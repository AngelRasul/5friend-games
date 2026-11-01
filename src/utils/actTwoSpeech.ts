import { ActTwoScenario } from '../types/game';

export interface SpeechSegment {
  label: string;
  text: string;
}

export interface ActTwoSpeechCallbacks {
  onStateChange?: (isSpeaking: boolean, currentLabel: string | null) => void;
}

const ORDINAL_CLUE_PREFIX = [
  'Первая улика.',
  'Вторая улика.',
  'Третья улика.',
  'Четвёртая улика.',
  'Пятая улика.',
];

// Глобальная ссылка защищает активный SpeechSynthesisUtterance от сборки мусора в Chrome/Safari
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeRunId = 0;
let nextSegmentTimer: number | null = null;
let activeCallbacks: ActTwoSpeechCallbacks | undefined;
let voicesPreloaded = false;

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * Предзагружает системные голоса браузера (особенно важно для Android/Desktop Chrome).
 */
export function preloadRussianVoices(): void {
  if (!isSpeechSynthesisSupported() || voicesPreloaded) return;
  voicesPreloaded = true;
  try {
    window.speechSynthesis.getVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        window.speechSynthesis.getVoices();
      });
    }
  } catch {
    // Игнорируем ограничения браузера
  }
}

function pickBestRussianVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const ruVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('ru'));
  if (ruVoices.length === 0) return null;

  // Приоритет более глубоким/мужским и качественным системным голосам для атмосферы расследования
  const preferredKeywords = [
    'dmitry',
    'yuri',
    'pavel',
    'maxim',
    'artem',
    'boris',
    'дмитрий',
    'юрий',
    'павел',
    'google русский',
    'natural',
    'premium',
  ];

  for (const keyword of preferredKeywords) {
    const match = ruVoices.find((v) => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  return ruVoices.find((v) => v.localService) ?? ruVoices[0];
}

function splitIntoShortSentences(paragraph: string): string[] {
  const normalized = paragraph
    .replace(/—/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawParts = normalized
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return rawParts.length > 0 ? rawParts : [normalized];
}

/**
 * Разбивает вводное описание дела и первичные улики на короткие фразы
 * (устраняет обрыв длинных фраз в Chrome и создаёт естественные паузы диктора).
 */
export function buildScenarioSpeechSegments(scenario: ActTwoScenario): SpeechSegment[] {
  const segments: SpeechSegment[] = [];

  const cleanLocation = scenario.locationAndTime.replace('·', ',');
  segments.push({
    label: scenario.code,
    text: `${scenario.code}. ${scenario.title}. ${cleanLocation}.`,
  });

  const summarySentences = splitIntoShortSentences(scenario.incidentSummary);
  for (const sentence of summarySentences) {
    segments.push({
      label: 'Описание дела',
      text: sentence,
    });
  }

  segments.push({
    label: 'Первичные улики',
    text: 'Первичные улики следствия.',
  });

  scenario.evidenceList.forEach((clue, idx) => {
    const prefix = ORDINAL_CLUE_PREFIX[idx] ?? `Улика ${idx + 1}.`;
    const cleanClue = clue.replace(/—/g, ', ').trim();
    segments.push({
      label: `Улика 0${idx + 1}`,
      text: `${prefix} ${cleanClue}`,
    });
  });

  return segments;
}

export function stopActTwoSpeech(): void {
  activeRunId += 1;
  if (nextSegmentTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(nextSegmentTimer);
    nextSegmentTimer = null;
  }
  activeUtterance = null;

  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Игнорируем ошибки отмены
    }
  }

  if (activeCallbacks?.onStateChange) {
    const cb = activeCallbacks.onStateChange;
    activeCallbacks = undefined;
    cb(false, null);
  }
}

/**
 * Запускает озвучку описания дела и первичных улик.
 * Первый сегмент отправляется синхронно в рамках клика пользователя для совместимости с iOS Safari.
 */
export function speakActTwoScenario(
  scenario: ActTwoScenario,
  callbacks?: ActTwoSpeechCallbacks
): boolean {
  if (!isSpeechSynthesisSupported()) {
    callbacks?.onStateChange?.(false, null);
    return false;
  }

  stopActTwoSpeech();

  const segments = buildScenarioSpeechSegments(scenario);
  if (segments.length === 0) return false;

  const runId = ++activeRunId;
  activeCallbacks = callbacks;
  const chosenVoice = pickBestRussianVoice();

  try {
    window.speechSynthesis.resume();
  } catch {
    // Некоторые браузеры игнорируют resume без паузы
  }

  const speakSegmentAt = (index: number) => {
    if (runId !== activeRunId) return;

    if (index >= segments.length) {
      activeUtterance = null;
      const cb = activeCallbacks?.onStateChange;
      activeCallbacks = undefined;
      cb?.(false, null);
      return;
    }

    const segment = segments[index];
    const utterance = new window.SpeechSynthesisUtterance(segment.text);
    utterance.lang = chosenVoice?.lang || 'ru-RU';
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }
    // Сдержанный напряжённый тембр диктора криминальной хроники
    utterance.rate = 0.95;
    utterance.pitch = 0.84;
    utterance.volume = 1;

    activeUtterance = utterance;
    activeCallbacks?.onStateChange?.(true, segment.label);

    utterance.onend = () => {
      if (runId !== activeRunId) return;
      nextSegmentTimer = window.setTimeout(() => {
        speakSegmentAt(index + 1);
      }, 170);
    };

    utterance.onerror = () => {
      if (runId !== activeRunId) return;
      activeUtterance = null;
      const cb = activeCallbacks?.onStateChange;
      activeCallbacks = undefined;
      cb?.(false, null);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      activeUtterance = null;
      const cb = activeCallbacks?.onStateChange;
      activeCallbacks = undefined;
      cb?.(false, null);
    }
  };

  speakSegmentAt(0);
  return true;
}

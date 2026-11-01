import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Eye,
  EyeOff,
  FileSearch,
  FolderOpen,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  Target,
  Users,
  Volume2,
  VolumeX,
  Vote,
  X,
} from 'lucide-react';
import { ACT_TWO_SCENARIOS, getActTwoScenarioById } from '../data/actTwoScenarios';
import { CHARACTERS, MAX_PLAYERS, MIN_PLAYERS, getCharacterById } from '../data/characters';
import {
  ACT_TWO_DISCUSSION_SECONDS,
  beginActTwoRoleHandoff,
  hideActTwoRoleAndAdvance,
  openActTwoBallot,
  openActTwoRole,
  startActTwoInvestigation,
  startActTwoVoting,
  submitActTwoVote,
} from '../logic/actTwoLogic';
import { isValidParticipantCount } from '../logic/gameLogic';
import { ActTwoPhase, ActTwoSessionState, CharacterId } from '../types/game';
import { playUiTone } from '../utils/sound';
import { ActTwoAtmosphere } from './ActTwoAtmosphere';
import { ActTwoScenarioIllustration } from './ActTwoScenarioIllustration';
import { CharacterAvatar } from './CharacterAvatar';

interface ActTwoScreenProps {
  selectedIds: CharacterId[];
  avatars: Partial<Record<CharacterId, string>>;
  soundEnabled: boolean;
  onToggleCharacter: (id: CharacterId) => void;
  onSelectAllCharacters: () => void;
  onClearCharacters: () => void;
  onToggleSound: () => void;
  onExitActTwo: () => void;
}

function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function ActTwoScreen({
  selectedIds,
  avatars,
  soundEnabled,
  onToggleCharacter,
  onSelectAllCharacters,
  onClearCharacters,
  onToggleSound,
  onExitActTwo,
}: ActTwoScreenProps) {
  const [actSession, setActSession] = useState<ActTwoSessionState | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const [remainingSeconds, setRemainingSeconds] = useState(ACT_TWO_DISCUSSION_SECONDS);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [discussionTab, setDiscussionTab] = useState<'evidence' | 'suspects'>('evidence');
  const [selectedSuspectId, setSelectedSuspectId] = useState<CharacterId | null>(null);
  const [isHandoffUnlocked, setIsHandoffUnlocked] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Partial<Record<CharacterId, boolean>>>({});

  const deadlineMsRef = useRef<number>(Date.now() + ACT_TWO_DISCUSSION_SECONDS * 1000);
  const pausedRemainingRef = useRef<number>(ACT_TWO_DISCUSSION_SECONDS);
  const timerTriggeredRef = useRef<boolean>(false);
  const voteLockRef = useRef<string>('');

  const isCountValid = isValidParticipantCount(selectedIds);
  const allSelected = selectedIds.length === CHARACTERS.length;

  const activeScenario = actSession
    ? getActTwoScenarioById(actSession.scenarioId)
    : undefined;

  // Защита от случайного двойного касания при передаче телефона
  useEffect(() => {
    setSelectedSuspectId(null);

    if (
      actSession?.phase === ActTwoPhase.ROLE_HANDOFF ||
      actSession?.phase === ActTwoPhase.VOTING_HANDOFF
    ) {
      setIsHandoffUnlocked(false);
      const timer = window.setTimeout(() => {
        setIsHandoffUnlocked(true);
      }, 280);
      return () => window.clearTimeout(timer);
    }

    setIsHandoffUnlocked(true);
  }, [actSession?.phase, actSession?.handoffIndex, actSession?.voterIndex]);

  // Сброс таймера при переходе к обсуждению дела
  useEffect(() => {
    if (actSession?.phase === ActTwoPhase.DISCUSSION) {
      setRemainingSeconds(ACT_TWO_DISCUSSION_SECONDS);
      pausedRemainingRef.current = ACT_TWO_DISCUSSION_SECONDS;
      deadlineMsRef.current = Date.now() + ACT_TWO_DISCUSSION_SECONDS * 1000;
      setIsTimerPaused(false);
      setDiscussionTab('evidence');
      timerTriggeredRef.current = false;
    }
  }, [actSession?.phase, actSession?.scenarioId]);

  const handleTransitionToVoting = useCallback(
    (expiredByTimer?: boolean) => {
      setActSession((prev) => {
        if (!prev || prev.phase !== ActTwoPhase.DISCUSSION) return prev;
        playUiTone(expiredByTimer ? 'alarm' : 'tap', soundEnabled);
        return startActTwoVoting(prev);
      });
    },
    [soundEnabled]
  );

  // Точный wall-clock таймер обсуждения
  useEffect(() => {
    if (actSession?.phase !== ActTwoPhase.DISCUSSION || isTimerPaused) {
      return;
    }

    deadlineMsRef.current = Date.now() + pausedRemainingRef.current * 1000;

    const interval = window.setInterval(() => {
      const diffMs = deadlineMsRef.current - Date.now();
      const nextSecs = Math.max(0, Math.ceil(diffMs / 1000));
      pausedRemainingRef.current = nextSecs;
      setRemainingSeconds(nextSecs);

      if (nextSecs <= 0 && !timerTriggeredRef.current) {
        timerTriggeredRef.current = true;
        window.clearInterval(interval);
        handleTransitionToVoting(true);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [actSession?.phase, isTimerPaused, handleTransitionToVoting]);

  const handleTogglePause = () => {
    setIsTimerPaused((prev) => {
      if (!prev) {
        const diffMs = deadlineMsRef.current - Date.now();
        const frozen = Math.max(0, Math.ceil(diffMs / 1000));
        pausedRemainingRef.current = frozen;
        setRemainingSeconds(frozen);
      } else {
        deadlineMsRef.current = Date.now() + pausedRemainingRef.current * 1000;
      }
      return !prev;
    });
  };

  const handleSelectScenario = (scenarioId: string) => {
    if (!isCountValid) return;
    playUiTone('tap', soundEnabled);
    voteLockRef.current = '';
    setCompletedTasks({});
    setActSession(startActTwoInvestigation(scenarioId, selectedIds));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToHub = () => {
    playUiTone('tap', soundEnabled);
    voteLockRef.current = '';
    setActSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBeginRoleHandoff = () => {
    playUiTone('tap', soundEnabled);
    setActSession((prev) => (prev ? beginActTwoRoleHandoff(prev) : null));
  };

  const handleOpenRole = () => {
    playUiTone('tap', soundEnabled);
    setActSession((prev) => (prev ? openActTwoRole(prev) : null));
  };

  const handleHideRoleAndNext = () => {
    playUiTone('tap', soundEnabled);
    setActSession((prev) => (prev ? hideActTwoRoleAndAdvance(prev) : null));
  };

  const handleOpenVoterBallot = () => {
    playUiTone('tap', soundEnabled);
    setActSession((prev) => (prev ? openActTwoBallot(prev) : null));
  };

  const handleSubmitVote = (suspectId: CharacterId) => {
    if (!actSession || actSession.phase !== ActTwoPhase.VOTING_SELECT) return;

    const lockKey = `${actSession.scenarioId}:${actSession.voterIndex}`;
    if (voteLockRef.current === lockKey) return;
    voteLockRef.current = lockKey;

    const isFinalVote = actSession.voterIndex + 1 >= actSession.participantIds.length;
    playUiTone(isFinalVote ? 'success' : 'tap', soundEnabled);

    setActSession((prev) => (prev ? submitActTwoVote(prev, suspectId) : null));
  };

  const handleToggleTaskDone = (characterId: CharacterId) => {
    playUiTone('tap', soundEnabled);
    setCompletedTasks((prev) => ({
      ...prev,
      [characterId]: !prev[characterId],
    }));
  };

  return (
    <div className="relative min-h-dvh flex flex-col bg-[#070709] text-[#F8FAFC] overflow-x-hidden">
      <ActTwoAtmosphere />

      {/* Тёмная шапка ACT II в единой геометрии приложения */}
      <header className="relative z-20 sticky top-0 h-14 bg-[#070709]/88 backdrop-blur-md border-b border-red-950/55">
        <div className="max-w-4xl mx-auto h-full px-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={actSession ? handleReturnToHub : onExitActTwo}
            className="min-h-[44px] min-w-[44px] -ml-2 px-3 rounded-full flex items-center gap-2 text-zinc-200 hover:text-white hover:bg-white/6 active:scale-95 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#DC2626]"
          >
            <ArrowLeft className="w-5 h-5 text-[#DC2626]" />
            <span className="text-sm font-semibold">
              {actSession ? 'К архиву дел' : 'Обычный режим'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="min-h-[44px] px-4 rounded-full bg-[#141419] hover:bg-[#1D1215] border border-white/10 text-zinc-200 text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#DC2626]"
          >
            <BookOpen className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>Правила</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          ГАЛЕРЕЯ 10 ДЕТЕКТИВНЫХ СЦЕНАРИЕВ И ВЫБОР УЧАСТНИКОВ (HUB)
      ====================================================================== */}
      {!actSession && (
        <main className="relative z-10 flex-1 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#101014] rounded-[32px] p-6 sm:p-7 border border-white/10 relative overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
              />

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-xs tracking-widest text-[#EF4444]">
                    ACT II · ЗАСЕКРЕЧЕННЫЕ ДЕЛА
                  </p>
                  <motion.h1
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1.5"
                  >
                    Закрытые расследования
                  </motion.h1>
                  <p className="text-sm text-zinc-400 mt-1.5 max-w-xl leading-relaxed">
                    Выберите от {MIN_PLAYERS} до {MAX_PLAYERS} участников и откройте одно из 10
                    дел. Каждый получит тайную роль, личную историю с уликами и скрытое задание.
                  </p>
                </div>
              </div>

              {/* Тонкий красный разделитель */}
              <div className="my-5 h-px bg-gradient-to-r from-[#991B1B]/60 via-white/10 to-transparent" />

              {/* Выбор участников 3–5 человек */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold text-zinc-300 tabular-nums">
                  Следственная группа · Выбрано: {selectedIds.length} из {MAX_PLAYERS}
                </span>

                <button
                  type="button"
                  onClick={allSelected ? onClearCharacters : onSelectAllCharacters}
                  className="min-h-[40px] px-3.5 rounded-full bg-[#18181F] hover:bg-[#241316] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Users className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>{allSelected ? 'Сбросить' : 'Все 5'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {CHARACTERS.map((character) => {
                  const isSelected = selectedIds.includes(character.id);
                  return (
                    <button
                      key={character.id}
                      type="button"
                      onClick={() => onToggleCharacter(character.id)}
                      aria-pressed={isSelected}
                      className={`min-h-[58px] rounded-2xl p-2.5 border flex items-center gap-2.5 text-left transition-all ${
                        isSelected
                          ? 'bg-[#1D0D10] border-[#DC2626] shadow-sm shadow-red-950/50'
                          : 'bg-[#0B0B0F] hover:bg-[#14141A] border-white/8 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <CharacterAvatar
                        character={character}
                        photoUrl={avatars[character.id]}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-bold text-white truncate">
                          {character.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {isSelected ? 'В деле' : 'Резерв'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!isCountValid && (
                <div className="mt-3 rounded-2xl bg-[#22090B] border border-[#991B1B] px-4 py-2.5 text-xs font-semibold text-[#FCA5A5] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                  <span>Выберите минимум {MIN_PLAYERS} участников, чтобы открыть материалы дела.</span>
                </div>
              )}
            </motion.section>

            {/* Список из 10 уникальных детективных сценариев */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACT_TWO_SCENARIOS.map((scenario, idx) => (
                <motion.article
                  key={scenario.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.25) }}
                  className="bg-[#101014] rounded-[28px] p-5 border border-white/10 hover:border-red-900/65 transition-colors flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#0B0B0F]">
                      <ActTwoScenarioIllustration
                        illustrationId={scenario.illustrationId}
                        className="w-full h-32"
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400 font-mono">
                      <span className="text-[#EF4444] font-semibold">{scenario.code}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{scenario.locationAndTime}</span>
                    </div>

                    <h2 className="font-display text-xl font-bold text-white mt-1.5 leading-snug">
                      {scenario.title}
                    </h2>

                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {scenario.subtitle}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!isCountValid}
                    onClick={() => handleSelectScenario(scenario.id)}
                    className="w-full min-h-[50px] px-5 rounded-full bg-[#991B1B] hover:bg-[#B91C1C] disabled:bg-zinc-900 disabled:text-zinc-600 text-white font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap"
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <span>
                      {isCountValid
                        ? 'Открыть дело'
                        : `Нужно от ${MIN_PLAYERS} игроков`}
                    </span>
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          АКТИВНОЕ РАССЛЕДОВАНИЕ ВЫБРАННОГО СЦЕНАРИЯ
      ====================================================================== */}
      {actSession && activeScenario && (
        <main className="relative z-10 flex-1 flex flex-col justify-center px-4 py-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-lg mx-auto">
            <div className="text-center text-xs font-mono text-zinc-400 mb-3">
              <span className="text-[#EF4444] font-semibold">{activeScenario.code}</span>
              <span className="mx-1.5">·</span>
              <span>{activeScenario.title}</span>
            </div>

            {/* 1. ОБЩАЯ СВОДКА ПРЕСТУПЛЕНИЯ ПЕРЕД РАЗДАЧЕЙ РОЛЕЙ */}
            {actSession.phase === ActTwoPhase.CASE_BRIEFING && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
                className="bg-[#101014] rounded-[32px] p-6 border border-white/10 space-y-5 relative overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
                />

                <div className="rounded-2xl overflow-hidden border border-white/8">
                  <ActTwoScenarioIllustration
                    illustrationId={activeScenario.illustrationId}
                    className="w-full h-36"
                  />
                </div>

                <div>
                  <div className="text-xs font-mono text-[#EF4444]">
                    {activeScenario.locationAndTime}
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white mt-1">
                    {activeScenario.title}
                  </h2>
                  <p className="text-sm text-zinc-300 mt-2.5 leading-relaxed">
                    {activeScenario.incidentSummary}
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-[#991B1B]/60 via-white/10 to-transparent" />

                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Первичные улики следствия
                  </h3>
                  <ul className="mt-2.5 space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {activeScenario.evidenceList.map((item, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <span className="font-mono text-[#EF4444] font-bold shrink-0">
                          0{index + 1}.
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleBeginRoleHandoff}
                  className="w-full min-h-[58px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] text-white font-display font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/60 active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  <span>Раздать секретные досье</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.section>
            )}

            {/* 2. БЕЗОПАСНАЯ ПЕРЕДАЧА ТЕЛЕФОНА УЧАСТНИКУ */}
            {actSession.phase === ActTwoPhase.ROLE_HANDOFF && (() => {
              const currentAssignment = actSession.assignments[actSession.handoffIndex];
              const player = currentAssignment
                ? getCharacterById(currentAssignment.characterId)
                : undefined;
              if (!player) return null;

              return (
                <div
                  key={`act2-handoff-${player.id}`}
                  className="bg-[#101014] rounded-[32px] p-6 sm:p-8 border border-white/10 text-center relative overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
                  />

                  <div className="text-xs font-mono text-zinc-400 tabular-nums">
                    Секретное досье · {actSession.handoffIndex + 1} из{' '}
                    {actSession.assignments.length}
                  </div>

                  <p className="text-xs text-zinc-500 mt-1">
                    Передайте телефон указанному игроку
                  </p>

                  <div className="mt-6 flex flex-col items-center">
                    <CharacterAvatar
                      character={player}
                      photoUrl={avatars[player.id]}
                      size="xl"
                    />
                    <h2 className="font-display text-3xl font-bold text-white mt-4">
                      {player.name}
                    </h2>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      disabled={!isHandoffUnlocked}
                      onClick={handleOpenRole}
                      className="w-full min-h-[60px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] disabled:opacity-65 text-white font-display font-semibold text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/60 active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <Eye className="w-5 h-5" />
                      <span>Открыть моё досье</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 3. ТАЙНЫЙ ПРОСМОТР РОЛИ, ЛИЧНОЙ ИСТОРИИ И ИНДИВИДУАЛЬНОГО ЗАДАНИЯ */}
            {actSession.phase === ActTwoPhase.ROLE_VIEWING && (() => {
              const currentAssignment = actSession.assignments[actSession.handoffIndex];
              const player = currentAssignment
                ? getCharacterById(currentAssignment.characterId)
                : undefined;
              if (!currentAssignment || !player) return null;

              const { role } = currentAssignment;

              return (
                <motion.div
                  key={`act2-role-${player.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#101014] rounded-[32px] p-6 border border-white/10 space-y-4 relative overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
                  />

                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>Досье игрока: {player.name}</span>
                    <span className="font-mono text-[#EF4444]">ЛИЧНО</span>
                  </div>

                  {/* Блок статуса роли */}
                  <div
                    className={`rounded-2xl p-4 border ${
                      role.isCulprit
                        ? 'bg-[#22080B] border-[#DC2626]'
                        : 'bg-[#16161D] border-white/12'
                    }`}
                  >
                    <div
                      className={`font-mono text-xs font-bold tracking-wider ${
                        role.isCulprit ? 'text-[#EF4444]' : 'text-zinc-400'
                      }`}
                    >
                      {role.isCulprit ? 'СТАТУС: ТЫ ПРЕСТУПНИК' : 'СТАТУС: ТЫ НЕВИНОВЕН'}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">
                      {role.personaTitle}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">{role.publicNote}</p>
                  </div>

                  {/* Индивидуальная история и тайные факты */}
                  <div className="rounded-2xl bg-[#0B0B0F] border border-white/8 p-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Личная история и улика
                    </div>
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {role.secretStory}
                    </p>
                  </div>

                  {/* Индивидуальное задание игрока */}
                  <div className="rounded-2xl bg-[#190A0D] border border-red-900/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#EF4444] mb-1.5">
                      <Target className="w-4 h-4 shrink-0" />
                      <span>Индивидуальное задание</span>
                    </div>
                    <p className="text-sm text-white leading-relaxed">{role.personalTask}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleHideRoleAndNext}
                    className="w-full min-h-[58px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] text-white font-display font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/60 active:scale-[0.98] transition-all whitespace-nowrap"
                  >
                    <EyeOff className="w-5 h-5" />
                    <span>
                      {actSession.handoffIndex + 1 < actSession.assignments.length
                        ? 'Скрыть досье и передать'
                        : 'Начать обсуждение'}
                    </span>
                  </button>
                </motion.div>
              );
            })()}

            {/* 4. ФАЗА ОБСУЖДЕНИЯ И СОПОСТАВЛЕНИЯ УЛИК */}
            {actSession.phase === ActTwoPhase.DISCUSSION && (() => {
              const timerProgress = Math.max(
                0,
                Math.min(1, remainingSeconds / ACT_TWO_DISCUSSION_SECONDS)
              );
              const isLowTime = remainingSeconds <= 40;

              return (
                <div className="bg-[#101014] rounded-[32px] p-6 border border-white/10 space-y-5 relative overflow-hidden">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
                  />

                  <div className="text-center">
                    <div className="text-xs font-mono tracking-widest text-[#EF4444]">
                      ОЧНАЯ СТАВКА · ОБСУЖДЕНИЕ
                    </div>

                    <div
                      className={`mt-3 rounded-2xl py-6 px-5 border transition-colors ${
                        isLowTime
                          ? 'bg-[#24090C] border-[#DC2626]'
                          : 'bg-[#0B0B0F] border-white/10'
                      }`}
                    >
                      <div
                        className={`font-mono text-5xl font-bold tabular-nums ${
                          isLowTime ? 'text-[#EF4444]' : 'text-white'
                        }`}
                      >
                        {formatTimer(remainingSeconds)}
                      </div>

                      <div className="mt-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          style={{
                            transform: `scaleX(${timerProgress})`,
                            transformOrigin: 'left',
                          }}
                          className="h-full w-full bg-[#DC2626] transition-transform duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Переключатель материалов дела и списка фигурантов */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-[#0B0B0F] border border-white/8">
                    <button
                      type="button"
                      onClick={() => setDiscussionTab('evidence')}
                      className={`min-h-[40px] px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                        discussionTab === 'evidence'
                          ? 'bg-[#991B1B] text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <FileSearch className="w-3.5 h-3.5 shrink-0" />
                      <span>Улики дела</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDiscussionTab('suspects')}
                      className={`min-h-[40px] px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                        discussionTab === 'suspects'
                          ? 'bg-[#991B1B] text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Фигуранты ({actSession.assignments.length})</span>
                    </button>
                  </div>

                  {discussionTab === 'evidence' ? (
                    <div className="rounded-2xl bg-[#0B0B0F] border border-white/8 p-4 space-y-3">
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {activeScenario.incidentSummary}
                      </p>
                      <div className="h-px bg-white/8" />
                      <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                        {activeScenario.evidenceList.map((ev, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="font-mono text-[#EF4444] font-bold shrink-0">
                              0{idx + 1}.
                            </span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#0B0B0F] border border-white/8 divide-y divide-white/8">
                      {actSession.assignments.map((item) => {
                        const ch = getCharacterById(item.characterId);
                        if (!ch) return null;
                        return (
                          <div key={ch.id} className="p-3 flex items-center gap-3">
                            <CharacterAvatar
                              character={ch}
                              photoUrl={avatars[ch.id]}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">
                                {ch.name} ·{' '}
                                <span className="text-[#FCA5A5] font-semibold">
                                  {item.role.personaTitle}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 leading-snug mt-0.5">
                                {item.role.publicNote}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTransitionToVoting(false)}
                      className="w-full min-h-[56px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] text-white font-display font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/60 active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <Vote className="w-5 h-5" />
                      <span>Перейти к голосованию</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTogglePause}
                      className="w-full min-h-[46px] px-5 rounded-full bg-[#18181F] hover:bg-[#22222B] border border-white/10 text-sm font-semibold text-zinc-200 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      {isTimerPaused ? (
                        <>
                          <Play className="w-4 h-4 text-[#EF4444]" />
                          <span>Продолжить таймер</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 text-[#EF4444]" />
                          <span>Пауза</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 5. ПЕРЕДАЧА ТЕЛЕФОНА ДЛЯ ТАЙНОГО ГОЛОСОВАНИЯ */}
            {actSession.phase === ActTwoPhase.VOTING_HANDOFF && (() => {
              const voterId = actSession.participantIds[actSession.voterIndex];
              const voter = voterId ? getCharacterById(voterId) : undefined;
              if (!voter) return null;

              return (
                <div
                  key={`act2-vote-handoff-${voter.id}`}
                  className="bg-[#101014] rounded-[32px] p-6 sm:p-8 border border-white/10 text-center"
                >
                  <div className="text-xs font-mono text-zinc-400 tabular-nums">
                    Тайный вердикт · {actSession.voterIndex + 1} из{' '}
                    {actSession.participantIds.length}
                  </div>

                  <div className="mt-6 flex flex-col items-center">
                    <CharacterAvatar
                      character={voter}
                      photoUrl={avatars[voter.id]}
                      size="xl"
                    />
                    <h2 className="font-display text-3xl font-bold text-white mt-4">
                      {voter.name}
                    </h2>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      disabled={!isHandoffUnlocked}
                      onClick={handleOpenVoterBallot}
                      className="w-full min-h-[60px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] disabled:opacity-65 text-white font-display font-semibold text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/60 active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <Vote className="w-5 h-5" />
                      <span>Вынести вердикт</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 6. ВЫБОР ГЛАВНОГО ОБВИНЯЕМОГО */}
            {actSession.phase === ActTwoPhase.VOTING_SELECT && (() => {
              const voterId = actSession.participantIds[actSession.voterIndex];
              const voter = voterId ? getCharacterById(voterId) : undefined;
              if (!voter) return null;

              return (
                <div
                  key={`act2-vote-select-${voter.id}`}
                  className="bg-[#101014] rounded-[32px] p-6 border border-white/10"
                >
                  <div className="text-center">
                    <div className="text-xs font-mono text-[#EF4444]">ГОЛОСУЕТ</div>
                    <h3 className="font-display text-2xl font-bold text-white mt-0.5">
                      {voter.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Укажите, кто совершил преступление
                    </p>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {actSession.assignments
                      .filter((a) => a.characterId !== voter.id)
                      .map((candidateAssignment) => {
                        const candidate = getCharacterById(
                          candidateAssignment.characterId
                        );
                        if (!candidate) return null;
                        const isChosen = selectedSuspectId === candidate.id;

                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            onClick={() => setSelectedSuspectId(candidate.id)}
                            aria-pressed={isChosen}
                            className={`w-full min-h-[64px] rounded-2xl px-4 py-3 border flex items-center justify-between gap-3 text-left transition-all ${
                              isChosen
                                ? 'bg-[#24090C] border-[#DC2626]'
                                : 'bg-[#0B0B0F] hover:bg-[#16161E] border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CharacterAvatar
                                character={candidate}
                                photoUrl={avatars[candidate.id]}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="font-display text-base font-bold text-white truncate">
                                  {candidate.name}
                                </div>
                                <div className="text-xs text-zinc-400 truncate">
                                  {candidateAssignment.role.personaTitle}
                                </div>
                              </div>
                            </div>

                            <div
                              className={`min-h-[34px] min-w-[34px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isChosen
                                  ? 'bg-[#DC2626] text-white'
                                  : 'bg-[#14141A] border border-white/15 text-transparent'
                              }`}
                            >
                              <Check className="w-4 h-4" strokeWidth={2.5} />
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      disabled={!selectedSuspectId}
                      onClick={() => {
                        if (selectedSuspectId) {
                          handleSubmitVote(selectedSuspectId);
                        }
                      }}
                      className="w-full min-h-[58px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] disabled:bg-zinc-900 disabled:text-zinc-600 text-white font-display font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <Check className="w-5 h-5" />
                      <span>Подтвердить обвинение</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 7. ФИНАЛЬНОЕ РАСКРЫТИЕ ДЕЛА, РОЛЕЙ И ИНДИВИДУАЛЬНЫХ ЗАДАНИЙ */}
            {actSession.phase === ActTwoPhase.FINALE && (() => {
              const culpritChar = getCharacterById(actSession.culpritCharacterId);
              const culpritAssignment = actSession.assignments.find(
                (a) => a.characterId === actSession.culpritCharacterId
              );

              return (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className="bg-[#101014] rounded-[32px] p-6 border border-white/10 space-y-5 relative overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
                  />

                  <div
                    className={`rounded-2xl p-4 border flex items-start gap-3 ${
                      actSession.caughtCulprit
                        ? 'bg-[#111F17] border-emerald-700/60 text-emerald-100'
                        : 'bg-[#24090C] border-[#DC2626] text-red-100'
                    }`}
                  >
                    {actSession.caughtCulprit ? (
                      <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-[#EF4444] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h2 className="font-display text-lg font-bold text-white">
                        {actSession.caughtCulprit
                          ? 'Преступник разоблачён!'
                          : 'Преступник ушёл от расплаты!'}
                      </h2>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        {actSession.caughtCulprit
                          ? activeScenario.caughtEpilogue
                          : activeScenario.escapedEpilogue}
                      </p>
                    </div>
                  </div>

                  {/* Настоящий виновник и истинная картина */}
                  {culpritChar && culpritAssignment && (
                    <div className="rounded-2xl bg-[#180A0D] border border-red-900/60 p-4 space-y-3">
                      <div className="text-xs font-mono uppercase tracking-wider text-[#EF4444]">
                        Истинный преступник
                      </div>
                      <div className="flex items-center gap-3">
                        <CharacterAvatar
                          character={culpritChar}
                          photoUrl={avatars[culpritChar.id]}
                          size="md"
                        />
                        <div>
                          <div className="font-display text-xl font-bold text-white">
                            {culpritChar.name}
                          </div>
                          <div className="text-xs font-semibold text-[#FCA5A5]">
                            {culpritAssignment.role.personaTitle}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed pt-1 border-t border-red-950/70">
                        {activeScenario.truthReconstruction}
                      </p>
                    </div>
                  )}

                  {/* Раскрытие всех секретных ролей, голосов и индивидуальных заданий */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Раскрытие ролей и индивидуальных заданий
                    </h3>

                    {actSession.assignments.map((item) => {
                      const player = getCharacterById(item.characterId);
                      if (!player) return null;
                      const votedTargetId = actSession.votes[player.id];
                      const votedTarget = votedTargetId
                        ? getCharacterById(votedTargetId)
                        : undefined;
                      const isTaskChecked = Boolean(completedTasks[player.id]);

                      return (
                        <div
                          key={player.id}
                          className="rounded-2xl bg-[#0B0B0F] border border-white/10 p-4 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CharacterAvatar
                                character={player}
                                photoUrl={avatars[player.id]}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="font-display text-sm font-bold text-white truncate">
                                  {player.name} ·{' '}
                                  <span
                                    className={
                                      item.role.isCulprit
                                        ? 'text-[#EF4444]'
                                        : 'text-zinc-300'
                                    }
                                  >
                                    {item.role.personaTitle}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Голос против: {votedTarget?.name ?? '—'}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`font-mono text-[11px] font-bold shrink-0 ${
                                item.role.isCulprit ? 'text-[#EF4444]' : 'text-zinc-400'
                              }`}
                            >
                              {item.role.isCulprit ? 'ПРЕСТУПНИК' : 'НЕВИНОВЕН'}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {item.role.secretStory}
                          </p>

                          <div className="pt-2 border-t border-white/8 flex items-start justify-between gap-3">
                            <div className="text-xs text-zinc-200 leading-snug">
                              <span className="text-[#EF4444] font-semibold">Задание: </span>
                              {item.role.personalTask}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleTaskDone(player.id)}
                              aria-pressed={isTaskChecked}
                              className={`min-h-[36px] px-3 rounded-full text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors whitespace-nowrap ${
                                isTaskChecked
                                  ? 'bg-[#991B1B] text-white'
                                  : 'bg-[#16161D] text-zinc-400 border border-white/10 hover:text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isTaskChecked ? 'Выполнено' : 'Отметить'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleReturnToHub}
                      className="w-full min-h-[56px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] text-white font-display font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <FolderOpen className="w-5 h-5" />
                      <span>Выбрать другое дело ACT II</span>
                    </button>

                    <button
                      type="button"
                      onClick={onExitActTwo}
                      className="w-full min-h-[48px] px-5 rounded-full bg-[#18181F] hover:bg-[#22222B] border border-white/10 text-zinc-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <span>Вернуться в обычную игру</span>
                    </button>
                  </div>
                </motion.section>
              );
            })()}
          </div>
        </main>
      )}

      {/* Модальное окно правил ACT II */}
      <AnimatePresence>
        {isRulesOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setIsRulesOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="act2-rules-title"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 28 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full sm:max-w-md bg-[#101014] text-white rounded-t-[28px] sm:rounded-[28px] border border-white/12 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
            >
              <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto mt-3 sm:hidden" />

              <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
                <h2
                  id="act2-rules-title"
                  className="font-display text-lg font-bold text-white"
                >
                  Правила ACT II
                </h2>
                <button
                  type="button"
                  onClick={() => setIsRulesOpen(false)}
                  aria-label="Закрыть"
                  className="min-h-[44px] min-w-[44px] -mr-2 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/8"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-sm text-zinc-300">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#22090B] border border-red-900/60 text-[#EF4444] flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">1. Секретные досье</h3>
                    <p className="mt-0.5 leading-snug text-zinc-400">
                      Один игрок получает роль преступника, остальные — подозреваемых с важными
                      уликами и личными тайнами.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#18181F] border border-white/10 text-[#EF4444] flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">2. Индивидуальные задания</h3>
                    <p className="mt-0.5 leading-snug text-zinc-400">
                      У каждого фигуранта есть скрытая личная цель на время допроса — выполнить её,
                      не подставив себя под обвинение.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#18181F] border border-white/10 text-[#EF4444] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">3. Очная ставка и вердикт</h3>
                    <p className="mt-0.5 leading-snug text-zinc-400">
                      За 4 минуты сопоставьте улики, затем тайно проголосуйте. Чтобы разоблачить
                      виновного, он должен набрать единоличное большинство голосов.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-medium text-white">Звук</span>
                  <button
                    type="button"
                    onClick={onToggleSound}
                    className="min-h-[44px] px-4 rounded-full bg-[#18181F] border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-4 h-4 text-[#EF4444]" />
                        <span>Включён</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4 text-zinc-500" />
                        <span>Выключен</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#0B0B0F] border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRulesOpen(false)}
                  className="w-full min-h-[48px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] text-white font-semibold text-sm active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  Понятно
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

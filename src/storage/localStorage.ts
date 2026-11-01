import { DEFAULT_CATEGORIES } from '../data/categories';
import { CHARACTERS } from '../data/characters';
import { createInitialGlobalScoreboard } from '../logic/gameLogic';
import {
  CategoryIconKey,
  CharacterId,
  GameCategory,
  GlobalScoreboardState,
  PlayerSessionStats,
} from '../types/game';

const CUSTOM_CATEGORIES_KEY = 'ugadai_spinu_custom_categories_v1';
const EXTRA_WORDS_KEY = 'ugadai_spinu_extra_words_v1';
const SOUND_ENABLED_KEY = 'ugadai_spinu_sound_enabled_v1';
const GLOBAL_SCOREBOARD_KEY = 'ugadai_spinu_scoreboard_v1';
const SELECTED_PLAYERS_KEY = 'ugadai_spinu_selected_players_v1';
const LEADERBOARD_VIEW_SESSION_KEY = 'ugadai_spinu_leaderboard_view_v1';

type ExtraWordsMap = Record<string, string[]>;

const VALID_CHARACTER_IDS = new Set<CharacterId>(CHARACTERS.map((c) => c.id));

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadCustomCategories(): GameCategory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const parsed = safeParseJson<GameCategory[]>(raw, []);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (cat) =>
        cat &&
        typeof cat.id === 'string' &&
        typeof cat.title === 'string' &&
        Array.isArray(cat.items) &&
        cat.items.length > 0
    );
  } catch {
    return [];
  }
}

export function saveCustomCategory(input: {
  title: string;
  description: string;
  iconKey: CategoryIconKey;
  items: string[];
}): GameCategory[] {
  const existing = loadCustomCategories();
  const cleanItems = Array.from(
    new Set(input.items.map((w) => w.trim()).filter((w) => w.length > 0))
  );

  const newCategory: GameCategory = {
    id: `custom_${Date.now()}`,
    title: input.title.trim(),
    description: input.description.trim() || 'Своя категория',
    iconKey: input.iconKey,
    items: cleanItems,
    isCustom: true,
  };

  const updated = [...existing, newCategory];
  try {
    window.localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
  return updated;
}

export function deleteCustomCategory(categoryId: string): GameCategory[] {
  const updated = loadCustomCategories().filter((c) => c.id !== categoryId);
  try {
    window.localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
  return updated;
}

export function loadExtraWordsMap(): ExtraWordsMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(EXTRA_WORDS_KEY);
    return safeParseJson<ExtraWordsMap>(raw, {});
  } catch {
    return {};
  }
}

export function addWordsToCategory(categoryId: string, newWords: string[]): ExtraWordsMap {
  const currentMap = loadExtraWordsMap();
  const existingExtra = currentMap[categoryId] ?? [];
  const cleaned = newWords.map((w) => w.trim()).filter((w) => w.length > 0);
  const merged = Array.from(new Set([...existingExtra, ...cleaned]));

  const nextMap: ExtraWordsMap = {
    ...currentMap,
    [categoryId]: merged,
  };

  try {
    window.localStorage.setItem(EXTRA_WORDS_KEY, JSON.stringify(nextMap));
  } catch {
    // Ignore storage quota errors
  }
  return nextMap;
}

export function buildMergedCategories(
  customCategories: GameCategory[],
  extraWordsMap: ExtraWordsMap
): GameCategory[] {
  const baseMerged = DEFAULT_CATEGORIES.map((category) => {
    const extra = extraWordsMap[category.id] ?? [];
    const uniqueItems = Array.from(new Set([...category.items, ...extra]));
    return {
      ...category,
      items: uniqueItems,
    };
  });

  const customMerged = customCategories.map((category) => {
    const extra = extraWordsMap[category.id] ?? [];
    const uniqueItems = Array.from(new Set([...category.items, ...extra]));
    return {
      ...category,
      items: uniqueItems,
      isCustom: true,
    };
  });

  return [...baseMerged, ...customMerged];
}

export function loadSoundPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = window.localStorage.getItem(SOUND_ENABLED_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function saveSoundPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}

export function loadSelectedPlayers(): CharacterId[] {
  const fallback: CharacterId[] = ['rasul', 'salikh', 'mikail'];
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(SELECTED_PLAYERS_KEY);
    const parsed = safeParseJson<unknown>(raw, null);
    if (!Array.isArray(parsed)) return fallback;
    const valid = Array.from(
      new Set(
        parsed.filter(
          (id): id is CharacterId =>
            typeof id === 'string' && VALID_CHARACTER_IDS.has(id as CharacterId)
        )
      )
    );
    return valid.length >= 3 && valid.length <= 5 ? valid : fallback;
  } catch {
    return fallback;
  }
}

export function saveSelectedPlayers(ids: CharacterId[]): void {
  try {
    window.localStorage.setItem(SELECTED_PLAYERS_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
}

export function loadGlobalScoreboard(): GlobalScoreboardState {
  const initial = createInitialGlobalScoreboard();
  if (typeof window === 'undefined') return initial;

  try {
    const raw = window.localStorage.getItem(GLOBAL_SCOREBOARD_KEY);
    if (!raw) return initial;
    const parsed = safeParseJson<Partial<GlobalScoreboardState> | null>(raw, null);
    if (!parsed || typeof parsed !== 'object') return initial;

    const scores = { ...initial.scores };
    const playerStats = { ...initial.playerStats };

    for (const character of CHARACTERS) {
      const id = character.id;
      const rawScore = parsed.scores?.[id];
      if (typeof rawScore === 'number' && Number.isFinite(rawScore)) {
        scores[id] = rawScore;
      }

      const rawStat = parsed.playerStats?.[id] as Partial<PlayerSessionStats> | undefined;
      if (rawStat && typeof rawStat === 'object') {
        playerStats[id] = {
          roundsPlayed: Number(rawStat.roundsPlayed) || 0,
          timesSpy: Number(rawStat.timesSpy) || 0,
          spyWins: Number(rawStat.spyWins) || 0,
          civilianRounds: Number(rawStat.civilianRounds) || 0,
          correctSpyVotes: Number(rawStat.correctSpyVotes) || 0,
          soloSpyCatches: Number(rawStat.soloSpyCatches) || 0,
          votesReceivedAsCivilian: Number(rawStat.votesReceivedAsCivilian) || 0,
        };
      }
    }

    const history = Array.isArray(parsed.history) ? parsed.history : [];
    const usedWordsByCategory =
      parsed.usedWordsByCategory && typeof parsed.usedWordsByCategory === 'object'
        ? parsed.usedWordsByCategory
        : {};

    const rawSeed = parsed.titleSeed;
    const hasValidSeed =
      typeof rawSeed === 'number' && Number.isFinite(rawSeed) && rawSeed > 0;
    const titleSeed = hasValidSeed ? rawSeed >>> 0 : initial.titleSeed;

    const loaded: GlobalScoreboardState = {
      scores,
      playerStats,
      history,
      usedWordsByCategory,
      titleSeed,
    };

    if (!hasValidSeed) {
      saveGlobalScoreboard(loaded);
    }

    return loaded;
  } catch {
    return initial;
  }
}

export function saveGlobalScoreboard(scoreboard: GlobalScoreboardState): void {
  try {
    window.localStorage.setItem(GLOBAL_SCOREBOARD_KEY, JSON.stringify(scoreboard));
  } catch {
    // Ignore storage errors
  }
}

export function clearGlobalScoreboard(): void {
  try {
    window.localStorage.removeItem(GLOBAL_SCOREBOARD_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function loadLeaderboardViewFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(LEADERBOARD_VIEW_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveLeaderboardViewFlag(isOpen: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (isOpen) {
      window.sessionStorage.setItem(LEADERBOARD_VIEW_SESSION_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(LEADERBOARD_VIEW_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearAllLocalAppStorage(): void {
  try {
    window.localStorage.removeItem(CUSTOM_CATEGORIES_KEY);
    window.localStorage.removeItem(EXTRA_WORDS_KEY);
    window.localStorage.removeItem(SOUND_ENABLED_KEY);
    window.localStorage.removeItem(GLOBAL_SCOREBOARD_KEY);
    window.localStorage.removeItem(SELECTED_PLAYERS_KEY);
    window.sessionStorage.removeItem(LEADERBOARD_VIEW_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

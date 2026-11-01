import { CHARACTERS, MAX_PLAYERS, MIN_PLAYERS, getCharacterById } from '../data/characters';
import {
  CharacterId,
  GameCategory,
  GlobalScoreboardState,
  LeaderboardEntry,
  PlayerSessionStats,
  RoundOutcome,
  SpyGamePhase,
  SpySessionState,
  UsedWordsMap,
} from '../types/game';

/** Длительность обсуждения по правилам — ровно 3 минуты (180 секунд) */
export const DISCUSSION_DURATION_SECONDS = 180;

export function isValidParticipantCount(selectedIds: CharacterId[]): boolean {
  return selectedIds.length >= MIN_PLAYERS && selectedIds.length <= MAX_PLAYERS;
}

export function sortParticipantsCanonical(selectedIds: CharacterId[]): CharacterId[] {
  const selectedSet = new Set(selectedIds);
  return CHARACTERS.filter((c) => selectedSet.has(c.id)).map((c) => c.id);
}

export function getUniformRandomIndex(max: number): number {
  if (max <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max;
    do {
      window.crypto.getRandomValues(array);
    } while (array[0] >= limit);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function getAvailableWordsForCategory(
  category: GameCategory | undefined,
  usedWordsByCategory: UsedWordsMap
): string[] {
  if (!category) return [];
  const usedSet = new Set(usedWordsByCategory[category.id] ?? []);
  return category.items.filter((item) => !usedSet.has(item));
}

export function drawUniqueRandomWord(
  category: GameCategory | undefined,
  usedWordsByCategory: UsedWordsMap
): { word: string | null; nextUsedWordsByCategory: UsedWordsMap } {
  if (!category) {
    return { word: null, nextUsedWordsByCategory: usedWordsByCategory };
  }

  const available = getAvailableWordsForCategory(category, usedWordsByCategory);
  if (available.length === 0) {
    return { word: null, nextUsedWordsByCategory: usedWordsByCategory };
  }

  const randomIndex = getUniformRandomIndex(available.length);
  const chosenWord = available[randomIndex];
  const previousUsed = usedWordsByCategory[category.id] ?? [];

  return {
    word: chosenWord,
    nextUsedWordsByCategory: {
      ...usedWordsByCategory,
      [category.id]: [...previousUsed, chosenWord],
    },
  };
}

function createEmptyStatsMap(): Record<CharacterId, PlayerSessionStats> {
  const createOne = (): PlayerSessionStats => ({
    roundsPlayed: 0,
    timesSpy: 0,
    spyWins: 0,
    civilianRounds: 0,
    correctSpyVotes: 0,
    soloSpyCatches: 0,
    votesReceivedAsCivilian: 0,
  });

  return {
    rasul: createOne(),
    salikh: createOne(),
    mikail: createOne(),
    denislam: createOne(),
    izamutdin: createOne(),
  };
}

export const PLACE_TITLES: Record<1 | 2 | 3 | 4 | 5, readonly string[]> = {
  1: [
    'Главный мозг тусовки',
    'Король обмана',
    'Гений манипуляций',
    'Хозяин этой игры',
    'Босс интриг',
  ],
  2: [
    'Первый среди проигравших',
    'Вечно второй',
    'Тень победителя',
    'Недотянул до трона',
    'Главный по обидным сливам',
  ],
  3: [
    'Серая масса',
    'Ни рыба ни мясо',
    'Пассажир этой катки',
    'Талант на минималках',
    'Массовка для вида',
  ],
  4: [
    'Ходячий провал',
    'Мозг не обнаружен',
    'Поставщик бесплатных очков',
    'Клинический случай',
    'Главный тормоз партии',
  ],
  5: [
    'Абсолютное днище',
    'Главный позор компании',
    'Мешок для битья',
    'Легендарный бездарь',
    'Дно пробито',
  ],
};

export function generateRandomTitleSeed(excludeSeed?: number): number {
  let seed = 1;
  do {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      seed = array[0] >>> 0;
    } else {
      seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    }
  } while (seed === 0 || (excludeSeed !== undefined && seed === (excludeSeed >>> 0)));
  return seed;
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getShuffledTitlesForPlace(
  place: 1 | 2 | 3 | 4 | 5,
  sessionSeed: number
): string[] {
  const pool = [...PLACE_TITLES[place]];
  const mixedSeed = ((sessionSeed >>> 0) ^ Math.imul(place, 0x85ebca6b)) >>> 0 || place;
  const nextRand = createMulberry32(mixedSeed);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }

  return pool;
}

/**
 * Инициализирует глобальное табло очков, статистики и случайного зерна званий новой сессии.
 */
export function createInitialGlobalScoreboard(
  previousTitleSeed?: number
): GlobalScoreboardState {
  return {
    scores: {
      rasul: 0,
      salikh: 0,
      mikail: 0,
      denislam: 0,
      izamutdin: 0,
    },
    playerStats: createEmptyStatsMap(),
    history: [],
    usedWordsByCategory: {},
    titleSeed: generateRandomTitleSeed(previousTitleSeed),
  };
}

/**
 * Запускает раунд «Шпиона» для выбранных участников и категории,
 * сохраняя все ранее набранные очки, историю и список использованных слов в глобальном табло.
 */
export function startSpyRoundWithScoreboard(
  participantIds: CharacterId[],
  categoryId: string,
  categories: GameCategory[],
  scoreboard: GlobalScoreboardState
): { session: SpySessionState; scoreboard: GlobalScoreboardState } {
  const orderedParticipants = sortParticipantsCanonical(participantIds);
  const category = categories.find((c) => c.id === categoryId);
  const { word, nextUsedWordsByCategory } = drawUniqueRandomWord(
    category,
    scoreboard.usedWordsByCategory
  );

  const spyId = orderedParticipants[getUniformRandomIndex(orderedParticipants.length)];
  const nextRoundNumber = scoreboard.history.length + 1;

  const session: SpySessionState = {
    participantIds: orderedParticipants,
    roundNumber: nextRoundNumber,
    activeCategoryId: categoryId,
    phase: word ? SpyGamePhase.ROLE_HANDOFF : SpyGamePhase.CATEGORY_EXHAUSTED,
    spyId,
    secretWord: word ?? '',
    roleRevealIndex: 0,
    voterIndex: 0,
    votes: {},
    lastRoundOutcome: null,
  };

  return {
    session,
    scoreboard: {
      ...scoreboard,
      usedWordsByCategory: nextUsedWordsByCategory,
    },
  };
}

export function openCurrentPlayerRole(session: SpySessionState): SpySessionState {
  if (session.phase !== SpyGamePhase.ROLE_HANDOFF) return session;
  return {
    ...session,
    phase: SpyGamePhase.ROLE_VIEWING,
  };
}

export function hideCurrentPlayerRoleAndAdvance(session: SpySessionState): SpySessionState {
  if (session.phase !== SpyGamePhase.ROLE_VIEWING) return session;

  const nextIndex = session.roleRevealIndex + 1;
  if (nextIndex < session.participantIds.length) {
    return {
      ...session,
      roleRevealIndex: nextIndex,
      phase: SpyGamePhase.ROLE_HANDOFF,
    };
  }

  return {
    ...session,
    phase: SpyGamePhase.DISCUSSION,
  };
}

export function startSecretVoting(session: SpySessionState): SpySessionState {
  if (session.phase !== SpyGamePhase.DISCUSSION) return session;
  return {
    ...session,
    voterIndex: 0,
    votes: {},
    phase: SpyGamePhase.VOTING_HANDOFF,
  };
}

export function openCurrentVoterBallot(session: SpySessionState): SpySessionState {
  if (session.phase !== SpyGamePhase.VOTING_HANDOFF) return session;
  return {
    ...session,
    phase: SpyGamePhase.VOTING_SELECT,
  };
}

/**
 * Принимает тайный голос текущего участника.
 * Защищено от повторного голосования одного игрока, голосования за себя и двойного начисления очков.
 */
export function submitSecretVoteWithScoreboard(
  session: SpySessionState,
  suspectId: CharacterId,
  categories: GameCategory[],
  scoreboard: GlobalScoreboardState
): { session: SpySessionState; scoreboard: GlobalScoreboardState } {
  if (
    session.phase !== SpyGamePhase.VOTING_SELECT ||
    session.lastRoundOutcome !== null
  ) {
    return { session, scoreboard };
  }

  const currentVoterId = session.participantIds[session.voterIndex];
  if (
    !currentVoterId ||
    suspectId === currentVoterId ||
    !session.participantIds.includes(suspectId) ||
    Object.prototype.hasOwnProperty.call(session.votes, currentVoterId)
  ) {
    return { session, scoreboard };
  }

  const nextVotes: Partial<Record<CharacterId, CharacterId>> = {
    ...session.votes,
    [currentVoterId]: suspectId,
  };

  const nextVoterIndex = session.voterIndex + 1;
  if (nextVoterIndex < session.participantIds.length) {
    return {
      session: {
        ...session,
        votes: nextVotes,
        voterIndex: nextVoterIndex,
        phase: SpyGamePhase.VOTING_HANDOFF,
      },
      scoreboard,
    };
  }

  // Защита от повторного начисления очков за уже записанный раунд
  if (scoreboard.history.some((r) => r.roundNumber === session.roundNumber)) {
    return {
      session: {
        ...session,
        phase: SpyGamePhase.ROUND_RESULTS,
      },
      scoreboard,
    };
  }

  // Все проголосовали — подсчитываем голоса и начисляем очки в глобальное табло
  const voteCounts: Partial<Record<CharacterId, number>> = {};
  for (const id of session.participantIds) {
    voteCounts[id] = 0;
  }
  for (const voterId of session.participantIds) {
    const target = nextVotes[voterId];
    if (target) {
      voteCounts[target] = (voteCounts[target] ?? 0) + 1;
    }
  }

  const spyVotesCount = voteCounts[session.spyId] ?? 0;
  const spyWonCleanly = spyVotesCount === 0;
  const isLoneDetectiveCatch = spyVotesCount === 1;

  let winnerSide: RoundOutcome['winnerSide'] = 'CIVILIANS';
  let reasonText = '';

  if (spyWonCleanly) {
    winnerSide = 'SPY';
    reasonText =
      'Ни один участник не проголосовал против шпиона — безоговорочная победа шпиона!';
  } else if (isLoneDetectiveCatch) {
    winnerSide = 'LONE_DETECTIVE';
    const loneVoterId = session.participantIds.find(
      (id) => id !== session.spyId && nextVotes[id] === session.spyId
    );
    const loneVoter = loneVoterId ? getCharacterById(loneVoterId) : undefined;
    reasonText = `Остальные проголосовали мимо, но ${loneVoter?.name ?? 'один участник'} в одиночку вычислил шпиона!`;
  } else {
    winnerSide = 'CIVILIANS';
    reasonText = `Группа участников (${spyVotesCount} из ${session.participantIds.length}) вычислила и проголосовала против шпиона!`;
  }

  const pointsAwarded: Partial<Record<CharacterId, number>> = {};
  const pointReasons: Partial<Record<CharacterId, string>> = {};
  const nextScores: Record<CharacterId, number> = { ...scoreboard.scores };
  const nextStats: Record<CharacterId, PlayerSessionStats> = { ...scoreboard.playerStats };

  for (const playerId of session.participantIds) {
    const prevStat = nextStats[playerId];
    const isSpy = playerId === session.spyId;
    const votedForSpy = !isSpy && nextVotes[playerId] === session.spyId;
    const receivedVotes = voteCounts[playerId] ?? 0;

    let earned = 0;
    let explanation = '';

    if (isSpy) {
      if (spyVotesCount === 0) {
        earned = 3;
        explanation = 'За шпиона никто не проголосовал (+3 очка)';
      } else {
        earned = 0;
        explanation = 'За шпиона проголосовали (0 очков)';
      }
    } else if (votedForSpy) {
      if (spyVotesCount === 1) {
        earned = 2;
        explanation = 'Единственный проголосовал за шпиона (+2 очка)';
      } else {
        earned = 1;
        explanation = 'Проголосовал за шпиона в составе группы (+1 очко)';
      }
    } else {
      earned = 0;
      explanation = 'Голос не против шпиона (0 очков)';
    }

    pointsAwarded[playerId] = earned;
    pointReasons[playerId] = explanation;
    nextScores[playerId] = (nextScores[playerId] ?? 0) + earned;

    nextStats[playerId] = {
      roundsPlayed: prevStat.roundsPlayed + 1,
      timesSpy: prevStat.timesSpy + (isSpy ? 1 : 0),
      spyWins: prevStat.spyWins + (isSpy && spyWonCleanly ? 1 : 0),
      civilianRounds: prevStat.civilianRounds + (isSpy ? 0 : 1),
      correctSpyVotes: prevStat.correctSpyVotes + (votedForSpy ? 1 : 0),
      soloSpyCatches:
        prevStat.soloSpyCatches + (votedForSpy && isLoneDetectiveCatch ? 1 : 0),
      votesReceivedAsCivilian:
        prevStat.votesReceivedAsCivilian + (!isSpy ? receivedVotes : 0),
    };
  }

  const activeCategory = categories.find((c) => c.id === session.activeCategoryId);
  const outcome: RoundOutcome = {
    roundNumber: session.roundNumber,
    categoryId: session.activeCategoryId,
    categoryTitle: activeCategory?.title ?? 'Категория',
    secretWord: session.secretWord,
    spyId: session.spyId,
    participantIds: session.participantIds,
    winnerSide,
    reasonText,
    votes: nextVotes,
    voteCounts,
    pointsAwarded,
    pointReasons,
  };

  return {
    session: {
      ...session,
      votes: nextVotes,
      lastRoundOutcome: outcome,
      phase: SpyGamePhase.ROUND_RESULTS,
    },
    scoreboard: {
      ...scoreboard,
      scores: nextScores,
      playerStats: nextStats,
      history: [...scoreboard.history, outcome],
    },
  };
}

export function finishSpySessionToLeaderboard(session: SpySessionState): SpySessionState {
  return {
    ...session,
    phase: SpyGamePhase.LEADERBOARD,
  };
}

/**
 * Формирует итоговую таблицу лидеров с дерзкими званиями по занятому месту (1–5).
 * - Учитывает участников текущей игровой сессии.
 * - Игроки с одинаковым количеством очков получают одинаковое место и случайные звания своего места.
 * - Звания стабильны при обновлении страницы (через scoreboard.titleSeed) и обновляются в новой сессии.
 */
export function buildGlobalLeaderboard(
  scoreboard: GlobalScoreboardState,
  fallbackParticipantIds?: CharacterId[]
): LeaderboardEntry[] {
  const canonicalOrder = CHARACTERS.map((c) => c.id);
  const playedIds = canonicalOrder.filter(
    (id) => (scoreboard.playerStats[id]?.roundsPlayed ?? 0) > 0
  );

  const activeIds =
    playedIds.length > 0
      ? playedIds
      : fallbackParticipantIds && fallbackParticipantIds.length > 0
        ? sortParticipantsCanonical(fallbackParticipantIds)
        : canonicalOrder;

  const sortedIds = [...activeIds].sort((a, b) => {
    const scoreDiff = (scoreboard.scores[b] ?? 0) - (scoreboard.scores[a] ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return canonicalOrder.indexOf(a) - canonicalOrder.indexOf(b);
  });

  const safeSeed =
    typeof scoreboard.titleSeed === 'number' && scoreboard.titleSeed > 0
      ? scoreboard.titleSeed
      : 1;

  const shuffledByPlace: Record<1 | 2 | 3 | 4 | 5, string[]> = {
    1: getShuffledTitlesForPlace(1, safeSeed),
    2: getShuffledTitlesForPlace(2, safeSeed),
    3: getShuffledTitlesForPlace(3, safeSeed),
    4: getShuffledTitlesForPlace(4, safeSeed),
    5: getShuffledTitlesForPlace(5, safeSeed),
  };

  const usedCountByPlace: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let previousScore: number | null = null;
  let previousRank = 1;

  return sortedIds.map((id, index) => {
    const character = getCharacterById(id)!;
    const score = scoreboard.scores[id] ?? 0;
    const stats = scoreboard.playerStats[id];
    const hasPlayed = (stats?.roundsPlayed ?? 0) > 0;

    const rank =
      previousScore !== null && score === previousScore ? previousRank : index + 1;
    previousScore = score;
    previousRank = rank;

    const placeKey = Math.min(5, Math.max(1, rank)) as 1 | 2 | 3 | 4 | 5;
    const placePool = shuffledByPlace[placeKey];
    const pickIndex = usedCountByPlace[placeKey] % placePool.length;
    usedCountByPlace[placeKey] += 1;

    return {
      rank,
      character,
      score,
      title: placePool[pickIndex],
      stats,
      hasPlayed,
    };
  });
}

export enum AppScreen {
  LOBBY = 'LOBBY',
  CHARACTER_SELECTION = 'CHARACTER_SELECTION',
  AVATAR_CAMERA = 'AVATAR_CAMERA',
  CATEGORY_SELECTION = 'CATEGORY_SELECTION',
  GAME = 'GAME',
  ACT_TWO_AUTH = 'ACT_TWO_AUTH',
  ACT_TWO = 'ACT_TWO',
}

export enum SpyGamePhase {
  /** Экран безопасной передачи смартфона участнику для просмотра роли */
  ROLE_HANDOFF = 'ROLE_HANDOFF',
  /** Участник тайно смотрит свою роль (слово или «Ты шпион») */
  ROLE_VIEWING = 'ROLE_VIEWING',
  /** Общее свободное обсуждение продолжительностью 3 минуты (180 секунд) */
  DISCUSSION = 'DISCUSSION',
  /** Экран безопасной передачи смартфона участнику для тайного голосования */
  VOTING_HANDOFF = 'VOTING_HANDOFF',
  /** Участник тайно выбирает подозреваемого */
  VOTING_SELECT = 'VOTING_SELECT',
  /** Раскрытие настоящего шпиона, секретного слова, голосов и начисление очков за раунд */
  ROUND_RESULTS = 'ROUND_RESULTS',
  /** Все слова в выбранной категории закончились перед стартом нового раунда */
  CATEGORY_EXHAUSTED = 'CATEGORY_EXHAUSTED',
  /** Итоговая таблица лидеров всей сессии с очками и званиями */
  LEADERBOARD = 'LEADERBOARD',
}

export type RoundWinnerSide = 'CIVILIANS' | 'LONE_DETECTIVE' | 'SPY';

export type CharacterId = 'rasul' | 'salikh' | 'mikail' | 'denislam' | 'izamutdin';

export type CategoryIconKey =
  | 'compass'
  | 'star'
  | 'briefcase'
  | 'paw'
  | 'package'
  | 'clapperboard'
  | 'utensils'
  | 'trophy';

export interface CharacterTheme {
  colorLabel: string;
  swatchHex: string;
  swatchBorderClass: string;
  selectedBgClass: string;
  selectedRingClass: string;
  avatarFallbackBgClass: string;
  avatarFallbackTextClass: string;
  bannerBgClass: string;
  bannerTextClass: string;
  bannerSubtextClass: string;
  avatarRingClass: string;
}

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  shortInitial: string;
  theme: CharacterTheme;
}

export interface GameCategory {
  id: string;
  title: string;
  description: string;
  iconKey: CategoryIconKey;
  items: string[];
  isCustom?: boolean;
}

export type UsedWordsMap = Record<string, string[]>;

export interface PlayerSessionStats {
  roundsPlayed: number;
  timesSpy: number;
  spyWins: number;
  civilianRounds: number;
  correctSpyVotes: number;
  soloSpyCatches: number;
  votesReceivedAsCivilian: number;
}

export interface RoundOutcome {
  roundNumber: number;
  categoryId: string;
  categoryTitle: string;
  secretWord: string;
  spyId: CharacterId;
  participantIds: CharacterId[];
  winnerSide: RoundWinnerSide;
  reasonText: string;
  votes: Partial<Record<CharacterId, CharacterId>>;
  voteCounts: Partial<Record<CharacterId, number>>;
  pointsAwarded: Partial<Record<CharacterId, number>>;
  pointReasons: Partial<Record<CharacterId, string>>;
}

export interface LeaderboardEntry {
  rank: number;
  character: CharacterProfile;
  score: number;
  title: string;
  stats: PlayerSessionStats;
  hasPlayed: boolean;
}

/**
 * Глобальное состояние очков, статистики, званий и сыгранных слов текущей сессии.
 * Сохраняется при обновлении страницы, выходе в лобби и смене категорий,
 * и генерирует новые звания при начале новой игровой сессии.
 */
export interface GlobalScoreboardState {
  scores: Record<CharacterId, number>;
  playerStats: Record<CharacterId, PlayerSessionStats>;
  history: RoundOutcome[];
  usedWordsByCategory: UsedWordsMap;
  titleSeed: number;
}

/**
 * Состояние текущего активного раунда игры «Шпион».
 */
export interface SpySessionState {
  participantIds: CharacterId[];
  roundNumber: number;
  activeCategoryId: string;
  phase: SpyGamePhase;
  spyId: CharacterId;
  secretWord: string;
  roleRevealIndex: number;
  voterIndex: number;
  votes: Partial<Record<CharacterId, CharacterId>>;
  lastRoundOutcome: RoundOutcome | null;
}

// ============================================================================
// СЕКРЕТНЫЙ РЕЖИМ ACT II — ДЕТЕКТИВНЫЕ СЦЕНАРИИ
// ============================================================================

export type ActTwoScenarioIconId =
  | 'chalice'
  | 'express'
  | 'operating_room'
  | 'theater_dagger'
  | 'lighthouse'
  | 'archive_fire'
  | 'penthouse_mirror'
  | 'night_flight'
  | 'crimson_ruby'
  | 'bunker_vault';

export enum ActTwoPhase {
  /** Галерея выбора из 10 сценариев и выбор 3–5 участников */
  HUB = 'HUB',
  /** Краткая сводка дела перед раздачей засекреченных досье */
  CASE_BRIEFING = 'CASE_BRIEFING',
  /** Безопасная передача смартфона следующему участнику */
  ROLE_HANDOFF = 'ROLE_HANDOFF',
  /** Тайное чтение своей роли, личной истории и индивидуального задания */
  ROLE_VIEWING = 'ROLE_VIEWING',
  /** Обсуждение расследования с доступом к уликам и таймером */
  DISCUSSION = 'DISCUSSION',
  /** Передача смартфона для тайного голосования по делу */
  VOTING_HANDOFF = 'VOTING_HANDOFF',
  /** Выбор главного обвиняемого */
  VOTING_SELECT = 'VOTING_SELECT',
  /** Финальное раскрытие преступника, ролей, историй и индивидуальных заданий */
  FINALE = 'FINALE',
}

export interface ActTwoRoleTemplate {
  id: string;
  personaTitle: string;
  isCulprit: boolean;
  publicNote: string;
  secretStory: string;
  personalTask: string;
}

export interface ActTwoScenario {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  locationAndTime: string;
  illustrationId: ActTwoScenarioIconId;
  incidentSummary: string;
  evidenceList: string[];
  roles: ActTwoRoleTemplate[];
  caughtEpilogue: string;
  escapedEpilogue: string;
  truthReconstruction: string;
}

export interface ActTwoAssignedPlayer {
  characterId: CharacterId;
  role: ActTwoRoleTemplate;
}

export interface ActTwoSessionState {
  scenarioId: string;
  participantIds: CharacterId[];
  assignments: ActTwoAssignedPlayer[];
  culpritCharacterId: CharacterId;
  phase: ActTwoPhase;
  handoffIndex: number;
  voterIndex: number;
  votes: Partial<Record<CharacterId, CharacterId>>;
  caughtCulprit: boolean | null;
  accusedCharacterId: CharacterId | null;
}

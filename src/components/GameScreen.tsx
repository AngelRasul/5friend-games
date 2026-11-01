import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Check,
  Crown,
  Eye,
  EyeOff,
  Home,
  Layers,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Trophy,
  VenetianMask,
  Vote,
} from 'lucide-react';
import { getCharacterById } from '../data/characters';
import {
  DISCUSSION_DURATION_SECONDS,
  buildGlobalLeaderboard,
  getAvailableWordsForCategory,
} from '../logic/gameLogic';
import {
  CharacterId,
  GameCategory,
  GlobalScoreboardState,
  SpyGamePhase,
  SpySessionState,
} from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';

interface GameScreenProps {
  session: SpySessionState;
  scoreboard: GlobalScoreboardState;
  categories: GameCategory[];
  avatars: Partial<Record<CharacterId, string>>;
  onOpenRole: () => void;
  onHideRoleAndNext: () => void;
  onStartVoting: (expiredByTimer?: boolean) => void;
  onOpenVoterBallot: () => void;
  onSubmitVote: (suspectId: CharacterId) => void;
  onStartNextRoundSameCategory: () => void;
  onOpenCategorySwitchForNextRound: () => void;
  onFinishToLeaderboard: () => void;
  onResetSessionScores: () => void;
  onExitToLobby: () => void;
}

function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function GameScreen({
  session,
  scoreboard,
  categories,
  avatars,
  onOpenRole,
  onHideRoleAndNext,
  onStartVoting,
  onOpenVoterBallot,
  onSubmitVote,
  onStartNextRoundSameCategory,
  onOpenCategorySwitchForNextRound,
  onFinishToLeaderboard,
  onResetSessionScores,
  onExitToLobby,
}: GameScreenProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    DISCUSSION_DURATION_SECONDS
  );
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState<CharacterId | null>(null);
  const [isHandoffUnlocked, setIsHandoffUnlocked] = useState<boolean>(false);
  const [confirmSessionReset, setConfirmSessionReset] = useState<boolean>(false);

  const deadlineMsRef = useRef<number>(Date.now() + DISCUSSION_DURATION_SECONDS * 1000);
  const pausedRemainingRef = useRef<number>(DISCUSSION_DURATION_SECONDS);
  const timerTriggeredRef = useRef<boolean>(false);

  const activeCategory = categories.find((c) => c.id === session.activeCategoryId);
  const remainingWordsInActiveCategory = getAvailableWordsForCategory(
    activeCategory,
    scoreboard.usedWordsByCategory
  ).length;

  // Сброс выбранного кандидата и анти-даблтап защита при передаче смартфона
  useEffect(() => {
    setSelectedSuspectId(null);
    setConfirmSessionReset(false);

    if (
      session.phase === SpyGamePhase.ROLE_HANDOFF ||
      session.phase === SpyGamePhase.VOTING_HANDOFF
    ) {
      setIsHandoffUnlocked(false);
      const unlockTimer = window.setTimeout(() => {
        setIsHandoffUnlocked(true);
      }, 280);
      return () => window.clearTimeout(unlockTimer);
    }

    setIsHandoffUnlocked(true);
  }, [session.phase, session.roleRevealIndex, session.voterIndex, session.roundNumber]);

  // Инициализация точного таймера на 3 минуты при входе в фазу DISCUSSION
  useEffect(() => {
    if (session.phase === SpyGamePhase.DISCUSSION) {
      setRemainingSeconds(DISCUSSION_DURATION_SECONDS);
      pausedRemainingRef.current = DISCUSSION_DURATION_SECONDS;
      deadlineMsRef.current = Date.now() + DISCUSSION_DURATION_SECONDS * 1000;
      setIsTimerPaused(false);
      timerTriggeredRef.current = false;
    }
  }, [session.phase, session.roundNumber]);

  // Точный wall-clock таймер без дрейфа в Safari / Chrome при блокировке экрана или смене вкладки
  useEffect(() => {
    if (session.phase !== SpyGamePhase.DISCUSSION || isTimerPaused) {
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
        onStartVoting(true);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [session.phase, isTimerPaused, onStartVoting]);

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

  // ============================================================================
  // ИТОГОВАЯ ТАБЛИЦА ЛИДЕРОВ И ЗВАНИЙ («ФИНАЛЬНЫЙ РЕЗУЛЬТАТ»)
  // ============================================================================
  if (session.phase === SpyGamePhase.LEADERBOARD) {
    const leaderboard = buildGlobalLeaderboard(scoreboard, session.participantIds);

    return (
      <main className="flex-1 px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md mx-auto bg-white rounded-[32px] p-6 shadow-sm border border-[#E7E0EC]"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-[#1C1B1F]">
              Итоги игры
            </h2>
            <span className="text-xs font-medium text-[#49454F] tabular-nums">
              Раундов: {scoreboard.history.length}
            </span>
          </div>

          <div className="mt-5 space-y-2.5">
            {leaderboard.map((entry) => {
              const isFirstPlace = entry.rank === 1;
              const isLowerHalf = entry.rank >= 4;

              return (
                <div
                  key={entry.character.id}
                  className={`rounded-[24px] flex items-center justify-between gap-3 transition-colors ${
                    isFirstPlace
                      ? 'p-4 bg-[#EFE7FF] border border-[#BCA4FF] shadow-xs'
                      : 'p-3.5 bg-[#F7F4FA] border border-[#E7E0EC]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 tabular-nums ${
                        isFirstPlace
                          ? 'w-8 h-8 bg-[#65558F] text-white'
                          : 'w-7 h-7 bg-white text-[#49454F] border border-[#E7E0EC]'
                      }`}
                    >
                      {entry.rank}
                    </span>

                    <CharacterAvatar
                      character={entry.character}
                      photoUrl={avatars[entry.character.id]}
                      size={isFirstPlace ? 'md' : 'sm'}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`font-display font-bold truncate ${
                            isFirstPlace
                              ? 'text-lg text-[#21005D]'
                              : 'text-base text-[#1C1B1F]'
                          }`}
                        >
                          {entry.character.name}
                        </span>
                        {isFirstPlace && (
                          <Crown
                            className="w-4 h-4 text-[#65558F] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div
                        className={`leading-snug mt-0.5 ${
                          isFirstPlace
                            ? 'text-sm font-semibold text-[#55467B]'
                            : isLowerHalf
                              ? 'text-xs font-medium text-[#7D5260]'
                              : 'text-xs font-medium text-[#65558F]'
                        }`}
                      >
                        {entry.title}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 tabular-nums pl-1">
                    <div
                      className={`font-display font-bold leading-none ${
                        isFirstPlace
                          ? 'text-3xl text-[#21005D]'
                          : 'text-2xl text-[#1C1B1F]'
                      }`}
                    >
                      {entry.score}
                    </div>
                    <div
                      className={`text-[11px] mt-1 ${
                        isFirstPlace ? 'text-[#55467B]' : 'text-[#49454F]'
                      }`}
                    >
                      очк.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={onOpenCategorySwitchForNextRound}
              className="w-full min-h-[54px] px-5 rounded-full bg-[#65558F] hover:bg-[#55467B] text-white font-display font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Продолжить игру</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {confirmSessionReset ? (
                <button
                  type="button"
                  onClick={onResetSessionScores}
                  className="min-h-[48px] px-4 rounded-full bg-[#B3261E] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Точно обнулить?</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmSessionReset(true)}
                  className="min-h-[48px] px-4 rounded-full bg-[#F5F2F7] hover:bg-[#F9DEDC]/70 text-[#49454F] hover:text-[#B3261E] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Новая сессия</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExitToLobby}
                className="min-h-[48px] px-4 rounded-full bg-[#EFECF2] hover:bg-[#E4E0E9] text-[#1C1B1F] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>В меню</span>
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    );
  }

  // ============================================================================
  // ВСЕ СЛОВА В КАТЕГОРИИ СЫГРАНЫ
  // ============================================================================
  if (session.phase === SpyGamePhase.CATEGORY_EXHAUSTED) {
    return (
      <main className="flex-1 flex flex-col justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md mx-auto bg-white rounded-[32px] p-6 shadow-sm border border-[#E7E0EC] text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EADDFF] text-[#21005D] flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#1C1B1F] mt-4">
            Слова в категории «{activeCategory?.title}» закончились
          </h2>
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={onOpenCategorySwitchForNextRound}
              className="w-full min-h-[54px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] text-white font-display font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Layers className="w-5 h-5" />
              <span>Выбрать категорию</span>
            </button>
            <button
              type="button"
              onClick={onFinishToLeaderboard}
              className="w-full min-h-[48px] px-5 rounded-full bg-[#EADDFF] hover:bg-[#DEC9FF] text-sm font-semibold text-[#21005D] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Trophy className="w-4 h-4" />
              <span>Финальный результат</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================================
  // ИТОГИ РАУНДА (ПОБЕДИТЕЛЬ, СЕКРЕТНОЕ СЛОВО И ОЧКИ РАУНДА)
  // ============================================================================
  if (session.phase === SpyGamePhase.ROUND_RESULTS && session.lastRoundOutcome) {
    const outcome = session.lastRoundOutcome;
    const spyCharacter = getCharacterById(outcome.spyId);

    return (
      <main className="flex-1 flex flex-col justify-center px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md mx-auto bg-white rounded-[32px] p-6 shadow-sm border border-[#E7E0EC] space-y-4"
        >
          <div
            className={`rounded-[22px] p-4 flex items-center gap-3 ${
              outcome.winnerSide === 'CIVILIANS'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                : outcome.winnerSide === 'LONE_DETECTIVE'
                  ? 'bg-amber-50 border border-amber-200 text-amber-950'
                  : 'bg-[#EADDFF]/70 border border-[#D0BCFF] text-[#21005D]'
            }`}
          >
            {outcome.winnerSide === 'CIVILIANS' ? (
              <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
            ) : outcome.winnerSide === 'LONE_DETECTIVE' ? (
              <Award className="w-6 h-6 text-amber-700 shrink-0" />
            ) : (
              <VenetianMask className="w-6 h-6 text-[#65558F] shrink-0" />
            )}
            <div className="font-display text-lg font-bold leading-snug">
              {outcome.winnerSide === 'CIVILIANS'
                ? 'Шпион раскрыт!'
                : outcome.winnerSide === 'LONE_DETECTIVE'
                  ? 'Одиночка угадал шпиона!'
                  : 'Чистая победа шпиона!'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {spyCharacter && (
              <div className="rounded-[20px] p-3.5 bg-[#F5F2F7] border border-[#E7E0EC]">
                <div className="text-[11px] font-medium text-[#49454F]">Шпион</div>
                <div className="mt-1.5 flex items-center gap-2 min-w-0">
                  <CharacterAvatar
                    character={spyCharacter}
                    photoUrl={avatars[spyCharacter.id]}
                    size="sm"
                  />
                  <span className="font-display text-sm font-bold text-[#1C1B1F] truncate">
                    {spyCharacter.name}
                  </span>
                </div>
              </div>
            )}

            <div className="rounded-[20px] p-3.5 bg-[#F5F2F7] border border-[#E7E0EC] flex flex-col justify-between">
              <div className="text-[11px] font-medium text-[#49454F]">Секретное слово</div>
              <div className="font-display text-base font-bold text-[#1C1B1F] break-words mt-1">
                {outcome.secretWord}
              </div>
            </div>
          </div>

          {/* Начисленные очки за этот раунд (без общего суммарного табло до финала) */}
          <div className="rounded-[22px] bg-[#F5F2F7]/75 border border-[#E7E0EC] divide-y divide-[#E7E0EC]">
            {session.participantIds.map((playerId) => {
              const player = getCharacterById(playerId);
              if (!player) return null;
              const earned = outcome.pointsAwarded[playerId] ?? 0;
              const votedTarget = outcome.votes[playerId]
                ? getCharacterById(outcome.votes[playerId]!)
                : undefined;

              return (
                <div
                  key={player.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-[#1C1B1F]">{player.name}</span>
                    <span className="text-xs text-[#49454F] ml-2">
                      → {votedTarget?.name ?? '—'}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold tabular-nums shrink-0 ${
                      earned > 0 ? 'text-emerald-700' : 'text-[#79747E]'
                    }`}
                  >
                    +{earned}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-1 space-y-2.5">
            {remainingWordsInActiveCategory > 0 && (
              <button
                type="button"
                onClick={onStartNextRoundSameCategory}
                className="w-full min-h-[56px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] text-white font-display font-semibold text-base flex items-center justify-center gap-2 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <span>Следующий раунд</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenCategorySwitchForNextRound}
                className="min-h-[48px] px-3 rounded-full bg-[#EFECF2] hover:bg-[#E8DEF8] text-xs font-semibold text-[#1D192B] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Layers className="w-4 h-4 text-[#65558F] shrink-0" />
                <span>Категория</span>
              </button>

              <button
                type="button"
                onClick={onFinishToLeaderboard}
                className="min-h-[48px] px-3 rounded-full bg-[#EADDFF] hover:bg-[#DEC9FF] text-xs font-semibold text-[#21005D] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 shrink-0" />
                <span>Финальный результат</span>
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    );
  }

  // ============================================================================
  // АКТИВНЫЕ ИГРОВЫЕ ЭТАПЫ: РОЛИ, ТАЙМЕР 3 МИНУТЫ И ТАЙНОЕ ГОЛОСОВАНИЕ
  // ============================================================================
  const activeRolePlayer = getCharacterById(
    session.participantIds[session.roleRevealIndex]
  );
  const activeVoterPlayer = getCharacterById(
    session.participantIds[session.voterIndex]
  );

  const timerProgress = Math.max(
    0,
    Math.min(1, remainingSeconds / DISCUSSION_DURATION_SECONDS)
  );
  const isLowTime = remainingSeconds <= 30;

  return (
    <main className="flex-1 flex flex-col justify-center px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center text-xs font-medium text-[#49454F] tabular-nums mb-3">
          Раунд {session.roundNumber} · {activeCategory?.title ?? 'Категория'}
        </div>

        {/* 1. ПЕРЕДАЧА ТЕЛЕФОНА: ТОЛЬКО ИМЯ УЧАСТНИКА И КНОПКА ПРОДОЛЖЕНИЯ */}
        {session.phase === SpyGamePhase.ROLE_HANDOFF && activeRolePlayer && (
          <div
            key={`role-handoff-${activeRolePlayer.id}`}
            className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#E7E0EC] text-center"
          >
            <div className="text-xs font-medium text-[#49454F] tabular-nums">
              Игрок {session.roleRevealIndex + 1} из {session.participantIds.length}
            </div>

            <div className="mt-6 flex flex-col items-center">
              <CharacterAvatar
                character={activeRolePlayer}
                photoUrl={avatars[activeRolePlayer.id]}
                size="xl"
              />
              <h2 className="font-display text-3xl font-bold text-[#1C1B1F] mt-4">
                {activeRolePlayer.name}
              </h2>
              <span className="text-xs text-[#49454F] mt-1">
                {activeRolePlayer.theme.colorLabel}
              </span>
            </div>

            <div className="mt-8">
              <button
                type="button"
                disabled={!isHandoffUnlocked}
                onClick={onOpenRole}
                className="w-full min-h-[60px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] disabled:opacity-75 text-white font-display font-semibold text-lg flex items-center justify-center gap-2.5 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Eye className="w-5 h-5" />
                <span>Показать роль</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. ПРОСМОТР РОЛИ: ТОЛЬКО «ТЫ ШПИОН» ИЛИ САМО СЕКРЕТНОЕ СЛОВО */}
        {session.phase === SpyGamePhase.ROLE_VIEWING && activeRolePlayer && (
          <div
            key={`role-view-${activeRolePlayer.id}`}
            className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#E7E0EC] text-center"
          >
            <div className="text-xs font-medium text-[#49454F]">{activeRolePlayer.name}</div>

            <div className="mt-5 rounded-[26px] bg-[#F5F2F7] border border-[#E7E0EC] px-5 py-10 min-h-[200px] flex flex-col items-center justify-center">
              {activeRolePlayer.id === session.spyId ? (
                <>
                  <VenetianMask className="w-10 h-10 text-[#65558F] mb-3" />
                  <div className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1B1F]">
                    ТЫ ШПИОН
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-[#65558F] mb-2">
                    Секретное слово
                  </span>
                  <div
                    style={{ textWrap: 'balance' }}
                    className="font-display text-3xl sm:text-4xl font-bold text-[#1C1B1F] leading-tight break-words"
                  >
                    {session.secretWord}
                  </div>
                </>
              )}
            </div>

            <div className="mt-7">
              <button
                type="button"
                onClick={onHideRoleAndNext}
                className="w-full min-h-[60px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] text-white font-display font-semibold text-lg flex items-center justify-center gap-2.5 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <EyeOff className="w-5 h-5" />
                <span>
                  {session.roleRevealIndex + 1 < session.participantIds.length
                    ? 'Скрыть роль'
                    : 'Начать обсуждение'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 3. ОБСУЖДЕНИЕ: ТАЙМЕР НА 3 МИНУТЫ И МИНИМУМ ЭЛЕМЕНТОВ */}
        {session.phase === SpyGamePhase.DISCUSSION && (
          <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#E7E0EC] text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#65558F]">
              Обсуждение
            </div>

            <div
              className={`mt-5 rounded-[26px] py-9 px-6 border transition-colors ${
                isLowTime
                  ? 'bg-[#F9DEDC]/60 border-[#F2B8B5]'
                  : 'bg-[#F5F2F7] border-[#E7E0EC]'
              }`}
            >
              <div
                className={`font-mono text-6xl font-semibold tracking-tight tabular-nums ${
                  isLowTime ? 'text-[#B3261E]' : 'text-[#1C1B1F]'
                }`}
              >
                {formatTimer(remainingSeconds)}
              </div>

              <div className="mt-6 h-2 w-full rounded-full bg-black/8 overflow-hidden">
                <div
                  style={{
                    transform: `scaleX(${timerProgress})`,
                    transformOrigin: 'left',
                  }}
                  className={`h-full w-full transition-transform duration-300 ${
                    isLowTime ? 'bg-[#B3261E]' : 'bg-[#65558F]'
                  }`}
                />
              </div>
            </div>

            <div className="mt-7 space-y-2.5">
              <button
                type="button"
                onClick={() => onStartVoting(false)}
                className="w-full min-h-[58px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] text-white font-display font-semibold text-lg flex items-center justify-center gap-2.5 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Vote className="w-5 h-5" />
                <span>Голосовать</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePause}
                className="w-full min-h-[48px] px-5 rounded-full bg-[#F5F2F7] hover:bg-[#E8DEF8] text-sm font-semibold text-[#1C1B1F] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                {isTimerPaused ? (
                  <>
                    <Play className="w-4 h-4 text-[#65558F]" />
                    <span>Продолжить таймер</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 text-[#65558F]" />
                    <span>Пауза</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 4. ПЕРЕДАЧА ТЕЛЕФОНА ПЕРЕД ГОЛОСОВАНИЕМ */}
        {session.phase === SpyGamePhase.VOTING_HANDOFF && activeVoterPlayer && (
          <div
            key={`vote-handoff-${activeVoterPlayer.id}`}
            className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#E7E0EC] text-center"
          >
            <div className="text-xs font-medium text-[#49454F] tabular-nums">
              Голосование · {session.voterIndex + 1} из {session.participantIds.length}
            </div>

            <div className="mt-6 flex flex-col items-center">
              <CharacterAvatar
                character={activeVoterPlayer}
                photoUrl={avatars[activeVoterPlayer.id]}
                size="xl"
              />
              <h2 className="font-display text-3xl font-bold text-[#1C1B1F] mt-4">
                {activeVoterPlayer.name}
              </h2>
            </div>

            <div className="mt-8">
              <button
                type="button"
                disabled={!isHandoffUnlocked}
                onClick={onOpenVoterBallot}
                className="w-full min-h-[60px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] disabled:opacity-75 text-white font-display font-semibold text-lg flex items-center justify-center gap-2.5 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Vote className="w-5 h-5" />
                <span>К голосованию</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. ТАЙНОЕ ГОЛОСОВАНИЕ: ТОЛЬКО ИМЯ ГОЛОСУЮЩЕГО И СПИСОК КАНДИДАТОВ */}
        {session.phase === SpyGamePhase.VOTING_SELECT && activeVoterPlayer && (
          <div
            key={`vote-select-${activeVoterPlayer.id}`}
            className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E7E0EC]"
          >
            <div className="text-center">
              <div className="text-xs font-semibold text-[#65558F]">Голосует</div>
              <h3 className="font-display text-2xl font-bold text-[#1C1B1F] mt-0.5">
                {activeVoterPlayer.name}
              </h3>
            </div>

            <div className="mt-5 space-y-2.5">
              {session.participantIds
                .filter((candidateId) => candidateId !== activeVoterPlayer.id)
                .map((candidateId) => {
                  const candidate = getCharacterById(candidateId);
                  if (!candidate) return null;
                  const isChosen = selectedSuspectId === candidate.id;

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedSuspectId(candidate.id)}
                      aria-pressed={isChosen}
                      className={`w-full min-h-[60px] rounded-[22px] px-4 py-3 border flex items-center justify-between gap-3 text-left transition-all ${
                        isChosen
                          ? `${candidate.theme.selectedBgClass} ${candidate.theme.selectedRingClass}`
                          : 'bg-[#F5F2F7]/85 hover:bg-[#EFECF2] border-[#E7E0EC]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CharacterAvatar
                          character={candidate}
                          photoUrl={avatars[candidate.id]}
                          size="sm"
                        />
                        <span className="font-display text-lg font-bold text-[#1C1B1F] truncate">
                          {candidate.name}
                        </span>
                      </div>

                      <div
                        className={`min-h-[36px] min-w-[36px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isChosen
                            ? 'bg-[#65558F] text-white'
                            : 'bg-white border border-[#CAC4D0] text-transparent'
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
                    onSubmitVote(selectedSuspectId);
                  }
                }}
                className="w-full min-h-[58px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] disabled:bg-[#E7E0EC] disabled:text-[#79747E] text-white font-display font-semibold text-base flex items-center justify-center gap-2 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Check className="w-5 h-5" />
                <span>Подтвердить</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Check, Play, RotateCcw, Trophy, X } from 'lucide-react';
import { CHARACTERS, MAX_PLAYERS, MIN_PLAYERS } from '../data/characters';
import { CharacterId, GlobalScoreboardState } from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';

interface LobbyProps {
  avatars: Partial<Record<CharacterId, string>>;
  scoreboard: GlobalScoreboardState;
  onStartSetup: () => void;
  onOpenFinalResult: () => void;
  onOpenRules: () => void;
  onResetAllSettings: () => Promise<void>;
  onOpenActTwoAuth: () => void;
}

export function Lobby({
  avatars,
  scoreboard,
  onStartSetup,
  onOpenFinalResult,
  onOpenRules,
  onResetAllSettings,
  onOpenActTwoAuth,
}: LobbyProps) {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDoneNotice, setResetDoneNotice] = useState(false);

  const playedRoundsCount = scoreboard.history.length;

  const handleConfirmReset = async () => {
    setIsResetting(true);
    await onResetAllSettings();
    setIsResetting(false);
    setIsResetModalOpen(false);
    setResetDoneNotice(true);
    window.setTimeout(() => {
      setResetDoneNotice(false);
    }, 3000);
  };

  return (
    <main className="flex-1 flex flex-col justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-[#E7E0EC]"
      >
        <div className="text-center">
          <p className="text-xs font-semibold tracking-wide uppercase text-[#65558F]">
            Игра «Шпион» · {MIN_PLAYERS}–{MAX_PLAYERS} игроков
          </p>

          <h1 className="font-display text-4xl font-bold tracking-tight text-[#1C1B1F] mt-2">
            Угадай спину
          </h1>

          <p className="text-sm text-[#49454F] mt-2">
            Один телефон, тайные роли и 3 минуты на поиск шпиона
          </p>
        </div>

        {/* Компактный ряд персонажей компании */}
        <div className="mt-7 grid grid-cols-5 gap-2">
          {CHARACTERS.map((character) => (
            <div key={character.id} className="flex flex-col items-center gap-1.5 min-w-0">
              <CharacterAvatar
                character={character}
                photoUrl={avatars[character.id]}
                size="sm"
              />
              <span className="text-[11px] font-medium text-[#1C1B1F] truncate w-full text-center">
                {character.name}
              </span>
            </div>
          ))}
        </div>

        {resetDoneNotice && (
          <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-900 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>Все данные сброшены</span>
          </div>
        )}

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={onStartSetup}
            className="w-full min-h-[60px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] text-white font-display font-semibold text-lg shadow-md shadow-[#65558F]/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65558F]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Играть</span>
          </button>

          {playedRoundsCount > 0 && (
            <button
              type="button"
              onClick={onOpenFinalResult}
              className="w-full min-h-[52px] px-5 rounded-full bg-[#EADDFF] hover:bg-[#DEC9FF] text-[#21005D] font-display font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>Финальный результат ({playedRoundsCount})</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onOpenRules}
              className="min-h-[48px] px-4 rounded-full bg-[#F5F2F7] hover:bg-[#E8DEF8] text-[#1D192B] font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-[#65558F] shrink-0" />
              <span>Правила</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="min-h-[48px] px-4 rounded-full bg-[#F5F2F7] hover:bg-[#F9DEDC]/75 text-[#49454F] hover:text-[#B3261E] font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Сбросить всё</span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* Малозаметный органичный вход в засекреченный второй акт */}
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onOpenActTwoAuth}
          aria-label="Секретный архив второго акта"
          className="min-h-[44px] px-4 rounded-full font-mono text-[11px] tracking-widest text-[#79747E]/50 hover:text-[#49454F] active:scale-95 transition-all select-none whitespace-nowrap"
        >
          АРХИВ · II
        </button>
      </div>

      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => !isResetting && setIsResetModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-settings-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full sm:max-w-sm bg-[#FBF8FD] rounded-t-[28px] sm:rounded-[28px] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl border border-[#E7E0EC]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="reset-settings-title"
                  className="font-display text-lg font-bold text-[#1C1B1F]"
                >
                  Сбросить все данные?
                </h2>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setIsResetModalOpen(false)}
                  aria-label="Закрыть"
                  className="min-h-[44px] min-w-[44px] -mr-2 rounded-full flex items-center justify-center text-[#49454F] hover:bg-[#E8DEF8]/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-[#49454F] mt-2 leading-relaxed">
                Удалятся фотографии игроков, свои категории, добавленные слова и накопленные очки.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setIsResetModalOpen(false)}
                  className="min-h-[48px] px-4 rounded-full bg-[#EFECF2] text-sm font-semibold text-[#1C1B1F] whitespace-nowrap"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleConfirmReset}
                  className="min-h-[48px] px-4 rounded-full bg-[#B3261E] hover:bg-[#991F18] text-white text-sm font-semibold whitespace-nowrap"
                >
                  {isResetting ? 'Сброс...' : 'Сбросить'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

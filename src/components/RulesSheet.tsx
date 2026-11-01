import { AnimatePresence, motion } from 'motion/react';
import {
  Clock,
  Trophy,
  VenetianMask,
  Volume2,
  VolumeX,
  Vote,
  X,
} from 'lucide-react';

interface RulesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function RulesSheet({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
}: RulesSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-modal-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-md bg-[#FBF8FD] rounded-t-[28px] sm:rounded-[28px] shadow-xl max-h-[88vh] flex flex-col overflow-hidden"
          >
            <div className="w-10 h-1.5 bg-[#CAC4D0] rounded-full mx-auto mt-3 sm:hidden" />

            <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-[#E7E0EC]">
              <h2
                id="rules-modal-title"
                className="font-display text-lg font-bold text-[#1C1B1F]"
              >
                Правила
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="min-h-[44px] min-w-[44px] -mr-2 rounded-full flex items-center justify-center text-[#49454F] hover:bg-[#E8DEF8]/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#49454F]">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EADDFF] text-[#21005D] flex items-center justify-center shrink-0">
                  <VenetianMask className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1C1B1F]">1. Тайные роли</h3>
                  <p className="mt-0.5 leading-snug">
                    Мирные получают одно общее слово, а один случайный игрок — роль «ТЫ ШПИОН».
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8DEF8] text-[#1D192B] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1C1B1F]">2. Обсуждение 3 минуты</h3>
                  <p className="mt-0.5 leading-snug">
                    Задавайте друг другу вопросы в свободном порядке и ищите шпиона.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FFD8E4] text-[#31111D] flex items-center justify-center shrink-0">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1C1B1F]">3. Тайное голосование</h3>
                  <p className="mt-0.5 leading-snug">
                    Каждый игрок на телефоне выбирает одного подозреваемого.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F5F2F7] text-[#65558F] border border-[#E7E0EC] flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1C1B1F]">4. Очки</h3>
                  <ul className="mt-1 space-y-1 leading-snug">
                    <li>
                      • <strong className="text-[#1C1B1F]">0 голосов за шпиона:</strong> шпиону +3
                    </li>
                    <li>
                      • <strong className="text-[#1C1B1F]">1 голос за шпиона:</strong> угадавшему +2,
                      шпиону 0
                    </li>
                    <li>
                      • <strong className="text-[#1C1B1F]">2+ голосов за шпиона:</strong> каждому
                      угадавшему +1, шпиону 0
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7E0EC] flex items-center justify-between">
                <span className="font-medium text-[#1C1B1F]">Звук</span>
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="min-h-[44px] px-4 rounded-full bg-[#EFECF2] hover:bg-[#E8DEF8] text-xs font-semibold text-[#1C1B1F] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-[#65558F]" />
                      <span>Включён</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-[#79747E]" />
                      <span>Выключен</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#F5F2F7] border-t border-[#E7E0EC]">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[48px] px-6 rounded-full bg-[#65558F] hover:bg-[#56467D] text-white font-semibold text-sm active:scale-[0.98] transition-all whitespace-nowrap"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

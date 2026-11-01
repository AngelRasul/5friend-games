import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, KeyRound, Lock, ShieldAlert } from 'lucide-react';
import { verifyActTwoPassword } from '../logic/actTwoLogic';
import { ActTwoAtmosphere } from './ActTwoAtmosphere';

interface ActTwoAuthProps {
  onAuthorized: () => void;
  onBack: () => void;
}

export function ActTwoAuth({ onAuthorized, onBack }: ActTwoAuthProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorTriggerCount, setErrorTriggerCount] = useState(0);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (verifyActTwoPassword(passwordInput)) {
      setHasError(false);
      onAuthorized();
    } else {
      setHasError(true);
      setErrorTriggerCount((prev) => prev + 1);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col bg-[#070709] text-[#F8FAFC] overflow-hidden">
      <ActTwoAtmosphere />

      <header className="relative z-20 sticky top-0 h-14 bg-[#070709]/85 backdrop-blur-md border-b border-red-950/50">
        <div className="max-w-lg mx-auto h-full px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] -ml-2 px-3 rounded-full flex items-center gap-2 text-zinc-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-red-600"
          >
            <ArrowLeft className="w-5 h-5 text-[#DC2626]" />
            <span className="text-sm font-semibold">Назад</span>
          </button>

          <span className="font-mono text-xs tracking-widest text-zinc-500 whitespace-nowrap shrink-0">
            ACT II · АРХИВ
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto bg-[#101014] rounded-[32px] p-6 sm:p-8 border border-white/10 shadow-2xl shadow-black/80 relative overflow-hidden"
        >
          {/* Тонкая алая линия по верхнему контуру карточки */}
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#DC2626] to-transparent"
          />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.05 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#1A0B0D] border border-red-900/60 text-[#DC2626] flex items-center justify-center mx-auto mb-5">
              <Lock className="w-6 h-6" />
            </div>

            <h1
              style={{ textWrap: 'balance' }}
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white"
            >
              ДОСТУП ЗАСЕКРЕЧЕН
            </h1>

            <p className="text-sm text-zinc-400 mt-2.5 leading-relaxed">
              Введите пароль для доступа к материалам второго акта
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <motion.div
              key={errorTriggerCount}
              animate={
                hasError
                  ? { x: [0, -10, 10, -7, 7, -3, 3, 0] }
                  : { x: 0 }
              }
              transition={{ duration: 0.36 }}
            >
              <label htmlFor="act-two-secret-input" className="sr-only">
                Секретный пароль
              </label>
              <div className="relative">
                <KeyRound
                  aria-hidden="true"
                  className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    hasError ? 'text-[#EF4444]' : 'text-zinc-500'
                  }`}
                />
                <input
                  id="act-two-secret-input"
                  type="password"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (hasError) setHasError(false);
                  }}
                  placeholder="Код допуска..."
                  className={`w-full min-h-[56px] pl-12 pr-4 rounded-2xl bg-[#09090C] text-white placeholder:text-zinc-600 font-mono text-base tracking-widest border transition-colors focus:outline-none ${
                    hasError
                      ? 'border-[#DC2626] ring-1 ring-[#DC2626]/60'
                      : 'border-white/12 focus:border-[#DC2626]'
                  }`}
                />
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {hasError && (
                <motion.div
                  key={`denied-${errorTriggerCount}`}
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-2xl bg-[#22090B] border border-[#991B1B] px-4 py-3 flex items-center justify-center gap-2.5 text-[#EF4444]"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-[#EF4444]" />
                  <span className="font-display text-xs sm:text-sm font-bold tracking-wider">
                    ДОСТУП ОТКЛОНЁН
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full min-h-[58px] px-6 rounded-full bg-[#B91C1C] hover:bg-[#DC2626] text-white font-display font-semibold text-base tracking-wide shadow-lg shadow-red-950/60 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EF4444]"
            >
              <span>ПОЛУЧИТЬ ДОСТУП</span>
            </button>
          </form>
        </motion.section>
      </main>
    </div>
  );
}

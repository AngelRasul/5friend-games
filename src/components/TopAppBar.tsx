import { ArrowLeft, BookOpen } from 'lucide-react';

interface TopAppBarProps {
  onBack?: () => void;
  backLabel?: string;
  onOpenRules: () => void;
}

export function TopAppBar({
  onBack,
  backLabel = 'Назад',
  onOpenRules,
}: TopAppBarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-[#FBF8FD]/90 backdrop-blur-md border-b border-[#E7E0EC]/70">
      <div className="max-w-lg mx-auto h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center shrink-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="min-h-[44px] min-w-[44px] -ml-2 px-3 rounded-full flex items-center gap-2 text-[#1C1B1F] hover:bg-[#E8DEF8]/60 active:scale-95 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#65558F]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">{backLabel}</span>
            </button>
          ) : (
            <span className="font-display text-lg font-bold tracking-tight text-[#1C1B1F] whitespace-nowrap shrink-0">
              Угадай спину
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenRules}
          className="min-h-[44px] px-4 rounded-full bg-[#EFECF2] hover:bg-[#E8DEF8] text-[#1D192B] text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#65558F]"
        >
          <BookOpen className="w-4 h-4 shrink-0 text-[#65558F]" />
          <span>Правила</span>
        </button>
      </div>
    </header>
  );
}

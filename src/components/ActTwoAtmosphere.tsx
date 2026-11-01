/**
 * Атмосферный фоновый слой секретного режима ACT II:
 * - Тёмно-алая виньетка сверху и тонкая пульсирующая линия.
 * - Несколько медленно стекающих капель строго по внешним краям экрана (не заходят на контент).
 * - Минималистичные статичные микро-капли в верхних углах.
 * Полностью pointer-events-none — не перехватывает нажатия и не перекрывает текст или кнопки.
 */
export function ActTwoAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
    >
      {/* Тёмный радиальный переход у верхней кромки */}
      <div
        className="absolute inset-x-0 top-0 h-72 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 85% 55% at 50% -10%, rgba(153, 27, 27, 0.24), rgba(7, 7, 9, 0) 75%)',
        }}
      />

      {/* Тонкая кроваво-красная линия вдоль верхнего среза */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#DC2626]/70 to-transparent act2-pulse-line" />

      {/* Статичные минималистичные капли в самых верхних углах */}
      <svg
        viewBox="0 0 36 54"
        className="absolute top-0 left-2.5 w-5 h-8 text-[#991B1B]/55"
        fill="currentColor"
      >
        <path d="M4 0h3v22c0 2.2-1.8 4-4 4S0 24.2 0 22V0h4zm14 0h2v35c0 2.5-2 4.5-4.5 4.5S11 37.5 11 35c0-1.9 1.8-4.2 3.5-6.8V0h3.5z" />
        <circle cx="15.5" cy="46.5" r="2.2" />
      </svg>

      <svg
        viewBox="0 0 36 54"
        className="absolute top-0 right-2.5 w-5 h-8 text-[#991B1B]/50"
        fill="currentColor"
      >
        <path d="M29 0h3v28c0 2.4-1.9 4.3-4.3 4.3S23.4 30.4 23.4 28c0-1.8 1.6-3.9 3.6-6.2V0h2zM14 0h2.2v16c0 1.8-1.4 3.2-3.2 3.2S9.8 17.8 9.8 16V0H14z" />
        <circle cx="27.7" cy="39.5" r="2" />
      </svg>

      {/* Медленно стекающие красные капли строго вдоль левого и правого краёв вьюпорта */}
      <div className="absolute left-[2px] top-0 w-[3px] h-24 act2-drip-slow">
        <div className="w-[1.5px] h-20 mx-auto bg-gradient-to-b from-transparent via-[#991B1B]/65 to-[#DC2626]/85 rounded-full" />
        <svg
          viewBox="0 0 8 12"
          className="w-[5px] h-[7px] -mt-0.5 mx-auto text-[#DC2626]/85"
          fill="currentColor"
        >
          <path d="M4 0C4 0 0.5 4.8 0.5 7.8C0.5 9.9 2.1 11.5 4 11.5C5.9 11.5 7.5 9.9 7.5 7.8C7.5 4.8 4 0 4 0Z" />
        </svg>
      </div>

      <div
        className="hidden sm:block absolute left-[10px] top-0 w-[3px] h-20 act2-drip-slower"
        style={{ animationDelay: '-6.5s' }}
      >
        <div className="w-[1px] h-16 mx-auto bg-gradient-to-b from-transparent via-[#7F1D1D]/55 to-[#B91C1C]/75 rounded-full" />
        <svg
          viewBox="0 0 8 12"
          className="w-[4px] h-[6px] -mt-0.5 mx-auto text-[#B91C1C]/75"
          fill="currentColor"
        >
          <path d="M4 0C4 0 0.5 4.8 0.5 7.8C0.5 9.9 2.1 11.5 4 11.5C5.9 11.5 7.5 9.9 7.5 7.8C7.5 4.8 4 0 4 0Z" />
        </svg>
      </div>

      <div
        className="absolute right-[2px] top-0 w-[3px] h-28 act2-drip-slower"
        style={{ animationDelay: '-3.8s' }}
      >
        <div className="w-[1.5px] h-24 mx-auto bg-gradient-to-b from-transparent via-[#991B1B]/60 to-[#DC2626]/80 rounded-full" />
        <svg
          viewBox="0 0 8 12"
          className="w-[5px] h-[7px] -mt-0.5 mx-auto text-[#DC2626]/80"
          fill="currentColor"
        >
          <path d="M4 0C4 0 0.5 4.8 0.5 7.8C0.5 9.9 2.1 11.5 4 11.5C5.9 11.5 7.5 9.9 7.5 7.8C7.5 4.8 4 0 4 0Z" />
        </svg>
      </div>

      <div
        className="hidden sm:block absolute right-[11px] top-0 w-[3px] h-20 act2-drip-slow"
        style={{ animationDelay: '-10.2s' }}
      >
        <div className="w-[1px] h-16 mx-auto bg-gradient-to-b from-transparent via-[#7F1D1D]/50 to-[#B91C1C]/70 rounded-full" />
        <svg
          viewBox="0 0 8 12"
          className="w-[4px] h-[6px] -mt-0.5 mx-auto text-[#B91C1C]/70"
          fill="currentColor"
        >
          <path d="M4 0C4 0 0.5 4.8 0.5 7.8C0.5 9.9 2.1 11.5 4 11.5C5.9 11.5 7.5 9.9 7.5 7.8C7.5 4.8 4 0 4 0Z" />
        </svg>
      </div>

      {/* Нижнее затемнение для глубины */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            'linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))',
        }}
      />
    </div>
  );
}

import { ActTwoScenarioIconId } from '../types/game';

interface ActTwoScenarioIllustrationProps {
  illustrationId: ActTwoScenarioIconId;
  className?: string;
}

/**
 * 10 уникальных встроенных SVG-иллюстраций в нуарной чёрно-бело-алой палитре ACT II.
 */
export function ActTwoScenarioIllustration({
  illustrationId,
  className = 'w-full h-32',
}: ActTwoScenarioIllustrationProps) {
  switch (illustrationId) {
    case 'chalice':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          <line x1="28" y1="98" x2="212" y2="98" stroke="#27272A" strokeWidth="1.5" />
          <path
            d="M94 24H146L138 54C135.5 63.5 128 69 120 69C112 69 104.5 63.5 102 54L94 24Z"
            stroke="#F4F4F5"
            strokeWidth="2"
          />
          <path
            d="M100 44H140L137 54C135 61.5 128 66 120 66C112 66 105 61.5 103 54L100 44Z"
            fill="#991B1B"
            fillOpacity="0.85"
          />
          <line x1="120" y1="69" x2="120" y2="98" stroke="#F4F4F5" strokeWidth="2" />
          <line x1="103" y1="98" x2="137" y2="98" stroke="#F4F4F5" strokeWidth="2" />
          {/* Трещина и стекающая капля */}
          <path d="M132 24L127 36L131 43" stroke="#EF4444" strokeWidth="1.6" />
          <path
            d="M146 28C146 28 150 35 150 38.5C150 40.7 148.2 42.5 146 42.5C143.8 42.5 142 40.7 142 38.5C142 35 146 28 146 28Z"
            fill="#DC2626"
          />
          <circle cx="156" cy="98" r="3" fill="#DC2626" />
        </svg>
      );

    case 'express':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          {/* Рельсы в перспективе */}
          <line x1="44" y1="104" x2="98" y2="72" stroke="#3F3F46" strokeWidth="1.5" />
          <line x1="196" y1="104" x2="142" y2="72" stroke="#3F3F46" strokeWidth="1.5" />
          <line x1="64" y1="94" x2="176" y2="94" stroke="#27272A" strokeWidth="1.5" />
          <line x1="82" y1="83" x2="158" y2="83" stroke="#27272A" strokeWidth="1.5" />
          {/* Карманные часы на 02:17 */}
          <circle cx="120" cy="48" r="26" stroke="#F4F4F5" strokeWidth="2" fill="#121217" />
          <path d="M114 17H126M120 17V22" stroke="#F4F4F5" strokeWidth="2" />
          <line x1="120" y1="48" x2="133" y2="39" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="120" y1="48" x2="136" y2="54" stroke="#F4F4F5" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M103 33L118 47L111 63" stroke="#DC2626" strokeWidth="1.3" strokeDasharray="3 2" />
          <circle cx="120" cy="48" r="2.8" fill="#DC2626" />
        </svg>
      );

    case 'operating_room':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          <rect x="24" y="22" width="192" height="76" rx="12" stroke="#27272A" strokeWidth="1.5" />
          {/* Линия ЭКГ, переходящая в прямую алую линию */}
          <path
            d="M36 62H68L76 48L84 76L94 32L103 82L111 56L118 62H204"
            stroke="#DC2626"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="204" cy="62" r="3.5" fill="#EF4444" />
          {/* Силуэт ампулы */}
          <path
            d="M174 28H182L180 35L184 41V52H172V41L176 35L174 28Z"
            stroke="#E4E4E7"
            strokeWidth="1.4"
          />
          <rect x="173.5" y="44" width="9" height="6.5" fill="#991B1B" />
        </svg>
      );

    case 'theater_dagger':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          {/* Занавес по краям */}
          <path d="M22 16C42 42 38 78 24 104" stroke="#7F1D1D" strokeWidth="2" />
          <path d="M218 16C198 42 202 78 216 104" stroke="#7F1D1D" strokeWidth="2" />
          {/* Маска */}
          <path
            d="M84 32C84 26 96 22 108 22C120 22 132 26 132 32V58C132 76 120 90 108 90C96 90 84 76 84 58V32Z"
            stroke="#F4F4F5"
            strokeWidth="2"
            fill="#121217"
          />
          <path d="M94 46C97 43 102 43 104 46" stroke="#F4F4F5" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M112 46C115 43 120 43 122 46" stroke="#F4F4F5" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M114 23L109 42L115 58L108 89" stroke="#DC2626" strokeWidth="1.6" />
          {/* Кинжал */}
          <line x1="156" y1="22" x2="156" y2="42" stroke="#F4F4F5" strokeWidth="2.4" />
          <line x1="145" y1="42" x2="167" y2="42" stroke="#DC2626" strokeWidth="2.4" />
          <path d="M152 42H160L156 92L152 42Z" fill="#E4E4E7" />
          <path d="M154.5 72L157.5 72L156 92Z" fill="#DC2626" />
          <circle cx="156" cy="99" r="2.4" fill="#DC2626" />
        </svg>
      );

    case 'lighthouse':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          {/* Луч прожектора */}
          <polygon points="124,34 218,16 218,54" fill="#991B1B" fillOpacity="0.32" />
          <polygon points="116,34 22,18 22,52" fill="#991B1B" fillOpacity="0.18" />
          {/* Башня маяка */}
          <path d="M108 92L113 42H127L132 92H108Z" stroke="#F4F4F5" strokeWidth="2" fill="#121217" />
          <rect x="114" y="28" width="12" height="14" stroke="#F4F4F5" strokeWidth="1.8" />
          <path d="M111 28L120 19L129 28H111Z" fill="#DC2626" />
          <circle cx="120" cy="35" r="3" fill="#EF4444" />
          {/* Скала и волны */}
          <path d="M74 102L96 92H144L166 102" stroke="#52525B" strokeWidth="2" />
          <line x1="112" y1="62" x2="128" y2="62" stroke="#DC2626" strokeWidth="1.8" />
        </svg>
      );

    case 'archive_fire':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          {/* Папка дела */}
          <path
            d="M78 30H108L115 38H162V90H78V30Z"
            stroke="#F4F4F5"
            strokeWidth="2"
            fill="#131318"
          />
          <line x1="92" y1="54" x2="148" y2="54" stroke="#DC2626" strokeWidth="2" />
          <line x1="92" y1="66" x2="136" y2="66" stroke="#71717A" strokeWidth="1.6" />
          <line x1="92" y1="76" x2="126" y2="76" stroke="#71717A" strokeWidth="1.6" />
          {/* Замочная скважина / печать */}
          <circle cx="146" cy="72" r="9" stroke="#DC2626" strokeWidth="1.8" />
          <circle cx="146" cy="70" r="2.2" fill="#DC2626" />
          <path d="M144.5 72H147.5L148.5 77H143.5L144.5 72Z" fill="#DC2626" />
          {/* Алые искры пепла */}
          <circle cx="174" cy="40" r="2" fill="#EF4444" />
          <circle cx="182" cy="54" r="1.5" fill="#DC2626" />
          <circle cx="66" cy="74" r="1.8" fill="#B91C1C" />
        </svg>
      );

    case 'penthouse_mirror':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          {/* Осколки зеркала на 24-м этаже */}
          <polygon
            points="120,18 168,42 154,96 86,96 72,42"
            stroke="#F4F4F5"
            strokeWidth="1.8"
            fill="#121217"
          />
          <line x1="120" y1="18" x2="114" y2="60" stroke="#DC2626" strokeWidth="1.8" />
          <line x1="114" y1="60" x2="154" y2="96" stroke="#F4F4F5" strokeWidth="1.4" />
          <line x1="114" y1="60" x2="72" y2="42" stroke="#F4F4F5" strokeWidth="1.4" />
          <line x1="114" y1="60" x2="86" y2="96" stroke="#DC2626" strokeWidth="1.6" />
          <line x1="114" y1="60" x2="168" y2="42" stroke="#71717A" strokeWidth="1.3" />
          <polygon points="114,60 132,51 126,71" fill="#991B1B" fillOpacity="0.85" />
          <circle cx="114" cy="60" r="2.8" fill="#EF4444" />
        </svg>
      );

    case 'night_flight':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          {/* Сетка авиационного радара */}
          <circle cx="120" cy="60" r="40" stroke="#27272A" strokeWidth="1.5" />
          <circle cx="120" cy="60" r="24" stroke="#27272A" strokeWidth="1.3" strokeDasharray="3 3" />
          <line x1="72" y1="60" x2="168" y2="60" stroke="#27272A" strokeWidth="1.2" />
          <line x1="120" y1="14" x2="120" y2="106" stroke="#27272A" strokeWidth="1.2" />
          {/* Луч радара и отметка борта */}
          <path d="M120 60L151 35A40 40 0 0 1 160 60Z" fill="#991B1B" fillOpacity="0.4" />
          <line x1="120" y1="60" x2="151" y2="35" stroke="#DC2626" strokeWidth="1.8" />
          <path
            d="M112 64L120 46L128 64L120 60L112 64Z"
            fill="#F4F4F5"
          />
          <circle cx="143" cy="43" r="3.2" fill="#EF4444" />
        </svg>
      );

    case 'crimson_ruby':
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          {/* Лучи сигнализации аукциона */}
          <line x1="28" y1="26" x2="212" y2="94" stroke="#7F1D1D" strokeWidth="1.2" strokeDasharray="4 3" />
          <line x1="28" y1="94" x2="212" y2="26" stroke="#7F1D1D" strokeWidth="1.2" strokeDasharray="4 3" />
          {/* Гранёный рубин «Кровь Востока» */}
          <polygon
            points="96,34 144,34 162,54 120,96 78,54"
            fill="#7F1D1D"
            fillOpacity="0.55"
            stroke="#F4F4F5"
            strokeWidth="2"
          />
          <polyline points="78,54 162,54" stroke="#F4F4F5" strokeWidth="1.4" />
          <polyline points="96,34 108,54 120,96 132,54 144,34" stroke="#EF4444" strokeWidth="1.5" />
          <polygon points="108,54 132,54 120,96" fill="#DC2626" fillOpacity="0.75" />
        </svg>
      );

    case 'bunker_vault':
    default:
      return (
        <svg
          viewBox="0 0 240 120"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <rect width="240" height="120" rx="18" fill="#0B0B0F" />
          {/* Массивная гермодверь бункера */}
          <circle cx="120" cy="60" r="38" stroke="#F4F4F5" strokeWidth="2.2" fill="#121217" />
          <circle cx="120" cy="60" r="26" stroke="#3F3F46" strokeWidth="1.6" />
          {/* Вентиль запирания */}
          <circle cx="120" cy="60" r="9" stroke="#DC2626" strokeWidth="2" />
          <line x1="120" y1="36" x2="120" y2="84" stroke="#F4F4F5" strokeWidth="2" />
          <line x1="96" y1="60" x2="144" y2="60" stroke="#F4F4F5" strokeWidth="2" />
          {/* Ригели и красный индикатор блокировки */}
          <line x1="76" y1="48" x2="86" y2="48" stroke="#DC2626" strokeWidth="3" />
          <line x1="76" y1="72" x2="86" y2="72" stroke="#DC2626" strokeWidth="3" />
          <circle cx="174" cy="34" r="4" fill="#DC2626" />
        </svg>
      );
  }
}

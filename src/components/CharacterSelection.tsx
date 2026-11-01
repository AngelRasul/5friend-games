import { motion } from 'motion/react';
import { ArrowRight, Check, Users } from 'lucide-react';
import { CHARACTERS, MAX_PLAYERS, MIN_PLAYERS } from '../data/characters';
import { isValidParticipantCount } from '../logic/gameLogic';
import { CharacterId } from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';

interface CharacterSelectionProps {
  selectedIds: CharacterId[];
  avatars: Partial<Record<CharacterId, string>>;
  onToggleCharacter: (id: CharacterId) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onStartGameFlow: () => void;
}

export function CharacterSelection({
  selectedIds,
  avatars,
  onToggleCharacter,
  onSelectAll,
  onClearSelection,
  onStartGameFlow,
}: CharacterSelectionProps) {
  const isCountValid = isValidParticipantCount(selectedIds);
  const allSelected = selectedIds.length === CHARACTERS.length;

  return (
    <main className="flex-1 flex flex-col justify-between px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#1C1B1F]">Участники</h2>
            <p className="text-xs text-[#49454F] tabular-nums mt-0.5">
              {MIN_PLAYERS}–{MAX_PLAYERS} игроков · Выбрано: {selectedIds.length}
            </p>
          </div>

          <button
            type="button"
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="min-h-[44px] px-4 rounded-full bg-[#EFECF2] hover:bg-[#E8DEF8] text-xs font-semibold text-[#1C1B1F] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Users className="w-4 h-4 text-[#65558F]" />
            <span>{allSelected ? 'Снять всех' : 'Все 5'}</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {CHARACTERS.map((character, index) => {
            const isSelected = selectedIds.includes(character.id);
            const photoUrl = avatars[character.id];

            return (
              <motion.button
                key={character.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                onClick={() => onToggleCharacter(character.id)}
                aria-pressed={isSelected}
                className={`w-full rounded-[24px] p-3.5 border flex items-center justify-between gap-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#65558F] ${
                  isSelected
                    ? `${character.theme.selectedBgClass} ${character.theme.selectedRingClass}`
                    : 'bg-white hover:bg-[#F5F2F7] border-[#E7E0EC]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <CharacterAvatar character={character} photoUrl={photoUrl} size="sm" />

                  <div className="min-w-0">
                    <div className="font-display text-base font-bold text-[#1C1B1F] truncate">
                      {character.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#49454F] mt-0.5">
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: character.theme.swatchHex }}
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${character.theme.swatchBorderClass}`}
                      />
                      <span className="truncate">{character.theme.colorLabel}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#65558F] text-white'
                      : 'bg-[#F5F2F7] border border-[#CAC4D0] text-transparent'
                  }`}
                >
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-md mx-auto pt-4">
        <button
          type="button"
          disabled={!isCountValid}
          onClick={onStartGameFlow}
          className="w-full min-h-[58px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] disabled:bg-[#E7E0EC] disabled:text-[#79747E] text-white font-display font-semibold text-base flex items-center justify-center gap-2.5 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
        >
          <span>
            {isCountValid
              ? `Далее (${selectedIds.length})`
              : `Выберите от ${MIN_PLAYERS} игроков`}
          </span>
          {isCountValid && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </main>
  );
}

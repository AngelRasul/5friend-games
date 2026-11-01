import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, FolderPlus, Plus, Shuffle, Trash2, X } from 'lucide-react';
import { getAvailableWordsForCategory } from '../logic/gameLogic';
import { CategoryIconKey, GameCategory, UsedWordsMap } from '../types/game';
import { CategoryIcon } from './CategoryIcon';

interface CategorySelectionProps {
  categories: GameCategory[];
  usedWordsByCategory: UsedWordsMap;
  onSelectCategory: (categoryId: string) => void;
  onCreateCustomCategory: (input: {
    title: string;
    description: string;
    iconKey: CategoryIconKey;
    items: string[];
  }) => void;
  onDeleteCustomCategory: (categoryId: string) => void;
  onAddWordsToCategory: (categoryId: string, words: string[]) => void;
}

const ICON_OPTIONS: { key: CategoryIconKey; label: string }[] = [
  { key: 'compass', label: 'Место' },
  { key: 'briefcase', label: 'Дело' },
  { key: 'paw', label: 'Зверь' },
  { key: 'package', label: 'Вещь' },
  { key: 'utensils', label: 'Еда' },
  { key: 'trophy', label: 'Спорт' },
  { key: 'star', label: 'Звезда' },
  { key: 'clapperboard', label: 'Тема' },
];

export function CategorySelection({
  categories,
  usedWordsByCategory,
  onSelectCategory,
  onCreateCustomCategory,
  onDeleteCustomCategory,
  onAddWordsToCategory,
}: CategorySelectionProps) {
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIconKey, setNewIconKey] = useState<CategoryIconKey>('compass');
  const [newWordsText, setNewWordsText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [addWordsTarget, setAddWordsTarget] = useState<GameCategory | null>(null);
  const [extraWordsText, setExtraWordsText] = useState('');

  const availableCategories = categories.filter(
    (cat) => getAvailableWordsForCategory(cat, usedWordsByCategory).length > 0
  );

  const handleRandomCategory = () => {
    if (availableCategories.length === 0) return;
    const randomCat =
      availableCategories[Math.floor(Math.random() * availableCategories.length)];
    onSelectCategory(randomCat.id);
  };

  const handleSubmitNewCategory = (e: FormEvent) => {
    e.preventDefault();
    const parsedWords = Array.from(
      new Set(
        newWordsText
          .split(/[\n,;]+/)
          .map((w) => w.trim())
          .filter((w) => w.length > 0)
      )
    );

    if (!newTitle.trim()) {
      setFormError('Введите название категории');
      return;
    }
    if (parsedWords.length < 3) {
      setFormError('Добавьте минимум 3 разных слова');
      return;
    }

    onCreateCustomCategory({
      title: newTitle.trim(),
      description: '',
      iconKey: newIconKey,
      items: parsedWords,
    });

    setNewTitle('');
    setNewWordsText('');
    setFormError(null);
    setIsNewCategoryModalOpen(false);
  };

  const handleSubmitExtraWords = (e: FormEvent) => {
    e.preventDefault();
    if (!addWordsTarget) return;

    const parsedWords = extraWordsText
      .split(/[\n,;]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (parsedWords.length === 0) return;

    onAddWordsToCategory(addWordsTarget.id, parsedWords);
    setExtraWordsText('');
    setAddWordsTarget(null);
  };

  return (
    <main className="flex-1 px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="font-display text-2xl font-bold text-[#1C1B1F]">Категория</h2>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={availableCategories.length === 0}
              onClick={handleRandomCategory}
              className="min-h-[44px] px-3.5 rounded-full bg-[#EADDFF] hover:bg-[#DEC9FF] disabled:opacity-50 text-xs font-semibold text-[#21005D] flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-4 h-4" />
              <span>Случайная</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsNewCategoryModalOpen(true);
              }}
              className="min-h-[44px] px-3.5 rounded-full bg-[#EFECF2] hover:bg-[#E8DEF8] text-xs font-semibold text-[#1C1B1F] flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <FolderPlus className="w-4 h-4 text-[#65558F]" />
              <span>Своя</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {categories.map((category, index) => {
            const availableCount = getAvailableWordsForCategory(
              category,
              usedWordsByCategory
            ).length;
            const totalCount = category.items.length;
            const isExhausted = availableCount === 0;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                className={`rounded-[26px] p-4 border transition-all ${
                  isExhausted
                    ? 'bg-[#F5F2F7]/70 border-[#E7E0EC] opacity-65'
                    : 'bg-white border-[#E7E0EC] shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isExhausted}
                    onClick={() => onSelectCategory(category.id)}
                    className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left min-h-[48px] rounded-2xl focus-visible:outline-2 focus-visible:outline-[#65558F]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-[#EADDFF]/75 text-[#21005D] flex items-center justify-center shrink-0">
                        <CategoryIcon iconKey={category.iconKey} className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-bold text-[#1C1B1F] truncate">
                          {category.title}
                        </h3>
                        <p className="text-xs text-[#49454F] tabular-nums mt-0.5">
                          {isExhausted
                            ? 'Все слова сыграны'
                            : `Слов: ${availableCount} из ${totalCount}`}
                        </p>
                      </div>
                    </div>

                    <div className="min-h-[40px] min-w-[40px] rounded-full bg-[#F5F2F7] text-[#65558F] flex items-center justify-center shrink-0">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </button>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-[#F1ECF6] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExtraWordsText('');
                      setAddWordsTarget(category);
                    }}
                    className="min-h-[40px] px-3 rounded-full hover:bg-[#EFECF2] text-xs font-semibold text-[#65558F] flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить слова</span>
                  </button>

                  {category.isCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomCategory(category.id)}
                      aria-label={`Удалить ${category.title}`}
                      className="min-h-[40px] min-w-[40px] rounded-full hover:bg-[#F9DEDC] text-[#B3261E] flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Создание своей категории (inputs 16px text-base против авто-зума iOS Safari) */}
      <AnimatePresence>
        {isNewCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewCategoryModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.form
              onSubmit={handleSubmitNewCategory}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full sm:max-w-md bg-[#FBF8FD] rounded-t-[28px] sm:rounded-[28px] shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#E7E0EC]">
                <h3 className="font-display text-lg font-bold text-[#1C1B1F]">
                  Своя категория
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  aria-label="Закрыть"
                  className="min-h-[44px] min-w-[44px] -mr-2 rounded-full flex items-center justify-center text-[#49454F] hover:bg-[#E8DEF8]/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#49454F] mb-1.5">
                    Название
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Например: Страны"
                    className="w-full h-12 px-4 rounded-2xl bg-white border border-[#CAC4D0] focus:border-[#65558F] focus:outline-none text-base text-[#1C1B1F]"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#49454F] mb-1.5">Иконка</span>
                  <div className="grid grid-cols-4 gap-2">
                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setNewIconKey(opt.key)}
                        className={`min-h-[44px] px-2 rounded-2xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          newIconKey === opt.key
                            ? 'bg-[#EADDFF] border-[#65558F] text-[#21005D] font-semibold'
                            : 'bg-white border-[#E7E0EC] text-[#49454F]'
                        }`}
                      >
                        <CategoryIcon iconKey={opt.key} className="w-4 h-4 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49454F] mb-1.5">
                    Слова (через запятую или с новой строки)
                  </label>
                  <textarea
                    rows={4}
                    value={newWordsText}
                    onChange={(e) => setNewWordsText(e.target.value)}
                    placeholder={'Япония\nБразилия\nИталия'}
                    className="w-full p-4 rounded-2xl bg-white border border-[#CAC4D0] focus:border-[#65558F] focus:outline-none text-base text-[#1C1B1F] resize-none"
                  />
                </div>

                {formError && <p className="text-xs font-semibold text-[#B3261E]">{formError}</p>}
              </div>

              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#F5F2F7] border-t border-[#E7E0EC] flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="flex-1 min-h-[48px] px-4 rounded-full bg-white border border-[#CAC4D0] text-sm font-semibold text-[#1C1B1F] whitespace-nowrap"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] px-4 rounded-full bg-[#65558F] hover:bg-[#55467B] text-sm font-semibold text-white whitespace-nowrap"
                >
                  Сохранить
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Пополнение существующей категории */}
      <AnimatePresence>
        {addWordsTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddWordsTarget(null)}
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            />
            <motion.form
              onSubmit={handleSubmitExtraWords}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full sm:max-w-md bg-[#FBF8FD] rounded-t-[28px] sm:rounded-[28px] shadow-xl overflow-hidden"
            >
              <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#E7E0EC]">
                <h3 className="font-display text-lg font-bold text-[#1C1B1F] truncate">
                  {addWordsTarget.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setAddWordsTarget(null)}
                  aria-label="Закрыть"
                  className="min-h-[44px] min-w-[44px] -mr-2 rounded-full flex items-center justify-center text-[#49454F] hover:bg-[#E8DEF8]/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <textarea
                  rows={4}
                  value={extraWordsText}
                  onChange={(e) => setExtraWordsText(e.target.value)}
                  placeholder="Новые слова через запятую или с новой строки"
                  className="w-full p-4 rounded-2xl bg-white border border-[#CAC4D0] focus:border-[#65558F] focus:outline-none text-base text-[#1C1B1F] resize-none"
                />
              </div>

              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#F5F2F7] border-t border-[#E7E0EC] flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAddWordsTarget(null)}
                  className="flex-1 min-h-[48px] px-4 rounded-full bg-white border border-[#CAC4D0] text-sm font-semibold text-[#1C1B1F] whitespace-nowrap"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] px-4 rounded-full bg-[#65558F] hover:bg-[#55467B] text-sm font-semibold text-white whitespace-nowrap"
                >
                  Добавить
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

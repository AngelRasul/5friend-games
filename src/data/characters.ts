import { CharacterProfile } from '../types/game';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 5;

export const CHARACTERS: CharacterProfile[] = [
  {
    id: 'rasul',
    name: 'Расул',
    shortInitial: 'Р',
    theme: {
      colorLabel: 'Белый цвет',
      swatchHex: '#FFFFFF',
      swatchBorderClass: 'border border-slate-300',
      selectedBgClass: 'bg-white shadow-md shadow-slate-900/5',
      selectedRingClass: 'ring-2 ring-slate-700 border-slate-400',
      avatarFallbackBgClass: 'bg-slate-100',
      avatarFallbackTextClass: 'text-slate-800',
      bannerBgClass: 'bg-white border border-slate-200/90',
      bannerTextClass: 'text-slate-900',
      bannerSubtextClass: 'text-slate-600',
      avatarRingClass: 'ring-4 ring-white shadow-sm border border-slate-300',
    },
  },
  {
    id: 'salikh',
    name: 'Салих',
    shortInitial: 'С',
    theme: {
      colorLabel: 'Жёлтый цвет',
      swatchHex: '#FACC15',
      swatchBorderClass: 'border border-amber-400',
      selectedBgClass: 'bg-amber-50/95 shadow-md shadow-amber-900/5',
      selectedRingClass: 'ring-2 ring-amber-500 border-amber-300',
      avatarFallbackBgClass: 'bg-amber-100',
      avatarFallbackTextClass: 'text-amber-900',
      bannerBgClass: 'bg-amber-100/85 border border-amber-200/90',
      bannerTextClass: 'text-amber-950',
      bannerSubtextClass: 'text-amber-800',
      avatarRingClass: 'ring-4 ring-amber-400/80',
    },
  },
  {
    id: 'mikail',
    name: 'Микаил',
    shortInitial: 'М',
    theme: {
      colorLabel: 'Фиолетовый цвет',
      swatchHex: '#8B5CF6',
      swatchBorderClass: 'border border-violet-500',
      selectedBgClass: 'bg-violet-50/95 shadow-md shadow-violet-900/5',
      selectedRingClass: 'ring-2 ring-violet-600 border-violet-300',
      avatarFallbackBgClass: 'bg-violet-100',
      avatarFallbackTextClass: 'text-violet-900',
      bannerBgClass: 'bg-violet-100/85 border border-violet-200/90',
      bannerTextClass: 'text-violet-950',
      bannerSubtextClass: 'text-violet-800',
      avatarRingClass: 'ring-4 ring-violet-500/80',
    },
  },
  {
    id: 'denislam',
    name: 'Денислам',
    shortInitial: 'Д',
    theme: {
      colorLabel: 'Красный цвет',
      swatchHex: '#EF4444',
      swatchBorderClass: 'border border-red-500',
      selectedBgClass: 'bg-red-50/95 shadow-md shadow-red-900/5',
      selectedRingClass: 'ring-2 ring-red-500 border-red-300',
      avatarFallbackBgClass: 'bg-red-100',
      avatarFallbackTextClass: 'text-red-900',
      bannerBgClass: 'bg-red-100/85 border border-red-200/90',
      bannerTextClass: 'text-red-950',
      bannerSubtextClass: 'text-red-800',
      avatarRingClass: 'ring-4 ring-red-500/80',
    },
  },
  {
    id: 'izamutdin',
    name: 'Изамутдин',
    shortInitial: 'И',
    theme: {
      colorLabel: 'Зелёный цвет',
      swatchHex: '#22C55E',
      swatchBorderClass: 'border border-emerald-500',
      selectedBgClass: 'bg-emerald-50/95 shadow-md shadow-emerald-900/5',
      selectedRingClass: 'ring-2 ring-emerald-600 border-emerald-300',
      avatarFallbackBgClass: 'bg-emerald-100',
      avatarFallbackTextClass: 'text-emerald-900',
      bannerBgClass: 'bg-emerald-100/85 border border-emerald-200/90',
      bannerTextClass: 'text-emerald-950',
      bannerSubtextClass: 'text-emerald-800',
      avatarRingClass: 'ring-4 ring-emerald-500/80',
    },
  },
];

export function getCharacterById(id: string): CharacterProfile | undefined {
  return CHARACTERS.find((character) => character.id === id);
}

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { CharacterProfile } from '../types/game';

interface CharacterAvatarProps {
  character: CharacterProfile;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<CharacterAvatarProps['size']>, string> = {
  sm: 'w-11 h-11 text-sm',
  md: 'w-14 h-14 text-base',
  lg: 'w-20 h-20 text-xl',
  xl: 'w-28 h-28 text-2xl',
};

const ICON_SIZES: Record<NonNullable<CharacterAvatarProps['size']>, string> = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-9 h-9',
  xl: 'w-12 h-12',
};

export function CharacterAvatar({
  character,
  photoUrl,
  size = 'md',
}: CharacterAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [photoUrl]);

  const showImage = Boolean(photoUrl) && !hasError;

  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center select-none ${SIZE_CLASSES[size]} ${character.theme.avatarRingClass} ${character.theme.avatarFallbackBgClass} ${character.theme.avatarFallbackTextClass}`}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt={`Аватар игрока ${character.name}`}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <User className={ICON_SIZES[size]} strokeWidth={2.1} aria-hidden="true" />
      )}
    </div>
  );
}

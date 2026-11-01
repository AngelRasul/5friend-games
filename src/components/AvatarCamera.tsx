import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { getCharacterById } from '../data/characters';
import { CharacterId } from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';

interface AvatarCameraProps {
  queue: CharacterId[];
  existingAvatars: Partial<Record<CharacterId, string>>;
  onSavePhoto: (characterId: CharacterId, dataUrl: string) => Promise<void>;
  onDeletePhoto: (characterId: CharacterId) => Promise<void>;
  onCompleteQueue: () => void;
}

const AVATAR_SIZE_PX = 512;

async function cropFileToSquareDataUrl(file: File): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE_PX;
  canvas.height = AVATAR_SIZE_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context unavailable');
  }

  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await window.createImageBitmap(file);
      const minSide = Math.min(bitmap.width, bitmap.height);
      const sx = (bitmap.width - minSide) / 2;
      const sy = (bitmap.height - minSide) / 2;
      ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', 0.86);
    } catch {
      // Переходим к стандартному декодированию через Image
    }
  }

  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image decode failed'));
    };
    img.src = objectUrl;
  });
}

export function AvatarCamera({
  queue,
  existingAvatars,
  onSavePhoto,
  onDeletePhoto,
  onCompleteQueue,
}: AvatarCameraProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const currentCharacterId = queue[currentIndex];
  const character = currentCharacterId ? getCharacterById(currentCharacterId) : undefined;
  const savedPhoto = currentCharacterId ? existingAvatars[currentCharacterId] : undefined;

  useEffect(() => {
    setPreviewDataUrl(null);
    setImageError(null);
  }, [currentIndex]);

  useEffect(() => {
    let mounted = true;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((status) => {
          if (mounted) {
            setCameraPermissionDenied(status.state === 'denied');
          }
          status.onchange = () => {
            if (mounted) {
              setCameraPermissionDenied(status.state === 'denied');
            }
          };
        })
        .catch(() => {
          // Safari может не поддерживать запрос статуса camera в Permissions API
        });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const handleImageFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size === 0) {
      setImageError(
        'Не удалось получить снимок с камеры. Проверьте доступ к камере или пропустите шаг.'
      );
      return;
    }

    try {
      const cropped = await cropFileToSquareDataUrl(file);
      setImageError(null);
      setPreviewDataUrl(cropped);
    } catch {
      setImageError('Не удалось обработать снимок. Попробуйте ещё раз или нажмите «Пропустить».');
    }
  };

  const advanceOrFinish = () => {
    setPreviewDataUrl(null);
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onCompleteQueue();
    }
  };

  const handleConfirmPhoto = async () => {
    if (!currentCharacterId || !previewDataUrl || isSaving) return;
    setIsSaving(true);
    await onSavePhoto(currentCharacterId, previewDataUrl);
    setIsSaving(false);
    advanceOrFinish();
  };

  const handleRetakeSystemCamera = () => {
    setPreviewDataUrl(null);
    nativeCameraInputRef.current?.click();
  };

  const handleDeleteExisting = async () => {
    if (!currentCharacterId || isSaving) return;
    setIsSaving(true);
    await onDeletePhoto(currentCharacterId);
    setIsSaving(false);
  };

  if (!character) {
    return null;
  }

  return (
    <main className="flex-1 flex flex-col justify-center px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <motion.div
        key={character.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md mx-auto bg-white rounded-[32px] p-6 shadow-sm border border-[#E7E0EC]"
      >
        <div className="text-center text-xs font-medium text-[#49454F] tabular-nums mb-3">
          Фото · {currentIndex + 1} из {queue.length}
        </div>

        <div className="flex items-center justify-center gap-3">
          <CharacterAvatar
            character={character}
            photoUrl={previewDataUrl ?? savedPhoto}
            size="sm"
          />
          <div>
            <h2 className="font-display text-2xl font-bold text-[#1C1B1F]">
              {character.name}
            </h2>
            <div className="text-xs text-[#49454F]">{character.theme.colorLabel}</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="relative aspect-square w-full max-w-[250px] mx-auto rounded-[28px] overflow-hidden bg-[#F5F2F7] border border-[#E7E0EC] flex items-center justify-center">
            {previewDataUrl || savedPhoto ? (
              <img
                src={previewDataUrl ?? savedPhoto}
                alt={character.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#EADDFF] text-[#21005D] flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
            )}
          </div>

          {cameraPermissionDenied && (
            <div className="mt-4 rounded-2xl bg-[#F9DEDC] text-[#410E0B] p-3.5 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B3261E]" />
              <span>
                Доступ к камере запрещён в настройках браузера. Разрешите камеру или нажмите
                «Пропустить».
              </span>
            </div>
          )}

          {imageError && (
            <div className="mt-4 rounded-2xl bg-[#F9DEDC] text-[#410E0B] p-3.5 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B3261E]" />
              <span>{imageError}</span>
            </div>
          )}
        </div>

        {/* Шуточное предупреждение в блоке системной камеры (точный текст + красный цвет + иконка Lucide) */}
        <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-3.5 py-2.5 flex items-center justify-center gap-2 text-red-600">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
          <span className="text-xs font-semibold leading-snug">
            Сделанные фото точно не передаються расулу на телеграм
          </span>
        </div>

        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleImageFileSelected}
          className="hidden"
        />

        <div className="mt-4 space-y-2.5">
          {previewDataUrl ? (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmPhoto}
                className="w-full min-h-[56px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] text-white font-display font-semibold text-base flex items-center justify-center gap-2 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Check className="w-5 h-5" />
                <span>Сохранить</span>
              </button>

              <button
                type="button"
                onClick={handleRetakeSystemCamera}
                className="w-full min-h-[48px] px-4 rounded-full bg-[#EFECF2] hover:bg-[#E8DEF8] text-sm font-semibold text-[#1C1B1F] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 text-[#65558F]" />
                <span>Переснять</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full min-h-[56px] px-6 rounded-full bg-[#65558F] hover:bg-[#55467B] text-white font-display font-semibold text-base flex items-center justify-center gap-2.5 shadow-md shadow-[#65558F]/20 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Camera className="w-5 h-5" />
                <span>Системная камера</span>
              </button>

              <div className="pt-1 flex items-center justify-between gap-2">
                {savedPhoto ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleDeleteExisting}
                    className="min-h-[44px] px-3.5 rounded-full text-xs font-semibold text-[#B3261E] hover:bg-[#F9DEDC]/60 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить</span>
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={advanceOrFinish}
                  className="min-h-[44px] px-4 rounded-full text-sm font-semibold text-[#49454F] hover:text-[#1C1B1F] hover:bg-[#EFECF2] flex items-center gap-1.5 transition-colors whitespace-nowrap ml-auto"
                >
                  <span>{savedPhoto ? 'Оставить' : 'Пропустить'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {currentIndex + 1 < queue.length && (
                <button
                  type="button"
                  onClick={onCompleteQueue}
                  className="w-full min-h-[40px] px-4 rounded-full text-xs font-semibold text-[#65558F] hover:bg-[#E8DEF8]/50 flex items-center justify-center transition-colors whitespace-nowrap"
                >
                  Сразу к категориям
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}

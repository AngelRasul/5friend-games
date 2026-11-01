/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AvatarCamera } from './components/AvatarCamera';
import { CategorySelection } from './components/CategorySelection';
import { CharacterSelection } from './components/CharacterSelection';
import { GameScreen } from './components/GameScreen';
import { Lobby } from './components/Lobby';
import { RulesSheet } from './components/RulesSheet';
import { TopAppBar } from './components/TopAppBar';
import { CHARACTERS } from './data/characters';
import {
  createInitialGlobalScoreboard,
  finishSpySessionToLeaderboard,
  hideCurrentPlayerRoleAndAdvance,
  isValidParticipantCount,
  openCurrentPlayerRole,
  openCurrentVoterBallot,
  sortParticipantsCanonical,
  startSecretVoting,
  startSpyRoundWithScoreboard,
  submitSecretVoteWithScoreboard,
} from './logic/gameLogic';
import {
  clearAllCharacterAvatars,
  deleteCharacterAvatar,
  loadAllCharacterAvatars,
  saveCharacterAvatar,
} from './storage/indexedDb';
import {
  addWordsToCategory,
  buildMergedCategories,
  clearAllLocalAppStorage,
  clearGlobalScoreboard,
  deleteCustomCategory,
  loadCustomCategories,
  loadExtraWordsMap,
  loadGlobalScoreboard,
  loadLeaderboardViewFlag,
  loadSelectedPlayers,
  loadSoundPreference,
  saveCustomCategory,
  saveGlobalScoreboard,
  saveLeaderboardViewFlag,
  saveSelectedPlayers,
  saveSoundPreference,
} from './storage/localStorage';
import {
  AppScreen,
  CategoryIconKey,
  CharacterId,
  GameCategory,
  GlobalScoreboardState,
  SpyGamePhase,
  SpySessionState,
} from './types/game';
import { playUiTone } from './utils/sound';

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundPreference());
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<CharacterId[]>(() => loadSelectedPlayers());
  const [avatars, setAvatars] = useState<Partial<Record<CharacterId, string>>>({});
  const [cameraQueue, setCameraQueue] = useState<CharacterId[]>([]);

  const [customCategories, setCustomCategories] = useState<GameCategory[]>(() =>
    loadCustomCategories()
  );
  const [extraWordsMap, setExtraWordsMap] = useState<Record<string, string[]>>(() =>
    loadExtraWordsMap()
  );

  // Глобальное табло очков, званий, истории раундов и использованных слов (с автосохранением)
  const [scoreboard, setScoreboard] = useState<GlobalScoreboardState>(() =>
    loadGlobalScoreboard()
  );

  const [session, setSession] = useState<SpySessionState | null>(() => {
    if (loadLeaderboardViewFlag() && scoreboard.history.length > 0) {
      const ordered = isValidParticipantCount(selectedIds)
        ? sortParticipantsCanonical(selectedIds)
        : CHARACTERS.slice(0, 3).map((c) => c.id);
      return {
        participantIds: ordered,
        roundNumber: scoreboard.history.length,
        activeCategoryId: 'locations',
        phase: SpyGamePhase.LEADERBOARD,
        spyId: ordered[0],
        secretWord: '',
        roleRevealIndex: 0,
        voterIndex: 0,
        votes: {},
        lastRoundOutcome: scoreboard.history[scoreboard.history.length - 1] ?? null,
      };
    }
    return null;
  });

  const [screen, setScreen] = useState<AppScreen>(() =>
    loadLeaderboardViewFlag() && scoreboard.history.length > 0
      ? AppScreen.GAME
      : AppScreen.LOBBY
  );
  const [isNextRoundCategorySwitch, setIsNextRoundCategorySwitch] = useState(false);

  // Синхронный замок от двойного клика при голосовании в одном кадре рендера
  const voteLockKeyRef = useRef<string>('');

  const categories = useMemo(
    () => buildMergedCategories(customCategories, extraWordsMap),
    [customCategories, extraWordsMap]
  );

  useEffect(() => {
    let active = true;
    loadAllCharacterAvatars().then((loaded) => {
      if (active) {
        setAvatars(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveGlobalScoreboard(scoreboard);
  }, [scoreboard]);

  useEffect(() => {
    const isViewingLeaderboard =
      screen === AppScreen.GAME && session?.phase === SpyGamePhase.LEADERBOARD;
    saveLeaderboardViewFlag(isViewingLeaderboard);
  }, [screen, session?.phase]);

  useEffect(() => {
    if (isValidParticipantCount(selectedIds)) {
      saveSelectedPlayers(selectedIds);
    }
  }, [selectedIds]);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      saveSoundPreference(next);
      if (next) {
        playUiTone('tap', true);
      }
      return next;
    });
  };

  const handleStartFromLobby = () => {
    playUiTone('tap', soundEnabled);
    setSession(null);
    setIsNextRoundCategorySwitch(false);
    setScreen(AppScreen.CHARACTER_SELECTION);
  };

  const handleOpenFinalResultFromLobby = () => {
    playUiTone('success', soundEnabled);
    const ordered = isValidParticipantCount(selectedIds)
      ? sortParticipantsCanonical(selectedIds)
      : CHARACTERS.slice(0, 3).map((c) => c.id);
    const fallbackCategoryId = categories[0]?.id ?? 'locations';

    setSession({
      participantIds: ordered,
      roundNumber: scoreboard.history.length,
      activeCategoryId: fallbackCategoryId,
      phase: SpyGamePhase.LEADERBOARD,
      spyId: ordered[0],
      secretWord: '',
      roleRevealIndex: 0,
      voterIndex: 0,
      votes: {},
      lastRoundOutcome: scoreboard.history[scoreboard.history.length - 1] ?? null,
    });
    setIsNextRoundCategorySwitch(false);
    setScreen(AppScreen.GAME);
  };

  const handleResetSessionScores = () => {
    clearGlobalScoreboard();
    setScoreboard((prev) => createInitialGlobalScoreboard(prev.titleSeed));
    setSession(null);
    setIsNextRoundCategorySwitch(false);
    playUiTone('tap', soundEnabled);
    setScreen(AppScreen.CHARACTER_SELECTION);
  };

  const handleResetAllSettings = async () => {
    await clearAllCharacterAvatars();
    clearAllLocalAppStorage();
    setAvatars({});
    setCustomCategories([]);
    setExtraWordsMap({});
    setSoundEnabled(true);
    setSelectedIds(['rasul', 'salikh', 'mikail']);
    setScoreboard((prev) => createInitialGlobalScoreboard(prev.titleSeed));
    setSession(null);
    setIsNextRoundCategorySwitch(false);
    playUiTone('tap', true);
  };

  const handleToggleCharacter = (id: CharacterId) => {
    playUiTone('tap', soundEnabled);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCharacters = () => {
    playUiTone('tap', soundEnabled);
    setSelectedIds(CHARACTERS.map((c) => c.id));
  };

  const handleClearCharacters = () => {
    playUiTone('tap', soundEnabled);
    setSelectedIds([]);
  };

  const handleProceedAfterCharacters = () => {
    if (!isValidParticipantCount(selectedIds)) return;
    playUiTone('tap', soundEnabled);
    const ordered = sortParticipantsCanonical(selectedIds);
    setCameraQueue(ordered);
    setIsNextRoundCategorySwitch(false);
    setScreen(AppScreen.AVATAR_CAMERA);
  };

  const handleSaveAvatar = async (characterId: CharacterId, dataUrl: string) => {
    await saveCharacterAvatar(characterId, dataUrl);
    setAvatars((prev) => ({
      ...prev,
      [characterId]: dataUrl,
    }));
    playUiTone('success', soundEnabled);
  };

  const handleDeleteAvatar = async (characterId: CharacterId) => {
    await deleteCharacterAvatar(characterId);
    setAvatars((prev) => {
      const next = { ...prev };
      delete next[characterId];
      return next;
    });
  };

  const handleCompleteCameraQueue = () => {
    playUiTone('tap', soundEnabled);
    setIsNextRoundCategorySwitch(false);
    setScreen(AppScreen.CATEGORY_SELECTION);
  };

  const handleSelectCategory = (categoryId: string) => {
    playUiTone('tap', soundEnabled);

    const participantsForRound =
      isNextRoundCategorySwitch && session ? session.participantIds : selectedIds;

    const { session: nextSession, scoreboard: nextScoreboard } =
      startSpyRoundWithScoreboard(participantsForRound, categoryId, categories, scoreboard);

    voteLockKeyRef.current = '';
    setScoreboard(nextScoreboard);
    setSession(nextSession);
    setIsNextRoundCategorySwitch(false);
    setScreen(AppScreen.GAME);
  };

  const handleCreateCustomCategory = (input: {
    title: string;
    description: string;
    iconKey: CategoryIconKey;
    items: string[];
  }) => {
    const updated = saveCustomCategory(input);
    setCustomCategories(updated);
    playUiTone('success', soundEnabled);
  };

  const handleDeleteCustomCategory = (categoryId: string) => {
    const updated = deleteCustomCategory(categoryId);
    setCustomCategories(updated);
  };

  const handleAddWords = (categoryId: string, words: string[]) => {
    const updatedExtra = addWordsToCategory(categoryId, words);
    setExtraWordsMap(updatedExtra);
    playUiTone('success', soundEnabled);
  };

  // ============================================================================
  // ОБРАБОТЧИКИ ЭТАПОВ ИГРЫ «ШПИОН»
  // ============================================================================

  const handleOpenRole = () => {
    playUiTone('tap', soundEnabled);
    setSession((prev) => (prev ? openCurrentPlayerRole(prev) : null));
  };

  const handleHideRoleAndNext = () => {
    playUiTone('tap', soundEnabled);
    setSession((prev) => (prev ? hideCurrentPlayerRoleAndAdvance(prev) : null));
  };

  const handleStartVoting = useCallback(
    (expiredByTimer?: boolean) => {
      setSession((prev) => {
        if (!prev || prev.phase !== SpyGamePhase.DISCUSSION) return prev;
        playUiTone(expiredByTimer ? 'alarm' : 'tap', soundEnabled);
        return startSecretVoting(prev);
      });
    },
    [soundEnabled]
  );

  const handleOpenVoterBallot = () => {
    playUiTone('tap', soundEnabled);
    setSession((prev) => (prev ? openCurrentVoterBallot(prev) : null));
  };

  const handleSubmitVote = (suspectId: CharacterId) => {
    if (!session || session.phase !== SpyGamePhase.VOTING_SELECT) return;

    const lockKey = `${session.roundNumber}:${session.voterIndex}`;
    if (voteLockKeyRef.current === lockKey) return;
    voteLockKeyRef.current = lockKey;

    const isFinalVote = session.voterIndex + 1 >= session.participantIds.length;
    playUiTone(isFinalVote ? 'success' : 'tap', soundEnabled);

    const { session: updatedSession, scoreboard: updatedScoreboard } =
      submitSecretVoteWithScoreboard(session, suspectId, categories, scoreboard);

    setSession(updatedSession);
    setScoreboard(updatedScoreboard);
  };

  const handleStartNextRoundSameCategory = () => {
    if (!session) return;
    playUiTone('tap', soundEnabled);

    const { session: nextSession, scoreboard: nextScoreboard } =
      startSpyRoundWithScoreboard(
        session.participantIds,
        session.activeCategoryId,
        categories,
        scoreboard
      );

    voteLockKeyRef.current = '';
    setScoreboard(nextScoreboard);
    setSession(nextSession);
  };

  const handleOpenCategorySwitchForNextRound = () => {
    playUiTone('tap', soundEnabled);
    setIsNextRoundCategorySwitch(true);
    setScreen(AppScreen.CATEGORY_SELECTION);
  };

  const handleFinishToLeaderboard = () => {
    playUiTone('success', soundEnabled);
    setSession((prev) => (prev ? finishSpySessionToLeaderboard(prev) : null));
  };

  const handleExitToLobby = () => {
    playUiTone('tap', soundEnabled);
    setSession(null);
    setIsNextRoundCategorySwitch(false);
    setScreen(AppScreen.LOBBY);
  };

  const getTopBarBackConfig = (): {
    onBack?: () => void;
    backLabel?: string;
  } => {
    switch (screen) {
      case AppScreen.CHARACTER_SELECTION:
        return {
          onBack: () => setScreen(AppScreen.LOBBY),
          backLabel: 'Меню',
        };
      case AppScreen.AVATAR_CAMERA:
        return {
          onBack: () => setScreen(AppScreen.CHARACTER_SELECTION),
          backLabel: 'Игроки',
        };
      case AppScreen.CATEGORY_SELECTION:
        return {
          onBack: () => {
            if (isNextRoundCategorySwitch && session) {
              setIsNextRoundCategorySwitch(false);
              setScreen(AppScreen.GAME);
            } else {
              setScreen(AppScreen.CHARACTER_SELECTION);
            }
          },
          backLabel: 'Назад',
        };
      case AppScreen.GAME:
        return {
          onBack: handleExitToLobby,
          backLabel: 'Меню',
        };
      case AppScreen.LOBBY:
      default:
        return {};
    }
  };

  const topBarBack = getTopBarBackConfig();

  return (
    <div className="min-h-dvh flex flex-col bg-[#FBF8FD] text-[#1C1B1F]">
      <TopAppBar
        onBack={topBarBack.onBack}
        backLabel={topBarBack.backLabel}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {screen === AppScreen.LOBBY && (
        <Lobby
          avatars={avatars}
          scoreboard={scoreboard}
          onStartSetup={handleStartFromLobby}
          onOpenFinalResult={handleOpenFinalResultFromLobby}
          onOpenRules={() => setIsRulesOpen(true)}
          onResetAllSettings={handleResetAllSettings}
        />
      )}

      {screen === AppScreen.CHARACTER_SELECTION && (
        <CharacterSelection
          selectedIds={selectedIds}
          avatars={avatars}
          onToggleCharacter={handleToggleCharacter}
          onSelectAll={handleSelectAllCharacters}
          onClearSelection={handleClearCharacters}
          onStartGameFlow={handleProceedAfterCharacters}
        />
      )}

      {screen === AppScreen.AVATAR_CAMERA && (
        <AvatarCamera
          queue={cameraQueue}
          existingAvatars={avatars}
          onSavePhoto={handleSaveAvatar}
          onDeletePhoto={handleDeleteAvatar}
          onCompleteQueue={handleCompleteCameraQueue}
        />
      )}

      {screen === AppScreen.CATEGORY_SELECTION && (
        <CategorySelection
          categories={categories}
          usedWordsByCategory={scoreboard.usedWordsByCategory}
          onSelectCategory={handleSelectCategory}
          onCreateCustomCategory={handleCreateCustomCategory}
          onDeleteCustomCategory={handleDeleteCustomCategory}
          onAddWordsToCategory={handleAddWords}
        />
      )}

      {screen === AppScreen.GAME && session && (
        <GameScreen
          session={session}
          scoreboard={scoreboard}
          categories={categories}
          avatars={avatars}
          onOpenRole={handleOpenRole}
          onHideRoleAndNext={handleHideRoleAndNext}
          onStartVoting={handleStartVoting}
          onOpenVoterBallot={handleOpenVoterBallot}
          onSubmitVote={handleSubmitVote}
          onStartNextRoundSameCategory={handleStartNextRoundSameCategory}
          onOpenCategorySwitchForNextRound={handleOpenCategorySwitchForNextRound}
          onFinishToLeaderboard={handleFinishToLeaderboard}
          onResetSessionScores={handleResetSessionScores}
          onExitToLobby={handleExitToLobby}
        />
      )}

      <RulesSheet
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    </div>
  );
}

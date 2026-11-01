import { CHARACTERS } from '../data/characters';
import { DEFAULT_CATEGORIES } from '../data/categories';
import {
  DISCUSSION_DURATION_SECONDS,
  PLACE_TITLES,
  buildGlobalLeaderboard,
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
} from './gameLogic';
import { CharacterId, GameCategory, SpyGamePhase } from '../types/game';

function expectOk(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Test assertion failed: ${message}`);
  }
}

function expectEqual<T>(actual: T, expected: T, message: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `Test assertion failed (${message}): expected ${expectedJson}, got ${actualJson}`
    );
  }
}

function runTests() {
  // 1. Таймер обсуждения = ровно 180 секунд (3 минуты)
  expectEqual(DISCUSSION_DURATION_SECONDS, 180, 'discussion timer 3 min');

  // 2. Ровно 5 персонажей и валидация от 3 до 5 участников
  expectEqual(CHARACTERS.length, 5, '5 canonical characters');
  expectEqual(isValidParticipantCount(['rasul', 'salikh']), false, '2 players invalid');
  expectEqual(
    isValidParticipantCount(['rasul', 'salikh', 'mikail']),
    true,
    '3 players valid'
  );
  expectEqual(
    isValidParticipantCount(['rasul', 'salikh', 'mikail', 'denislam', 'izamutdin']),
    true,
    '5 players valid'
  );

  expectEqual(
    sortParticipantsCanonical(['izamutdin', 'rasul', 'mikail']),
    ['rasul', 'mikail', 'izamutdin'],
    'canonical participant order'
  );

  // 3. Базовые категории (4 категории)
  expectEqual(
    DEFAULT_CATEGORIES.map((c) => c.id),
    ['locations', 'professions', 'animals', 'objects'],
    '4 base categories'
  );

  // 4. Отсутствие повторяющихся слов внутри сессии и обработка исчерпания категории
  const miniCategory: GameCategory = {
    id: 'test_cat',
    title: 'Тестовая',
    description: 'Тест',
    iconKey: 'compass',
    items: ['Альфа', 'Бета', 'Гамма'],
  };

  let board = createInitialGlobalScoreboard();
  const seenWords = new Set<string>();
  const players3: CharacterId[] = ['rasul', 'salikh', 'mikail'];

  for (let i = 0; i < 3; i++) {
    const started = startSpyRoundWithScoreboard(players3, 'test_cat', [miniCategory], board);
    board = started.scoreboard;
    expectEqual(started.session.phase, SpyGamePhase.ROLE_HANDOFF, `round ${i + 1} phase`);
    expectOk(players3.includes(started.session.spyId), 'spy must be among participants');
    expectOk(started.session.secretWord.length > 0, 'secret word non-empty');
    expectEqual(seenWords.has(started.session.secretWord), false, 'no duplicate words');
    seenWords.add(started.session.secretWord);
  }
  expectEqual(seenWords.size, 3, 'all 3 unique words drawn');

  const exhausted = startSpyRoundWithScoreboard(players3, 'test_cat', [miniCategory], board);
  expectEqual(
    exhausted.session.phase,
    SpyGamePhase.CATEGORY_EXHAUSTED,
    'exhausted category transitions cleanly'
  );

  // 5. Поочерёдная раздача и скрытие ролей
  let roundBoard = createInitialGlobalScoreboard();
  const players4: CharacterId[] = ['rasul', 'salikh', 'mikail', 'denislam'];
  let { session, scoreboard: sb } = startSpyRoundWithScoreboard(
    players4,
    'locations',
    DEFAULT_CATEGORIES,
    roundBoard
  );
  roundBoard = sb;

  for (let i = 0; i < players4.length; i++) {
    expectEqual(session.phase, SpyGamePhase.ROLE_HANDOFF, 'handoff before viewing');
    expectEqual(session.roleRevealIndex, i, 'reveal index');
    expectEqual(
      hideCurrentPlayerRoleAndAdvance(session).phase,
      SpyGamePhase.ROLE_HANDOFF,
      'cannot advance before opening role'
    );

    session = openCurrentPlayerRole(session);
    expectEqual(session.phase, SpyGamePhase.ROLE_VIEWING, 'viewing role');

    session = hideCurrentPlayerRoleAndAdvance(session);
  }
  expectEqual(session.phase, SpyGamePhase.DISCUSSION, 'transitions to discussion');

  // 6. Голосование: защита от повторного старта и голосования за себя
  session = startSecretVoting(session);
  expectEqual(session.phase, SpyGamePhase.VOTING_HANDOFF, 'voting handoff');
  session = openCurrentVoterBallot(session);
  expectEqual(session.phase, SpyGamePhase.VOTING_SELECT, 'voting select');
  expectEqual(
    startSecretVoting(session).phase,
    SpyGamePhase.VOTING_SELECT,
    'startSecretVoting ignored outside DISCUSSION'
  );

  const firstVoter = session.participantIds[0];
  const selfVoteAttempt = submitSecretVoteWithScoreboard(
    session,
    firstVoter,
    DEFAULT_CATEGORIES,
    roundBoard
  );
  expectEqual(selfVoteAttempt.session.voterIndex, 0, 'self-vote rejected');

  // 7. Подсчёт очков A: 0 голосов за шпиона -> шпиону +3, мирным 0
  {
    const sbZero = createInitialGlobalScoreboard();
    let { session: s, scoreboard: b } = startSpyRoundWithScoreboard(
      players4,
      'locations',
      DEFAULT_CATEGORIES,
      sbZero
    );
    s = { ...s, spyId: 'rasul', phase: SpyGamePhase.DISCUSSION };
    s = startSecretVoting(s);

    const targetByVoter: Record<CharacterId, CharacterId> = {
      rasul: 'salikh',
      salikh: 'mikail',
      mikail: 'denislam',
      denislam: 'salikh',
      izamutdin: 'salikh',
    };

    for (let i = 0; i < players4.length; i++) {
      s = openCurrentVoterBallot(s);
      const voter = s.participantIds[s.voterIndex];
      const res = submitSecretVoteWithScoreboard(s, targetByVoter[voter], DEFAULT_CATEGORIES, b);
      s = res.session;
      b = res.scoreboard;
    }

    expectEqual(s.phase, SpyGamePhase.ROUND_RESULTS, 'round results phase');
    expectEqual(s.lastRoundOutcome?.winnerSide, 'SPY', 'spy wins with 0 votes');
    expectEqual(b.scores.rasul, 3, 'spy gets +3');
    expectEqual(b.scores.salikh, 0, 'civ 0');
    expectEqual(b.scores.mikail, 0, 'civ 0');
    expectEqual(b.scores.denislam, 0, 'civ 0');

    // Попытка повторного завершения раунда не начисляет очки дважды
    const duplicateAttempt = submitSecretVoteWithScoreboard(
      { ...s, phase: SpyGamePhase.VOTING_SELECT },
      'salikh',
      DEFAULT_CATEGORIES,
      b
    );
    expectEqual(duplicateAttempt.scoreboard.scores.rasul, 3, 'no double scoring');
    expectEqual(duplicateAttempt.scoreboard.history.length, 1, 'no duplicate history');
  }

  // 8. Подсчёт очков B: 1 голос за шпиона -> шпиону 0, угадавшему +2, остальным 0
  {
    const sbLone = createInitialGlobalScoreboard();
    let { session: s, scoreboard: b } = startSpyRoundWithScoreboard(
      players4,
      'locations',
      DEFAULT_CATEGORIES,
      sbLone
    );
    s = { ...s, spyId: 'rasul', phase: SpyGamePhase.DISCUSSION };
    s = startSecretVoting(s);

    const targetByVoter: Record<CharacterId, CharacterId> = {
      rasul: 'salikh',
      salikh: 'rasul',
      mikail: 'salikh',
      denislam: 'salikh',
      izamutdin: 'salikh',
    };

    for (let i = 0; i < players4.length; i++) {
      s = openCurrentVoterBallot(s);
      const voter = s.participantIds[s.voterIndex];
      const res = submitSecretVoteWithScoreboard(s, targetByVoter[voter], DEFAULT_CATEGORIES, b);
      s = res.session;
      b = res.scoreboard;
    }

    expectEqual(s.lastRoundOutcome?.winnerSide, 'LONE_DETECTIVE', 'lone detective outcome');
    expectEqual(b.scores.rasul, 0, 'spy gets 0 when 1 vote');
    expectEqual(b.scores.salikh, 2, 'lone accurate voter gets +2');
    expectEqual(b.scores.mikail, 0, 'wrong voter gets 0');
    expectEqual(b.scores.denislam, 0, 'wrong voter gets 0');
  }

  // 9. Подсчёт очков C: 2+ голосов за шпиона (в т.ч. ничья 2-2) -> шпиону 0, каждому угадавшему +1
  {
    const sbGroup = createInitialGlobalScoreboard();
    let { session: s, scoreboard: b } = startSpyRoundWithScoreboard(
      players4,
      'locations',
      DEFAULT_CATEGORIES,
      sbGroup
    );
    s = { ...s, spyId: 'rasul', phase: SpyGamePhase.DISCUSSION };
    s = startSecretVoting(s);

    const targetByVoter: Record<CharacterId, CharacterId> = {
      rasul: 'salikh',
      salikh: 'rasul',
      mikail: 'rasul',
      denislam: 'salikh',
      izamutdin: 'salikh',
    };

    for (let i = 0; i < players4.length; i++) {
      s = openCurrentVoterBallot(s);
      const voter = s.participantIds[s.voterIndex];
      const res = submitSecretVoteWithScoreboard(s, targetByVoter[voter], DEFAULT_CATEGORIES, b);
      s = res.session;
      b = res.scoreboard;
    }

    expectEqual(s.lastRoundOutcome?.winnerSide, 'CIVILIANS', 'group caught spy');
    expectEqual(b.scores.rasul, 0, 'spy gets 0');
    expectEqual(b.scores.salikh, 1, 'voter 1 gets +1');
    expectEqual(b.scores.mikail, 1, 'voter 2 gets +1');
    expectEqual(b.scores.denislam, 0, 'wrong voter gets 0');

    // Финальная таблица лидеров: только игравшие 4 участника, корректная ничья и звания по местам
    const finished = finishSpySessionToLeaderboard(s);
    expectEqual(finished.phase, SpyGamePhase.LEADERBOARD, 'leaderboard phase');
    const lb = buildGlobalLeaderboard(b);
    expectEqual(lb.length, 4, 'only 4 played participants appear in leaderboard');
    // Счёт: salikh = 1, mikail = 1, rasul = 0, denislam = 0 -> места 1, 1, 3, 3
    expectEqual(
      lb.map((e) => e.rank),
      [1, 1, 3, 3],
      'tied scores receive identical competition ranks (1, 1, 3, 3)'
    );
    expectOk(PLACE_TITLES[1].includes(lb[0].title), 'rank 1 player A gets rank 1 title');
    expectOk(PLACE_TITLES[1].includes(lb[1].title), 'rank 1 player B gets rank 1 title');
    expectOk(lb[0].title !== lb[1].title, 'tied rank 1 players get distinct titles');
    expectOk(PLACE_TITLES[3].includes(lb[2].title), 'rank 3 player C gets rank 3 title');
    expectOk(PLACE_TITLES[3].includes(lb[3].title), 'rank 3 player D gets rank 3 title');
    expectOk(lb[2].title !== lb[3].title, 'tied rank 3 players get distinct titles');

    // Стабильность званий при повторном рендере / перезагрузке страницы (тот же titleSeed)
    const reloadedBoard = JSON.parse(JSON.stringify(b));
    const lbAfterReload = buildGlobalLeaderboard(reloadedBoard);
    expectEqual(
      lbAfterReload.map((e) => e.title),
      lb.map((e) => e.title),
      'titles never change on page reload within same session'
    );
  }

  // 10. Проверка всех 5 мест (1–5) и перегенерации званий в новой игровой сессии
  {
    const baseStats = createInitialGlobalScoreboard().playerStats;
    for (const c of CHARACTERS) {
      baseStats[c.id].roundsPlayed = 3;
    }

    const sessionScores: Record<CharacterId, number> = {
      rasul: 9,
      salikh: 6,
      mikail: 4,
      denislam: 2,
      izamutdin: 0,
    };

    const seenRank1Titles = new Set<string>();
    const seenRank5Titles = new Set<string>();
    let prevSeed: number | undefined = undefined;

    for (let i = 0; i < 40; i++) {
      const freshBoard = createInitialGlobalScoreboard(prevSeed);
      expectOk(freshBoard.titleSeed !== prevSeed, 'new session generates a fresh titleSeed');
      prevSeed = freshBoard.titleSeed;

      const fullBoard = {
        ...freshBoard,
        scores: sessionScores,
        playerStats: baseStats,
      };

      const lb5 = buildGlobalLeaderboard(fullBoard);
      expectEqual(
        lb5.map((e) => e.rank),
        [1, 2, 3, 4, 5],
        '5 distinct scores produce ranks 1..5'
      );

      for (const entry of lb5) {
        const rankKey = entry.rank as 1 | 2 | 3 | 4 | 5;
        expectOk(
          PLACE_TITLES[rankKey].includes(entry.title),
          `rank ${rankKey} title comes from PLACE_TITLES[${rankKey}]`
        );
      }

      seenRank1Titles.add(lb5[0].title);
      seenRank5Titles.add(lb5[4].title);
    }

    expectOk(seenRank1Titles.size > 1, 'rank 1 titles vary randomly across new sessions');
    expectOk(seenRank5Titles.size > 1, 'rank 5 titles vary randomly across new sessions');
  }

  console.log('ALL GAME LOGIC & SECURITY TESTS PASSED SUCCESSFULLY!');
}

runTests();

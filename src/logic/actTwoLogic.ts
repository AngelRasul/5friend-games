import { ACT_TWO_SCENARIOS, getActTwoScenarioById } from '../data/actTwoScenarios';
import { getUniformRandomIndex, sortParticipantsCanonical } from './gameLogic';
import {
  ActTwoAssignedPlayer,
  ActTwoPhase,
  ActTwoRoleTemplate,
  ActTwoScenario,
  ActTwoSessionState,
  CharacterId,
} from '../types/game';

/** Длительность обсуждения в режиме ACT II — 4 минуты (240 секунд) */
export const ACT_TWO_DISCUSSION_SECONDS = 240;

const EXPECTED_SECRET_LEN = 4;
const EXPECTED_ROLLING_HASH = 20537649;
const EXPECTED_WEIGHTED_SUM = 35712;

/**
 * Программная крипто-хеш проверка секретного пароля второго акта.
 * Нормализует ввод (регистр и крайние пробелы) и сверяет контрольные дайджесты,
 * не храня и не раскрывая пароль в открытом виде в интерфейсе.
 */
export function verifyActTwoPassword(rawInput: string): boolean {
  if (typeof rawInput !== 'string') return false;
  const normalized = rawInput.trim().toUpperCase();
  if (normalized.length !== EXPECTED_SECRET_LEN) return false;

  let rollingHash = 5381;
  let weightedSum = 0;

  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    rollingHash = (rollingHash * 33 + code) % 100000007;
    weightedSum += code * (i + 7);
  }

  return (
    rollingHash === EXPECTED_ROLLING_HASH && weightedSum === EXPECTED_WEIGHTED_SUM
  );
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getUniformRandomIndex(i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Инициализирует новое засекреченное расследование ACT II для 3–5 выбранных игроков.
 * Всегда включает ровно 1 преступника и (N - 1) невиновных подозреваемых,
 * случайным образом распределяя досье между участниками.
 */
export function startActTwoInvestigation(
  scenarioId: string,
  selectedParticipantIds: CharacterId[]
): ActTwoSessionState {
  const scenario: ActTwoScenario =
    getActTwoScenarioById(scenarioId) ?? ACT_TWO_SCENARIOS[0];
  const orderedParticipants = sortParticipantsCanonical(selectedParticipantIds);
  const count = orderedParticipants.length;

  const culpritRole = scenario.roles.find((r) => r.isCulprit) ?? scenario.roles[0];
  const innocentRoles = scenario.roles
    .filter((r) => !r.isCulprit)
    .slice(0, Math.max(0, count - 1));

  const rolesForMatch: ActTwoRoleTemplate[] = shuffleArray([
    culpritRole,
    ...innocentRoles,
  ]);

  const assignments: ActTwoAssignedPlayer[] = orderedParticipants.map(
    (characterId, idx) => ({
      characterId,
      role: rolesForMatch[idx],
    })
  );

  const culpritAssignment =
    assignments.find((a) => a.role.isCulprit) ?? assignments[0];

  return {
    scenarioId: scenario.id,
    participantIds: orderedParticipants,
    assignments,
    culpritCharacterId: culpritAssignment.characterId,
    phase: ActTwoPhase.CASE_BRIEFING,
    handoffIndex: 0,
    voterIndex: 0,
    votes: {},
    caughtCulprit: null,
    accusedCharacterId: null,
  };
}

export function beginActTwoRoleHandoff(
  session: ActTwoSessionState
): ActTwoSessionState {
  if (session.phase !== ActTwoPhase.CASE_BRIEFING) return session;
  return {
    ...session,
    handoffIndex: 0,
    phase: ActTwoPhase.ROLE_HANDOFF,
  };
}

export function openActTwoRole(session: ActTwoSessionState): ActTwoSessionState {
  if (session.phase !== ActTwoPhase.ROLE_HANDOFF) return session;
  return {
    ...session,
    phase: ActTwoPhase.ROLE_VIEWING,
  };
}

export function hideActTwoRoleAndAdvance(
  session: ActTwoSessionState
): ActTwoSessionState {
  if (session.phase !== ActTwoPhase.ROLE_VIEWING) return session;

  const nextIndex = session.handoffIndex + 1;
  if (nextIndex < session.assignments.length) {
    return {
      ...session,
      handoffIndex: nextIndex,
      phase: ActTwoPhase.ROLE_HANDOFF,
    };
  }

  return {
    ...session,
    phase: ActTwoPhase.DISCUSSION,
  };
}

export function startActTwoVoting(
  session: ActTwoSessionState
): ActTwoSessionState {
  if (session.phase !== ActTwoPhase.DISCUSSION) return session;
  return {
    ...session,
    voterIndex: 0,
    votes: {},
    phase: ActTwoPhase.VOTING_HANDOFF,
  };
}

export function openActTwoBallot(
  session: ActTwoSessionState
): ActTwoSessionState {
  if (session.phase !== ActTwoPhase.VOTING_HANDOFF) return session;
  return {
    ...session,
    phase: ActTwoPhase.VOTING_SELECT,
  };
}

/**
 * Принимает тайный голос игрока по расследованию ACT II.
 * Преступник считается разоблачённым, если он единолично набрал наибольшее число голосов (без ничьей).
 */
export function submitActTwoVote(
  session: ActTwoSessionState,
  suspectCharacterId: CharacterId
): ActTwoSessionState {
  if (session.phase !== ActTwoPhase.VOTING_SELECT) return session;

  const voterId = session.participantIds[session.voterIndex];
  if (
    !voterId ||
    suspectCharacterId === voterId ||
    !session.participantIds.includes(suspectCharacterId) ||
    Object.prototype.hasOwnProperty.call(session.votes, voterId)
  ) {
    return session;
  }

  const nextVotes: Partial<Record<CharacterId, CharacterId>> = {
    ...session.votes,
    [voterId]: suspectCharacterId,
  };

  const nextVoterIndex = session.voterIndex + 1;
  if (nextVoterIndex < session.participantIds.length) {
    return {
      ...session,
      votes: nextVotes,
      voterIndex: nextVoterIndex,
      phase: ActTwoPhase.VOTING_HANDOFF,
    };
  }

  const voteCounts: Partial<Record<CharacterId, number>> = {};
  for (const pid of session.participantIds) {
    voteCounts[pid] = 0;
  }
  for (const pid of session.participantIds) {
    const target = nextVotes[pid];
    if (target) {
      voteCounts[target] = (voteCounts[target] ?? 0) + 1;
    }
  }

  let maxVotes = 0;
  for (const pid of session.participantIds) {
    const c = voteCounts[pid] ?? 0;
    if (c > maxVotes) {
      maxVotes = c;
    }
  }

  const topSuspects = session.participantIds.filter(
    (pid) => (voteCounts[pid] ?? 0) === maxVotes && maxVotes > 0
  );

  const hasSingleAccused = topSuspects.length === 1;
  const accusedCharacterId = hasSingleAccused ? topSuspects[0] : null;
  const caughtCulprit =
    hasSingleAccused && accusedCharacterId === session.culpritCharacterId;

  return {
    ...session,
    votes: nextVotes,
    accusedCharacterId,
    caughtCulprit,
    phase: ActTwoPhase.FINALE,
  };
}

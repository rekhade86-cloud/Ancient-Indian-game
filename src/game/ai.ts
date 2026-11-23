import {
  HOME_STEP,
  OUTER_LOOP_START,
  TRAY_STEP,
  getOuterRingDistance,
  isPrivateCenterLaneStep,
  isSafeCoord,
  getPieceCoord,
} from './boardGeometry';
import {
  applyMove,
  areAllies,
  getAllLegalMoves,
  getCurrentPlayerId,
  isHomeUnlocked,
} from './engine';
import type { ArmId, Difficulty, GameState, LegalMove } from './types';

/**
 * Computes how endangered a piece at `(owner, step)` is by enemy pieces within `maxDist` squares behind.
 */
function countNearbyEnemiesBehind(
  state: GameState,
  owner: ArmId,
  step: number,
  maxDist: number
): number {
  if (step === TRAY_STEP || step === HOME_STEP || isPrivateCenterLaneStep(step)) {
    return 0;
  }
  const coord = getPieceCoord(owner, step);
  if (coord && isSafeCoord(coord)) return 0;

  let threats = 0;
  for (const p of state.pieces) {
    if (areAllies(state, owner, p.owner)) continue;
    if (p.step < OUTER_LOOP_START || p.step > 74) continue;
    const dist = getOuterRingDistance(p.owner, p.step, owner, step);
    if (dist !== null && dist >= 1 && dist <= maxDist) {
      threats++;
    }
  }
  return threats;
}

/**
 * Heuristic score for a single Chaupar LegalMove (Shakuni Strategy Engine).
 */
export function evaluateMove(state: GameState, move: LegalMove): number {
  let score = 0;
  const homeLocked = !isHomeUnlocked(state, move.pieceOwner);

  // 1. Capture (Maar) — highest priority, especially when Home Column is locked (Tod)
  if (move.isCapture) {
    score += homeLocked ? 360 : 230;
    if (move.capturedPieceIds.length >= 2) {
      score += 140; // Jodi-vs-Jodi double cut!
    }
  }

  // 2. Reaching Central Home (Meru)
  if (move.reachesHome) {
    score += move.isJodiMove ? 290 : 195;
  }

  // 3. Entering or advancing inside private Home Column (steps 75..82)
  if (move.toStep >= 75 && move.toStep < HOME_STEP) {
    score += move.fromStep < 75 ? 115 : 80 + (move.toStep - 75) * 6;
  }

  // 4. Threat assessment before and after move
  const currentThreatsClose = countNearbyEnemiesBehind(state, move.pieceOwner, move.fromStep, 6);
  const currentThreatsMid = countNearbyEnemiesBehind(state, move.pieceOwner, move.fromStep, 12);
  const destThreatsClose = move.isJodiMove
    ? 0 // Jodi cannot be cut by a single opponent
    : countNearbyEnemiesBehind(state, move.pieceOwner, move.toStep, 6);

  // Landing on a Safe Square (Charkoni)
  if (move.landsOnSafe) {
    score += currentThreatsClose > 0 ? 125 : 78;
  }

  // Forming a protective Jodi pair
  if (move.formsJodi) {
    score += currentThreatsMid > 0 ? 120 : 68;
  }

  // Escaping an immediate danger zone (enemy 1-6 squares behind)
  if (currentThreatsClose > 0 && destThreatsClose === 0) {
    score += 85;
  }

  // Penalize stepping into danger or leaving a safe square into danger
  if (!move.landsOnSafe && !move.formsJodi && !move.isJodiMove && destThreatsClose > 0) {
    score -= 65 * destThreatsClose;
    const fromCoord = getPieceCoord(move.pieceOwner, move.fromStep);
    if (fromCoord && isSafeCoord(fromCoord)) {
      score -= 40;
    }
  }

  // Deploying Gotis from Royal Tray early to build board presence & capture potential
  if (move.entersFromTray) {
    const activeCount = state.pieces.filter(
      (p) => p.owner === move.pieceOwner && p.step >= 0 && p.step < HOME_STEP
    ).length;
    score += activeCount < 2 ? 62 : 34;
  }

  // Forward progress reward
  const effectiveAdvance =
    move.fromStep === TRAY_STEP
      ? move.stepsMoved
      : move.toStep >= move.fromStep
        ? move.toStep - move.fromStep
        : move.stepsMoved;
  score += effectiveAdvance * 1.8;

  // Mild preference for advancing pieces further along when Home is unlocked
  if (!homeLocked && move.fromStep >= 0) {
    score += move.fromStep * 0.45;
  }

  // When Home is locked, reward positioning within striking range (1-12) of an enemy
  if (homeLocked && !move.isCapture && move.toStep >= OUTER_LOOP_START && move.toStep <= 74) {
    for (const p of state.pieces) {
      if (areAllies(state, move.pieceOwner, p.owner)) continue;
      if (p.step < OUTER_LOOP_START || p.step > 74) continue;
      const dist = getOuterRingDistance(move.pieceOwner, move.toStep, p.owner, p.step);
      if (dist !== null && dist >= 1 && dist <= 6) {
        score += 36;
      } else if (dist !== null && dist <= 12) {
        score += 18;
      }
    }
  }

  return score;
}

/**
 * Selects the next LegalMove for the AI player based on difficulty.
 * Mastermind ("Shakuni") performs lookahead across all remaining dice in the current roll
 * so it chooses optimal split-vs-combine sequences!
 */
export function chooseAIMove(
  state: GameState,
  difficulty: Difficulty = state.config.difficulty,
  rng: () => number = Math.random
): LegalMove | null {
  const legalMoves = getAllLegalMoves(state);
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  const actor = getCurrentPlayerId(state);

  if (difficulty === 'novice') {
    // Novice (Sainik): prefers obvious captures half the time, otherwise noisy selection
    const scored = legalMoves.map((m) => ({
      move: m,
      score: evaluateMove(state, m) * 0.45 + (rng() - 0.5) * 190,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  if (difficulty === 'tactician') {
    // Tactician (Yudhishthira): greedy single-step heuristic with small tie-break noise
    const scored = legalMoves.map((m) => ({
      move: m,
      score: evaluateMove(state, m) + (rng() - 0.5) * 28,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  // Mastermind (Shakuni): full turn-sequence lookahead across remaining unused dice!
  // Limit branching cleanly if needed (with max 4 pieces & 3 dice, tree is very small).
  function searchBestSequenceScore(currState: GameState, depth: number): { score: number; firstMove: LegalMove | null } {
    if (currState.winnerTeamId !== null) {
      return { score: 10000, firstMove: null };
    }
    // Stop if turn ended or no unused dice remain
    if (
      getCurrentPlayerId(currState) !== actor ||
      currState.turnPhase !== 'awaiting_move' ||
      depth >= 3
    ) {
      return { score: 0, firstMove: null };
    }

    const moves = getAllLegalMoves(currState);
    if (moves.length === 0) return { score: 0, firstMove: null };

    // Prune to top 10 candidate moves per ply for instant <5ms response
    const ranked = moves
      .map((m) => ({ move: m, immediate: evaluateMove(currState, m) }))
      .sort((a, b) => b.immediate - a.immediate)
      .slice(0, 10);

    let bestTotal = -Infinity;
    let bestMove: LegalMove | null = ranked[0].move;

    for (const { move, immediate } of ranked) {
      const nextState = applyMove(currState, move);
      const followUp =
        nextState.turnPhase === 'awaiting_move' && getCurrentPlayerId(nextState) === actor
          ? searchBestSequenceScore(nextState, depth + 1).score
          : 0;
      const total = immediate + followUp;
      if (total > bestTotal) {
        bestTotal = total;
        bestMove = move;
      }
    }

    return { score: bestTotal, firstMove: bestMove };
  }

  return searchBestSequenceScore(state, 0).firstMove ?? legalMoves[0];
}

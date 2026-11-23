import {
  HOME_STEP,
  OUTER_LOOP_END,
  OUTER_LOOP_LENGTH,
  OUTER_LOOP_START,
  PLAYER_PATHS,
  TRAY_STEP,
  coordKey,
  getPieceCoord,
  isSafeCoord,
} from './boardGeometry';
import type {
  ArmId,
  CommentaryEntry,
  DiceMode,
  DieToken,
  GameConfig,
  GameState,
  Goti,
  LastRollDisplay,
  LegalMove,
  PlayerConfig,
  PlayerPalette,
} from './types';

export const PASHAKA_FACES: readonly number[] = [1, 2, 5, 6];

export const PALETTES: Record<ArmId, PlayerPalette> = {
  south: {
    primary: '#8B0000',
    secondary: '#D4AF37',
    accent: '#F5D061',
    clothFill: '#6B0F1A',
    clothBorder: '#D4AF37',
    pieceTop: '#C92A2A',
    pieceBase: '#5C0000',
    pieceRim: '#E8C55A',
    label: 'Crimson',
  },
  east: {
    primary: '#1A237E',
    secondary: '#C0C0C0',
    accent: '#E2E8F0',
    clothFill: '#162066',
    clothBorder: '#C0C0C0',
    pieceTop: '#3949AB',
    pieceBase: '#0F1654',
    pieceRim: '#D8DEE9',
    label: 'Indigo',
  },
  north: {
    primary: '#004D40',
    secondary: '#D4AF37',
    accent: '#6EE7B7',
    clothFill: '#064035',
    clothBorder: '#D4AF37',
    pieceTop: '#0F766E',
    pieceBase: '#022C22',
    pieceRim: '#E8C55A',
    label: 'Emerald',
  },
  west: {
    primary: '#E65100',
    secondary: '#F5D061',
    accent: '#FDBA74',
    clothFill: '#9A3412',
    clothBorder: '#E8C55A',
    pieceTop: '#EA580C',
    pieceBase: '#7C2D12',
    pieceRim: '#FDE68A',
    label: 'Saffron',
  },
};

export const ARM_LABELS: Record<ArmId, string> = {
  south: 'South',
  east: 'East',
  north: 'North',
  west: 'West',
};

let logCounter = 1;
function makeLog(
  turn: number,
  actor: ArmId | 'system',
  category: CommentaryEntry['category'],
  text: string,
  sanskritTag?: string
): CommentaryEntry {
  return {
    id: `log-${turn}-${logCounter++}`,
    turn,
    actor,
    category,
    text,
    sanskritTag,
  };
}

export function createInitialState(config: GameConfig): GameState {
  const turnOrder: ArmId[] =
    config.mode === '1v1'
      ? ['south', 'north']
      : ['south', 'east', 'north', 'west'];

  const isHuman = (arm: ArmId) => config.humanArms.includes(arm);

  const northPalette = config.mode === '1v1' ? PALETTES.east : PALETTES.north;

  const players: Record<ArmId, PlayerConfig> = {
    south: {
      id: 'south',
      name: isHuman('south') ? 'Kauravas (You)' : 'Shakuni',
      house: 'Hastinapur',
      teamId: 0,
      isAI: !isHuman('south'),
      palette: PALETTES.south,
      hasCaptured: false,
      piecesHome: 0,
    },
    east: {
      id: 'east',
      name: isHuman('east') ? 'Pandavas (You)' : 'Yudhishthira',
      house: 'Indraprastha',
      teamId: 1,
      isAI: !isHuman('east'),
      palette: PALETTES.east,
      hasCaptured: false,
      piecesHome: 0,
    },
    north: {
      id: 'north',
      name:
        config.mode === '1v1'
          ? isHuman('north')
            ? 'Pandavas (You)'
            : 'Pandavas · Shakuni AI'
          : config.mode === '2v2'
            ? isHuman('north')
              ? 'Panchala (You)'
              : 'Panchala (Ally)'
            : isHuman('north')
              ? 'Panchala (You)'
              : 'Panchala',
      house: config.mode === '1v1' ? 'Indraprastha' : 'Kampilya',
      teamId: config.mode === '2v2' ? 0 : config.mode === '1v1' ? 1 : 2,
      isAI: !isHuman('north'),
      palette: northPalette,
      hasCaptured: false,
      piecesHome: 0,
    },
    west: {
      id: 'west',
      name: isHuman('west') ? 'Matsya (You)' : 'Matsya',
      house: 'Viratanagara',
      teamId: config.mode === '2v2' ? 1 : 3,
      isAI: !isHuman('west'),
      palette: PALETTES.west,
      hasCaptured: false,
      piecesHome: 0,
    },
  };

  const pieces: Goti[] = [];
  for (const arm of turnOrder) {
    for (let i = 0; i < 4; i++) {
      pieces.push({
        id: `${arm}-${i}`,
        owner: arm,
        index: i,
        step: TRAY_STEP,
      });
    }
  }

  const modeTitle =
    config.mode === '1v1'
      ? '1v1 Royal Duel'
      : config.mode === '2v2'
        ? '2v2 Jodidar Alliance'
        : '4-Player Free-For-All';

  return {
    config,
    turnOrder,
    currentTurnIndex: 0,
    turnNumber: 1,
    turnPhase: 'awaiting_roll',
    players,
    pieces,
    dice: [],
    lastRoll: null,
    consecutiveBonusRolls: 0,
    pendingBonusRoll: false,
    winnerTeamId: null,
    winnerArms: [],
    log: [
      makeLog(
        1,
        'system',
        'move',
        `The Dyut Sabha convenes for ${modeTitle}. ${players[turnOrder[0]].name} casts first!`,
        'Dyut Sabha'
      ),
    ],
    stats: {
      totalRolls: 0,
      turnsTaken: 1,
      capturesByPlayer: { south: 0, east: 0, north: 0, west: 0 },
      jodisFormedByPlayer: { south: 0, east: 0, north: 0, west: 0 },
      rollsByPlayer: { south: 0, east: 0, north: 0, west: 0 },
    },
    lastEvent: { type: 'none', seq: 0 },
  };
}

export function getCurrentPlayerId(state: GameState): ArmId {
  return state.turnOrder[state.currentTurnIndex];
}

/**
 * In 2v2 Jodidar mode, if the current player has already brought all 4 of their own
 * pieces Home, they roll and move their opposite partner's remaining pieces.
 */
export function getActivePieceOwner(state: GameState, playerId: ArmId): ArmId {
  const ownPieces = state.pieces.filter((p) => p.owner === playerId);
  const allOwnHome = ownPieces.length > 0 && ownPieces.every((p) => p.step === HOME_STEP);
  if (allOwnHome && state.config.mode === '2v2') {
    const teamId = state.players[playerId].teamId;
    const partner = state.turnOrder.find(
      (id) => id !== playerId && state.players[id].teamId === teamId
    );
    if (partner) return partner;
  }
  return playerId;
}

/**
 * Checks whether `playerId` is allowed to enter their private Home Column (steps 75..83).
 * In 2v2 Jodidar mode, either partner's capture unlocks Home for the alliance.
 */
export function isHomeUnlocked(state: GameState, playerId: ArmId): boolean {
  if (!state.config.strictCaptureToHome) return true;
  if (state.players[playerId].hasCaptured) return true;
  if (state.config.mode === '2v2') {
    const teamId = state.players[playerId].teamId;
    return state.turnOrder.some(
      (id) => state.players[id].teamId === teamId && state.players[id].hasCaptured
    );
  }
  return false;
}

export function areAllies(state: GameState, a: ArmId, b: ArmId): boolean {
  return state.players[a].teamId === state.players[b].teamId;
}

/**
 * Rolls 3 authentic rectangular Pashaka stick dice (faces: 1, 2, 5, 6).
 * Bonus roll (Punah-Daav) when all 3 faces match (1-1-1, 2-2-2, 5-5-5, 6-6-6).
 */
export function rollPashaka(rng: () => number = Math.random): {
  tokens: DieToken[];
  display: LastRollDisplay;
} {
  const f0 = PASHAKA_FACES[Math.floor(rng() * PASHAKA_FACES.length)];
  const f1 = PASHAKA_FACES[Math.floor(rng() * PASHAKA_FACES.length)];
  const f2 = PASHAKA_FACES[Math.floor(rng() * PASHAKA_FACES.length)];
  const total = f0 + f1 + f2;
  const isBonusRoll = f0 === f1 && f1 === f2;

  return {
    tokens: [
      { id: 'd0', value: f0, used: false },
      { id: 'd1', value: f1, used: false },
      { id: 'd2', value: f2, used: false },
    ],
    display: {
      mode: 'pashaka',
      pashakaFaces: [f0, f1, f2],
      total,
      isBonusRoll,
      wasTeenTrik: false,
    },
  };
}

/**
 * Rolls 6 traditional Cowrie shells (Kaudi).
 * Scoring: 0 up = 25 (bonus), 1 up = 10 (bonus), 2..5 up = 2..5, 6 up = 12 (bonus).
 */
export function rollKaudi(rng: () => number = Math.random): {
  tokens: DieToken[];
  display: LastRollDisplay;
} {
  const shells: boolean[] = Array.from({ length: 6 }, () => rng() < 0.5);
  const mouthUp = shells.filter(Boolean).length;
  let score = mouthUp;
  let isBonusRoll = false;
  if (mouthUp === 0) {
    score = 25;
    isBonusRoll = true;
  } else if (mouthUp === 1) {
    score = 10;
    isBonusRoll = true;
  } else if (mouthUp === 6) {
    score = 12;
    isBonusRoll = true;
  }

  return {
    tokens: [{ id: 'k0', value: score, used: false }],
    display: {
      mode: 'kaudi',
      kaudiShells: shells,
      total: score,
      isBonusRoll,
      wasTeenTrik: false,
    },
  };
}

export function rollDiceForMode(
  mode: DiceMode,
  rng: () => number = Math.random
): { tokens: DieToken[]; display: LastRollDisplay } {
  return mode === 'pashaka' ? rollPashaka(rng) : rollKaudi(rng);
}

/**
 * Computes destination step for a Goti moving `steps` squares forward.
 * Returns null if the move is illegal (e.g., overshooting Central Home).
 */
export function computeDestinationStep(
  currentStep: number,
  steps: number,
  canEnterHome: boolean
): number | null {
  if (steps <= 0) return null;
  if (currentStep === HOME_STEP) return null;

  // Entering from Royal Tray (-1)
  if (currentStep === TRAY_STEP) {
    const dest = steps - 1; // 1 step -> index 0 (Row 1 center lane)
    if (dest > OUTER_LOOP_END) {
      // Impossible for max roll 25, but guard anyway
      return null;
    }
    return dest;
  }

  // Already in private Home Column ascent (75..82): must land on 83 by EXACT throw
  if (currentStep >= 75) {
    const dest = currentStep + steps;
    return dest <= HOME_STEP ? dest : null;
  }

  // Descending own center lane (0..6) or moving along outer perimeter (7..74)
  const rawNext = currentStep + steps;
  if (rawNext <= OUTER_LOOP_END) {
    return rawNext;
  }

  // Crossed past index 74 (end of outer circuit, South Left col Row 8)
  if (canEnterHome) {
    // Enter Home Column (75..83) — exact throw required to reach 83
    return rawNext <= HOME_STEP ? rawNext : null;
  } else {
    // Strict Capture ("Tod") rule: Home Column is locked!
    // Continue seamlessly anti-clockwise around the 68-square outer perimeter loop (7..74).
    const wrapped = ((rawNext - OUTER_LOOP_START) % OUTER_LOOP_LENGTH) + OUTER_LOOP_START;
    return wrapped;
  }
}

/**
 * Groups active on-board pieces (excluding Tray and Home) by their board coordinate key.
 */
export function getOccupancyMap(pieces: Goti[]): Map<string, Goti[]> {
  const map = new Map<string, Goti[]>();
  for (const p of pieces) {
    if (p.step === TRAY_STEP || p.step === HOME_STEP) continue;
    const coord = getPieceCoord(p.owner, p.step);
    if (!coord) continue;
    const key = coordKey(coord);
    const list = map.get(key);
    if (list) list.push(p);
    else map.set(key, [p]);
  }
  return map;
}

/**
 * Returns pairs of own pieces sharing the exact same board square (and same step, so they move together as a Jodi).
 */
export function getPlayerJodis(pieces: Goti[], owner: ArmId): Array<[Goti, Goti]> {
  const byStep = new Map<number, Goti[]>();
  for (const p of pieces) {
    if (p.owner !== owner || p.step === TRAY_STEP || p.step === HOME_STEP) continue;
    const list = byStep.get(p.step);
    if (list) list.push(p);
    else byStep.set(p.step, [p]);
  }
  const jodis: Array<[Goti, Goti]> = [];
  for (const group of byStep.values()) {
    if (group.length >= 2) {
      jodis.push([group[0], group[1]]);
    }
  }
  return jodis;
}

/**
 * Computes all legal moves for a specific subset of unused die indices.
 */
export function getLegalMovesForDieSubset(
  state: GameState,
  dieIndices: number[]
): LegalMove[] {
  if (dieIndices.length === 0) return [];
  const unique = Array.from(new Set(dieIndices)).sort((a, b) => a - b);
  let diceSum = 0;
  for (const idx of unique) {
    const token = state.dice[idx];
    if (!token || token.used) return [];
    diceSum += token.value;
  }

  const currentPlayer = getCurrentPlayerId(state);
  const pieceOwner = getActivePieceOwner(state, currentPlayer);
  const canEnterHome = isHomeUnlocked(state, pieceOwner);
  const occupancy = getOccupancyMap(state.pieces);
  const ownerPieces = state.pieces.filter((p) => p.owner === pieceOwner);
  const moves: LegalMove[] = [];

  // Deduplicate identical tray pieces (entering tray piece 0 is equivalent to tray piece 1; expose first available tray piece)
  let addedTrayEntry = false;
  // Deduplicate identical-step single moves from stacked pieces only by keeping each piece clickable in UI!
  // Wait: exposing each piece ID separately makes clicking any visual piece on the board work cleanly.

  // 1. Single-piece moves
  for (const piece of ownerPieces) {
    if (piece.step === HOME_STEP) continue;
    if (piece.step === TRAY_STEP) {
      if (addedTrayEntry) continue;
    }

    const toStep = computeDestinationStep(piece.step, diceSum, canEnterHome);
    if (toStep === null) continue;

    const destCoord = PLAYER_PATHS[pieceOwner][toStep];
    const reachesHome = toStep === HOME_STEP;
    const landsOnSafe = !reachesHome && isSafeCoord(destCoord);

    let capturedPieceIds: string[] = [];
    let blockedByEnemyJodi = false;
    let formsJodi = false;

    if (!reachesHome) {
      const occupants = occupancy.get(coordKey(destCoord)) ?? [];
      const enemyOccupants = occupants.filter((o) => !areAllies(state, pieceOwner, o.owner));
      const sameOwnerOccupants = occupants.filter(
        (o) => o.owner === pieceOwner && o.id !== piece.id && o.step === toStep
      );

      if (sameOwnerOccupants.length >= 1) {
        formsJodi = true;
      }

      if (!landsOnSafe && enemyOccupants.length > 0) {
        // Check if any enemy has a Jodi (>= 2 enemy pieces of same owner) on this square
        const enemyCountByOwner = new Map<ArmId, Goti[]>();
        for (const eo of enemyOccupants) {
          const list = enemyCountByOwner.get(eo.owner) ?? [];
          list.push(eo);
          enemyCountByOwner.set(eo.owner, list);
        }
        for (const list of enemyCountByOwner.values()) {
          if (list.length >= 2) {
            blockedByEnemyJodi = true;
            break;
          }
        }
        if (!blockedByEnemyJodi) {
          capturedPieceIds = enemyOccupants.map((eo) => eo.id);
        }
      }
    }

    if (blockedByEnemyJodi) continue;

    if (piece.step === TRAY_STEP) {
      addedTrayEntry = true;
    }

    moves.push({
      id: `single:${piece.id}:${unique.join('+')}`,
      pieceOwner,
      pieceIds: [piece.id],
      isJodiMove: false,
      dieIndices: unique,
      diceSum,
      stepsMoved: diceSum,
      fromStep: piece.step,
      toStep,
      destCoord,
      isCapture: capturedPieceIds.length > 0,
      capturedPieceIds,
      landsOnSafe,
      formsJodi,
      reachesHome,
      entersFromTray: piece.step === TRAY_STEP,
    });
  }

  // 2. Jodi Pair Moves (even diceSum >= 2 -> move pair together by diceSum / 2)
  if (diceSum >= 2 && diceSum % 2 === 0) {
    const halfSteps = diceSum / 2;
    const jodis = getPlayerJodis(state.pieces, pieceOwner);
    for (const [p1, p2] of jodis) {
      const toStep = computeDestinationStep(p1.step, halfSteps, canEnterHome);
      if (toStep === null) continue;

      const destCoord = PLAYER_PATHS[pieceOwner][toStep];
      const reachesHome = toStep === HOME_STEP;
      const landsOnSafe = !reachesHome && isSafeCoord(destCoord);

      let capturedPieceIds: string[] = [];
      if (!reachesHome && !landsOnSafe) {
        const occupants = occupancy.get(coordKey(destCoord)) ?? [];
        const enemyOccupants = occupants.filter((o) => !areAllies(state, pieceOwner, o.owner));
        // A Jodi can cut BOTH single enemy pieces AND enemy Jodis!
        capturedPieceIds = enemyOccupants.map((eo) => eo.id);
      }

      moves.push({
        id: `jodi:${p1.id}+${p2.id}:${unique.join('+')}`,
        pieceOwner,
        pieceIds: [p1.id, p2.id],
        isJodiMove: true,
        dieIndices: unique,
        diceSum,
        stepsMoved: halfSteps,
        fromStep: p1.step,
        toStep,
        destCoord,
        isCapture: capturedPieceIds.length > 0,
        capturedPieceIds,
        landsOnSafe,
        formsJodi: false, // Already a Jodi
        reachesHome,
        entersFromTray: false,
      });
    }
  }

  return moves;
}

/**
 * Generates all non-empty subsets of unused die indices (for 3 dice: up to 7 subsets).
 */
export function getUnusedDieSubsets(dice: DieToken[]): number[][] {
  const unused = dice
    .map((d, idx) => (d.used ? -1 : idx))
    .filter((idx) => idx !== -1);

  const subsets: number[][] = [];
  const n = unused.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const sub: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) sub.push(unused[i]);
    }
    subsets.push(sub);
  }
  return subsets;
}

/**
 * Returns ALL legal moves across all single and combined subsets of remaining unused dice.
 */
export function getAllLegalMoves(state: GameState): LegalMove[] {
  const subsets = getUnusedDieSubsets(state.dice);
  const all: LegalMove[] = [];
  for (const sub of subsets) {
    all.push(...getLegalMovesForDieSubset(state, sub));
  }
  return all;
}

/**
 * Advances to the next player's turn (or grants a pending bonus roll to the same player).
 */
export function finishCurrentTurnPhase(state: GameState): GameState {
  if (state.winnerTeamId !== null) return state;

  if (state.pendingBonusRoll) {
    return {
      ...state,
      turnPhase: 'awaiting_roll',
      dice: [],
      pendingBonusRoll: false,
    };
  }

  const nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
  const nextTurnNumber = state.turnNumber + 1;
  return {
    ...state,
    currentTurnIndex: nextIndex,
    turnNumber: nextTurnNumber,
    turnPhase: 'awaiting_roll',
    dice: [],
    consecutiveBonusRolls: 0,
    pendingBonusRoll: false,
    stats: {
      ...state.stats,
      turnsTaken: state.stats.turnsTaken + 1,
    },
  };
}

/**
 * Applies a dice roll (either random or deterministic for tests) to GameState.
 * Handles Bonus Rolls (Punah-Daav), Teen-Trik 3-consecutive-bonus burn penalty,
 * and automatic pass if no legal moves exist.
 */
export function applyDiceRoll(
  state: GameState,
  forcedRoll?: { tokens: DieToken[]; display: LastRollDisplay },
  rng: () => number = Math.random
): GameState {
  if (state.winnerTeamId !== null) return state;
  const actor = getCurrentPlayerId(state);
  const actorName = state.players[actor].name;
  const roll = forcedRoll ?? rollDiceForMode(state.config.diceMode, rng);

  const nextStats = {
    ...state.stats,
    totalRolls: state.stats.totalRolls + 1,
    rollsByPlayer: {
      ...state.stats.rollsByPlayer,
      [actor]: state.stats.rollsByPlayer[actor] + 1,
    },
  };

  const rollDesc =
    roll.display.mode === 'pashaka' && roll.display.pashakaFaces
      ? `${roll.display.pashakaFaces.join('-')} (${roll.display.total})`
      : `${roll.display.total} (${roll.display.kaudiShells?.filter(Boolean).length ?? 0} shells up)`;

  // Check Teen-Trik (3 consecutive bonus rolls in one turn -> 3rd roll burned & turn passes)
  if (roll.display.isBonusRoll && state.consecutiveBonusRolls >= 2) {
    const teenTrikDisplay: LastRollDisplay = {
      ...roll.display,
      wasTeenTrik: true,
    };
    const nextLog = [
      makeLog(
        state.turnNumber,
        actor,
        'penalty',
        `Teen-Trik! ${actorName} cast a third consecutive bonus (${rollDesc}). The throw is voided and the turn passes!`,
        'Teen-Trik'
      ),
      ...state.log,
    ].slice(0, 60);

    const nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
    return {
      ...state,
      currentTurnIndex: nextIndex,
      turnNumber: state.turnNumber + 1,
      turnPhase: 'awaiting_roll',
      dice: [],
      lastRoll: teenTrikDisplay,
      consecutiveBonusRolls: 0,
      pendingBonusRoll: false,
      log: nextLog,
      stats: {
        ...nextStats,
        turnsTaken: nextStats.turnsTaken + 1,
      },
      lastEvent: { type: 'teen_trik', actor, seq: state.lastEvent.seq + 1 },
    };
  }

  const nextConsecutiveBonus = roll.display.isBonusRoll
    ? state.consecutiveBonusRolls + 1
    : state.consecutiveBonusRolls;

  const bonusLabel = roll.display.isBonusRoll ? ' — Punah-Daav (Bonus Roll)!' : '';
  const rollLogEntry = makeLog(
    state.turnNumber,
    actor,
    roll.display.isBonusRoll ? 'bonus' : 'roll',
    `${actorName} casts ${rollDesc}${bonusLabel}`,
    roll.display.isBonusRoll ? 'Punah-Daav' : roll.display.mode === 'pashaka' ? 'Pashaka' : 'Kaudi'
  );

  let nextState: GameState = {
    ...state,
    turnPhase: 'awaiting_move',
    dice: roll.tokens,
    lastRoll: roll.display,
    consecutiveBonusRolls: nextConsecutiveBonus,
    pendingBonusRoll: roll.display.isBonusRoll,
    log: [rollLogEntry, ...state.log].slice(0, 60),
    stats: nextStats,
    lastEvent: { type: 'roll', actor, seq: state.lastEvent.seq + 1 },
  };

  // Check if ANY legal move exists with this roll
  const legalMoves = getAllLegalMoves(nextState);
  if (legalMoves.length === 0) {
    nextState = {
      ...nextState,
      log: [
        makeLog(
          state.turnNumber,
          actor,
          'move',
          `${actorName} has no legal move for ${rollDesc}.`,
          'Nihshakti'
        ),
        ...nextState.log,
      ].slice(0, 60),
    };
    return finishCurrentTurnPhase(nextState);
  }

  return nextState;
}

/**
 * Executes a validated LegalMove, updates captures, Tod Home unlock, Jodis,
 * Home victory checks, commentary, and turn continuation.
 */
export function applyMove(state: GameState, move: LegalMove): GameState {
  if (state.winnerTeamId !== null) return state;

  const actor = getCurrentPlayerId(state);
  const actorName = state.players[actor].name;
  const pieceOwnerName = state.players[move.pieceOwner].name;

  // Mark consumed dice as used
  const nextDice = state.dice.map((d, idx) =>
    move.dieIndices.includes(idx) ? { ...d, used: true } : d
  );

  // Move pieces and reset captured enemy pieces to Tray (-1)
  const capturedSet = new Set(move.capturedPieceIds);
  const movingSet = new Set(move.pieceIds);

  const nextPieces = state.pieces.map((p) => {
    if (movingSet.has(p.id)) {
      return { ...p, step: move.toStep };
    }
    if (capturedSet.has(p.id)) {
      return { ...p, step: TRAY_STEP };
    }
    return p;
  });

  // Update player stats (captures, Home unlock, piecesHome)
  const nextPlayers: Record<ArmId, PlayerConfig> = { ...state.players };
  for (const arm of state.turnOrder) {
    const homeCount = nextPieces.filter((p) => p.owner === arm && p.step === HOME_STEP).length;
    nextPlayers[arm] = {
      ...nextPlayers[arm],
      piecesHome: homeCount,
    };
  }

  let nextPendingBonus = state.pendingBonusRoll;
  const newLogs: CommentaryEntry[] = [];
  let eventType: GameState['lastEvent']['type'] = 'move';

  const nextStats = {
    ...state.stats,
    capturesByPlayer: { ...state.stats.capturesByPlayer },
    jodisFormedByPlayer: { ...state.stats.jodisFormedByPlayer },
  };

  if (move.isCapture) {
    const wasLocked = !isHomeUnlocked(state, move.pieceOwner);
    nextPlayers[actor] = { ...nextPlayers[actor], hasCaptured: true };
    nextPlayers[move.pieceOwner] = { ...nextPlayers[move.pieceOwner], hasCaptured: true };
    nextPendingBonus = true;
    nextStats.capturesByPlayer[actor] += move.capturedPieceIds.length;
    eventType = 'capture';

    const victimId = state.pieces.find((p) => p.id === move.capturedPieceIds[0])?.owner;
    const victimName = victimId ? state.players[victimId].name : 'opponent';
    const doubleText = move.capturedPieceIds.length >= 2 ? 'Jodi pair' : 'Goti';
    const unlockText = wasLocked ? ' Home Column unlocked!' : '';

    newLogs.push(
      makeLog(
        state.turnNumber,
        actor,
        'capture',
        `Maar! ${actorName} cuts ${victimName}'s ${doubleText} and earns a Bonus Roll!${unlockText}`,
        'Maar · Tod'
      )
    );
  } else if (move.reachesHome) {
    eventType = 'home';
    const pairText = move.isJodiMove ? 'Jodi pair ascends' : 'Goti ascends';
    newLogs.push(
      makeLog(
        state.turnNumber,
        actor,
        'home',
        `${pieceOwnerName}'s ${pairText} into Central Meru (Home)!`,
        'Meru Home'
      )
    );
  } else if (move.formsJodi) {
    nextStats.jodisFormedByPlayer[actor] += 1;
    eventType = 'jodi';
    const safeSuffix = move.landsOnSafe ? ' on a Safe Lotus Square' : '';
    newLogs.push(
      makeLog(
        state.turnNumber,
        actor,
        'jodi',
        `${actorName} forms a protective Jodi pair${safeSuffix}!`,
        'Jodi'
      )
    );
  } else if (move.landsOnSafe) {
    eventType = 'safe';
    newLogs.push(
      makeLog(
        state.turnNumber,
        actor,
        'safe',
        `${actorName} lands safely on a Charkoni Lotus square (${move.stepsMoved} steps).`,
        'Charkoni'
      )
    );
  } else if (move.entersFromTray) {
    newLogs.push(
      makeLog(
        state.turnNumber,
        actor,
        'move',
        `${actorName} deploys a Goti from the Royal Kosh (${move.stepsMoved} steps).`
      )
    );
  } else if (move.isJodiMove) {
    newLogs.push(
      makeLog(
        state.turnNumber,
        actor,
        'move',
        `${actorName} advances a twin Jodi pair ${move.stepsMoved} squares (using ${move.diceSum}).`,
        'Jodi March'
      )
    );
  }

  // Check Victory condition (all pieces of a team have reached Central Home)
  const teamId = nextPlayers[move.pieceOwner].teamId;
  const teamArms = state.turnOrder.filter((id) => nextPlayers[id].teamId === teamId);
  const teamPieces = nextPieces.filter((p) => teamArms.includes(p.owner));
  const isTeamVictorious =
    teamPieces.length > 0 && teamPieces.every((p) => p.step === HOME_STEP);

  if (isTeamVictorious) {
    const winnerLabel =
      teamArms.length > 1
        ? `${nextPlayers[teamArms[0]].name} & ${nextPlayers[teamArms[1]].name}`
        : nextPlayers[teamArms[0]].name;
    newLogs.unshift(
      makeLog(
        state.turnNumber,
        actor,
        'victory',
        `Royal Victory! ${winnerLabel} claims the Dyut Sabha throne!`,
        'Vijay'
      )
    );
    return {
      ...state,
      players: nextPlayers,
      pieces: nextPieces,
      dice: nextDice,
      pendingBonusRoll: false,
      winnerTeamId: teamId,
      winnerArms: teamArms,
      log: [...newLogs, ...state.log].slice(0, 60),
      stats: nextStats,
      lastEvent: {
        type: 'victory',
        coord: move.destCoord,
        actor,
        seq: state.lastEvent.seq + 1,
      },
    };
  }

  let nextState: GameState = {
    ...state,
    players: nextPlayers,
    pieces: nextPieces,
    dice: nextDice,
    pendingBonusRoll: nextPendingBonus,
    log: [...newLogs, ...state.log].slice(0, 60),
    stats: nextStats,
    lastEvent: {
      type: eventType,
      coord: move.destCoord,
      actor,
      seq: state.lastEvent.seq + 1,
    },
  };

  // Check if any unused dice remain AND have legal moves
  const hasUnused = nextDice.some((d) => !d.used);
  if (!hasUnused) {
    return finishCurrentTurnPhase(nextState);
  }

  const remainingMoves = getAllLegalMoves(nextState);
  if (remainingMoves.length === 0) {
    const unusedVals = nextDice.filter((d) => !d.used).map((d) => d.value).join(', ');
    nextState = {
      ...nextState,
      log: [
        makeLog(
          state.turnNumber,
          actor,
          'move',
          `No legal move remains for unused die [${unusedVals}].`,
          'Pass'
        ),
        ...nextState.log,
      ].slice(0, 60),
    };
    return finishCurrentTurnPhase(nextState);
  }

  return nextState;
}

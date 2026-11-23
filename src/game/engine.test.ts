import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARM_CELLS,
  CENTER_COORD,
  HOME_STEP,
  OUTER_LOOP_END,
  OUTER_LOOP_START,
  PLAYER_PATHS,
  SAFE_SQUARES,
  TRAY_STEP,
  coordKey,
  getOuterRingDistance,
  isSafeCoord,
} from './boardGeometry';
import {
  PASHAKA_FACES,
  applyDiceRoll,
  applyMove,
  computeDestinationStep,
  createInitialState,
  getAllLegalMoves,
  getCurrentPlayerId,
  getLegalMovesForDieSubset,
  isHomeUnlocked,
  rollKaudi,
  rollPashaka,
} from './engine';
import { chooseAIMove } from './ai';
import type { GameConfig, GameState } from './types';

function defaultConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    mode: '1v1',
    difficulty: 'mastermind',
    diceMode: 'pashaka',
    strictCaptureToHome: true,
    humanArms: ['south'],
    ...overrides,
  };
}

test('Board geometry has exactly 96 arm cells and 12 safe Charkoni squares', () => {
  assert.equal(ARM_CELLS.length, 96);
  assert.equal(SAFE_SQUARES.length, 12);

  // Verify South arm safe squares: Row 5 outer cols (15,8), (15,10) and Row 8 tip (18,9)
  assert.equal(isSafeCoord({ row: 15, col: 8 }), true);
  assert.equal(isSafeCoord({ row: 15, col: 10 }), true);
  assert.equal(isSafeCoord({ row: 18, col: 9 }), true);

  // Verify East, North, West tips are safe
  assert.equal(isSafeCoord({ row: 9, col: 18 }), true);
  assert.equal(isSafeCoord({ row: 0, col: 9 }), true);
  assert.equal(isSafeCoord({ row: 9, col: 0 }), true);

  // Verify non-safe outer cell
  assert.equal(isSafeCoord({ row: 16, col: 10 }), false);
});

test('All 4 arms have exact 84-step paths ending at Central Meru (9,9) with contiguous anti-clockwise outer loops', () => {
  for (const arm of ['south', 'east', 'north', 'west'] as const) {
    const path = PLAYER_PATHS[arm];
    assert.equal(path.length, 84, `${arm} path should have 84 squares`);
    assert.deepEqual(path[HOME_STEP], CENTER_COORD, `${arm} path must end at Central Home (9,9)`);

    // Outer loop indices 7..74 must all be 68 unique coordinates
    const outerSlice = path.slice(OUTER_LOOP_START, OUTER_LOOP_END + 1);
    assert.equal(outerSlice.length, 68);
    const uniqueOuter = new Set(outerSlice.map(coordKey));
    assert.equal(uniqueOuter.size, 68, `${arm} outer loop must have 68 unique squares`);

    // Consecutive cells along the entire path (except entering central 3x3 home at step 82->83)
    // must be adjacent orthogonally (dist=1) or across an inner corner bridge (dr=1, dc=1)
    for (let i = 0; i < HOME_STEP - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const dr = Math.abs(a.row - b.row);
      const dc = Math.abs(a.col - b.col);
      assert.ok(
        dr <= 1 && dc <= 1 && (dr + dc >= 1),
        `${arm} path discontinuity at step ${i} -> ${i + 1}: (${a.row},${a.col}) -> (${b.row},${b.col})`
      );
    }
  }

  // Opposite arms (South vs North) must be exactly 34 steps apart on the 68-square outer ring
  assert.equal(getOuterRingDistance('south', 7, 'north', 7), 34);
  assert.equal(getOuterRingDistance('south', 7, 'east', 7), 17);
});

test('Pashaka stick dice only roll 1, 2, 5, 6 and trigger Bonus Roll on triples', () => {
  for (let i = 0; i < 200; i++) {
    const roll = rollPashaka();
    assert.equal(roll.tokens.length, 3);
    for (const t of roll.tokens) {
      assert.ok(PASHAKA_FACES.includes(t.value), `Unexpected Pashaka face: ${t.value}`);
    }
    const [a, b, c] = roll.display.pashakaFaces!;
    assert.equal(roll.display.isBonusRoll, a === b && b === c);
  }
});

test('Cowrie shells (Kaudi) score authentically (0=25, 1=10, 6=12 bonus; 2..5 regular)', () => {
  // Force all 0 mouth-up (rng >= 0.5 -> false)
  const zeroUp = rollKaudi(() => 0.9);
  assert.equal(zeroUp.display.total, 25);
  assert.equal(zeroUp.display.isBonusRoll, true);

  // Force all 6 mouth-up (rng < 0.5 -> true)
  const sixUp = rollKaudi(() => 0.1);
  assert.equal(sixUp.display.total, 12);
  assert.equal(sixUp.display.isBonusRoll, true);
});

test('Teen-Trik burns 3rd consecutive bonus roll and immediately passes turn', () => {
  let state = createInitialState(defaultConfig());
  const tripleSix = {
    tokens: [
      { id: 'd0', value: 6, used: false },
      { id: 'd1', value: 6, used: false },
      { id: 'd2', value: 6, used: false },
    ],
    display: {
      mode: 'pashaka' as const,
      pashakaFaces: [6, 6, 6] as [number, number, number],
      total: 18,
      isBonusRoll: true,
      wasTeenTrik: false,
    },
  };

  // Roll 1 (triple 6 -> bonus 1)
  state = applyDiceRoll(state, tripleSix);
  assert.equal(state.consecutiveBonusRolls, 1);
  assert.equal(getCurrentPlayerId(state), 'south');

  // Consume all 3 dice with one combined move so bonus roll triggers
  const move1 = getLegalMovesForDieSubset(state, [0, 1, 2])[0];
  state = applyMove(state, move1);
  assert.equal(getCurrentPlayerId(state), 'south');
  assert.equal(state.turnPhase, 'awaiting_roll');

  // Roll 2 (triple 6 -> bonus 2)
  state = applyDiceRoll(state, tripleSix);
  assert.equal(state.consecutiveBonusRolls, 2);
  const move2 = getLegalMovesForDieSubset(state, [0, 1, 2])[0];
  state = applyMove(state, move2);
  assert.equal(getCurrentPlayerId(state), 'south');

  // Roll 3 (triple 6 -> TEEN-TRIK! Burned and turn passes to North!)
  state = applyDiceRoll(state, tripleSix);
  assert.equal(getCurrentPlayerId(state), 'north');
  assert.equal(state.lastRoll?.wasTeenTrik, true);
  assert.equal(state.consecutiveBonusRolls, 0);
  assert.equal(state.dice.length, 0);
});

test('Splitting and combining 3 Pashaka dice across multiple Gotis works accurately', () => {
  let state = createInitialState(defaultConfig());
  state = applyDiceRoll(state, {
    tokens: [
      { id: 'd0', value: 6, used: false },
      { id: 'd1', value: 2, used: false },
      { id: 'd2', value: 1, used: false },
    ],
    display: {
      mode: 'pashaka',
      pashakaFaces: [6, 2, 1],
      total: 9,
      isBonusRoll: false,
      wasTeenTrik: false,
    },
  });

  // Combine dice 0+1 (6+2=8) onto Goti 0 from Tray -> lands at step 7 (South Tip)
  const combinedMoves = getLegalMovesForDieSubset(state, [0, 1]);
  assert.ok(combinedMoves.length > 0);
  assert.equal(combinedMoves[0].diceSum, 8);
  assert.equal(combinedMoves[0].toStep, 7);

  state = applyMove(state, combinedMoves[0]);
  assert.equal(state.dice[0].used, true);
  assert.equal(state.dice[1].used, true);
  assert.equal(state.dice[2].used, false);
  assert.equal(getCurrentPlayerId(state), 'south');

  // Use remaining die 2 (value 1) to deploy a second Goti from Tray to step 0
  const remaining = getLegalMovesForDieSubset(state, [2]);
  const deployMove = remaining.find((m) => m.entersFromTray);
  assert.ok(deployMove);
  state = applyMove(state, deployMove!);
  // Turn should now pass to North
  assert.equal(getCurrentPlayerId(state), 'north');
});

test('Strict Mahabharata Capture (Tod) blocks Home ascent until capture, wrapping outer loop seamlessly', () => {
  // Without capture, step 73 + 5 wraps onto outer loop (7 + ((73 - 7 + 5) % 68) = 7 + 3 = 10)
  assert.equal(computeDestinationStep(73, 5, false), 10);

  // With capture unlocked, step 73 + 5 enters Home Column at step 78
  assert.equal(computeDestinationStep(73, 5, true), 78);

  // Exact throw required for Central Home (83): step 80 + 3 = 83 (legal), 80 + 5 = null (overshoot)
  assert.equal(computeDestinationStep(80, 3, true), 83);
  assert.equal(computeDestinationStep(80, 5, true), null);
});

test('Capture (Maar) cuts enemy piece to Tray, unlocks Home Column, and grants Bonus Roll', () => {
  let state = createInitialState(defaultConfig());
  // Place South piece at step 10 (r=16, c=10) and North piece at same square + 2 steps ahead (r=14, c=10 -> South step 12)
  // Find which North step corresponds to South step 12 (r=14, c=10)
  const targetCoord = PLAYER_PATHS.south[12];
  assert.equal(isSafeCoord(targetCoord), false, 'Target square must not be safe');
  const northStepAtTarget = PLAYER_PATHS.north.findIndex(
    (c, idx) => idx >= OUTER_LOOP_START && idx <= OUTER_LOOP_END && c.row === targetCoord.row && c.col === targetCoord.col
  );
  assert.ok(northStepAtTarget >= OUTER_LOOP_START);

  state = {
    ...state,
    pieces: state.pieces.map((p) => {
      if (p.id === 'south-0') return { ...p, step: 10 };
      if (p.id === 'north-0') return { ...p, step: northStepAtTarget };
      return p;
    }),
  };

  assert.equal(isHomeUnlocked(state, 'south'), false);

  state = applyDiceRoll(state, {
    tokens: [{ id: 'd0', value: 2, used: false }],
    display: { mode: 'kaudi', total: 2, isBonusRoll: false, wasTeenTrik: false },
  });

  const captureMove = getLegalMovesForDieSubset(state, [0]).find(
    (m) => m.pieceIds[0] === 'south-0'
  );
  assert.ok(captureMove);
  assert.equal(captureMove!.isCapture, true);
  assert.deepEqual(captureMove!.capturedPieceIds, ['north-0']);

  state = applyMove(state, captureMove!);
  // North-0 sent back to Tray (-1)
  assert.equal(state.pieces.find((p) => p.id === 'north-0')!.step, TRAY_STEP);
  // South Home Column unlocked!
  assert.equal(isHomeUnlocked(state, 'south'), true);
  // South gets immediate Bonus Roll!
  assert.equal(getCurrentPlayerId(state), 'south');
  assert.equal(state.turnPhase, 'awaiting_roll');
});

test('Jodi protects against single enemy piece, but enemy Jodi can cut Jodi using even roll / 2', () => {
  let state = createInitialState(defaultConfig());
  // Target non-safe square: South step 12
  const targetCoord = PLAYER_PATHS.south[12];
  const northStepAtTarget = PLAYER_PATHS.north.findIndex(
    (c, idx) => idx >= OUTER_LOOP_START && idx <= OUTER_LOOP_END && c.row === targetCoord.row && c.col === targetCoord.col
  );

  // Place North Jodi (2 pieces) at South step 12, and South Jodi (2 pieces) at South step 10 (2 squares behind)
  state = {
    ...state,
    pieces: state.pieces.map((p) => {
      if (p.id === 'south-0' || p.id === 'south-1') return { ...p, step: 10 };
      if (p.id === 'north-0' || p.id === 'north-1') return { ...p, step: northStepAtTarget };
      return p;
    }),
  };

  // Roll [2, 2] -> single die 2 CANNOT cut North's Jodi, but combined even roll 4 moves South's Jodi 2 squares to cut North's Jodi!
  state = applyDiceRoll(state, {
    tokens: [
      { id: 'd0', value: 2, used: false },
      { id: 'd1', value: 2, used: false },
    ],
    display: { mode: 'pashaka', pashakaFaces: [2, 2, 1], total: 5, isBonusRoll: false, wasTeenTrik: false },
  });

  // Single piece move with die 0 (value 2) must be blocked by North's Jodi
  const singleMoves = getLegalMovesForDieSubset(state, [0]);
  assert.equal(
    singleMoves.some((m) => !m.isJodiMove && m.pieceIds[0] === 'south-0' && m.toStep === 12),
    false,
    'Single piece must NOT be able to cut an opponent Jodi'
  );

  // Combined [0, 1] (sum = 4, even -> moves Jodi 2 steps to step 12) MUST be legal and capture BOTH North pieces!
  const combinedMoves = getLegalMovesForDieSubset(state, [0, 1]);
  const jodiStrike = combinedMoves.find((m) => m.isJodiMove && m.toStep === 12);
  assert.ok(jodiStrike, 'Jodi must be able to strike opponent Jodi with even roll / 2');
  assert.equal(jodiStrike!.isCapture, true);
  assert.equal(jodiStrike!.capturedPieceIds.length, 2);

  state = applyMove(state, jodiStrike!);
  assert.equal(state.pieces.find((p) => p.id === 'north-0')!.step, TRAY_STEP);
  assert.equal(state.pieces.find((p) => p.id === 'north-1')!.step, TRAY_STEP);
});

test('2v2 Jodidar mode lets finished player control their opposite partner pieces', () => {
  let state = createInitialState(defaultConfig({ mode: '2v2', humanArms: ['south'] }));
  // Put all 4 South pieces Home (step 83), leave North pieces in Tray
  state = {
    ...state,
    players: {
      ...state.players,
      south: { ...state.players.south, piecesHome: 4, hasCaptured: true },
    },
    pieces: state.pieces.map((p) => (p.owner === 'south' ? { ...p, step: HOME_STEP } : p)),
  };

  state = applyDiceRoll(state, {
    tokens: [{ id: 'd0', value: 5, used: false }],
    display: { mode: 'kaudi', total: 5, isBonusRoll: false, wasTeenTrik: false },
  });

  const moves = getAllLegalMoves(state);
  assert.ok(moves.length > 0);
  assert.equal(moves[0].pieceOwner, 'north', 'South should now control opposite partner North');
});

test('Shakuni AI prioritizes capturing an opponent over ordinary advance', () => {
  let state: GameState = createInitialState(defaultConfig({ humanArms: [] }));
  const targetCoord = PLAYER_PATHS.south[14];
  const northStepAtTarget = PLAYER_PATHS.north.findIndex(
    (c, idx) => idx >= OUTER_LOOP_START && idx <= OUTER_LOOP_END && c.row === targetCoord.row && c.col === targetCoord.col
  );

  state = {
    ...state,
    pieces: state.pieces.map((p) => {
      if (p.id === 'south-0') return { ...p, step: 9 };
      if (p.id === 'south-1') return { ...p, step: 20 };
      if (p.id === 'north-0') return { ...p, step: northStepAtTarget };
      return p;
    }),
  };

  state = applyDiceRoll(state, {
    tokens: [
      { id: 'd0', value: 5, used: false },
      { id: 'd1', value: 1, used: false },
    ],
    display: { mode: 'pashaka', pashakaFaces: [5, 1, 2], total: 8, isBonusRoll: false, wasTeenTrik: false },
  });

  const chosen = chooseAIMove(state, 'mastermind');
  assert.ok(chosen);
  assert.equal(chosen!.isCapture, true, 'Shakuni AI must pick the capturing move');
  assert.equal(chosen!.pieceIds[0], 'south-0');
});

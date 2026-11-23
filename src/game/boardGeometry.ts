import type { ArmId, GridCoord } from './types';

export const BOARD_SIZE = 19;
export const CENTER_COORD: GridCoord = { row: 9, col: 9 };
export const HOME_STEP = 83;
export const TRAY_STEP = -1;
export const OUTER_LOOP_START = 7;
export const OUTER_LOOP_END = 74;
export const OUTER_LOOP_LENGTH = 68; // indices 7..74 inclusive
export const HOME_COLUMN_ENTRY_STEP = 75;

export function coordKey(c: GridCoord): string {
  return `${c.row},${c.col}`;
}

export function coordsEqual(a: GridCoord, b: GridCoord): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Rotate a 19x19 grid coordinate 90 degrees ANTI-CLOCKWISE around (9, 9).
 * Visual check (screen coordinates: row increases downward, col increases rightward):
 * South (dr > 0, dc = 0) -> East (dr = 0, dc > 0): new_dr = -dc, new_dc = dr
 * East (dr = 0, dc > 0) -> North (dr < 0, dc = 0): new_dr = -dc, new_dc = dr
 * North (dr < 0, dc = 0) -> West (dr = 0, dc < 0): new_dr = -dc, new_dc = dr
 * West (dr = 0, dc < 0) -> South (dr > 0, dc = 0): new_dr = -dc, new_dc = dr
 */
export function rotateCCW90(c: GridCoord): GridCoord {
  const dr = c.row - 9;
  const dc = c.col - 9;
  return {
    row: 9 - dc,
    col: 9 + dr,
  };
}

function rotateCCWTimes(c: GridCoord, times: number): GridCoord {
  let curr = c;
  for (let i = 0; i < times; i++) {
    curr = rotateCCW90(curr);
  }
  return curr;
}

/**
 * Canonical 84-square deterministic path for South Arm (Player 1).
 * Step -1 = Royal Tray (Kosh).
 * Step 0..7   = Inner descent down South middle column (Row 1 -> Row 8 tip).
 * Step 8..15  = South Right column going UP toward center (Row 8 -> Row 1).
 * Step 16..23 = East Bottom row going OUTWARD (Row 1 -> Row 8).
 * Step 24     = East Tip (Row 8 middle).
 * Step 25..32 = East Top row going INWARD (Row 8 -> Row 1).
 * Step 33..40 = North Right column going OUTWARD (Row 1 -> Row 8).
 * Step 41     = North Tip (Row 8 middle).
 * Step 42..49 = North Left column going INWARD (Row 8 -> Row 1).
 * Step 50..57 = West Top row going OUTWARD (Row 1 -> Row 8).
 * Step 58     = West Tip (Row 8 middle).
 * Step 59..66 = West Bottom row going INWARD (Row 8 -> Row 1).
 * Step 67..74 = South Left column going OUTWARD (Row 1 -> Row 8).
 * Step 75..82 = Final Ascent UP South Middle Column (Row 8 -> Row 1).
 * Step 83     = Central Home (Chara / Meru) at (9, 9).
 */
function buildSouthPath(): GridCoord[] {
  const path: GridCoord[] = [];

  // 0..7: South center column descending outward (r=11..18, c=9)
  for (let r = 11; r <= 18; r++) path.push({ row: r, col: 9 });

  // 8..15: South right column going upward (r=18..11, c=10)
  for (let r = 18; r >= 11; r--) path.push({ row: r, col: 10 });

  // 16..23: East bottom row going outward (r=10, c=11..18)
  for (let c = 11; c <= 18; c++) path.push({ row: 10, col: c });

  // 24: East outer tip (r=9, c=18)
  path.push({ row: 9, col: 18 });

  // 25..32: East top row going inward (r=8, c=18..11)
  for (let c = 18; c >= 11; c--) path.push({ row: 8, col: c });

  // 33..40: North right column going outward (r=7..0, c=10)
  for (let r = 7; r >= 0; r--) path.push({ row: r, col: 10 });

  // 41: North outer tip (r=0, c=9)
  path.push({ row: 0, col: 9 });

  // 42..49: North left column going inward (r=0..7, c=8)
  for (let r = 0; r <= 7; r++) path.push({ row: r, col: 8 });

  // 50..57: West top row going outward (r=8, c=7..0)
  for (let c = 7; c >= 0; c--) path.push({ row: 8, col: c });

  // 58: West outer tip (r=9, c=0)
  path.push({ row: 9, col: 0 });

  // 59..66: West bottom row going inward (r=10, c=0..7)
  for (let c = 0; c <= 7; c++) path.push({ row: 10, col: c });

  // 67..74: South left column going outward (r=11..18, c=8)
  for (let r = 11; r <= 18; r++) path.push({ row: r, col: 8 });

  // 75..82: South center column ascending home (r=18..11, c=9)
  for (let r = 18; r >= 11; r--) path.push({ row: r, col: 9 });

  // 83: Central Home (Chara / Meru)
  path.push({ row: 9, col: 9 });

  return path;
}

const SOUTH_PATH = buildSouthPath();

export const PLAYER_PATHS: Record<ArmId, GridCoord[]> = {
  south: SOUTH_PATH,
  east: SOUTH_PATH.map((c) => rotateCCWTimes(c, 1)),
  north: SOUTH_PATH.map((c) => rotateCCWTimes(c, 2)),
  west: SOUTH_PATH.map((c) => rotateCCWTimes(c, 3)),
};

/**
 * Exact 12 Safe Squares (Charkoni / Phool):
 * On every arm:
 *  - Outer columns (left & right): Row 5 counting outward from center (4th from tip)
 *  - Center column (middle lane): Row 8 (outermost tip square)
 */
const SOUTH_SAFE_CELLS: GridCoord[] = [
  { row: 15, col: 8 },
  { row: 15, col: 10 },
  { row: 18, col: 9 },
];

export const SAFE_SQUARES: GridCoord[] = [
  ...SOUTH_SAFE_CELLS,
  ...SOUTH_SAFE_CELLS.map((c) => rotateCCWTimes(c, 1)),
  ...SOUTH_SAFE_CELLS.map((c) => rotateCCWTimes(c, 2)),
  ...SOUTH_SAFE_CELLS.map((c) => rotateCCWTimes(c, 3)),
];

export const SAFE_SQUARE_KEYS: ReadonlySet<string> = new Set(
  SAFE_SQUARES.map(coordKey)
);

export function isSafeCoord(c: GridCoord): boolean {
  return SAFE_SQUARE_KEYS.has(coordKey(c));
}

export function isCenterHomeArea(row: number, col: number): boolean {
  return row >= 8 && row <= 10 && col >= 8 && col <= 10;
}

export interface BoardCellMeta {
  row: number;
  col: number;
  arm: ArmId;
  isHomeLane: boolean;
  isSafe: boolean;
  isEntrySquare: boolean;
  /** 1..8 counting outward from center */
  outwardRow: number;
}

/**
 * All 96 outer arm cells (4 arms * 24 cells).
 */
export const ARM_CELLS: BoardCellMeta[] = (() => {
  const cells: BoardCellMeta[] = [];

  // South arm: rows 11..18, cols 8..10
  for (let row = 11; row <= 18; row++) {
    for (let col = 8; col <= 10; col++) {
      cells.push({
        row,
        col,
        arm: 'south',
        isHomeLane: col === 9,
        isSafe: isSafeCoord({ row, col }),
        isEntrySquare: row === 11 && col === 9,
        outwardRow: row - 10,
      });
    }
  }

  // East arm: rows 8..10, cols 11..18
  for (let row = 8; row <= 10; row++) {
    for (let col = 11; col <= 18; col++) {
      cells.push({
        row,
        col,
        arm: 'east',
        isHomeLane: row === 9,
        isSafe: isSafeCoord({ row, col }),
        isEntrySquare: row === 9 && col === 11,
        outwardRow: col - 10,
      });
    }
  }

  // North arm: rows 0..7, cols 8..10
  for (let row = 0; row <= 7; row++) {
    for (let col = 8; col <= 10; col++) {
      cells.push({
        row,
        col,
        arm: 'north',
        isHomeLane: col === 9,
        isSafe: isSafeCoord({ row, col }),
        isEntrySquare: row === 7 && col === 9,
        outwardRow: 8 - row,
      });
    }
  }

  // West arm: rows 8..10, cols 0..7
  for (let row = 8; row <= 10; row++) {
    for (let col = 0; col <= 7; col++) {
      cells.push({
        row,
        col,
        arm: 'west',
        isHomeLane: row === 9,
        isSafe: isSafeCoord({ row, col }),
        isEntrySquare: row === 9 && col === 7,
        outwardRow: 8 - col,
      });
    }
  }

  return cells;
})();

export function getPieceCoord(arm: ArmId, step: number): GridCoord | null {
  if (step < 0 || step >= PLAYER_PATHS[arm].length) return null;
  return PLAYER_PATHS[arm][step];
}

/**
 * Checks whether a given step is in the private home column or initial descent
 * where no opponent can ever step.
 * Note: Step 7 and Step 75 are the arm's outer tip (Row 8), which is a Safe Square anyway.
 */
export function isPrivateCenterLaneStep(step: number): boolean {
  return (step >= 0 && step <= 6) || (step >= 76 && step <= 82);
}

/**
 * Maps an arm's outer perimeter step (7..74) to a global anti-clockwise ring index (0..67),
 * useful for calculating exact threat distances between pieces of different players.
 */
const ARM_RING_OFFSET: Record<ArmId, number> = {
  south: 0,
  east: 17,
  north: 34,
  west: 51,
};

export function getGlobalOuterRingIndex(arm: ArmId, step: number): number | null {
  if (step < OUTER_LOOP_START || step > OUTER_LOOP_END) return null;
  const local = step - OUTER_LOOP_START; // 0..67
  return (local + ARM_RING_OFFSET[arm]) % OUTER_LOOP_LENGTH;
}

/**
 * Computes how many steps behind `target` the `attacker` is along the anti-clockwise outer ring.
 * Returns null if either piece is not on the shared outer ring.
 */
export function getOuterRingDistance(
  attackerArm: ArmId,
  attackerStep: number,
  targetArm: ArmId,
  targetStep: number
): number | null {
  const aIdx = getGlobalOuterRingIndex(attackerArm, attackerStep);
  const tIdx = getGlobalOuterRingIndex(targetArm, targetStep);
  if (aIdx === null || tIdx === null) return null;
  const dist = (tIdx - aIdx + OUTER_LOOP_LENGTH) % OUTER_LOOP_LENGTH;
  return dist === 0 ? OUTER_LOOP_LENGTH : dist;
}

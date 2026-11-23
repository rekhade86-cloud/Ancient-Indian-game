export type ArmId = 'south' | 'east' | 'north' | 'west';

export type GameMode = '1v1' | '2v2' | '4p';

export type Difficulty = 'novice' | 'tactician' | 'mastermind';

export type DiceMode = 'pashaka' | 'kaudi';

export type AppPhase = 'title' | 'playing' | 'paused' | 'gameover';

export type TurnPhase = 'awaiting_roll' | 'rolling' | 'awaiting_move' | 'turn_transition';

export interface GridCoord {
  row: number; // 0..18
  col: number; // 0..18
}

export interface PlayerPalette {
  primary: string;
  secondary: string;
  accent: string;
  clothFill: string;
  clothBorder: string;
  pieceTop: string;
  pieceBase: string;
  pieceRim: string;
  label: string;
}

export interface PlayerConfig {
  id: ArmId;
  name: string;
  house: string;
  teamId: 0 | 1 | 2 | 3;
  isAI: boolean;
  palette: PlayerPalette;
  hasCaptured: boolean;
  piecesHome: number;
}

export interface Goti {
  id: string; // e.g. 'south-0'
  owner: ArmId;
  index: number; // 0..3
  /**
   * -1 = In off-board Royal Tray (Kosh)
   * 0..6 = Descending own arm's center lane (Row 1..Row 7)
   * 7 = Own arm's outer tip (Row 8, Safe Square) — entry into outer perimeter
   * 8..74 = Anti-clockwise outer perimeter circuit across all 4 arms
   * 75 = Returned to own arm's outer tip (Row 8) ready to ascend Home Column
   * 76..82 = Ascending own arm's private Middle Column (Row 7..Row 1)
   * 83 = Central Home (Chara / Meru) — VICTORY for this piece
   */
  step: number;
}

export interface DieToken {
  id: string;
  value: number;
  used: boolean;
}

export interface LastRollDisplay {
  mode: DiceMode;
  /** For pashaka: 3 values from [1,2,5,6]. For kaudi: 6 booleans (true = mouth up). */
  pashakaFaces?: [number, number, number];
  kaudiShells?: boolean[];
  total: number;
  isBonusRoll: boolean;
  wasTeenTrik: boolean;
}

export interface LegalMove {
  id: string;
  /** The player whose pieces are being moved (usually currentPlayer, or partner in 2v2 Jodidar) */
  pieceOwner: ArmId;
  /** 1 piece ID for a single move, or 2 piece IDs for a Jodi Pair move */
  pieceIds: string[];
  isJodiMove: boolean;
  /** Indices into state.dice array that are consumed by this move */
  dieIndices: number[];
  /** Sum of consumed dice values */
  diceSum: number;
  /** Effective board squares advanced (diceSum for single, diceSum / 2 for Jodi) */
  stepsMoved: number;
  fromStep: number;
  toStep: number;
  destCoord: GridCoord;
  isCapture: boolean;
  capturedPieceIds: string[];
  landsOnSafe: boolean;
  formsJodi: boolean;
  reachesHome: boolean;
  entersFromTray: boolean;
}

export interface CommentaryEntry {
  id: string;
  turn: number;
  actor: ArmId | 'system';
  category: 'roll' | 'move' | 'capture' | 'jodi' | 'safe' | 'home' | 'bonus' | 'penalty' | 'victory';
  text: string;
  sanskritTag?: string;
}

export interface MatchStats {
  totalRolls: number;
  turnsTaken: number;
  capturesByPlayer: Record<ArmId, number>;
  jodisFormedByPlayer: Record<ArmId, number>;
  rollsByPlayer: Record<ArmId, number>;
}

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  diceMode: DiceMode;
  strictCaptureToHome: boolean;
  /** Allow local pass-and-play or solo vs Shakuni AI */
  humanArms: ArmId[];
}

export interface GameState {
  config: GameConfig;
  turnOrder: ArmId[];
  currentTurnIndex: number;
  turnNumber: number;
  turnPhase: TurnPhase;
  players: Record<ArmId, PlayerConfig>;
  pieces: Goti[];
  dice: DieToken[];
  lastRoll: LastRollDisplay | null;
  consecutiveBonusRolls: number;
  pendingBonusRoll: boolean;
  winnerTeamId: number | null;
  winnerArms: ArmId[];
  log: CommentaryEntry[];
  stats: MatchStats;
  /** Most recent dramatic board event for audio/visual feedback */
  lastEvent: {
    type: 'none' | 'roll' | 'move' | 'capture' | 'safe' | 'jodi' | 'home' | 'teen_trik' | 'victory';
    coord?: GridCoord;
    actor?: ArmId;
    seq: number;
  };
}

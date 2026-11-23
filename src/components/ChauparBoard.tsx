import React, { useMemo, useState } from 'react';
import {
  ARM_CELLS,
  BOARD_SIZE,
  HOME_STEP,
  PLAYER_PATHS,
  TRAY_STEP,
  coordKey,
  getPieceCoord,
} from '../game/boardGeometry';
import { getCurrentPlayerId, isHomeUnlocked } from '../game/engine';
import type { ArmId, GameState, Goti, LegalMove } from '../game/types';

const TABLE_BG_SRC = '/src/assets/images/sandalwood_table_1795439058673.jpg';

const CELL = 44; // SVG units per cell (19 * 44 = 836)
const PAD = 22;
const VIEW_SIZE = BOARD_SIZE * CELL + PAD * 2; // 880 x 880

function cellCenter(row: number, col: number): { x: number; y: number } {
  return {
    x: PAD + col * CELL + CELL / 2,
    y: PAD + row * CELL + CELL / 2,
  };
}

function cellOrigin(row: number, col: number): { x: number; y: number } {
  return {
    x: PAD + col * CELL,
    y: PAD + row * CELL,
  };
}

/** Quadrant Royal Tray ("Kosh") anchors in SVG coordinates */
const KOSH_BOXES: Record<ArmId, { x: number; y: number; w: number; h: number }> = {
  south: { x: PAD + 12 * CELL + 12, y: PAD + 12 * CELL + 16, w: 6.4 * CELL, h: 6.1 * CELL },
  east: { x: PAD + 12 * CELL + 12, y: PAD + 0.55 * CELL, w: 6.4 * CELL, h: 6.1 * CELL },
  north: { x: PAD + 0.55 * CELL, y: PAD + 0.55 * CELL, w: 6.4 * CELL, h: 6.1 * CELL },
  west: { x: PAD + 0.55 * CELL, y: PAD + 12 * CELL + 16, w: 6.4 * CELL, h: 6.1 * CELL },
};

interface ChauparBoardProps {
  state: GameState;
  activeMoves: LegalMove[];
  preferJodiMove: boolean;
  isHumanTurn: boolean;
  onExecuteMove: (move: LegalMove) => void;
}

export const ChauparBoard: React.FC<ChauparBoardProps> = ({
  state,
  activeMoves,
  preferJodiMove,
  isHumanTurn,
  onExecuteMove,
}) => {
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);
  const [tableImgFailed, setTableImgFailed] = useState(false);

  const currentPlayer = getCurrentPlayerId(state);

  // Map pieceId -> best matching LegalMove given preferJodiMove toggle
  const movableByPieceId = useMemo(() => {
    const map = new Map<string, LegalMove>();
    if (!isHumanTurn) return map;

    for (const move of activeMoves) {
      for (const pid of move.pieceIds) {
        const existing = map.get(pid);
        if (!existing) {
          map.set(pid, move);
        } else if (move.isJodiMove === preferJodiMove && existing.isJodiMove !== preferJodiMove) {
          map.set(pid, move);
        }
      }
    }
    return map;
  }, [activeMoves, preferJodiMove, isHumanTurn]);

  // Group active on-board pieces by coordinate key
  const boardGroups = useMemo(() => {
    const groups = new Map<string, Goti[]>();
    for (const p of state.pieces) {
      if (p.step === TRAY_STEP || p.step === HOME_STEP) continue;
      const coord = getPieceCoord(p.owner, p.step);
      if (!coord) continue;
      const key = coordKey(coord);
      const list = groups.get(key);
      if (list) list.push(p);
      else groups.set(key, [p]);
    }
    return groups;
  }, [state.pieces]);

  // Group tray pieces and home pieces by owner
  const trayPiecesByArm = useMemo(() => {
    const map: Record<ArmId, Goti[]> = { south: [], east: [], north: [], west: [] };
    for (const p of state.pieces) {
      if (p.step === TRAY_STEP) map[p.owner].push(p);
    }
    return map;
  }, [state.pieces]);

  const homePiecesByArm = useMemo(() => {
    const map: Record<ArmId, Goti[]> = { south: [], east: [], north: [], west: [] };
    for (const p of state.pieces) {
      if (p.step === HOME_STEP) map[p.owner].push(p);
    }
    return map;
  }, [state.pieces]);

  // Preview destination for hovered piece (or if only 1 movable piece exists, subtle indicator)
  const previewMove = useMemo(() => {
    if (hoveredPieceId && movableByPieceId.has(hoveredPieceId)) {
      return movableByPieceId.get(hoveredPieceId)!;
    }
    return null;
  }, [hoveredPieceId, movableByPieceId]);

  // Highlighted destination squares for ALL currently movable pieces
  const destinationHints = useMemo(() => {
    const unique = new Map<string, { row: number; col: number; isCapture: boolean; isHome: boolean; move: LegalMove }>();
    if (!isHumanTurn) return [];
    for (const move of activeMoves) {
      if (move.isJodiMove !== preferJodiMove) {
        // Only skip if another move for the same piece matches preferJodiMove
        const hasPreferred = activeMoves.some(
          (m) => m.isJodiMove === preferJodiMove && m.pieceIds.some((id) => move.pieceIds.includes(id))
        );
        if (hasPreferred) continue;
      }
      const key = coordKey(move.destCoord);
      if (!unique.has(key) || move.isCapture) {
        unique.set(key, {
          row: move.destCoord.row,
          col: move.destCoord.col,
          isCapture: move.isCapture,
          isHome: move.reachesHome,
          move,
        });
      }
    }
    return Array.from(unique.values());
  }, [activeMoves, preferJodiMove, isHumanTurn]);

  const getArmClothFill = (arm: ArmId, isHomeLane: boolean, row: number, col: number): string => {
    const palette = state.players[arm]?.palette;
    const isAlt = (row + col) % 2 === 0;
    if (isHomeLane) {
      // Richer dyed royal silk along the center lane of each arm
      return palette ? palette.clothFill : '#4c141c';
    }
    // Warm embroidered ivory-sandstone / antique woven silk for outer perimeter squares
    return isAlt ? '#2c1913' : '#24140f';
  };

  const renderGoti = (
    piece: Goti,
    cx: number,
    cy: number,
    scale: number,
    isPartOfJodi: boolean,
    labelSuffix: string
  ) => {
    const palette = state.players[piece.owner].palette;
    const legalMove = movableByPieceId.get(piece.id);
    const isMovable = Boolean(legalMove);
    const isAscending = piece.step >= 75 && piece.step < HOME_STEP;
    const r = 15 * scale;

    const handleTrigger = () => {
      if (legalMove) {
        setHoveredPieceId(null);
        onExecuteMove(legalMove);
      }
    };

    return (
      <g
        key={piece.id}
        transform={`translate(${cx}, ${cy})`}
        onClick={handleTrigger}
        onKeyDown={(e) => {
          if (legalMove && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleTrigger();
          }
        }}
        onMouseEnter={() => isMovable && setHoveredPieceId(piece.id)}
        onMouseLeave={() => setHoveredPieceId(null)}
        role={isMovable ? 'button' : undefined}
        tabIndex={isMovable ? 0 : undefined}
        aria-label={
          isMovable
            ? `${legalMove!.isJodiMove ? 'Move Jodi pair' : legalMove!.entersFromTray ? 'Deploy' : 'Move'} ${state.players[piece.owner].name} Goti ${piece.index + 1} ${legalMove!.stepsMoved} steps${legalMove!.isCapture ? ' to capture opponent' : ''}${labelSuffix}`
            : undefined
        }
        className={isMovable ? 'cursor-pointer focus:outline-none' : 'pointer-events-none'}
      >
        {/* Generous invisible touch target on mobile */}
        {isMovable && <circle cx={0} cy={0} r={24 * Math.max(scale, 0.9)} fill="transparent" />}

        {/* Glowing Aura Ring when valid move is available */}
        {isMovable && (
          <g className="animate-aura">
            <circle
              cx={0}
              cy={0}
              r={r + 5.5}
              fill="none"
              stroke={legalMove!.isCapture ? '#ff6b6b' : '#f7d86e'}
              strokeWidth="2.8"
              strokeDasharray={legalMove!.isJodiMove ? '5 3' : undefined}
            />
            <circle
              cx={0}
              cy={0}
              r={r + 2.5}
              fill={legalMove!.isCapture ? 'rgba(239,68,68,0.22)' : 'rgba(247,216,110,0.2)'}
            />
          </g>
        )}

        {/* Ground drop shadow */}
        <ellipse cx={2} cy={4} rx={r * 0.96} ry={r * 0.85} fill="rgba(0,0,0,0.58)" />

        {/* Conical Wooden/Ivory Goti Body with Metallic Gold Rim */}
        <circle
          cx={0}
          cy={0}
          r={r}
          fill={palette.pieceBase}
          stroke={palette.pieceRim}
          strokeWidth={isPartOfJodi ? 2.4 : 1.9}
        />
        {/* Sculpted 3D inner cone shade */}
        <circle
          cx={-r * 0.14}
          cy={-r * 0.14}
          r={r * 0.74}
          fill={palette.pieceTop}
        />
        {/* Specular wood sheen highlight */}
        <ellipse
          cx={-r * 0.28}
          cy={-r * 0.3}
          rx={r * 0.32}
          ry={r * 0.2}
          fill="rgba(255,248,225,0.34)"
          transform="rotate(-25)"
        />
        {/* Turned ivory/gold finial knob at the apex */}
        <circle
          cx={0}
          cy={0}
          r={r * 0.34}
          fill={isAscending ? '#f7e199' : palette.pieceRim}
          stroke="#1c0f0a"
          strokeWidth="1"
        />
        <circle cx={-r * 0.08} cy={-r * 0.08} r={r * 0.13} fill="#fff9e6" />

        {/* Subtle Home-bound chevron badge if ascending final lane */}
        {isAscending && (
          <circle
            cx={r * 0.75}
            cy={-r * 0.75}
            r={4.2}
            fill="#10b981"
            stroke="#fff"
            strokeWidth="1"
          />
        )}
      </g>
    );
  };

  return (
    <div
      data-testid="chaupar-board-stage"
      className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-[#1a0f0a] shadow-2xl select-none"
    >
      {/* Carved Dark Sandalwood Tabletop Backdrop */}
      {!tableImgFailed ? (
        <img
          src={TABLE_BG_SRC}
          alt="Carved antique sandalwood palace tabletop"
          referrerPolicy="no-referrer"
          onError={() => setTableImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-radial from-[#361f15] via-[#1c100b] to-[#0f0805] pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-radial from-transparent via-[#120a07]/25 to-[#0b0604]/75 pointer-events-none" />

      {/* Cruciform Embroidered Silk Chaupar Board SVG */}
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="relative z-10 w-full h-full max-w-full max-h-full aspect-square drop-shadow-[0_14px_30px_rgba(0,0,0,0.85)]"
        role="region"
        aria-label="Chaupar Royal Game Board"
      >
        <defs>
          {/* Gold Zari Thread Gradient */}
          <linearGradient id="zariGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8e39e" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#9d731a" />
          </linearGradient>

          {/* Silk Backing Shadow */}
          <filter id="clothDrop" x="-8%" y="-8%" width="116%" height="116%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.65" />
          </filter>

          {/* Subtle Diagonal Brocade Pattern */}
          <pattern id="silkWeave" width="12" height="12" patternUnits="userSpaceOnUse">
            <path
              d="M0 6 L6 0 L12 6 L6 12 Z"
              fill="none"
              stroke="#d4af37"
              strokeOpacity="0.06"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>

        {/* Cruciform Embroidered Silk Cloth Backing Silhouette */}
        <g filter="url(#clothDrop)">
          {/* Vertical Cloth Band (North + Center + South) */}
          <rect
            x={PAD + 8 * CELL - 7}
            y={PAD - 7}
            width={3 * CELL + 14}
            height={19 * CELL + 14}
            rx={10}
            fill="#1f100b"
            stroke="url(#zariGold)"
            strokeWidth="3"
          />
          {/* Horizontal Cloth Band (West + Center + East) */}
          <rect
            x={PAD - 7}
            y={PAD + 8 * CELL - 7}
            width={19 * CELL + 14}
            height={3 * CELL + 14}
            rx={10}
            fill="#1f100b"
            stroke="url(#zariGold)"
            strokeWidth="3"
          />
        </g>

        {/* Render all 96 Arm Squares */}
        {ARM_CELLS.map((cell) => {
          const { x, y } = cellOrigin(cell.row, cell.col);
          const { x: cx, y: cy } = cellCenter(cell.row, cell.col);
          const fill = getArmClothFill(cell.arm, cell.isHomeLane, cell.row, cell.col);
          const isCurrentArmEntry =
            cell.isEntrySquare &&
            cell.arm === currentPlayer &&
            isHumanTurn &&
            activeMoves.some((m) => m.entersFromTray);

          return (
            <g key={`cell-${cell.row}-${cell.col}`}>
              <rect
                x={x + 0.5}
                y={y + 0.5}
                width={CELL - 1}
                height={CELL - 1}
                fill={fill}
                stroke="#d4af37"
                strokeOpacity={cell.isSafe ? 0.8 : 0.36}
                strokeWidth={cell.isSafe ? 1.5 : 0.9}
              />
              <rect
                x={x + 0.5}
                y={y + 0.5}
                width={CELL - 1}
                height={CELL - 1}
                fill="url(#silkWeave)"
              />

              {/* Highlight Entry Square when deploying from Kosh */}
              {isCurrentArmEntry && (
                <rect
                  x={x + 3}
                  y={y + 3}
                  width={CELL - 6}
                  height={CELL - 6}
                  rx={4}
                  fill="rgba(247, 216, 110, 0.16)"
                  stroke="#f7d86e"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                />
              )}

              {/* Ornate Embroidered Safe Square (Charkoni / Phool) Lotus + Cross "X" */}
              {cell.isSafe && (
                <g transform={`translate(${cx}, ${cy})`} opacity="0.92">
                  {/* Diagonal Charkoni Cross ("X") */}
                  <line
                    x1={-15}
                    y1={-15}
                    x2={15}
                    y2={15}
                    stroke="#e8c55a"
                    strokeWidth="1.5"
                    strokeOpacity="0.72"
                  />
                  <line
                    x1={15}
                    y1={-15}
                    x2={-15}
                    y2={15}
                    stroke="#e8c55a"
                    strokeWidth="1.5"
                    strokeOpacity="0.72"
                  />
                  {/* Embroidered 4-petal lotus flower */}
                  <path
                    d="M0 -13 C4 -6 4 -3 0 0 C-4 -3 -4 -6 0 -13 Z M0 13 C4 6 4 3 0 0 C-4 3 -4 6 0 13 Z M-13 0 C-6 -4 -3 -4 0 0 C-3 4 -6 4 -13 0 Z M13 0 C6 -4 3 -4 0 0 C3 4 6 4 13 0 Z"
                    fill="#d4af37"
                    fillOpacity="0.34"
                    stroke="#f7e199"
                    strokeWidth="1"
                  />
                  <circle cx={0} cy={0} r={3.2} fill="#f7e199" />
                </g>
              )}

              {/* Subtle Home Column directional arrow */}
              {cell.isHomeLane && cell.outwardRow === 3 && (
                <g transform={`translate(${cx}, ${cy})`} opacity="0.45">
                  {cell.arm === 'south' && (
                    <path d="M-6 4 L0 -4 L6 4" fill="none" stroke="#f7e199" strokeWidth="1.6" strokeLinecap="round" />
                  )}
                  {cell.arm === 'north' && (
                    <path d="M-6 -4 L0 4 L6 -4" fill="none" stroke="#f7e199" strokeWidth="1.6" strokeLinecap="round" />
                  )}
                  {cell.arm === 'east' && (
                    <path d="M4 -6 L-4 0 L4 6" fill="none" stroke="#f7e199" strokeWidth="1.6" strokeLinecap="round" />
                  )}
                  {cell.arm === 'west' && (
                    <path d="M-4 -6 L4 0 L-4 6" fill="none" stroke="#f7e199" strokeWidth="1.6" strokeLinecap="round" />
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Central Square: CHARA / MERU (HOME) — 3x3 Center Block (cols 8..10, rows 8..10) */}
        <g>
          <rect
            x={PAD + 8 * CELL}
            y={PAD + 8 * CELL}
            width={3 * CELL}
            height={3 * CELL}
            fill="#160c08"
            stroke="url(#zariGold)"
            strokeWidth="3"
          />
          {/* Inner decorative silk border */}
          <rect
            x={PAD + 8 * CELL + 6}
            y={PAD + 8 * CELL + 6}
            width={3 * CELL - 12}
            height={3 * CELL - 12}
            fill="#24120d"
            stroke="#d4af37"
            strokeOpacity="0.6"
            strokeWidth="1.2"
          />
          {/* Colored Triangular Home Gateways pointing into Meru */}
          <polygon
            points={`${PAD + 8 * CELL + 6},${PAD + 11 * CELL - 6} ${PAD + 11 * CELL - 6},${PAD + 11 * CELL - 6} ${PAD + 9.5 * CELL},${PAD + 9.5 * CELL}`}
            fill={state.players.south.palette.clothFill}
            fillOpacity="0.65"
          />
          <polygon
            points={`${PAD + 11 * CELL - 6},${PAD + 8 * CELL + 6} ${PAD + 11 * CELL - 6},${PAD + 11 * CELL - 6} ${PAD + 9.5 * CELL},${PAD + 9.5 * CELL}`}
            fill={state.players.east.palette.clothFill}
            fillOpacity="0.65"
          />
          <polygon
            points={`${PAD + 8 * CELL + 6},${PAD + 8 * CELL + 6} ${PAD + 11 * CELL - 6},${PAD + 8 * CELL + 6} ${PAD + 9.5 * CELL},${PAD + 9.5 * CELL}`}
            fill={state.players.north.palette.clothFill}
            fillOpacity="0.65"
          />
          <polygon
            points={`${PAD + 8 * CELL + 6},${PAD + 8 * CELL + 6} ${PAD + 8 * CELL + 6},${PAD + 11 * CELL - 6} ${PAD + 9.5 * CELL},${PAD + 9.5 * CELL}`}
            fill={state.players.west.palette.clothFill}
            fillOpacity="0.65"
          />

          {/* 8-Petal Golden Meru Mandala */}
          <g transform={`translate(${PAD + 9.5 * CELL}, ${PAD + 9.5 * CELL})`}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <path
                key={deg}
                d="M0 -30 C7 -16 7 -7 0 0 C-7 -7 -7 -16 0 -30 Z"
                fill="url(#zariGold)"
                fillOpacity="0.55"
                stroke="#f7e199"
                strokeWidth="0.9"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx={0} cy={0} r={17} fill="#1b0e09" stroke="url(#zariGold)" strokeWidth="2" />
            <text
              x={0}
              y={-1}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#f7e199"
              fontFamily="Cinzel, Georgia, serif"
              fontWeight="700"
              fontSize="9.5"
              letterSpacing="1.2"
            >
              MERU
            </text>
          </g>

          {/* Render Home-arrived Gotis neatly tucked inside their own Meru triangle */}
          {state.turnOrder.map((arm) => {
            const arrived = homePiecesByArm[arm];
            if (arrived.length === 0) return null;
            return arrived.map((p, idx) => {
              const offset = (idx - (arrived.length - 1) / 2) * 18;
              const centerX = PAD + 9.5 * CELL;
              const centerY = PAD + 9.5 * CELL;
              let gx = centerX;
              let gy = centerY;
              if (arm === 'south') {
                gx = centerX + offset;
                gy = centerY + 44;
              } else if (arm === 'north') {
                gx = centerX + offset;
                gy = centerY - 44;
              } else if (arm === 'east') {
                gx = centerX + 44;
                gy = centerY + offset;
              } else {
                gx = centerX - 44;
                gy = centerY + offset;
              }
              return renderGoti(p, gx, gy, 0.62, false, ' (Home)');
            });
          })}
        </g>

        {/* Anti-clockwise corner flow chevrons at inner corners */}
        {[
          { x: PAD + 11.05 * CELL, y: PAD + 11.05 * CELL, rot: -45 },
          { x: PAD + 11.05 * CELL, y: PAD + 7.95 * CELL, rot: -135 },
          { x: PAD + 7.95 * CELL, y: PAD + 7.95 * CELL, rot: 135 },
          { x: PAD + 7.95 * CELL, y: PAD + 11.05 * CELL, rot: 45 },
        ].map((corner, i) => (
          <g key={i} transform={`translate(${corner.x}, ${corner.y}) rotate(${corner.rot})`} opacity="0.65">
            <path d="M-5 4 L0 -4 L5 4" fill="none" stroke="#f5d061" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        ))}

        {/* 4 Quadrant Royal Trays ("Kosh") for inactive Gotis */}
        {(['south', 'east', 'north', 'west'] as ArmId[]).map((arm) => {
          const box = KOSH_BOXES[arm];
          const isActiveInMode = state.turnOrder.includes(arm);
          const player = state.players[arm];
          const isTurn = arm === currentPlayer;
          const unlocked = isHomeUnlocked(state, arm);
          const trayPieces = trayPiecesByArm[arm];

          if (!isActiveInMode) {
            // Ornate subtle brass medallion for unused quadrant in 1v1 mode
            return (
              <g key={`kosh-decor-${arm}`} opacity="0.38">
                <rect
                  x={box.x + 26}
                  y={box.y + 26}
                  width={box.w - 52}
                  height={box.h - 52}
                  rx={16}
                  fill="rgba(22, 12, 8, 0.45)"
                  stroke="#d4af37"
                  strokeOpacity="0.35"
                  strokeWidth="1.2"
                />
                <circle
                  cx={box.x + box.w / 2}
                  cy={box.y + box.h / 2}
                  r={34}
                  fill="none"
                  stroke="#d4af37"
                  strokeOpacity="0.4"
                  strokeWidth="1.2"
                  strokeDasharray="3 4"
                />
                <text
                  x={box.x + box.w / 2}
                  y={box.y + box.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#d4af37"
                  fillOpacity="0.55"
                  fontFamily="Cinzel, Georgia, serif"
                  fontSize="11"
                  letterSpacing="2"
                >
                  CHAUPAR
                </text>
              </g>
            );
          }

          return (
            <g key={`kosh-${arm}`}>
              {/* Carved Sandalwood Kosh Frame */}
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx={16}
                fill={isTurn ? 'rgba(38, 20, 14, 0.94)' : 'rgba(24, 13, 9, 0.86)'}
                stroke={isTurn ? '#f7d86e' : player.palette.clothBorder}
                strokeOpacity={isTurn ? 0.95 : 0.48}
                strokeWidth={isTurn ? 2.6 : 1.5}
              />

              {/* Subtle colored silk header band inside Kosh */}
              <rect
                x={box.x + 8}
                y={box.y + 8}
                width={box.w - 16}
                height={42}
                rx={10}
                fill={player.palette.clothFill}
                fillOpacity="0.88"
                stroke={player.palette.secondary}
                strokeOpacity="0.4"
                strokeWidth="1"
              />

              {/* Player House Name */}
              <text
                x={box.x + box.w / 2}
                y={box.y + 24}
                textAnchor="middle"
                fill="#fff5dc"
                fontFamily="Cinzel, Georgia, serif"
                fontWeight="700"
                fontSize="12.5"
              >
                {player.name}
              </text>

              {/* Home Lock / Unlock Status Text */}
              <text
                x={box.x + box.w / 2}
                y={box.y + 41}
                textAnchor="middle"
                fill={unlocked ? '#86efac' : '#fde68a'}
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
                fontSize="10"
              >
                {unlocked ? 'Home Unlocked' : 'Locked · Capture 1'}
              </text>

              {/* 4 Circular Goti Sockets inside Kosh */}
              {[0, 1, 2, 3].map((slotIdx) => {
                const colIdx = slotIdx % 2;
                const rowIdx = Math.floor(slotIdx / 2);
                const sx = box.x + box.w * (colIdx === 0 ? 0.32 : 0.68);
                const sy = box.y + 92 + rowIdx * 66;
                const piece = trayPieces[slotIdx];

                return (
                  <g key={`slot-${arm}-${slotIdx}`}>
                    <circle
                      cx={sx}
                      cy={sy}
                      r={20}
                      fill="rgba(10, 5, 3, 0.55)"
                      stroke="#d4af37"
                      strokeOpacity="0.28"
                      strokeWidth="1.2"
                    />
                    {piece && renderGoti(piece, sx, sy, 1.04, false, ' from Royal Kosh')}
                  </g>
                );
              })}

              {/* Bottom Kosh caption */}
              <text
                x={box.x + box.w / 2}
                y={box.y + box.h - 14}
                textAnchor="middle"
                fill="#c8b28e"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="10.5"
              >
                Kosh ({trayPieces.length}) · Home ({player.piecesHome}/4)
              </text>
            </g>
          );
        })}

        {/* Highlight Destination Targets for Active Selected Dice */}
        {destinationHints.map((hint) => {
          const { x, y } = cellCenter(hint.row, hint.col);
          const isHoveredTarget =
            previewMove &&
            previewMove.destCoord.row === hint.row &&
            previewMove.destCoord.col === hint.col;
          return (
            <g
              key={`dest-${hint.row}-${hint.col}`}
              transform={`translate(${x}, ${y})`}
              onClick={() => onExecuteMove(hint.move)}
              className="cursor-pointer"
            >
              <circle
                cx={0}
                cy={0}
                r={isHoveredTarget ? 18 : 13}
                fill={hint.isCapture ? 'rgba(239, 68, 68, 0.28)' : 'rgba(247, 216, 110, 0.22)'}
                stroke={hint.isCapture ? '#ff6b6b' : '#f7d86e'}
                strokeWidth={isHoveredTarget ? 2.6 : 1.8}
                strokeDasharray="4 3"
              />
              {hint.isCapture && (
                <text
                  x={0}
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fecaca"
                  fontFamily="Cinzel, Georgia, serif"
                  fontWeight="800"
                  fontSize="10"
                >
                  CUT
                </text>
              )}
            </g>
          );
        })}

        {/* Render Active On-Board Gotis & Jodi Pairs */}
        {Array.from(boardGroups.entries()).map(([key, group]) => {
          const [rStr, cStr] = key.split(',');
          const { x: cx, y: cy } = cellCenter(Number(rStr), Number(cStr));

          // Detect if any owner has a Jodi (>= 2 pieces at same step) on this square
          const byOwner = new Map<ArmId, Goti[]>();
          for (const p of group) {
            const list = byOwner.get(p.owner) ?? [];
            list.push(p);
            byOwner.set(p.owner, list);
          }

          // Compute clean layout offsets when multiple Gotis share a cell
          const count = group.length;
          const offsets: Array<[number, number, number]> =
            count === 1
              ? [[0, 0, 1.0]]
              : count === 2
                ? [
                    [-8.5, 0, 0.84],
                    [8.5, 0, 0.84],
                  ]
                : count === 3
                  ? [
                      [0, -8, 0.74],
                      [-9, 7, 0.74],
                      [9, 7, 0.74],
                    ]
                  : [
                      [-8.5, -8.5, 0.68],
                      [8.5, -8.5, 0.68],
                      [-8.5, 8.5, 0.68],
                      [8.5, 8.5, 0.68],
                    ];

          const hasJodi = Array.from(byOwner.values()).some((list) => list.length >= 2);

          return (
            <g key={`group-${key}`}>
              {/* Golden Jodi Twin-Guard Shield Halo behind paired pieces */}
              {hasJodi && (
                <g transform={`translate(${cx}, ${cy})`}>
                  <rect
                    x={-19}
                    y={-15}
                    width={38}
                    height={30}
                    rx={14}
                    fill="rgba(212, 175, 55, 0.16)"
                    stroke="#f5d061"
                    strokeWidth="1.8"
                  />
                  <rect
                    x={-10}
                    y={-22}
                    width={20}
                    height={11}
                    rx={4}
                    fill="#1a0f0a"
                    stroke="#f5d061"
                    strokeWidth="1"
                  />
                  <text
                    x={0}
                    y={-16}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#f7e199"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    fontSize="7.5"
                  >
                    JODI
                  </text>
                </g>
              )}

              {group.map((piece, idx) => {
                const [ox, oy, sc] = offsets[Math.min(idx, offsets.length - 1)];
                const isJodi = (byOwner.get(piece.owner)?.length ?? 0) >= 2;
                return renderGoti(piece, cx + ox, cy + oy, sc, isJodi, '');
              })}
            </g>
          );
        })}

        {/* Path preview line when hovering a movable piece */}
        {previewMove && previewMove.fromStep >= 0 && (
          (() => {
            const fromCoord = PLAYER_PATHS[previewMove.pieceOwner][previewMove.fromStep];
            const a = cellCenter(fromCoord.row, fromCoord.col);
            const b = cellCenter(previewMove.destCoord.row, previewMove.destCoord.col);
            return (
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={previewMove.isCapture ? '#ff6b6b' : '#f7d86e'}
                strokeWidth="2.4"
                strokeDasharray="5 4"
                strokeLinecap="round"
                className="pointer-events-none"
              />
            );
          })()
        )}
      </svg>
    </div>
  );
};

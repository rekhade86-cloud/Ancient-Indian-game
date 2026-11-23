import React from 'react';
import { Layers, Shield, Sparkles } from 'lucide-react';
import { getCurrentPlayerId, getPlayerJodis } from '../game/engine';
import type { GameState } from '../game/types';

interface DiceTrayProps {
  state: GameState;
  isRolling: boolean;
  isHumanTurn: boolean;
  selectedDieIndices: number[];
  combineMode: boolean;
  preferJodiMove: boolean;
  hasValidJodiMove: boolean;
  onRoll: () => void;
  onSelectDie: (index: number) => void;
  onToggleCombineMode: () => void;
  onTogglePreferJodi: () => void;
  onToggleDiceMode: () => void;
}

/**
 * Renders one rectangular 4-sided ancient Indian Pashaka ivory stick die
 * with authentic engraved crimson/gold dots for 1, 2, 5, and 6.
 */
const PashakaStickSVG: React.FC<{
  value: number;
  used: boolean;
  selected: boolean;
  rolling: boolean;
  delayMs: number;
}> = ({ value, used, selected, rolling, delayMs }) => {
  const dotPositions: Record<number, Array<[number, number]>> = {
    1: [[60, 18]],
    2: [
      [34, 18],
      [86, 18],
    ],
    5: [
      [24, 12],
      [24, 24],
      [60, 18],
      [96, 12],
      [96, 24],
    ],
    6: [
      [26, 12],
      [26, 24],
      [60, 12],
      [60, 24],
      [94, 12],
      [94, 24],
    ],
  };

  const dots = dotPositions[value] ?? dotPositions[1];

  return (
    <svg
      viewBox="0 0 120 36"
      className={`w-full h-7 sm:h-8 transition-opacity ${rolling ? 'animate-pashaka' : ''} ${
        used ? 'opacity-35' : 'opacity-100'
      }`}
      style={rolling ? { animationDelay: `${delayMs}ms` } : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`ivory-${value}-${selected ? 's' : 'n'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff9eb" />
          <stop offset="55%" stopColor="#efe1be" />
          <stop offset="100%" stopColor="#c9b385" />
        </linearGradient>
      </defs>
      {/* Stick bevel shadow */}
      <rect x="3" y="5" width="114" height="29" rx="5" fill="rgba(0,0,0,0.55)" />
      {/* Rectangular ivory body */}
      <rect
        x="2"
        y="2"
        width="116"
        height="30"
        rx="5"
        fill={`url(#ivory-${value}-${selected ? 's' : 'n'})`}
        stroke={selected ? '#f7d86e' : '#8b6f3d'}
        strokeWidth={selected ? '2.4' : '1.4'}
      />
      {/* Traditional engraved decorative gold end bands */}
      <line x1="12" y1="4" x2="12" y2="30" stroke="#9e7b31" strokeWidth="1.2" strokeOpacity="0.65" />
      <line x1="108" y1="4" x2="108" y2="30" stroke="#9e7b31" strokeWidth="1.2" strokeOpacity="0.65" />
      {/* Engraved crimson/ebony pip dots */}
      {dots.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="4.1" fill="#7c0a0a" />
          <circle cx={cx} cy={cy} r="1.6" fill="#d4af37" />
        </g>
      ))}
    </svg>
  );
};

/**
 * Renders one sculptural Cowrie shell (Kaudi) — mouth-up (slotted ivory) or mouth-down (smooth dome).
 */
const CowrieShellSVG: React.FC<{ mouthUp: boolean; rolling: boolean; delayMs: number }> = ({
  mouthUp,
  rolling,
  delayMs,
}) => (
  <svg
    viewBox="0 0 36 44"
    className={`w-7 h-8 sm:w-8 sm:h-9 ${rolling ? 'animate-pashaka' : ''}`}
    style={rolling ? { animationDelay: `${delayMs}ms` } : undefined}
    aria-hidden="true"
  >
    <ellipse cx="19" cy="24" rx="12" ry="16" fill="rgba(0,0,0,0.45)" />
    <ellipse
      cx="18"
      cy="22"
      rx="12"
      ry="16"
      fill={mouthUp ? '#fdf5df' : '#d8c298'}
      stroke="#8d6f3b"
      strokeWidth="1.4"
    />
    {mouthUp ? (
      <>
        <path d="M18 9 C15 16 15 28 18 35 C21 28 21 16 18 9 Z" fill="#431a0d" />
        <line x1="14" y1="15" x2="22" y2="15" stroke="#b89860" strokeWidth="1" />
        <line x1="13.5" y1="22" x2="22.5" y2="22" stroke="#b89860" strokeWidth="1" />
        <line x1="14" y1="29" x2="22" y2="29" stroke="#b89860" strokeWidth="1" />
      </>
    ) : (
      <ellipse cx="15" cy="17" rx="4.5" ry="7" fill="rgba(255,252,240,0.4)" transform="rotate(-15 15 17)" />
    )}
  </svg>
);

export const DiceTray: React.FC<DiceTrayProps> = ({
  state,
  isRolling,
  isHumanTurn,
  selectedDieIndices,
  combineMode,
  preferJodiMove,
  hasValidJodiMove,
  onRoll,
  onSelectDie,
  onToggleCombineMode,
  onTogglePreferJodi,
  onToggleDiceMode,
}) => {
  const currentPlayer = getCurrentPlayerId(state);
  const player = state.players[currentPlayer];
  const canRoll = isHumanTurn && state.turnPhase === 'awaiting_roll' && !isRolling && state.winnerTeamId === null;
  const unusedCount = state.dice.filter((d) => !d.used).length;
  const selectedSum = selectedDieIndices.reduce((acc, idx) => acc + (state.dice[idx]?.value ?? 0), 0);
  const hasOwnJodi = getPlayerJodis(state.pieces, currentPlayer).length > 0;

  const displayFaces = state.lastRoll?.pashakaFaces ?? [6, 5, 1];
  const displayShells = state.lastRoll?.kaudiShells ?? [true, false, true, false, true, false];

  return (
    <section
      aria-label="Dice Tray and Move Allocation"
      className="rounded-2xl border border-[#d4af37]/35 bg-[#1b0f0b] p-3 lg:p-4 shadow-xl flex flex-col gap-2.5 lg:gap-3.5"
    >
      {/* Header row (Desktop detailed, Mobile ultra-compact) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display text-xs sm:text-sm font-bold text-[#f7e199] whitespace-nowrap">
            {state.config.diceMode === 'pashaka' ? 'Aksha · Pashaka' : 'Kaudi · Cowries'}
          </span>
          {state.lastRoll && (
            <span className="font-mono-num text-xs text-[#cbb89a] whitespace-nowrap">
              · Sum {state.lastRoll.total}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleDiceMode}
          disabled={state.turnPhase === 'awaiting_move' || isRolling}
          aria-label="Switch between 3 Pashaka stick dice and 6 Cowrie shells"
          className="text-[11px] font-medium text-[#d4af37] hover:text-[#f7e199] disabled:opacity-40 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed px-1.5 py-1"
        >
          Switch to {state.config.diceMode === 'pashaka' ? 'Cowries' : 'Pashaka'}
        </button>
      </div>

      {/* Velvet Dice Surface + Roll Action (Horizontal on Mobile for thumb reach, Vertical on Desktop) */}
      <div className="flex flex-row lg:flex-col items-center gap-2.5 lg:gap-3">
        {/* Royal Crimson Velvet Tray */}
        <div
          data-testid="velvet-dice-tray"
          className="flex-1 w-full rounded-xl border border-[#d4af37]/40 bg-gradient-to-br from-[#3a0d14] via-[#28080e] to-[#1a0509] p-2.5 lg:p-3.5 shadow-inner"
        >
          {state.config.diceMode === 'pashaka' ? (
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-1.5 lg:gap-2">
              {displayFaces.map((face, i) => (
                <PashakaStickSVG
                  key={i}
                  value={face}
                  used={Boolean(state.dice[i]?.used)}
                  selected={selectedDieIndices.includes(i)}
                  rolling={isRolling}
                  delayMs={i * 55}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-6 lg:grid-cols-3 gap-1.5 place-items-center py-0.5">
              {displayShells.map((up, i) => (
                <CowrieShellSVG key={i} mouthUp={up} rolling={isRolling} delayMs={i * 35} />
              ))}
            </div>
          )}

          {state.lastRoll?.wasTeenTrik && (
            <div className="mt-2 text-center text-[11px] font-semibold text-amber-300">
              Teen-Trik! 3rd Bonus Voided
            </div>
          )}
          {state.lastRoll?.isBonusRoll && !state.lastRoll.wasTeenTrik && state.turnPhase === 'awaiting_move' && (
            <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#f7e199]">
              <Sparkles className="w-3 h-3 text-[#f5d061]" />
              <span>Punah-Daav · Bonus Roll Earned</span>
            </div>
          )}
        </div>

        {/* Primary Roll Dice CTA (48px+ Thumb Target) */}
        <button
          type="button"
          onClick={onRoll}
          disabled={!canRoll}
          aria-label={
            canRoll
              ? `Cast ${state.config.diceMode === 'pashaka' ? 'Pashaka' : 'Kaudi'} dice`
              : isHumanTurn
                ? 'Select a piece to move'
                : `${player.name} is playing`
          }
          className={`shrink-0 lg:w-full min-h-[52px] min-w-[116px] px-4 py-2.5 rounded-xl font-display text-xs sm:text-sm font-bold tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[#f5d061] ${
            canRoll
              ? 'bg-[#8b0000] border border-[#e3bf55] text-[#fff6df] hover:bg-[#a60e0e] active:scale-[0.98] shadow-lg shadow-black/50 cursor-pointer'
              : 'bg-[#261711] border border-white/10 text-[#9c896d] cursor-not-allowed'
          }`}
        >
          <span>
            {isRolling
              ? 'Casting...'
              : !isHumanTurn
                ? 'AI Turn'
                : state.turnPhase === 'awaiting_move'
                  ? 'Pick Goti'
                  : state.config.diceMode === 'pashaka'
                    ? 'Cast Pashaka'
                    : 'Cast Kaudi'}
          </span>
        </button>
      </div>

      {/* Interactive Die Token Selector & Combine / Jodi Controls */}
      {state.turnPhase === 'awaiting_move' && state.dice.length > 0 && isHumanTurn && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#d4af37]/20">
          <div className="flex items-center gap-1.5" role="group" aria-label="Available dice tokens">
            {state.dice.map((token, idx) => {
              const isSelected = selectedDieIndices.includes(idx);
              return (
                <button
                  key={token.id}
                  type="button"
                  disabled={token.used}
                  onClick={() => onSelectDie(idx)}
                  aria-pressed={isSelected}
                  aria-label={`Die ${idx + 1} value ${token.value}${token.used ? ' used' : isSelected ? ' selected' : ''}`}
                  className={`min-h-[44px] min-w-[44px] px-3 rounded-lg font-mono-num text-base font-bold transition-all cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#f5d061] ${
                    token.used
                      ? 'bg-[#170e0a] text-[#6d5d49] border border-white/5 line-through'
                      : isSelected
                        ? 'bg-[#d4af37] text-[#1a0d07] border-2 border-[#fff5cc] shadow-md'
                        : 'bg-[#2a1811] text-[#f5deb0] border border-[#d4af37]/45 hover:border-[#f5d061]'
                  }`}
                >
                  {token.value}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {unusedCount >= 2 && (
              <button
                type="button"
                onClick={onToggleCombineMode}
                aria-pressed={combineMode}
                aria-label="Combine selected dice onto a single piece"
                className={`min-h-[44px] px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  combineMode
                    ? 'bg-[#d4af37]/25 text-[#fff4ce] border border-[#f5d061]'
                    : 'bg-[#261610] text-[#d4c09e] border border-[#d4af37]/30 hover:border-[#d4af37]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{combineMode ? `Sum: ${selectedSum}` : 'Combine'}</span>
              </button>
            )}

            {(hasValidJodiMove || (hasOwnJodi && selectedSum % 2 === 0 && selectedSum >= 2)) && (
              <button
                type="button"
                onClick={onTogglePreferJodi}
                aria-pressed={preferJodiMove}
                aria-label="Toggle Jodi Pair movement mode"
                className={`min-h-[44px] px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  preferJodiMove
                    ? 'bg-[#064035] text-[#d1fae5] border border-[#34d399]'
                    : 'bg-[#261610] text-[#d4c09e] border border-[#d4af37]/30 hover:border-[#d4af37]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{preferJodiMove ? `Jodi ÷2 (${selectedSum / 2})` : 'Single'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subtle contextual prompt when awaiting roll on desktop */}
      {state.turnPhase === 'awaiting_roll' && (
        <div className="hidden lg:block text-xs text-[#b8a17e] leading-relaxed">
          {isHumanTurn ? (
            <>
              Press <kbd className="font-mono-num text-[#f5deb0]">Space</kbd> or click{' '}
              <strong className="text-[#f5deb0]">Cast</strong>. Split your 3 stick values across multiple Gotis or combine them.
            </>
          ) : (
            <span>{player.name} is reading the board and casting the Pashaka...</span>
          )}
        </div>
      )}
    </section>
  );
};

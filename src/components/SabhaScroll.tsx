import React from 'react';
import { HOME_STEP, TRAY_STEP } from '../game/boardGeometry';
import { getCurrentPlayerId, isHomeUnlocked } from '../game/engine';
import type { GameState } from '../game/types';

interface SabhaScrollProps {
  state: GameState;
}

export const SabhaScroll: React.FC<SabhaScrollProps> = ({ state }) => {
  const currentPlayer = getCurrentPlayerId(state);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3.5">
      {/* Piece Tracker for Each Active Player */}
      <section
        aria-label="Royal Piece Tracker"
        className="rounded-2xl border border-[#d4af37]/30 bg-[#1b0f0b] p-3.5 space-y-2.5 shrink-0"
      >
        <h2 className="font-display text-xs font-bold tracking-wider text-[#d4af37]">
          ROYAL HOUSES · GOTI TRACKER
        </h2>

        <div className="space-y-2">
          {state.turnOrder.map((arm) => {
            const player = state.players[arm];
            const armPieces = state.pieces.filter((p) => p.owner === arm);
            const inTray = armPieces.filter((p) => p.step === TRAY_STEP).length;
            const home = armPieces.filter((p) => p.step === HOME_STEP).length;
            const active = armPieces.length - inTray - home;
            const unlocked = isHomeUnlocked(state, arm);
            const isCurrent = arm === currentPlayer;

            return (
              <div
                key={arm}
                className={`rounded-xl px-3 py-2 border transition-colors ${
                  isCurrent
                    ? 'bg-[#2a1610] border-[#f5d061]/70'
                    : 'bg-[#160c09] border-white/8'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-[#f5d061]"
                      style={{ backgroundColor: player.palette.primary }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold text-[#f5ead6] truncate">
                      {player.name}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-medium whitespace-nowrap ${
                      unlocked ? 'text-emerald-300' : 'text-amber-200/85'
                    }`}
                  >
                    {unlocked ? 'Home Unlocked' : 'Home Locked'}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#bfa987] font-mono-num">
                  <span>Kosh {inTray}</span>
                  <span aria-hidden="true">·</span>
                  <span>Board {active}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#f7e199]">Meru {home}/4</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Sanskrit/Hindi-English Sabha Commentary Scroll */}
      <section
        aria-label="Sabha Commentary Log"
        className="flex-1 min-h-0 flex flex-col rounded-2xl border border-[#d4af37]/30 bg-[#1b0f0b] overflow-hidden"
      >
        <div className="px-3.5 py-2.5 border-b border-[#d4af37]/20 flex items-center justify-between">
          <h2 className="font-display text-xs font-bold tracking-wider text-[#d4af37]">
            SABHA SCROLL
          </h2>
          <span className="font-mono-num text-[11px] text-[#b8a17e]">
            Turn {state.turnNumber}
          </span>
        </div>

        <ol className="flex-1 overflow-y-auto sabha-scroll p-3 space-y-2 text-xs leading-relaxed">
          {state.log.map((entry) => {
            const accentClass =
              entry.category === 'capture'
                ? 'text-rose-200 bg-rose-950/35 border-rose-500/30'
                : entry.category === 'victory'
                  ? 'text-[#fff4ce] bg-[#4b1a0e]/60 border-[#d4af37]/60'
                  : entry.category === 'jodi' || entry.category === 'safe' || entry.category === 'home'
                    ? 'text-emerald-100 bg-emerald-950/25 border-emerald-500/25'
                    : entry.category === 'penalty'
                      ? 'text-amber-200 bg-amber-950/35 border-amber-500/35'
                      : 'text-[#e3d3b8] bg-[#150c08] border-white/6';

            return (
              <li
                key={entry.id}
                className={`rounded-lg border px-2.5 py-2 ${accentClass}`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] text-[#b8a17e] mb-0.5">
                  <span className="font-semibold text-[#d4af37]">
                    {entry.sanskritTag ?? 'Sabha'}
                  </span>
                  <span className="font-mono-num">T{entry.turn}</span>
                </div>
                <p>{entry.text}</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
};

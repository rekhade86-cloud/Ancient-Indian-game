import React from 'react';
import { Crown, Home, RotateCcw } from 'lucide-react';
import type { GameState } from '../game/types';

interface VictoryModalProps {
  state: GameState;
  onRematch: () => void;
  onReturnTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  state,
  onRematch,
  onReturnTitle,
}) => {
  if (state.winnerTeamId === null) return null;

  const winnerNames = state.winnerArms.map((id) => state.players[id].name).join(' & ');
  const totalCaptures = Object.values(state.stats.capturesByPlayer).reduce((a, b) => a + b, 0);
  const totalJodis = Object.values(state.stats.jodisFormedByPlayer).reduce((a, b) => a + b, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-[#d4af37] bg-[#1a0f0a] p-6 text-center text-[#f5ead6] shadow-2xl space-y-5">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#8b0000] border-2 border-[#f5d061] flex items-center justify-center shadow-lg">
          <Crown className="w-7 h-7 text-[#f5d061]" />
        </div>

        <div>
          <p className="text-xs font-semibold text-[#d4af37] tracking-widest">
            ROYAL PROCLAMATION · VIJAY
          </p>
          <h2 id="victory-title" className="font-display text-2xl sm:text-3xl font-bold text-[#fff4d4] mt-1">
            {winnerNames} Wins!
          </h2>
          <p className="text-xs sm:text-sm text-[#c8b28e] mt-1.5">
            All royal Gotis have ascended safely into Central Meru.
          </p>
        </div>

        {/* Tabular Match Statistics */}
        <div className="grid grid-cols-2 gap-2.5 text-left">
          <div className="rounded-xl border border-[#d4af37]/25 bg-[#24150f] p-3">
            <div className="text-xs text-[#bfa987]">Total Rolls</div>
            <div className="font-mono-num text-xl font-bold text-[#f7e199] mt-0.5">
              {state.stats.totalRolls}
            </div>
          </div>
          <div className="rounded-xl border border-[#d4af37]/25 bg-[#24150f] p-3">
            <div className="text-xs text-[#bfa987]">Turns Taken</div>
            <div className="font-mono-num text-xl font-bold text-[#f7e199] mt-0.5">
              {state.stats.turnsTaken}
            </div>
          </div>
          <div className="rounded-xl border border-[#d4af37]/25 bg-[#24150f] p-3">
            <div className="text-xs text-[#bfa987]">Captures (Maar)</div>
            <div className="font-mono-num text-xl font-bold text-[#f7e199] mt-0.5">
              {totalCaptures}
            </div>
          </div>
          <div className="rounded-xl border border-[#d4af37]/25 bg-[#24150f] p-3">
            <div className="text-xs text-[#bfa987]">Jodis Formed</div>
            <div className="font-mono-num text-xl font-bold text-[#f7e199] mt-0.5">
              {totalJodis}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            data-start="true"
            onClick={onRematch}
            className="w-full min-h-[48px] rounded-xl bg-[#8b0000] border border-[#e3bf55] text-[#fff6df] font-display text-sm font-bold tracking-wider hover:bg-[#a60e0e] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#f5d061]" />
            <span>Play Rematch</span>
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full min-h-[44px] rounded-xl border border-[#d4af37]/35 bg-[#24150f] text-xs font-semibold text-[#e5d5ba] hover:border-[#d4af37] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#d4af37]" />
            <span>Return to Title</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { BookOpen, Home, Play, RotateCcw, Smartphone, Volume2, VolumeX } from 'lucide-react';
import type { DiceMode } from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

interface PauseModalProps {
  open: boolean;
  muted: boolean;
  haptics: boolean;
  diceMode: DiceMode;
  strictCaptureToHome: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuitToTitle: () => void;
  onOpenGrantha: () => void;
  onToggleMute: () => void;
  onToggleHaptics: () => void;
  onToggleDiceMode: () => void;
  onToggleStrictCapture: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  open,
  muted,
  haptics,
  diceMode,
  strictCaptureToHome,
  onResume,
  onRestart,
  onQuitToTitle,
  onOpenGrantha,
  onToggleMute,
  onToggleHaptics,
  onToggleDiceMode,
  onToggleStrictCapture,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#d4af37]/45 bg-[#1a0f0a] p-5 sm:p-6 text-[#f5ead6] shadow-2xl space-y-5">
        <div className="text-center">
          <h2 id="pause-modal-title" className="font-display text-2xl font-bold text-[#f7e199]">
            Sabha Paused
          </h2>
          <p className="text-xs text-[#bda887] mt-1">
            Progress is automatically saved offline on this device
          </p>
        </div>

        {/* Live Match Settings */}
        <div className="space-y-2.5 border-y border-[#d4af37]/20 py-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#e6d7bd]">Sound Effects</span>
            <button
              type="button"
              onClick={onToggleMute}
              className="min-h-[40px] px-3.5 rounded-lg border border-[#d4af37]/35 bg-[#251610] text-xs font-semibold text-[#f5deb0] flex items-center gap-2 hover:border-[#d4af37] cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-[#d4af37]" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
              <span>{muted ? 'Muted' : 'On'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[#e6d7bd]">Mobile Haptics</span>
            <button
              type="button"
              onClick={onToggleHaptics}
              className="min-h-[40px] px-3.5 rounded-lg border border-[#d4af37]/35 bg-[#251610] text-xs font-semibold text-[#f5deb0] flex items-center gap-2 hover:border-[#d4af37] cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#d4af37]" />
              <span>{haptics ? 'On' : 'Off'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[#e6d7bd]">Dice Set</span>
            <button
              type="button"
              onClick={onToggleDiceMode}
              className="min-h-[40px] px-3.5 rounded-lg border border-[#d4af37]/35 bg-[#251610] text-xs font-semibold text-[#f5deb0] hover:border-[#d4af37] cursor-pointer"
            >
              {diceMode === 'pashaka' ? '3 Pashaka Sticks' : '6 Cowrie Shells'}
            </button>
          </div>

          <label className="flex items-center justify-between gap-3 min-h-[40px] cursor-pointer">
            <span className="text-[#e6d7bd]">Strict Capture to Enter Home</span>
            <input
              type="checkbox"
              checked={strictCaptureToHome}
              onChange={onToggleStrictCapture}
              className="h-5 w-5 accent-[#d4af37] cursor-pointer"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[48px] rounded-xl bg-[#8b0000] border border-[#e3bf55] text-[#fff6df] font-display text-sm font-bold tracking-wider hover:bg-[#a60e0e] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-[#f5d061]" />
            <span>Resume Match</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenGrantha}
              className="min-h-[44px] rounded-xl border border-[#d4af37]/35 bg-[#251610] text-xs font-semibold text-[#e8d9be] hover:border-[#d4af37] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#d4af37]" />
              <span>Grantha Rules</span>
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[44px] rounded-xl border border-[#d4af37]/35 bg-[#251610] text-xs font-semibold text-[#e8d9be] hover:border-[#d4af37] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#d4af37]" />
              <span>Restart</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onQuitToTitle}
              className="flex-1 min-h-[44px] rounded-xl border border-white/15 bg-[#150c08] text-xs font-semibold text-[#c5b08f] hover:text-white hover:border-white/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Title Screen</span>
            </button>
            <PWAInstallButton compact />
          </div>
        </div>
      </div>
    </div>
  );
};

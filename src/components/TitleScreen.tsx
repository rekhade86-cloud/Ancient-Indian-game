import React, { useState } from 'react';
import { BookOpen, Play, RotateCcw } from 'lucide-react';
import type { ArmId, DiceMode, Difficulty, GameConfig, GameMode } from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

const TITLE_BG_SRC = '/src/assets/images/title_bg_1795439069091.jpg';

interface TitleScreenProps {
  initialConfig: GameConfig;
  hasSavedMatch: boolean;
  onStartNew: (config: GameConfig) => void;
  onResumeSaved: () => void;
  onOpenGrantha: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  initialConfig,
  hasSavedMatch,
  onStartNew,
  onResumeSaved,
  onOpenGrantha,
}) => {
  const [mode, setMode] = useState<GameMode>(initialConfig.mode);
  const [playType, setPlayType] = useState<'ai' | 'passplay'>(
    initialConfig.humanArms.length > 1 ? 'passplay' : 'ai'
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(initialConfig.difficulty);
  const [diceMode, setDiceMode] = useState<DiceMode>(initialConfig.diceMode);
  const [strictCaptureToHome, setStrictCaptureToHome] = useState<boolean>(
    initialConfig.strictCaptureToHome
  );
  const [bgFailed, setBgFailed] = useState(false);

  const buildConfig = (): GameConfig => {
    let humanArms: ArmId[] = ['south'];
    if (playType === 'passplay') {
      humanArms = mode === '1v1' ? ['south', 'north'] : ['south', 'east', 'north', 'west'];
    }
    return {
      mode,
      difficulty,
      diceMode,
      strictCaptureToHome,
      humanArms,
    };
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#120b08] text-[#f5ead6] flex flex-col">
      {/* Illustrated Hastinapur Dyut Sabha Backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {!bgFailed ? (
          <img
            src={TITLE_BG_SRC}
            alt="Candlelit Royal Palace Hall of Hastinapur"
            referrerPolicy="no-referrer"
            onError={() => setBgFailed(true)}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#2a0f12] via-[#170c09] to-[#0f0806]" />
        )}
        {/* Measured scrim ensuring 4.5:1+ contrast over calm left negative space */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#100906]/95 via-[#120a07]/84 to-[#120a07]/45 lg:via-[#120a07]/78 lg:to-[#120a07]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#100906]/90 via-transparent to-[#100906]/55" />
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 flex flex-col justify-between px-4 py-5 sm:px-8 sm:py-8 lg:px-14 lg:py-10 max-w-7xl w-full mx-auto">
        <div className="my-auto w-full max-w-[500px]">
          {/* Custom Inline SVG Royal Emblem & Title Lockup */}
          <div className="mb-5">
            <svg
              viewBox="0 0 420 112"
              className="w-full max-w-[390px] h-auto"
              role="img"
              aria-label="Dyut Krida — Royal Chaupar of Hastinapur"
            >
              <defs>
                <linearGradient id="royalGoldTitle" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f8e3a1" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#b08420" />
                </linearGradient>
              </defs>
              {/* Ornate miniature cruciform lotus crest */}
              <g transform="translate(36, 46)">
                <rect x="-10" y="-26" width="20" height="52" rx="3" fill="#8b0000" stroke="url(#royalGoldTitle)" strokeWidth="1.8" />
                <rect x="-26" y="-10" width="52" height="20" rx="3" fill="#8b0000" stroke="url(#royalGoldTitle)" strokeWidth="1.8" />
                <rect x="-11" y="-11" width="22" height="22" rx="2" fill="#1b100b" stroke="url(#royalGoldTitle)" strokeWidth="2" />
                <circle cx="0" cy="0" r="4.5" fill="#f5d061" />
              </g>
              {/* Title Typography */}
              <text
                x="78"
                y="43"
                fill="url(#royalGoldTitle)"
                fontFamily="Cinzel, Georgia, serif"
                fontWeight="800"
                fontSize="31"
                letterSpacing="2.4"
              >
                DYUT KRIDA
              </text>
              <line x1="78" y1="54" x2="365" y2="54" stroke="#d4af37" strokeOpacity="0.45" strokeWidth="1.2" />
              <text
                x="78"
                y="76"
                fill="#ebd8b7"
                fontFamily="Cinzel, Georgia, serif"
                fontWeight="600"
                fontSize="14.5"
                letterSpacing="3.5"
              >
                ROYAL CHAUPAR · HASTINAPUR
              </text>
              <text
                x="78"
                y="98"
                fill="#b8a17e"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="500"
                fontSize="11.5"
              >
                Offline Stick-Dice Strategy Board Game
              </text>
            </svg>
          </div>

          {/* Compact Match Setup Surface */}
          <section
            aria-label="Match Configuration"
            className="rounded-2xl border border-[#d4af37]/30 bg-[#1a0f0a]/90 p-4 sm:p-5 shadow-2xl space-y-4"
          >
            {/* Game Mode */}
            <div>
              <div className="text-xs font-semibold text-[#d4af37] mb-1.5">Royal Sabha Mode</div>
              <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Game Mode">
                {(
                  [
                    { id: '1v1', label: '1v1 Duel' },
                    { id: '2v2', label: '2v2 Alliance' },
                    { id: '4p', label: '4-Player' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={mode === item.id}
                    onClick={() => setMode(item.id)}
                    className={`min-h-[44px] px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[#d4af37] ${
                      mode === item.id
                        ? 'bg-[#8b0000] text-[#fff6df] border border-[#d4af37]'
                        : 'bg-[#251610] text-[#cbb89a] border border-white/10 hover:border-[#d4af37]/40 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent Type & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-[#d4af37] mb-1.5">Opponents</div>
                <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Opponent Type">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={playType === 'ai'}
                    onClick={() => setPlayType('ai')}
                    className={`min-h-[44px] px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      playType === 'ai'
                        ? 'bg-[#2f1a12] text-[#f7e199] border border-[#d4af37]'
                        : 'bg-[#22140e] text-[#b9a587] border border-white/10 hover:text-white'
                    }`}
                  >
                    vs Shakuni AI
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={playType === 'passplay'}
                    onClick={() => setPlayType('passplay')}
                    className={`min-h-[44px] px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      playType === 'passplay'
                        ? 'bg-[#2f1a12] text-[#f7e199] border border-[#d4af37]'
                        : 'bg-[#22140e] text-[#b9a587] border border-white/10 hover:text-white'
                    }`}
                  >
                    Pass &amp; Play
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#d4af37] mb-1.5">Ancient Dice</div>
                <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Dice Type">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={diceMode === 'pashaka'}
                    onClick={() => setDiceMode('pashaka')}
                    className={`min-h-[44px] px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      diceMode === 'pashaka'
                        ? 'bg-[#2f1a12] text-[#f7e199] border border-[#d4af37]'
                        : 'bg-[#22140e] text-[#b9a587] border border-white/10 hover:text-white'
                    }`}
                  >
                    3 Pashaka
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={diceMode === 'kaudi'}
                    onClick={() => setDiceMode('kaudi')}
                    className={`min-h-[44px] px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      diceMode === 'kaudi'
                        ? 'bg-[#2f1a12] text-[#f7e199] border border-[#d4af37]'
                        : 'bg-[#22140e] text-[#b9a587] border border-white/10 hover:text-white'
                    }`}
                  >
                    6 Cowries
                  </button>
                </div>
              </div>
            </div>

            {/* AI Difficulty (shown when playing vs AI) */}
            {playType === 'ai' && (
              <div>
                <div className="text-xs font-semibold text-[#d4af37] mb-1.5">Shakuni AI Strength</div>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="AI Difficulty">
                  {(
                    [
                      { id: 'novice', label: 'Novice' },
                      { id: 'tactician', label: 'Tactician' },
                      { id: 'mastermind', label: 'Mastermind' },
                    ] as const
                  ).map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={difficulty === tier.id}
                      onClick={() => setDifficulty(tier.id)}
                      className={`min-h-[42px] px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        difficulty === tier.id
                          ? 'bg-[#1a237e] text-[#eef2ff] border border-[#c0c0c0]'
                          : 'bg-[#22140e] text-[#b9a587] border border-white/10 hover:text-white'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Strict Capture-to-Enter-Home Toggle */}
            <label className="flex items-center justify-between gap-3 pt-1 cursor-pointer min-h-[44px]">
              <span className="text-xs sm:text-sm text-[#e8d9be]">
                Strict Mahabharata Rule (Capture to Unlock Home)
              </span>
              <input
                type="checkbox"
                checked={strictCaptureToHome}
                onChange={(e) => setStrictCaptureToHome(e.target.checked)}
                className="h-5 w-5 accent-[#d4af37] rounded cursor-pointer shrink-0"
              />
            </label>

            {/* Primary & Secondary Actions */}
            <div className="pt-1 flex flex-col gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={() => onStartNew(buildConfig())}
                className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#8b0000] border border-[#e3bf55] text-[#fff6e0] font-display text-base font-bold tracking-wider hover:bg-[#a60e0e] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-black/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#f5d061]"
              >
                <Play className="w-4 h-4 fill-current text-[#f5d061]" />
                <span>Start Royal Match</span>
              </button>

              {hasSavedMatch && (
                <button
                  type="button"
                  onClick={onResumeSaved}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#271811] border border-[#d4af37]/50 text-[#f5deb0] text-sm font-semibold hover:bg-[#352017] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#d4af37]" />
                  <span>Resume Saved Offline Match</span>
                </button>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={onOpenGrantha}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-lg border border-[#d4af37]/35 bg-[#20130d]/90 text-[#e8d9be] text-sm font-medium hover:border-[#d4af37] hover:text-white transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#d4af37]" />
                  <span>Grantha Rules</span>
                </button>
                <PWAInstallButton />
              </div>
            </div>
          </section>
        </div>

        {/* Clean Single-Line Bottom Control Hint */}
        <footer className="mt-6 text-xs text-[#b8a17e] flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Space Cast Dice</span>
          <span aria-hidden="true">·</span>
          <span>Tap Die + Goti to Move</span>
          <span aria-hidden="true">·</span>
          <span>Esc Pause</span>
          <span aria-hidden="true">·</span>
          <span>100% Offline Ready</span>
        </footer>
      </main>
    </div>
  );
};

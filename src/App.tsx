import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Lock,
  Pause,
  RotateCcw,
  ScrollText,
  Unlock,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ChauparBoard } from './components/ChauparBoard';
import { DiceTray } from './components/DiceTray';
import { GranthaModal } from './components/GranthaModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PauseModal } from './components/PauseModal';
import { SabhaScroll } from './components/SabhaScroll';
import { TitleScreen } from './components/TitleScreen';
import { VictoryModal } from './components/VictoryModal';
import { chooseAIMove } from './game/ai';
import { chauparAudio } from './game/audio';
import {
  applyDiceRoll,
  applyMove,
  createInitialState,
  getCurrentPlayerId,
  getLegalMovesForDieSubset,
  getUnusedDieSubsets,
  isHomeUnlocked,
} from './game/engine';
import {
  clearSavedMatchState,
  loadPrefs,
  loadSavedMatchState,
  saveMatchState,
  savePrefs,
  triggerHaptic,
} from './game/storage';
import type { AppPhase, GameConfig, GameState, LegalMove } from './game/types';

const DEFAULT_CONFIG: GameConfig = {
  mode: '1v1',
  difficulty: 'tactician',
  diceMode: 'pashaka',
  strictCaptureToHome: true,
  humanArms: ['south'],
};

function findFirstLegalSubset(state: GameState): number[] {
  // Prefer a single unused die that has legal moves
  for (let i = 0; i < state.dice.length; i++) {
    if (!state.dice[i].used && getLegalMovesForDieSubset(state, [i]).length > 0) {
      return [i];
    }
  }
  // Otherwise find any combined subset that has legal moves
  const subsets = getUnusedDieSubsets(state.dice);
  for (const sub of subsets) {
    if (getLegalMovesForDieSubset(state, sub).length > 0) {
      return sub;
    }
  }
  return [];
}

export default function App() {
  const initialAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const initialSaved = useMemo(() => loadSavedMatchState(), []);
  const initialPrefs = useMemo(() => loadPrefs(), []);

  const [appPhase, setAppPhase] = useState<AppPhase>(initialAutostart ? 'playing' : 'title');
  const [gameState, setGameState] = useState<GameState>(() =>
    initialAutostart ? createInitialState(DEFAULT_CONFIG) : initialSaved ?? createInitialState(DEFAULT_CONFIG)
  );
  const [hasSavedMatch, setHasSavedMatch] = useState<boolean>(Boolean(initialSaved));
  const [isRolling, setIsRolling] = useState(false);
  const [selectedDieIndices, setSelectedDieIndices] = useState<number[]>([]);
  const [combineMode, setCombineMode] = useState(false);
  const [preferJodiMove, setPreferJodiMove] = useState(false);

  const [granthaOpen, setGranthaOpen] = useState(false);
  const [mobileSabhaOpen, setMobileSabhaOpen] = useState(false);
  const [muted, setMuted] = useState<boolean>(initialPrefs.muted);
  const [haptics, setHaptics] = useState<boolean>(initialPrefs.haptics);

  const timersRef = useRef<number[]>([]);
  const lastAudioSeqRef = useRef<number>(0);

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  // Sync audio mute preference
  useEffect(() => {
    chauparAudio.setMuted(muted);
    savePrefs({ muted, haptics });
  }, [muted, haptics]);

  // Mirror state machine to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = appPhase;
  }, [appPhase]);

  // Transition to gameover modal when victory occurs
  useEffect(() => {
    if (gameState.winnerTeamId !== null && appPhase === 'playing') {
      setAppPhase('gameover');
      setHasSavedMatch(false);
      clearSavedMatchState();
    }
  }, [gameState.winnerTeamId, appPhase]);

  // Auto-save match state offline on every meaningful turn update
  useEffect(() => {
    if (appPhase === 'playing' || appPhase === 'paused') {
      saveMatchState(gameState);
      if (gameState.winnerTeamId === null) {
        setHasSavedMatch(true);
      }
    }
  }, [gameState, appPhase]);

  // Play synchronized procedural Web Audio & mobile haptics on game events
  useEffect(() => {
    const ev = gameState.lastEvent;
    if (ev.seq <= lastAudioSeqRef.current) return;
    lastAudioSeqRef.current = ev.seq;

    switch (ev.type) {
      case 'capture':
        chauparAudio.playCaptureClash();
        triggerHaptic([35, 30, 70], haptics);
        break;
      case 'safe':
      case 'jodi':
        chauparAudio.playSafeChime();
        triggerHaptic(22, haptics);
        break;
      case 'home':
      case 'victory':
        chauparAudio.playHomeVictory();
        triggerHaptic([30, 40, 30, 40, 80], haptics);
        break;
      case 'teen_trik':
        chauparAudio.playTeenTrik();
        triggerHaptic([50, 40, 50], haptics);
        break;
      case 'move':
        chauparAudio.playGotiPlace();
        triggerHaptic(12, haptics);
        break;
      default:
        break;
    }
  }, [gameState.lastEvent, haptics]);

  // Auto-select valid die subset whenever dice change during human turn
  const currentPlayerId = getCurrentPlayerId(gameState);
  const currentPlayer = gameState.players[currentPlayerId];
  const isHumanTurn = !currentPlayer.isAI;

  useEffect(() => {
    if (gameState.turnPhase !== 'awaiting_move' || !isHumanTurn) {
      setSelectedDieIndices([]);
      setCombineMode(false);
      setPreferJodiMove(false);
      return;
    }
    const nextSubset = findFirstLegalSubset(gameState);
    setSelectedDieIndices(nextSubset);
    setCombineMode(nextSubset.length > 1);
    setPreferJodiMove(false);
  }, [gameState.dice, gameState.turnPhase, isHumanTurn, gameState]);

  // Compute legal moves for currently selected die subset
  const activeMoves = useMemo(() => {
    if (gameState.turnPhase !== 'awaiting_move' || selectedDieIndices.length === 0) {
      return [];
    }
    return getLegalMovesForDieSubset(gameState, selectedDieIndices);
  }, [gameState, selectedDieIndices]);

  const hasValidJodiMove = useMemo(
    () => activeMoves.some((m) => m.isJodiMove),
    [activeMoves]
  );

  // Trigger dice roll with tactile animation + audio
  const triggerRoll = useCallback(() => {
    if (isRolling || gameState.turnPhase !== 'awaiting_roll' || gameState.winnerTeamId !== null) {
      return;
    }
    setIsRolling(true);
    chauparAudio.playDiceRoll();
    triggerHaptic([16, 28, 16], haptics);

    scheduleTimer(() => {
      setGameState((prev) => applyDiceRoll(prev));
      setIsRolling(false);
    }, 400);
  }, [isRolling, gameState.turnPhase, gameState.winnerTeamId, haptics, scheduleTimer]);

  // Execute a chosen LegalMove
  const handleExecuteMove = useCallback((move: LegalMove) => {
    setGameState((prev) => applyMove(prev, move));
  }, []);

  // Shakuni AI autonomous turn controller
  useEffect(() => {
    if (appPhase !== 'playing' || gameState.winnerTeamId !== null || granthaOpen) {
      return;
    }
    if (!currentPlayer.isAI || isRolling) {
      return;
    }

    if (gameState.turnPhase === 'awaiting_roll') {
      const id = scheduleTimer(() => {
        triggerRoll();
      }, 540);
      return () => window.clearTimeout(id);
    }

    if (gameState.turnPhase === 'awaiting_move') {
      const id = scheduleTimer(() => {
        const aiMove = chooseAIMove(gameState, gameState.config.difficulty);
        if (aiMove) {
          setGameState((prev) => applyMove(prev, aiMove));
        }
      }, 520);
      return () => window.clearTimeout(id);
    }
  }, [
    appPhase,
    gameState,
    currentPlayer.isAI,
    isRolling,
    granthaOpen,
    scheduleTimer,
    triggerRoll,
  ]);

  // Cleanup timers on unmount
  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  // Start / Resume / Restart Handlers
  const handleStartNew = useCallback(
    (config: GameConfig) => {
      clearAllTimers();
      setIsRolling(false);
      setGranthaOpen(false);
      setMobileSabhaOpen(false);
      const fresh = createInitialState(config);
      lastAudioSeqRef.current = 0;
      setGameState(fresh);
      saveMatchState(fresh);
      setHasSavedMatch(true);
      setAppPhase('playing');
      (document.activeElement as HTMLElement | null)?.blur?.();
    },
    [clearAllTimers]
  );

  const handleResumeSaved = useCallback(() => {
    const saved = loadSavedMatchState();
    clearAllTimers();
    setIsRolling(false);
    setGranthaOpen(false);
    setMobileSabhaOpen(false);
    if (saved) {
      lastAudioSeqRef.current = saved.lastEvent.seq;
      setGameState(saved);
    }
    setAppPhase('playing');
    (document.activeElement as HTMLElement | null)?.blur?.();
  }, [clearAllTimers]);

  const handleRestart = useCallback(() => {
    handleStartNew(gameState.config);
  }, [handleStartNew, gameState.config]);

  const handleQuitToTitle = useCallback(() => {
    clearAllTimers();
    setIsRolling(false);
    setMobileSabhaOpen(false);
    setAppPhase('title');
  }, [clearAllTimers]);

  // Die token selection & Combine toggle
  const handleSelectDie = useCallback(
    (index: number) => {
      if (gameState.dice[index]?.used) return;
      if (combineMode) {
        setSelectedDieIndices((prev) => {
          if (prev.includes(index)) {
            const next = prev.filter((i) => i !== index);
            return next.length > 0 ? next : [index];
          }
          return [...prev, index].sort((a, b) => a - b);
        });
      } else {
        setSelectedDieIndices([index]);
      }
    },
    [combineMode, gameState.dice]
  );

  const handleToggleCombineMode = useCallback(() => {
    const unused = gameState.dice
      .map((d, i) => (d.used ? -1 : i))
      .filter((i) => i !== -1);
    if (!combineMode) {
      setCombineMode(true);
      setSelectedDieIndices(unused);
    } else {
      setCombineMode(false);
      const firstLegal = findFirstLegalSubset(gameState);
      setSelectedDieIndices(firstLegal.length > 0 ? [firstLegal[0]] : unused.slice(0, 1));
    }
  }, [combineMode, gameState]);

  const handleToggleDiceMode = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        diceMode: prev.config.diceMode === 'pashaka' ? 'kaudi' : 'pashaka',
      },
    }));
  }, []);

  const handleToggleStrictCapture = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        strictCaptureToHome: !prev.config.strictCaptureToHome,
      },
    }));
  }, []);

  // Global keyboard shortcuts (Title Enter/Space, Playing Space/Esc/P/M/G/R)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (granthaOpen) {
        if (e.key === 'Escape') setGranthaOpen(false);
        return;
      }

      if (appPhase === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartNew(gameState.config);
        }
        return;
      }

      if (appPhase === 'paused') {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setAppPhase('playing');
        }
        return;
      }

      if (appPhase === 'playing') {
        if (e.key === ' ') {
          e.preventDefault();
          if (isHumanTurn && gameState.turnPhase === 'awaiting_roll' && !isRolling) {
            triggerRoll();
          }
        } else if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setAppPhase('paused');
        } else if (e.key.toLowerCase() === 'm') {
          setMuted((m) => !m);
        } else if (e.key.toLowerCase() === 'g') {
          setGranthaOpen(true);
        } else if (e.key.toLowerCase() === 'r') {
          handleRestart();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    appPhase,
    granthaOpen,
    gameState.config,
    gameState.turnPhase,
    isHumanTurn,
    isRolling,
    handleStartNew,
    handleRestart,
    triggerRoll,
  ]);

  // Active player's Home Lock status for Top HUD
  const currentUnlocked = isHomeUnlocked(gameState, currentPlayerId);
  const modeLabel =
    gameState.config.mode === '1v1'
      ? '1v1 Duel'
      : gameState.config.mode === '2v2'
        ? '2v2 Alliance'
        : '4P Sabha';

  if (appPhase === 'title') {
    return (
      <>
        <TitleScreen
          initialConfig={gameState.config}
          hasSavedMatch={hasSavedMatch}
          onStartNew={handleStartNew}
          onResumeSaved={handleResumeSaved}
          onOpenGrantha={() => setGranthaOpen(true)}
        />
        <GranthaModal open={granthaOpen} onClose={() => setGranthaOpen(false)} />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#120b08] text-[#f5ead6] flex flex-col">
      {/* Compact Royal Top HUD Bar (fits comfortably under 15% mobile height cap) */}
      <header className="shrink-0 h-13 lg:h-14 px-3 lg:px-5 border-b border-[#d4af37]/30 bg-[#1a0f0a] flex items-center justify-between gap-2 shadow-md z-20">
        {/* Active Turn Banner + Capture Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full border-2 border-[#f5d061] shrink-0 flex items-center justify-center shadow-inner"
            style={{ backgroundColor: currentPlayer.palette.primary }}
            aria-hidden="true"
          >
            <span className="font-display text-xs font-bold text-[#fff6e0]">
              {currentPlayer.name.charAt(0)}
            </span>
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm font-bold text-[#fff4d4] truncate">
                {currentPlayer.name}&apos;s Turn
              </span>
              <span className="hidden md:inline text-xs text-[#b8a17e] whitespace-nowrap">
                · {modeLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-medium truncate">
              {currentUnlocked ? (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <Unlock className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>Home Unlocked!</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-200">
                  <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">Home Locked: Capture 1 Enemy Piece</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Utility Controls (44px touch targets on mobile) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile Sabha Scroll Bottom-Sheet Trigger */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setMobileSabhaOpen(true);
            }}
            aria-label="Open Sabha Scroll and Piece Tracker"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#e8d9be] hover:bg-white/10 active:bg-white/15 cursor-pointer"
          >
            <ScrollText className="w-5 h-5 text-[#d4af37]" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setGranthaOpen(true);
            }}
            aria-label="Open Grantha Rules (G)"
            title="Grantha Rules (G)"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#e8d9be] hover:bg-white/10 active:bg-white/15 cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-[#d4af37]" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setMuted((m) => !m);
            }}
            aria-label={muted ? 'Unmute sound effects (M)' : 'Mute sound effects (M)'}
            title={muted ? 'Unmute (M)' : 'Mute (M)'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#e8d9be] hover:bg-white/10 active:bg-white/15 cursor-pointer"
          >
            {muted ? (
              <VolumeX className="w-5 h-5 text-[#b8a17e]" />
            ) : (
              <Volume2 className="w-5 h-5 text-[#d4af37]" />
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              handleRestart();
            }}
            aria-label="Restart Match (R)"
            title="Restart Match (R)"
            className="hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#e8d9be] hover:bg-white/10 active:bg-white/15 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#d4af37]" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setAppPhase('paused');
            }}
            aria-label="Pause Game (P)"
            title="Pause (P)"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#e8d9be] hover:bg-white/10 active:bg-white/15 cursor-pointer"
          >
            <Pause className="w-5 h-5 text-[#d4af37]" />
          </button>
        </div>
      </header>

      {/* Main Arena: Mobile Portrait Stack (Board + Bottom Thumb Dice Dock) | Desktop 3-Column Royal Table */}
      <main className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[296px_1fr_308px] gap-2 lg:gap-4 p-2 lg:p-3.5 max-w-[1600px] w-full mx-auto">
        {/* Desktop Left Column: Velvet Dice Tray & Move Allocation */}
        <aside className="hidden lg:flex flex-col justify-between gap-3 min-h-0">
          <DiceTray
            state={gameState}
            isRolling={isRolling}
            isHumanTurn={isHumanTurn}
            selectedDieIndices={selectedDieIndices}
            combineMode={combineMode}
            preferJodiMove={preferJodiMove}
            hasValidJodiMove={hasValidJodiMove}
            onRoll={triggerRoll}
            onSelectDie={handleSelectDie}
            onToggleCombineMode={handleToggleCombineMode}
            onTogglePreferJodi={() => setPreferJodiMove((p) => !p)}
            onToggleDiceMode={handleToggleDiceMode}
          />

          {/* Compact Desktop Tactical Legend */}
          <div className="rounded-2xl border border-[#d4af37]/25 bg-[#190e0a] p-3.5 text-xs text-[#c5b08f] space-y-2">
            <div className="font-display text-xs font-bold text-[#d4af37]">
              ROYAL LAWS OF CHAUPAR
            </div>
            <p>
              <strong className="text-[#f5deb0]">Charkoni (X):</strong> 12 embroidered lotus squares protect every Goti from capture.
            </p>
            <p>
              <strong className="text-[#f5deb0]">Jodi Pair:</strong> Stack 2 own Gotis to guard against single strikes; move together by even roll ÷ 2.
            </p>
            <p>
              <strong className="text-[#f5deb0]">Tod (Capture):</strong> Cut an enemy Goti for an instant Bonus Roll &amp; Home Column unlock.
            </p>
          </div>
        </aside>

        {/* Center Stage: Embroidered Cruciform Chaupar Board */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="w-full h-full max-w-[min(100vw-16px,calc(100dvh-238px))] lg:max-w-[calc(100dvh-84px)] aspect-square flex items-center justify-center">
            <ChauparBoard
              state={gameState}
              activeMoves={activeMoves}
              preferJodiMove={preferJodiMove}
              isHumanTurn={isHumanTurn}
              onExecuteMove={handleExecuteMove}
            />
          </div>
        </div>

        {/* Mobile Bottom Thumb-Zone Dice & Move Allocation Dock */}
        <div className="lg:hidden shrink-0 pb-[env(safe-area-inset-bottom)]">
          <DiceTray
            state={gameState}
            isRolling={isRolling}
            isHumanTurn={isHumanTurn}
            selectedDieIndices={selectedDieIndices}
            combineMode={combineMode}
            preferJodiMove={preferJodiMove}
            hasValidJodiMove={hasValidJodiMove}
            onRoll={triggerRoll}
            onSelectDie={handleSelectDie}
            onToggleCombineMode={handleToggleCombineMode}
            onTogglePreferJodi={() => setPreferJodiMove((p) => !p)}
            onToggleDiceMode={handleToggleDiceMode}
          />
        </div>

        {/* Desktop Right Sidebar: Sabha Scroll & Royal Piece Tracker */}
        <aside className="hidden lg:flex flex-col min-h-0">
          <SabhaScroll state={gameState} />
        </aside>
      </main>

      {/* Mobile Sabha Scroll Bottom Sheet Drawer */}
      {mobileSabhaOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden flex flex-col justify-end bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-label="Sabha Scroll and Piece Tracker"
        >
          <div className="h-[76dvh] rounded-t-3xl border-t border-[#d4af37]/45 bg-[#150c08] p-4 flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="w-10 h-1.5 rounded-full bg-[#d4af37]/40 mx-auto" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setMobileSabhaOpen(false)}
                aria-label="Close Sabha Scroll"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#d4c09e] hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <SabhaScroll state={gameState} />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <GranthaModal open={granthaOpen} onClose={() => setGranthaOpen(false)} />

      <PauseModal
        open={appPhase === 'paused'}
        muted={muted}
        haptics={haptics}
        diceMode={gameState.config.diceMode}
        strictCaptureToHome={gameState.config.strictCaptureToHome}
        onResume={() => setAppPhase('playing')}
        onRestart={handleRestart}
        onQuitToTitle={handleQuitToTitle}
        onOpenGrantha={() => setGranthaOpen(true)}
        onToggleMute={() => setMuted((m) => !m)}
        onToggleHaptics={() => setHaptics((h) => !h)}
        onToggleDiceMode={handleToggleDiceMode}
        onToggleStrictCapture={handleToggleStrictCapture}
      />

      <VictoryModal
        state={gameState}
        onRematch={handleRestart}
        onReturnTitle={handleQuitToTitle}
      />

      <OfflineIndicator />
    </div>
  );
}

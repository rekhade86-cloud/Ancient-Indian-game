import type { GameState } from './types';

const SAVE_KEY = 'dyut_krida_chaupar_save_v1';
const SETTINGS_KEY = 'dyut_krida_chaupar_prefs_v1';

export interface SavedPrefs {
  muted: boolean;
  haptics: boolean;
}

export function saveMatchState(state: GameState): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    // Do not persist completed matches as resumable
    if (state.winnerTeamId !== null) {
      window.localStorage.removeItem(SAVE_KEY);
      return;
    }
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / privacy mode errors cleanly
  }
}

export function loadSavedMatchState(): GameState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || !parsed.config || !Array.isArray(parsed.pieces) || !parsed.players) {
      return null;
    }
    // Reset transient rolling phase if saved mid-roll
    if (parsed.turnPhase === 'rolling') {
      parsed.turnPhase = 'awaiting_roll';
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSavedMatchState(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

export function loadPrefs(): SavedPrefs {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { muted: false, haptics: true };
    }
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { muted: false, haptics: true };
    const parsed = JSON.parse(raw) as Partial<SavedPrefs>;
    return {
      muted: Boolean(parsed.muted),
      haptics: parsed.haptics !== false,
    };
  } catch {
    return { muted: false, haptics: true };
  }
}

export function savePrefs(prefs: SavedPrefs): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

export function triggerHaptic(pattern: number | number[], enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined') return;
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Unsupported
  }
}

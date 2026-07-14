import { useEffect, useState } from 'react';
import {
  getMaintenanceMode,
  setMaintenanceMode as apiSetMaintenanceMode } from
'./api';

// ---------------------------------------------------------------------------
// Shared maintenance-mode store
// ---------------------------------------------------------------------------
// The public root ("/") swaps to the 503 ServiceUnavailable page whenever this
// flag is ON. The admin "System Status → Take Website Offline" control flips it.
//
// Source of truth is the backend flag (GET/POST /admin/api/system/maintenance).
// We mirror it to localStorage so the whole SPA — and other browser tabs — react
// instantly without a round-trip, and so the preview works even before the real
// backend is wired up. When the API is unreachable we fall back to the cached
// value and still reflect the admin's intent optimistically.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ssc:maintenanceMode';

type Listener = (value: boolean) => void;
const listeners = new Set<Listener>();

function readCache(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeCache(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {

    /* ignore storage errors (private mode, etc.) */}
}

let current = readCache();

function emit(value: boolean): void {
  current = value;
  writeCache(value);
  listeners.forEach((listener) => listener(value));
}

/** Current in-memory maintenance flag (synchronous). */
export function getMaintenanceFlag(): boolean {
  return current;
}

/** Refresh the flag from the backend, updating all subscribers. */
export async function refreshMaintenanceFlag(): Promise<boolean> {
  try {
    const value = await getMaintenanceMode();
    emit(value);
    return value;
  } catch {
    // Backend unreachable — keep the cached value.
    return current;
  }
}

/** Persist a new flag value through the API and notify subscribers. */
export async function updateMaintenanceFlag(value: boolean): Promise<boolean> {
  // Reflect intent immediately for a responsive UI.
  emit(value);
  try {
    const persisted = await apiSetMaintenanceMode(value);
    if (persisted !== value) emit(persisted);
    return persisted;
  } catch {
    // Optimistic value already applied.
    return value;
  }
}

// Keep separate browser tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      const next = event.newValue === 'true';
      if (next !== current) emit(next);
    }
  });
}

/**
 * React hook returning the live maintenance flag. On mount it subscribes to
 * store changes and refreshes from the backend once.
 */
export function useMaintenanceFlag(): boolean {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const listener: Listener = (next) => setValue(next);
    listeners.add(listener);
    setValue(current);
    void refreshMaintenanceFlag();
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return value;
}
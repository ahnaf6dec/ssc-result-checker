import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Simple admin authentication
// ---------------------------------------------------------------------------
// A lightweight, front-end-only gate for the /admin panel. Credentials are the
// fixed pair requested by the project owner. The signed-in state is persisted
// in localStorage so a refresh keeps the admin logged in, and it stays in sync
// across tabs.
//
// NOTE: This is deliberately minimal client-side protection. For real security
// the backend must enforce authentication on the /admin/api/* routes.
// ---------------------------------------------------------------------------

export const ADMIN_EMAIL = 'ahnaf@admin.com';
export const ADMIN_PASSWORD = 'Ahnaf@1008';

const STORAGE_KEY = 'ssc:adminAuthed';

type Listener = (value: boolean) => void;
const listeners = new Set<Listener>();

function readAuthed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

let authed = readAuthed();

function emit(value: boolean): void {
  authed = value;
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {

    /* ignore storage errors */}
  listeners.forEach((listener) => listener(value));
}

/**
 * Validate credentials. Returns true and signs the admin in on success,
 * false otherwise. Comparison is case-insensitive on the email only.
 */
export function login(email: string, password: string): boolean {
  const ok =
  email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
  if (ok) emit(true);
  return ok;
}

export function logout(): void {
  emit(false);
}

export function isAuthenticated(): boolean {
  return authed;
}

// Keep sessions consistent across tabs.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      const next = event.newValue === 'true';
      if (next !== authed) emit(next);
    }
  });
}

/** React hook exposing the live authentication state. */
export function useAuth(): boolean {
  const [value, setValue] = useState(authed);
  useEffect(() => {
    const listener: Listener = (next) => setValue(next);
    listeners.add(listener);
    setValue(authed);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return value;
}
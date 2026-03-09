"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_PREFIX = "co-draft-";

export function useOfflineDraft<T>(key: string, initialValue: T) {
  const storageKey = STORAGE_PREFIX + key;
  const [value, setValue] = useState<T>(initialValue);
  const [hasDraft, setHasDraft] = useState(false);
  const initialized = useRef(false);

  // Check for existing draft on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { data: T; savedAt: string };
        setValue(parsed.data);
        setHasDraft(true);
      }
    } catch {
      // Invalid stored data — ignore
    }
  }, [storageKey]);

  // Auto-save on value changes (debounced)
  useEffect(() => {
    if (!initialized.current) return;

    const timeout = setTimeout(() => {
      try {
        const payload = JSON.stringify({
          data: value,
          savedAt: new Date().toISOString(),
        });
        localStorage.setItem(storageKey, payload);
      } catch {
        // Storage full or unavailable — silently fail
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [value, storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setHasDraft(false);
  }, [storageKey]);

  const restoreDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { data: T; savedAt: string };
        setValue(parsed.data);
        setHasDraft(false); // Dismiss the "restore" prompt
      }
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const dismissDraft = useCallback(() => {
    setHasDraft(false);
  }, []);

  return {
    value,
    setValue,
    hasDraft,
    clearDraft,
    restoreDraft,
    dismissDraft,
  };
}

// Get draft timestamp for display
export function getDraftAge(key: string): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { savedAt: string };
    const saved = new Date(parsed.savedAt);
    const diff = Date.now() - saved.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return null;
  }
}

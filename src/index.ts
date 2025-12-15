import { writable, type Writable, get } from "svelte/store";
import { z } from "zod";

/**
 * An extension of Svelte's `writable` that also saves its state to localStorage and
 * automatically restores it.
 */
export default function storedWritable<T>(
  key: string,
  schema: z.ZodType<T>,
  initialValue: T,
  disableLocalStorage = false
): Writable<T> & { clear: () => void } {
  
  const stored = !disableLocalStorage ? localStorage.getItem(key) : null;

  // Subscribe to window storage event to keep changes from another tab in sync.
  if (!disableLocalStorage && typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key === key) {
        if (event.newValue === null) {
          w.set(initialValue);
          return;
        }

        w.set(schema.parse(JSON.parse(event.newValue)));
      }
    });
  }

  const w = writable<T>(
    stored ? schema.parse(JSON.parse(stored)) : initialValue
  );

  function set(value: T) {
    w.set(value);
    if (!disableLocalStorage) localStorage.setItem(key, JSON.stringify(value));
  }

  function update(updater: (value: T) => T) {
    w.update((current) => {
      const next = updater(current);
      if (!disableLocalStorage) localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }

  function clear() {
    w.set(initialValue);
    if (!disableLocalStorage) localStorage.removeItem(key);
  }

  return {
    subscribe: w.subscribe,
    set,
    update,
    clear,
  };
}

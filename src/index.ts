import { writable, type Writable, get } from 'svelte/store';
import type { z } from 'zod';

/**
 * An extension of Svelte's `writable` that also saves its state to localStorage and
 * automatically restores it.
 * @param key The localStorage key to use for saving the writable's contents.
 * @param schema A Zod schema describing the contents of the writable.
 * @param initialValue The initial value to use if no prior state has been saved in
 * localstorage.
 * @returns A stored writable.
 */
export default function storedWritable<T extends z.ZodType>(
  key: string,
  schema: T,
  initialValue: z.infer<typeof schema>,
  disableLocalStorage = false,
): Writable<z.infer<typeof schema>> & { clear: () => void } {
  const stored = !disableLocalStorage ? localStorage.getItem(key) : null;

  const w = writable<z.infer<typeof schema>>(
    stored ? schema.parse(JSON.parse(stored)) : initialValue,
  );

  /**
   * Set writable value and inform subscribers. Updates the writeable's stored data in
   * localstorage.
   * */
  function set(...args: Parameters<typeof w.set>) {
    w.set(...args);
    if (!disableLocalStorage) localStorage.setItem(key, JSON.stringify(get(w)));
  }

  /**
   * Update writable value using a callback and inform subscribers. Updates the writeable's
   * stored data in localstorage.
   * */
  function update(...args: Parameters<typeof w.update>) {
    w.update(...args);
    if (!disableLocalStorage) localStorage.setItem(key, JSON.stringify(get(w)));
  }

  /**
   * Delete any data saved for this StoredWritable in localstorage.
   */
  function clear() {
    localStorage.removeItem(key);
  }

  return {
    subscribe: w.subscribe,
    set,
    update,
    clear,
  };
}

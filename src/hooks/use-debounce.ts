import { useEffect, useState } from "react";

/**
 * Debounces a rapidly changing value (e.g. a search box) so it can be
 * used as a server-side query param without a request per keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

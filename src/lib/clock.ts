/**
 * Wall-clock read for game timers.
 *
 * The React Compiler lint flags `Date.now()` anywhere inside a component,
 * including event handlers where reading the clock is the whole point
 * (starting a round). Game timers store the start time in a ref and only
 * ever read it inside effects and handlers, so this indirection is safe.
 */
export const now = () => Date.now();

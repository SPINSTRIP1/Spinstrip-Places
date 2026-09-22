/**
 * Client-side state for the Smart Menu: the table a diner scanned, their
 * nickname, orders they've placed, cart transfers and game scores.
 *
 * Everything here lives in localStorage on purpose. The backend has no
 * table, waiter or game concepts yet; when it does, each helper is the one
 * place to swap a storage read for an API call.
 */

const KEYS = {
  table: (merchantId: string) => `spinstrip:table:${merchantId}`,
  nick: "spinstrip:diner-nick",
  order: (id: string) => `spinstrip:order:${id}`,
  orderByRef: (reference: string) => `spinstrip:order-ref:${reference}`,
  lastOrder: "spinstrip:last-order",
  scores: (merchantId: string) => `spinstrip:scores:${merchantId}`,
  cartTags: (merchantId: string) => `spinstrip:cart-tags:${merchantId}`,
  emails: "spinstrip:customer-emails",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked (private mode) — the flow still works for this visit */
  }
}

/* ─────────────────────────── Table & diner ─────────────────────────── */

/** Table number from a scanned QR: `?number=7` (also accepts `table` / `t`). */
export function tableFromSearch(params: URLSearchParams): string | null {
  const raw = params.get("number") ?? params.get("table") ?? params.get("t");
  const value = raw?.trim();
  return value ? value.slice(0, 12) : null;
}

export const getTable = (merchantId: string) =>
  read<string | null>(KEYS.table(merchantId), null);
export const setTable = (merchantId: string, table: string) =>
  write(KEYS.table(merchantId), table);

export const getDinerNick = () => read<string>(KEYS.nick, "");
export const setDinerNick = (nick: string) => write(KEYS.nick, nick.trim());

/* ─────────────────────────── Customer identity ─────────────────────────── */

/**
 * Emails this phone has checked out with. There is no login on the
 * storefront, so this is the guard for the orders page: you only see orders
 * once you have placed one here. The list API itself only needs an email,
 * so never expose an email prompt — that would let anyone browse another
 * customer's history.
 */
export const getKnownEmails = () => read<string[]>(KEYS.emails, []);

export function rememberEmail(email: string) {
  const value = email.trim().toLowerCase();
  if (!value) return;
  const known = getKnownEmails().filter((e) => e !== value);
  write(KEYS.emails, [value, ...known].slice(0, 5));
}

/* ─────────────────────────── Placed orders ─────────────────────────── */

export interface OrderSnapshotLine {
  menuItemId: string;
  name: string;
  quantity: number;
  /** Unit price in naira. */
  price: number;
  image?: string | null;
  /** Nicknames of diners whose transferred cart contributed this line. */
  sourceNicks?: string[];
}

export interface OrderSnapshot {
  /** Backend order id when the API returned one, else the payment reference. */
  id: string;
  reference: string | null;
  merchantId: string;
  restaurantName: string;
  tableNumber: string | null;
  lines: OrderSnapshotLine[];
  total: number;
  customerName: string;
  placedAt: string;
}

export function saveOrderSnapshot(snapshot: OrderSnapshot) {
  write(KEYS.order(snapshot.id), snapshot);
  if (snapshot.reference) write(KEYS.orderByRef(snapshot.reference), snapshot.id);
  write(KEYS.lastOrder, snapshot.id);
}

export const getOrderSnapshot = (id: string) =>
  read<OrderSnapshot | null>(KEYS.order(id), null);

/** Resolve an order id from a payment reference saved at checkout. */
export const orderIdForReference = (reference: string) =>
  read<string | null>(KEYS.orderByRef(reference), null);

export const getLastOrderId = () => read<string | null>(KEYS.lastOrder, null);

/** "#A1B2C3" — the tail of a UUID or reference, readable across a table. */
export function shortOrderCode(id: string) {
  return id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
}

/** Payload the waiter app scans to claim an order. Mirrors the prototype. */
export function receiptQrPayload(snapshot: OrderSnapshot) {
  return JSON.stringify({
    v: 1,
    type: "spinstrip_order",
    restaurant_id: snapshot.merchantId,
    order_id: snapshot.id,
    reference: snapshot.reference,
    table_code: snapshot.tableNumber,
  });
}

/* ─────────────────────────── Cart transfer ─────────────────────────── */

export interface CartTransfer {
  nick: string;
  /** menuItemId → quantity */
  lines: Record<string, number>;
}

const toBase64Url = (text: string) =>
  btoa(unescape(encodeURIComponent(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (text: string) => {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 ? "=".repeat(4 - (padded.length % 4)) : "";
  return decodeURIComponent(escape(atob(padded + pad)));
};

/**
 * The transfer travels inside the QR itself, so the captain's phone needs
 * no server round-trip to receive it.
 */
export function encodeCartTransfer(transfer: CartTransfer) {
  return toBase64Url(JSON.stringify({ v: 1, ...transfer }));
}

export function decodeCartTransfer(code: string): CartTransfer | null {
  try {
    const parsed = JSON.parse(fromBase64Url(code)) as Partial<CartTransfer> & {
      v?: number;
    };
    if (!parsed.lines || typeof parsed.lines !== "object") return null;
    const lines: Record<string, number> = {};
    for (const [id, qty] of Object.entries(parsed.lines)) {
      const n = Number(qty);
      if (id && Number.isFinite(n) && n > 0) lines[id] = Math.floor(n);
    }
    if (!Object.keys(lines).length) return null;
    return { nick: String(parsed.nick ?? "Guest").slice(0, 24), lines };
  } catch {
    return null;
  }
}

/** Which diners' transfers fed each cart line, for "via Ada" labels. */
export type CartTags = Record<string, string[]>;

export const getCartTags = (merchantId: string) =>
  read<CartTags>(KEYS.cartTags(merchantId), {});
export const setCartTags = (merchantId: string, tags: CartTags) =>
  write(KEYS.cartTags(merchantId), tags);

/* ─────────────────────────── Games ─────────────────────────── */

export type GameId = "jigsaw" | "tiles" | "spinanza";

export interface GameScore {
  id: string;
  game: GameId;
  playerName: string;
  score: number;
  detail: string;
  createdAt: string;
}

/** Lower is better only for the puzzle (time + moves). */
export const LOWER_IS_BETTER: Record<GameId, boolean> = {
  jigsaw: true,
  tiles: false,
  spinanza: false,
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function submitScore(
  merchantId: string,
  entry: Omit<GameScore, "id" | "createdAt">,
) {
  const scores = read<GameScore[]>(KEYS.scores(merchantId), []);
  scores.push({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  });
  // Keep the store small: only this week's scores matter.
  const cutoff = Date.now() - WEEK_MS;
  write(
    KEYS.scores(merchantId),
    scores.filter((s) => new Date(s.createdAt).getTime() >= cutoff).slice(-300),
  );
}

export function getLeaderboard(merchantId: string, game: GameId, limit = 20) {
  const cutoff = Date.now() - WEEK_MS;
  const lower = LOWER_IS_BETTER[game];
  return read<GameScore[]>(KEYS.scores(merchantId), [])
    .filter((s) => s.game === game && new Date(s.createdAt).getTime() >= cutoff)
    .sort((a, b) => (lower ? a.score - b.score : b.score - a.score))
    .slice(0, limit);
}

const AVATAR_COLORS = ["#6932E2", "#E2328C", "#32A8E2", "#22B573", "#E2A832", "#E24B32"];

export function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function timeAgo(value: string | number | Date | null | undefined) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

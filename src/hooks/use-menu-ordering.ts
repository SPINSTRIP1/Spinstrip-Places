"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { MenuCart } from "@/app/preview/menu/_components/modals/checkout";
import { maxQuantity } from "@/components/restaurant/ItemSheet";
import { isMenuItemOrderable, type PublicMenuItem } from "@/hooks/use-menu";
import { getCartTags, setCartTags, type CartTags } from "@/lib/smart-menu";

const cartKey = (merchantId: string) => `spinstrip:cart:${merchantId}`;

/**
 * Everything needed to order from one restaurant: the cart (persisted per
 * restaurant, so the restaurant page and an order page share it), the dish
 * sheet, checkout and cart transfer. Pair with `MenuBrowser` and
 * `MenuOrderLayer`. `merchantId` may be null while the page is still
 * finding out which restaurant it is; nothing is read or saved until it is set.
 */
export function useMenuOrdering(merchantId: string | null, items: PublicMenuItem[]) {
  const [cart, setCart] = useState<MenuCart>({});
  const [tags, setTags] = useState<CartTags>({});
  /** True once the saved cart has been read, so it isn't overwritten with an empty one. */
  const [ready, setReady] = useState(false);
  const [openItem, setOpenItem] = useState<PublicMenuItem | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // Restore the saved cart once we're on the client; reading storage during
  // render would break hydration.
  useEffect(() => {
    if (!merchantId) return;
    let saved: MenuCart = {};
    try {
      const raw = localStorage.getItem(cartKey(merchantId));
      if (raw) saved = JSON.parse(raw) as MenuCart;
    } catch {
      /* storage blocked — start empty */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted cart on mount
    setCart(saved);
    setTags(getCartTags(merchantId));
    setReady(true);
  }, [merchantId]);

  useEffect(() => {
    if (!ready || !merchantId) return;
    try {
      localStorage.setItem(cartKey(merchantId), JSON.stringify(cart));
    } catch {
      /* ignore */
    }
    setCartTags(merchantId, tags);
  }, [cart, tags, merchantId, ready]);

  // Only lines for dishes that are still on the menu and orderable count.
  const lines = useMemo(
    () =>
      items
        .filter((item) => cart[item.id] > 0 && isMenuItemOrderable(item))
        .map((item) => ({ item, quantity: cart[item.id] })),
    [items, cart],
  );
  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = lines.reduce(
    (sum, line) => sum + (parseFloat(line.item.price) || 0) * line.quantity,
    0,
  );

  const addToCart = (item: PublicMenuItem, quantity = 1) => {
    if (!isMenuItemOrderable(item)) return;
    const current = cart[item.id] ?? 0;
    const next = Math.min(maxQuantity(item), current + quantity);
    const added = next - current;
    setOpenItem(null);
    if (added <= 0) {
      toast.error(`You already have the maximum of ${item.name}`);
      return;
    }
    setCart({ ...cart, [item.id]: next });
    toast.success(
      `${added} × ${item.name} added${next > added ? ` · ${next} in order` : ""}`,
    );
  };

  // ± on a card. Going below 1 removes the dish; the cap is stock or 20.
  const changeQuantity = (item: PublicMenuItem, delta: number) => {
    const current = cart[item.id] ?? 0;
    const next = current + delta;
    if (next <= 0) {
      const rest = { ...cart };
      delete rest[item.id];
      setCart(rest);
      const restTags = { ...tags };
      delete restTags[item.id];
      setTags(restTags);
      toast.success(`${item.name} removed`);
      return;
    }
    if (next > maxQuantity(item)) {
      toast.error(`You already have the maximum of ${item.name}`);
      return;
    }
    setCart({ ...cart, [item.id]: next });
  };

  // Keep tags in step with the checkout's own edits (remove, quantities).
  const updateCart = (updater: (previous: MenuCart) => MenuCart) => {
    const next = updater(cart);
    setCart(next);
    const keptTags: CartTags = {};
    for (const [id, nicks] of Object.entries(tags)) if (next[id]) keptTags[id] = nicks;
    setTags(keptTags);
  };

  const clearCart = () => {
    setCart({});
    setTags({});
  };

  return {
    items,
    cart,
    setCart,
    tags,
    setTags,
    ready,
    lines,
    cartCount,
    cartTotal,
    openItem,
    setOpenItem,
    checkoutOpen,
    setCheckoutOpen,
    transferOpen,
    setTransferOpen,
    addToCart,
    changeQuantity,
    updateCart,
    clearCart,
  };
}

export type MenuOrdering = ReturnType<typeof useMenuOrdering>;

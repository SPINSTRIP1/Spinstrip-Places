"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";
import CheckOutModal from "@/app/preview/menu/_components/modals/checkout";
import ItemSheet from "@/components/restaurant/ItemSheet";
import TransferSheet from "@/components/restaurant/TransferSheet";
import { findTable, isMenuItemOrderable, usePublicTables } from "@/hooks/use-menu";
import type { MenuOrdering } from "@/hooks/use-menu-ordering";
import type { RestaurantProfile } from "@/hooks/use-restaurants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils";

interface MenuOrderLayerProps {
  restaurant: RestaurantProfile;
  ordering: MenuOrdering;
  /** Table the diner is sitting at, if they scanned one. */
  tableNumber: string | null;
  /** Hide the "Place order" bar (e.g. on a tab that isn't the menu). Sheets still work. */
  showBar?: boolean;
  /** Positions the fixed "Place order" bar for the page it sits on. */
  barClassName: string;
}

/**
 * The ordering overlays that go with `MenuBrowser`: the floating "Place
 * order" bar, the dish sheet, checkout and the cart-transfer sheet.
 */
export default function MenuOrderLayer({
  restaurant,
  ordering,
  tableNumber,
  showBar = true,
  barClassName,
}: MenuOrderLayerProps) {
  const merchantId = restaurant.id;
  const {
    items,
    cart,
    tags,
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
    updateCart,
    clearCart,
  } = ordering;

  // Match the table number to one of the merchant's real tables (its id goes on the order).
  const { tables } = usePublicTables(merchantId);
  const table = findTable(tables, tableNumber);
  const checkoutItem = lines[0]?.item ?? items.find(isMenuItemOrderable) ?? items[0];

  return (
    <>
      {showBar && cartCount > 0 && !checkoutOpen && !openItem && !transferOpen && (
        <div className={cn("fixed z-40", barClassName)}>
          <button
            onClick={() => setCheckoutOpen(true)}
            className="bar-in btn-press sec-gradient flex w-full items-center justify-between rounded-full py-3 pl-4 pr-3 text-white"
            style={{ boxShadow: "0 16px 40px -10px var(--sec-glow)" }}
          >
            <span className="flex items-center gap-3">
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/20">
                <ShoppingBag className="h-4 w-4" />
                <span
                  key={cartCount}
                  className="bump absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary-text"
                >
                  {cartCount}
                </span>
              </span>
              <span className="text-left">
                <span className="block text-[11px] font-medium text-white/80">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                  {tableNumber ? ` · Table ${tableNumber}` : ` · ${restaurant.name}`}
                </span>
                <span className="font-display block text-base font-bold">
                  {formatPrice(cartTotal)}
                </span>
              </span>
            </span>
            <span className="font-display flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-primary-text">
              Place order <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}

      {openItem && (
        <ItemSheet
          item={openItem}
          inCart={cart[openItem.id] ?? 0}
          onClose={() => setOpenItem(null)}
          onAdd={addToCart}
        />
      )}

      {transferOpen && (
        <TransferSheet
          merchantId={merchantId}
          tableNumber={tableNumber}
          cart={cart}
          itemCount={cartCount}
          total={cartTotal}
          onClose={() => setTransferOpen(false)}
          onSent={clearCart}
        />
      )}

      {checkoutItem && (
        <CheckOutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          item={checkoutItem}
          merchantMenu={items}
          cart={cart}
          onCartChange={updateCart}
          restaurantName={restaurant.isNamed ? restaurant.name : undefined}
          tableNumber={table ? tableNumber : null}
          tableId={table?.id ?? null}
          lineTags={tags}
          onTransfer={() => {
            setCheckoutOpen(false);
            setTransferOpen(true);
          }}
        />
      )}
    </>
  );
}

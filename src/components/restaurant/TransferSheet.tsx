"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Users, X } from "lucide-react";
import type { MenuCart } from "@/app/preview/menu/_components/modals/checkout";
import { encodeCartTransfer, getDinerNick, setDinerNick } from "@/lib/smart-menu";
import { formatPrice } from "@/utils";

interface Props {
  merchantId: string;
  tableNumber: string | null;
  cart: MenuCart;
  itemCount: number;
  total: number;
  onClose: () => void;
  /** Called once the QR is shown, so the sender's cart can be cleared. */
  onSent: () => void;
}

/**
 * "Send cart to table captain": encodes this diner's cart into a QR that the
 * captain scans with their camera. The link opens the same restaurant page
 * on the captain's phone and merges the lines into their cart, tagged with
 * the sender's nickname. No server involved.
 */
export default function TransferSheet({
  merchantId,
  tableNumber,
  cart,
  itemCount,
  total,
  onClose,
  onSent,
}: Props) {
  const [nick, setNick] = useState("");
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setNick(getDinerNick());
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const generate = async () => {
    const name = nick.trim() || "Guest";
    setDinerNick(name);
    const code = encodeCartTransfer({ nick: name, lines: cart });
    const url = new URL(`/restaurants/${merchantId}`, window.location.origin);
    if (tableNumber) url.searchParams.set("number", tableNumber);
    url.searchParams.set("transfer", code);
    const dataUrl = await QRCode.toDataURL(url.toString(), {
      margin: 1,
      width: 320,
      color: { dark: "#0F0F0F", light: "#FFFFFF" },
    });
    setQr(dataUrl);
    onSent();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Send cart to table captain"
    >
      <div className="sheet-overlay absolute inset-0 bg-primary-text/50 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-panel relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Group order</p>
            <h3 className="font-display mt-0.5 text-xl font-bold text-primary-text">
              {qr ? "Cart ready to transfer" : "Send cart to table captain"}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-primary-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {qr ? (
          <div className="mt-4 text-center">
            <p className="text-sm text-secondary-text">
              The captain scans this with their phone camera. Your {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"} ({formatPrice(total)}) join their cart tagged
              “{nick.trim() || "Guest"}”, and they place one order for the table.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URI */}
            <img src={qr} alt="Cart transfer QR code" className="mx-auto mt-4 w-64 rounded-2xl border border-background-light bg-white p-2" />
            <p className="mt-2 text-xs text-secondary-text">
              {tableNumber ? `Table ${tableNumber} · ` : ""}your own cart has been cleared
            </p>
            <button
              onClick={onClose}
              className="btn-press mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-start gap-3 rounded-2xl bg-background p-3.5 text-sm text-secondary-text">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Everyone builds their own cart, then sends it to one person at the table. The captain places
                and pays for a single order.
              </p>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary-text">Your nickname</span>
              <input
                value={nick}
                onChange={(e) => setNick(e.target.value.slice(0, 24))}
                placeholder="e.g. Ada"
                autoComplete="nickname"
                className="mt-1.5 h-11 w-full rounded-xl border border-background-light bg-white px-3 text-sm text-primary-text outline-none focus:border-primary"
              />
            </label>
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-background-light p-3 text-sm">
              <span className="text-secondary-text">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
              <span className="font-display font-bold text-primary-text">{formatPrice(total)}</span>
            </div>
            <button
              onClick={generate}
              disabled={itemCount === 0}
              className="btn-press mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_-8px_rgba(105,50,226,0.6)] disabled:opacity-50"
            >
              <QrCode className="h-4 w-4" /> Generate transfer QR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Success from "@/components/ui/success";
import Loader from "@/components/loader";
import { useFetch } from "@/hooks/use-fetch";
import { MENU_API_URL } from "@/constants";
import { VerifyMenuPaymentResponse } from "@/hooks/use-menu";
import { MENU_ORDER_REFERENCE_KEY } from "../_components/modals/checkout";
import { getOrderSnapshot, orderIdForReference } from "@/lib/smart-menu";

// The verify endpoint doesn't document its status values, so accept the
// common spellings for a failed payment. Anything else that isn't an error
// counts as settled or settling — the order page shows the live status.
const FAILED_STATUSES = ["FAILED", "ABANDONED", "CANCELLED", "REVERSED"];

function readStoredReference() {
  try {
    return sessionStorage.getItem(MENU_ORDER_REFERENCE_KEY);
  } catch {
    return null;
  }
}

/**
 * Payment providers return here. This page only verifies the payment and
 * moves on: a settled order goes straight to its Smart Menu page (receipt
 * QR, status, games); only a failure stays here so the customer can retry.
 */
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Paystack appends both `reference` and `trxref` to the callback URL; fall
  // back to the reference saved at checkout for providers that don't.
  const [storedReference] = useState(() =>
    typeof window === "undefined" ? null : readStoredReference(),
  );
  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref") ||
    storedReference;

  const { data, loading, error, refetch } = useFetch<VerifyMenuPaymentResponse>(
    {
      route: `${MENU_API_URL}/menu/payments/verify/${reference}`,
      enabled: !!reference,
      showErrorMessage: false,
    },
  );

  const paymentStatus = (
    data?.data?.paymentStatus ?? data?.data?.status
  )?.toUpperCase();
  const isFailed =
    !reference ||
    (!!paymentStatus && FAILED_STATUSES.includes(paymentStatus)) ||
    (!!error && !loading);
  const backendOrderId = data?.data?.orderId;

  // Where to send the customer once the payment checks out: the order the
  // API named, else the one this phone saved at checkout, else their list.
  const [destination, setDestination] = useState<string | null>(null);
  useEffect(() => {
    if (!reference || loading || isFailed || !data) return;
    const orderId =
      backendOrderId ||
      orderIdForReference(reference) ||
      (getOrderSnapshot(reference) ? reference : null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resolving the order from browser storage
    setDestination(
      orderId
        ? `/orders/${orderId}?ref=${encodeURIComponent(reference)}`
        : "/orders",
    );
  }, [reference, loading, isFailed, data, backendOrderId]);

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (!isFailed) {
    return (
      <Loader
        label={
          destination ? "Opening your order…" : "Confirming your payment…"
        }
      />
    );
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-background-light bg-white shadow-lg">
          <div className="flex flex-col items-center px-6 pb-6 pt-10 text-center">
            <Success type="info" />
            <h1 className="mt-5 text-2xl font-bold text-primary-text">
              {reference ? "Payment not completed" : "No payment to verify"}
            </h1>
            <p className="mt-2 text-sm text-secondary-text">
              {reference
                ? "We couldn't confirm your payment. If you were debited, don't worry — your order will be confirmed once the payment settles, and it will appear under My orders."
                : "This page opens automatically after a payment. Start an order from a restaurant's menu."}
            </p>
            {reference && (
              <p className="mt-4 rounded-full bg-background px-3 py-1 text-xs text-secondary-text">
                Reference <span className="font-semibold text-primary-text">{reference}</span>
              </p>
            )}
          </div>

          <div className="space-y-3 px-6 pb-6">
            {reference && (
              <Button
                onClick={() => refetch()}
                className="w-full"
                size="lg"
              >
                Check again
              </Button>
            )}
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/orders">Go to my orders</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full" size="lg">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-x-1.5 pt-6">
          <p className="text-sm">Powered by</p>
          <Image
            src="/logo-black.svg"
            alt="SpinStrip"
            width={100}
            height={100}
            className="h-[24px] w-[78px] object-contain"
          />
        </div>
      </div>
    </section>
  );
}

export default function MenuOrderSuccessPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SuccessContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChefHatIcon,
  Mail01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import Success from "@/components/ui/success";
import Loader from "@/components/loader";
import { useFetch } from "@/hooks/use-fetch";
import { MENU_API_URL } from "@/constants";
import { VerifyMenuPaymentResponse } from "@/hooks/use-menu";
import { MENU_ORDER_REFERENCE_KEY } from "../_components/modals/checkout";
import { formatAmount } from "@/utils";

// The verify endpoint doesn't document its status values, so accept the
// common spellings for a settled or a failed payment.
const VERIFIED_STATUSES = ["COMPLETED", "SUCCESS", "SUCCESSFUL", "PAID", "CONFIRMED"];
const FAILED_STATUSES = ["FAILED", "ABANDONED", "CANCELLED", "REVERSED"];

function DashedDivider() {
  return (
    <div
      className="w-full h-[2px]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #C8C8C8 8px, transparent 8px)",
        backgroundSize: "16px 2px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

function readStoredReference() {
  try {
    return sessionStorage.getItem(MENU_ORDER_REFERENCE_KEY);
  } catch {
    return null;
  }
}

function SuccessContent() {
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
  const amount = data?.data?.amount ?? data?.data?.totalAmount;
  const isVerified = !!paymentStatus && VERIFIED_STATUSES.includes(paymentStatus);
  const isFailed =
    (!!paymentStatus && FAILED_STATUSES.includes(paymentStatus)) ||
    (!!error && !loading);

  // Verifying state
  if (reference && loading) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-primary-text">
              Verifying your payment...
            </h1>
            <p className="text-sm text-secondary-text">
              Hold on while we confirm your order.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header band */}
          <div className="bg-primary/5 flex flex-col items-center text-center px-6 pt-10 pb-6">
            <Success type={isFailed ? "info" : "success"} />
            <h1 className="text-2xl font-bold text-primary-text mt-5">
              {isFailed
                ? "Payment Not Completed"
                : isVerified
                  ? "Order Confirmed!"
                  : "Order Received!"}
            </h1>
            <p className="text-sm text-secondary-text mt-2">
              {isFailed
                ? "We couldn't confirm your payment. If you were debited, don't worry — your order will be confirmed once the payment settles."
                : "The restaurant has your order. A receipt with your order details is on its way to your inbox."}
            </p>
          </div>

          <div className="px-6 py-2">
            <DashedDivider />
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-4">
            {reference && (
              <div className="flex items-start justify-between gap-x-4">
                <p className="text-sm text-secondary-text">Reference</p>
                <p className="text-sm font-bold text-primary-text text-right break-all">
                  {reference}
                </p>
              </div>
            )}
            {amount !== undefined && amount !== null && (
              <div className="flex items-center justify-between gap-x-4">
                <p className="text-sm text-secondary-text">Amount</p>
                <p className="text-sm font-bold text-primary-text">
                  {formatAmount(amount)}
                </p>
              </div>
            )}
            {paymentStatus && (
              <div className="flex items-center justify-between gap-x-4">
                <p className="text-sm text-secondary-text">Payment Status</p>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isVerified
                      ? "bg-green-100 text-green-700"
                      : isFailed
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
            )}
          </div>

          {!isFailed && (
            <>
              <div className="px-6 py-2">
                <DashedDivider />
              </div>

              <div className="px-6 py-4 space-y-3">
                <h2 className="text-sm font-bold text-primary-text">
                  What happens next?
                </h2>
                <div className="flex items-center gap-x-3">
                  <div className="bg-primary-accent rounded-full p-2 shrink-0">
                    <HugeiconsIcon icon={Mail01Icon} size={18} color="#6932E2" />
                  </div>
                  <p className="text-sm text-secondary-text">
                    Check your email for your order receipt.
                  </p>
                </div>
                <div className="flex items-center gap-x-3">
                  <div className="bg-primary-accent rounded-full p-2 shrink-0">
                    <HugeiconsIcon
                      icon={ChefHatIcon}
                      size={18}
                      color="#6932E2"
                    />
                  </div>
                  <p className="text-sm text-secondary-text">
                    The kitchen starts preparing once your payment is confirmed.
                  </p>
                </div>
                <div className="flex items-center gap-x-3">
                  <div className="bg-primary-accent rounded-full p-2 shrink-0">
                    <HugeiconsIcon
                      icon={ShoppingBag01Icon}
                      size={18}
                      color="#6932E2"
                    />
                  </div>
                  <p className="text-sm text-secondary-text">
                    Keep your reference handy if you need to contact the
                    restaurant.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="px-6 pt-2 pb-6 space-y-3">
            {isFailed && reference && (
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="w-full"
                size={"lg"}
              >
                Retry Verification
              </Button>
            )}
            <Button asChild className="w-full" size={"lg"}>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-x-1.5 pt-6">
          <p className="text-sm">Powered by</p>
          <Image
            src={"/logo-black.svg"}
            alt="SpinStrip"
            width={100}
            height={100}
            className="w-[78px] h-[24px] object-contain"
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

import { Suspense } from "react";
import type { Metadata } from "next";
import AuroraBackground from "@/components/AuroraBackground";
import Loader from "@/components/loader";
import OrderExperience from "@/components/smart-menu/OrderExperience";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Your order",
  description: "Show your receipt QR to a waiter, track your order and play while you wait.",
};

/** Post-payment Smart Menu page. `id` is the order id (or payment reference). */
export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <>
      <AuroraBackground />
      <Suspense fallback={<Loader label="Opening your order…" />}>
        <OrderExperience orderId={id} />
      </Suspense>
    </>
  );
}

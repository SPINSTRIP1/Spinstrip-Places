import type { Metadata } from "next";
import AuroraBackground from "@/components/AuroraBackground";
import Header from "@/components/Header";
import OrdersList from "@/components/smart-menu/OrdersList";

export const metadata: Metadata = {
  title: "My orders",
  description: "Orders you've placed on SpinStrip, with receipt QR, status and table games.",
};

export default function OrdersPage() {
  return (
    <>
      <AuroraBackground />
      <Header />
      <OrdersList />
    </>
  );
}

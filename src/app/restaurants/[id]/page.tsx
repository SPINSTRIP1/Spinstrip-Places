import { Suspense } from "react";
import type { Metadata } from "next";
import Loader from "@/components/loader";
import RestaurantPage from "@/components/restaurant/RestaurantPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Restaurant",
  description: "Build your order from this kitchen's menu and pay on SpinStrip.",
};

/**
 * `id` is the merchant's user id — the only restaurant key the menu API
 * exposes. Everything else about the storefront is loaded on the client.
 */
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // useSearchParams() inside RestaurantPage needs a Suspense boundary.
  return (
    <Suspense fallback={<Loader label="Loading the menu…" />}>
      <RestaurantPage merchantId={id} />
    </Suspense>
  );
}

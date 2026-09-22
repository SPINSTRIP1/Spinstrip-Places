"use client";

import { Toaster as HotToaster } from "react-hot-toast";

/**
 * Mounts the react-hot-toast host once for the whole app. The checkouts
 * already call `toast.error(...)`; without a host those messages were
 * silently dropped.
 */
export default function Toaster() {
  return (
    <HotToaster
      position="top-center"
      gutter={8}
      containerStyle={{ top: 80 }}
      toastOptions={{
        duration: 2600,
        style: {
          background: "#0F0F0F",
          color: "#FFFFFF",
          borderRadius: 9999,
          padding: "10px 16px",
          fontSize: 14,
          fontWeight: 500,
          boxShadow: "0 16px 40px -12px rgba(15, 15, 15, 0.5)",
        },
        success: { iconTheme: { primary: "#22C55E", secondary: "#0F0F0F" } },
        error: { iconTheme: { primary: "#F87171", secondary: "#0F0F0F" } },
      }}
    />
  );
}

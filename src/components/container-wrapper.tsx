import React from "react";
import { cn } from "@/lib/utils";

export default function ContainerWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[32px] border border-background-light bg-white p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

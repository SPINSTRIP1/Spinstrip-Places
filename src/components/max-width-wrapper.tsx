"use client";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const MaxWidthWrapper = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "h-full mx-auto max-w-7xl w-full p-3 lg:py-5 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default MaxWidthWrapper;

import React from "react";

export default function ContainerWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[32px] bg-[#f8f8f8] p-4 ${className}`}>
      {children}
    </div>
  );
}

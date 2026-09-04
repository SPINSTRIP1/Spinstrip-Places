"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface ConsentCheckProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

/** Marketing-consent checkbox with a properly associated, clickable label. */
export default function ConsentCheck({
  id,
  checked,
  onChange,
  children,
}: ConsentCheckProps) {
  return (
    <div className="flex items-start gap-x-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-0.5"
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-sm leading-relaxed text-secondary-text"
      >
        {children}
      </label>
    </div>
  );
}

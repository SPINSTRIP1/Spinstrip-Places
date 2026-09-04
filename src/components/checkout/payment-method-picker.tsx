"use client";

import OptionCard from "@/components/checkout/option-card";

export interface PaymentOption<T extends string> {
  value: T;
  label: string;
  hint: string;
  disabled?: boolean;
}

interface PaymentMethodPickerProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly PaymentOption<T>[];
}

/**
 * Provider picker. The two checkouts post different field names
 * (`paymentMethod` vs `paymentProvider`) with different enums, so the
 * options are passed in — the presentation stays shared.
 */
export default function PaymentMethodPicker<T extends string>({
  value,
  onChange,
  options,
}: PaymentMethodPickerProps<T>) {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Payment method">
      {options.map((option) => (
        <OptionCard
          key={option.value}
          selected={value === option.value}
          disabled={option.disabled}
          onSelect={() => onChange(option.value)}
          title={option.label}
          subtitle={option.hint}
        />
      ))}
    </div>
  );
}

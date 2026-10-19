"use client";

import { Control } from "react-hook-form";
import { FormInput } from "@/components/ui/form-input";
import type { ContactFormData } from "@/lib/contact";

/** Full name, email and phone — the only details a checkout asks for. */
export default function ContactFields({ control }: { control: Control<ContactFormData> }) {
  return (
    <div className="space-y-4">
      <FormInput
        control={control}
        name="fullName"
        label="Full Name"
        placeholder="e.g. Ada Obi"
        type="text"
        autoComplete="name"
      />
      <FormInput
        control={control}
        name="email"
        label="Email Address"
        placeholder="you@example.com"
        autoComplete="email"
        inputMode="email"
      />
      <FormInput
        control={control}
        name="phone"
        label="Phone Number"
        placeholder="+2348012345678"
        type="text"
        autoComplete="tel"
        inputMode="tel"
      />
    </div>
  );
}

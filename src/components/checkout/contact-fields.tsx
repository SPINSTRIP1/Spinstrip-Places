"use client";

import { useEffect, useId, useState } from "react";
import { Control, useFormContext } from "react-hook-form";
import ConsentCheck from "@/components/checkout/consent-check";
import { FormInput } from "@/components/ui/form-input";
import {
  clearSavedContact,
  getRememberContact,
  getSavedContact,
  setRememberContact,
  type ContactFormData,
} from "@/lib/contact";

const FIELDS = ["fullName", "email", "phone"] as const;

/**
 * Full name, email and phone — the only details a checkout asks for — plus
 * "Remember my details" and, when they were filled in from a past checkout,
 * a "Not you?" link for shared phones. Must sit inside the form's FormProvider.
 */
export default function ContactFields({ control }: { control: Control<ContactFormData> }) {
  const { setValue } = useFormContext<ContactFormData>();
  const rememberId = useId();
  const [remember, setRemember] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  // Storage is only readable in the browser, after the first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setRemember(getRememberContact());
    setHasSaved(getSavedContact() !== null);
  }, []);

  const forgetMe = () => {
    clearSavedContact();
    setHasSaved(false);
    for (const field of FIELDS) setValue(field, "");
  };

  const changeRemember = (next: boolean) => {
    setRemember(next);
    setRememberContact(next);
    if (!next) setHasSaved(false);
  };

  return (
    <div className="space-y-4">
      {hasSaved && (
        <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl bg-background px-3.5 py-2.5 text-xs text-secondary-text">
          Filled in from your last checkout on this device.
          <button
            type="button"
            onClick={forgetMe}
            className="font-bold text-primary hover:underline"
          >
            Not you? Clear
          </button>
        </p>
      )}
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
      <ConsentCheck id={rememberId} checked={remember} onChange={changeRemember}>
        Remember my details on this device for next time
      </ConsentCheck>
    </div>
  );
}

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { getSavedContact, type ContactFormData } from "@/lib/contact";

const FIELDS = ["fullName", "email", "phone"] as const;

/**
 * Prefills a checkout's contact fields with the details saved from the last
 * checkout (`saveContact`) each time it opens. Fields the customer has already
 * typed in are left alone.
 */
export function useSavedContact(form: UseFormReturn<ContactFormData>, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const saved = getSavedContact();
    if (!saved) return;
    for (const field of FIELDS) {
      if (!form.getValues(field)) form.setValue(field, saved[field]);
    }
  }, [form, isOpen]);
}

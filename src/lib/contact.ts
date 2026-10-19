import z from "zod";

/**
 * The three contact fields every checkout asks for — full name, email and
 * phone — and the helpers that turn them into what each API expects
 * (first/last name for places and events, `customerName` for menu orders,
 * and the `confirmEmail` the places and events APIs still require).
 */
export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Please enter your full name")
    .max(100, "Name must be 100 characters or fewer")
    .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
      message: "Please enter your first and last name",
    }),
  email: z.email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(20, "Phone number must be 20 characters or fewer")
    .regex(/^\+?[0-9][0-9\s-]{8,18}$/, "Please enter a valid phone number"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const EMPTY_CONTACT: ContactFormData = { fullName: "", email: "", phone: "" };

/** "Ada Grace Obi" → { firstName: "Ada", lastName: "Grace Obi" }. */
export function splitFullName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

/** Phone without spaces or dashes, as the APIs store it. */
export const normalisePhone = (phone: string) => phone.replace(/[\s-]/g, "");

/* ─────────────────────────── Remembered details ─────────────────────────── */

const SAVED_CONTACT_KEY = "spinstrip:contact";
/** "0" when the customer unticked "Remember my details"; remembering is the default. */
const REMEMBER_KEY = "spinstrip:contact-remember";

/** Whether checkouts on this browser should save the customer's details. */
export function getRememberContact(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(REMEMBER_KEY) !== "0";
  } catch {
    return true;
  }
}

/** Saves the choice; turning it off also forgets anything already saved. */
export function setRememberContact(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (!remember) clearSavedContact();
}

/** Forget the saved details ("Not you?"). */
export function clearSavedContact() {
  try {
    localStorage.removeItem(SAVED_CONTACT_KEY);
  } catch {
    /* ignore */
  }
}

/** The details this browser last checked out with, if any. */
export function getSavedContact(): ContactFormData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVED_CONTACT_KEY);
    if (!raw) return null;
    const parsed = contactSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Remember the details for the next checkout, unless the customer opted out. */
export function saveContact(contact: ContactFormData) {
  if (!getRememberContact()) return;
  try {
    localStorage.setItem(
      SAVED_CONTACT_KEY,
      JSON.stringify({
        fullName: contact.fullName.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
      }),
    );
  } catch {
    /* storage blocked (private mode) — they'll just type it again */
  }
}

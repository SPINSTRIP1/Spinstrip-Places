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

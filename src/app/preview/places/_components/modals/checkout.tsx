"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { format, differenceInCalendarDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import {
  Globe02Icon,
  Location01Icon,
  Sofa01Icon,
  Time01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import SideModal from "@/components/side-modal";
import SectionHeader from "@/components/section-header";
import EmptyState from "@/components/empty-state";
import { FormInput } from "@/components/ui/form-input";
import { Calendar } from "@/components/ui/calendar";
import CheckoutSteps from "@/components/checkout/checkout-steps";
import CheckoutActions from "@/components/checkout/checkout-actions";
import OptionCard from "@/components/checkout/option-card";
import ConsentCheck from "@/components/checkout/consent-check";
import PaymentMethodPicker from "@/components/checkout/payment-method-picker";
import SummaryCard, { SummaryRow } from "@/components/checkout/summary-card";
import {
  CheckoutFooter,
  CheckoutHeader,
} from "@/components/checkout/checkout-header";
import {
  BookFacilityPayload,
  BookFacilityResponse,
  PlacePaymentMethod,
  PublicFacility,
  PublicPlace,
} from "@/hooks/use-places";
import { getOperatingHoursDisplay } from "@/lib/utils";
import { formatAmount } from "@/utils";
import { PLACES_API_URL } from "@/constants";
import apiClient from "@/lib/api/axios-client";
import { handleAxiosError } from "@/lib/api/handle-axios-error";

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: PublicPlace;
  /** Facility the user clicked "Book" on. Falls back to an in-modal picker. */
  facility?: PublicFacility | null;
  /** Signed-in user, when there is one. Sent as `userId`. */
  userId?: string;
}

/**
 * Mirrors the body of `POST /places/public/book`. `placeId`, `facilityId`,
 * `feeId`, the check-in/out timestamps, the consents and the payment method
 * live in component state (they're pickers, not text inputs); everything else
 * is a form field.
 */
const bookingSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters"),
    email: z.email("Please enter a valid email address"),
    confirmEmail: z.string().min(1, "Please confirm your email address"),
    phone: z
      .string()
      .min(10, "Please enter a valid phone number")
      .regex(/^\+?[0-9][0-9\s-]{8,19}$/, "Please enter a valid phone number"),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Emails don't match",
    path: ["confirmEmail"],
  });

type BookingFormData = z.infer<typeof bookingSchema>;

const DEFAULT_CHECK_IN_TIME = "14:00";
const DEFAULT_CHECK_OUT_TIME = "11:00";

const PAYMENT_OPTIONS = [
  {
    value: "PAYSTACK",
    label: "Paystack",
    hint: "Card, bank transfer or USSD",
  },
  {
    value: "LEDGER_BLOCK",
    label: "Fuspay",
    hint: "Card, bank transfer or USSD",
  },
] as const satisfies readonly {
  value: PlacePaymentMethod;
  label: string;
  hint: string;
}[];

const STEPS = ["Your stay", "Details & payment"];

/** Combines a calendar date with an "HH:mm" time into an ISO 8601 string. */
function toIsoDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, 0, 0);
  return combined.toISOString();
}

export default function CheckOutModal({
  isOpen,
  onClose,
  place,
  facility,
  userId,
}: CheckOutModalProps) {
  const router = useRouter();
  const facilities = useMemo(() => place.facilities ?? [], [place.facilities]);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    facility?.id ?? facilities[0]?.id ?? "",
  );
  const [selectedFeeId, setSelectedFeeId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [checkInTime, setCheckInTime] = useState(DEFAULT_CHECK_IN_TIME);
  const [checkOutTime, setCheckOutTime] = useState(DEFAULT_CHECK_OUT_TIME);
  const [paymentMethod, setPaymentMethod] =
    useState<PlacePaymentMethod>("PAYSTACK");
  const [consents, setConsents] = useState({ place: false, news: false });
  const [loading, setLoading] = useState(false);

  const [bookedFacilityId, setBookedFacilityId] = useState(facility?.id);
  if (facility?.id !== bookedFacilityId) {
    setBookedFacilityId(facility?.id);
    setSelectedFacilityId(facility?.id ?? facilities[0]?.id ?? "");
  }

  const selectedFacility = useMemo(
    () => facilities.find((item) => item.id === selectedFacilityId) ?? null,
    [facilities, selectedFacilityId],
  );

  const fees = useMemo(
    () =>
      (selectedFacility?.fees ?? []).filter((fee) => fee.isActive !== false),
    [selectedFacility],
  );

  // Default to the first rate rather than resetting `selectedFeeId` in an
  // effect, so switching facility never renders with a stale fee selected.
  const selectedFee = useMemo(
    () => fees.find((fee) => fee.id === selectedFeeId) ?? fees[0] ?? null,
    [fees, selectedFeeId],
  );

  /** A facility with no active fee tier is free to book. */
  const isFree = fees.length === 0;

  const nights =
    dateRange?.from && dateRange?.to
      ? Math.max(differenceInCalendarDays(dateRange.to, dateRange.from), 1)
      : 0;

  const unitAmount = selectedFee ? Number(selectedFee.amount) || 0 : 0;
  const totalAmount = unitAmount * Math.max(nights, 1);

  const hasDates = !!dateRange?.from && !!dateRange?.to;
  const canContinue =
    !!selectedFacility && hasDates && (isFree || !!selectedFee);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      confirmEmail: "",
      phone: "",
    },
  });

  const handleReset = useCallback(() => {
    form.reset();
    setCurrentStep(1);
    setDateRange(undefined);
    setCheckInTime(DEFAULT_CHECK_IN_TIME);
    setCheckOutTime(DEFAULT_CHECK_OUT_TIME);
    setConsents({ place: false, news: false });
    setPaymentMethod("PAYSTACK");
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selectedFacility || !dateRange?.from || !dateRange?.to) {
      toast.error("Please select a facility and your stay dates");
      return;
    }
    if (!isFree && !selectedFee) {
      toast.error("Please select a rate");
      return;
    }

    const checkInDate = toIsoDateTime(dateRange.from, checkInTime);
    const checkOutDate = toIsoDateTime(dateRange.to, checkOutTime);

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      toast.error("Check-out must be after check-in");
      return;
    }

    const payload: BookFacilityPayload = {
      placeId: place.id as string,
      facilityId: selectedFacility.id,
      checkInDate,
      checkOutDate,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      confirmEmail: values.confirmEmail,
      phone: values.phone,
      marketingConsentPlace: consents.place,
      marketingConsentNews: consents.news,
      callbackUrl: `${window.location.origin}/preview/places/success`,
    };

    // `feeId` and `paymentMethod` are only meaningful for paid facilities.
    if (!isFree && selectedFee) {
      payload.feeId = selectedFee.id;
      payload.paymentMethod = paymentMethod;
    }
    if (userId) payload.userId = userId;

    setLoading(true);
    try {
      const res = await apiClient.post<BookFacilityResponse>(
        `${PLACES_API_URL}/places/public/book`,
        payload,
      );

      const data = res.data.data;
      const paymentUrl =
        data?.payment?.authorizationUrl ?? data?.authorizationUrl;

      if (paymentUrl) {
        setLoading(false);
        // Hand off to the provider; it returns to callbackUrl on completion.
        window.location.assign(paymentUrl);
        return;
      }

      // Nothing to pay (free facility) — go straight to the success page.
      const reference =
        data?.payment?.reference ??
        data?.reference ??
        data?.bookingId ??
        data?.id ??
        "";
      toast.success("Booking confirmed!");
      handleReset();
      onClose();
      router.push(`/preview/places/success?reference=${reference}`);
    } catch (error) {
      const err = handleAxiosError(error as AxiosError);
      toast.error(err || "Something went wrong");
      setLoading(false);
    }
  });

  const stayLabel = hasDates
    ? `${format(dateRange!.from!, "d MMM yyyy")} → ${format(dateRange!.to!, "d MMM yyyy")}`
    : "Not selected";

  const nightCount = Math.max(nights, 1);

  const orderSummary = (
    <SummaryCard
      total={isFree ? "Free" : formatAmount(totalAmount)}
      note={hasDates ? undefined : "Pick your dates to see the full total."}
    >
      <SummaryRow
        label="Facility"
        value={selectedFacility?.name ?? "None selected"}
        muted={!selectedFacility}
      />
      <SummaryRow label="Stay" value={stayLabel} muted={!hasDates} />
      {hasDates && (
        <SummaryRow
          label="Check-in / Check-out"
          value={`${checkInTime} / ${checkOutTime}`}
        />
      )}
      {isFree ? (
        <SummaryRow label="Access" value="Free" />
      ) : (
        <SummaryRow
          label={`${nightCount} ${nightCount === 1 ? "night" : "nights"} × ${
            selectedFee?.name ?? "Rate"
          }`}
          value={formatAmount(unitAmount)}
        />
      )}
    </SummaryCard>
  );

  const missingLabel = !selectedFacility
    ? "Choose a facility to continue"
    : !hasDates
      ? "Select your check-in and check-out dates"
      : undefined;

  return (
    <SideModal
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout"
      subtitle={place.name}
    >
      <FormProvider {...form}>
        <div className="space-y-6 pb-2">
          <CheckoutHeader
            image={selectedFacility?.images?.[0] || place.coverImage}
            title={place.name}
            metas={[
              {
                icon: Location01Icon,
                label: [place.city, place.state].filter(Boolean).join(", "),
              },
              {
                icon: Time01Icon,
                label: getOperatingHoursDisplay(place.operatingHours),
              },
              ...(place.website
                ? [{ icon: Globe02Icon, label: place.website }]
                : []),
            ]}
          />

          <CheckoutSteps
            current={currentStep}
            steps={STEPS}
            onStepClick={setCurrentStep}
          />

          {currentStep === 1 && (
            <div className="space-y-6">
              {facilities.length === 0 ? (
                <EmptyState
                  icon={<HugeiconsIcon icon={Sofa01Icon} size={26} />}
                  title="Nothing bookable yet"
                  description="This place hasn't published any bookable facilities. Follow it to hear when reservations open."
                />
              ) : (
                <>
                  {facilities.length > 1 && (
                    <section className="space-y-3">
                      <SectionHeader
                        title="Choose a facility"
                        badge={`${facilities.length}`}
                      />
                      <div
                        className="grid gap-3 sm:grid-cols-2"
                        role="radiogroup"
                      >
                        {facilities.map((item) => {
                          const from = (item.fees ?? [])
                            .map((fee) => Number(fee.amount) || 0)
                            .sort((a, b) => a - b)[0];
                          return (
                            <OptionCard
                              key={item.id}
                              selected={item.id === selectedFacilityId}
                              onSelect={() => setSelectedFacilityId(item.id)}
                              image={item.images?.[0] || place.coverImage}
                              title={item.name}
                              subtitle={
                                from
                                  ? `${item.facilityCategory} · from ${formatAmount(from)}`
                                  : `${item.facilityCategory} · Free`
                              }
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}

                  <section className="space-y-3">
                    <SectionHeader
                      title="Select a rate"
                      subtitle={
                        fees.length
                          ? "Rates are charged per night of your stay."
                          : undefined
                      }
                    />
                    {fees.length === 0 ? (
                      <EmptyState
                        variant="inline"
                        title={
                          selectedFacility
                            ? "No payment required"
                            : "No facility selected"
                        }
                        description={
                          selectedFacility
                            ? "This facility is free to book — just pick your dates below."
                            : "Choose a facility above to see its rates."
                        }
                      />
                    ) : (
                      <div className="space-y-3" role="radiogroup">
                        {fees.map((fee) => (
                          <OptionCard
                            key={fee.id}
                            selected={fee.id === selectedFee?.id}
                            onSelect={() => setSelectedFeeId(fee.id)}
                            title={fee.name}
                            subtitle={fee.description}
                            trailing={formatAmount(fee.amount)}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <SectionHeader
                      title="Your stay"
                      subtitle={
                        hasDates
                          ? `${nightCount} ${nightCount === 1 ? "night" : "nights"} selected`
                          : "Pick a check-in and a check-out date."
                      }
                    />

                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          { label: "Check in", date: dateRange?.from },
                          { label: "Check out", date: dateRange?.to },
                        ] as const
                      ).map((slot) => (
                        <div
                          key={slot.label}
                          className="rounded-2xl border border-background-light bg-white px-3 py-2"
                        >
                          <p className="text-xs uppercase tracking-wide text-secondary-text">
                            {slot.label}
                          </p>
                          <p className="truncate text-sm font-bold text-primary-text">
                            {slot.date
                              ? format(slot.date, "d MMM yyyy")
                              : "Select a date"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-background-light bg-white p-2">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                        disabled={{ before: new Date() }}
                        className="w-full p-0 [--cell-size:2.25rem]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="checkInTime"
                          className="text-xs font-bold uppercase tracking-wide text-secondary-text"
                        >
                          Check-in time
                        </label>
                        <input
                          id="checkInTime"
                          type="time"
                          value={checkInTime}
                          onChange={(e) => setCheckInTime(e.target.value)}
                          className="w-full rounded-2xl border border-background-light bg-white px-3 py-2.5 text-sm text-primary-text focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="checkOutTime"
                          className="text-xs font-bold uppercase tracking-wide text-secondary-text"
                        >
                          Check-out time
                        </label>
                        <input
                          id="checkOutTime"
                          type="time"
                          value={checkOutTime}
                          onChange={(e) => setCheckOutTime(e.target.value)}
                          className="w-full rounded-2xl border border-background-light bg-white px-3 py-2.5 text-sm text-primary-text focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </section>

                  {orderSummary}

                  <CheckoutActions
                    submitLabel="Continue to details"
                    submitDisabled={!canContinue}
                    onSubmit={() => setCurrentStep(2)}
                    hint={missingLabel}
                  />
                </>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {orderSummary}

              <section className="space-y-3">
                <SectionHeader
                  title="Contact information"
                  subtitle="Your booking confirmation is sent to this email address."
                />
                <p className="text-sm text-secondary-text">
                  <Link href="/login" className="font-bold text-primary">
                    Log in to SpinStrip
                  </Link>{" "}
                  to check out faster next time.
                </p>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      control={form.control}
                      name="firstName"
                      label="First Name"
                      placeholder="Enter First name"
                      type="text"
                    />
                    <FormInput
                      control={form.control}
                      name="lastName"
                      label="Last Name"
                      placeholder="Enter Last name"
                      type="text"
                    />
                  </div>
                  <FormInput
                    control={form.control}
                    name="email"
                    label="Email Address"
                    placeholder="Enter Email Address"
                  />
                  <FormInput
                    control={form.control}
                    name="confirmEmail"
                    label="Confirm Email Address"
                    placeholder="Confirm Email Address"
                  />
                  <FormInput
                    control={form.control}
                    name="phone"
                    label="Phone Number"
                    placeholder="+2348012345678"
                    type="text"
                  />
                </div>
              </section>

              {!isFree && (
                <section className="space-y-3">
                  <SectionHeader title="Payment method" />
                  <PaymentMethodPicker
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    options={PAYMENT_OPTIONS}
                  />
                </section>
              )}

              <section className="space-y-3">
                <div className="space-y-3 rounded-2xl border border-background-light bg-background p-4">
                  <ConsentCheck
                    id="place-consent-place"
                    checked={consents.place}
                    onChange={(value) =>
                      setConsents((prev) => ({ ...prev, place: value }))
                    }
                  >
                    Keep me updated on more events and news from this place.
                  </ConsentCheck>
                  <ConsentCheck
                    id="place-consent-news"
                    checked={consents.news}
                    onChange={(value) =>
                      setConsents((prev) => ({ ...prev, news: value }))
                    }
                  >
                    Send me emails about the best events happening nearby or
                    online.
                  </ConsentCheck>
                </div>
                <p className="text-xs leading-relaxed text-secondary-text">
                  By completing this booking you agree to the{" "}
                  <Link href="/login" className="font-bold text-primary">
                    SpinStrip Terms of Service
                  </Link>
                  .
                </p>
              </section>

              <CheckoutActions
                onBack={() => setCurrentStep(1)}
                submitLabel={
                  isFree ? "Book now" : `Pay ${formatAmount(totalAmount)}`
                }
                submitDisabled={!form.formState.isValid}
                loading={loading}
                onSubmit={onSubmit}
              />
            </div>
          )}

          <CheckoutFooter />
        </div>
      </FormProvider>
    </SideModal>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import SideModal from "@/components/side-modal";
import Image from "next/image";
import {
  Globe02Icon,
  Location01Icon,
  Time01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInCalendarDays } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  BookFacilityPayload,
  BookFacilityResponse,
  PlacePaymentMethod,
  PublicFacility,
  PublicPlace,
} from "@/hooks/use-places";
import { cn, getOperatingHoursDisplay } from "@/lib/utils";
import { formatAmount } from "@/utils";
import { PLACES_API_URL } from "@/constants";
import apiClient from "@/lib/api/axios-client";
import { handleAxiosError } from "@/lib/api/handle-axios-error";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

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

/** Combines a calendar date with an "HH:mm" time into an ISO 8601 string. */
function toIsoDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, 0, 0);
  return combined.toISOString();
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-x-4 justify-between",
        bold ? "font-bold mt-2 pt-2 border-t border-gray-300" : "mb-1.5",
      )}
    >
      <p className="text-sm">{label}</p>
      <p className="text-sm text-right shrink-0">{value}</p>
    </div>
  );
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
        // Hand off to Paystack; it returns to callbackUrl on completion.
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

  const orderSummary = (
    <div className="bg-neutral rounded-lg p-3">
      <h3 className="font-bold text-primary-text text-sm mb-3">
        Order Summary
      </h3>
      <SummaryRow label="Facility" value={selectedFacility?.name ?? "—"} />
      <SummaryRow label="Stay" value={stayLabel} />
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
          label={`${Math.max(nights, 1)} ${
            Math.max(nights, 1) === 1 ? "night" : "nights"
          } × ${selectedFee?.name ?? "Rate"}`}
          value={formatAmount(unitAmount)}
        />
      )}
      <SummaryRow
        bold
        label="TOTAL"
        value={isFree ? "Free" : formatAmount(totalAmount)}
      />
    </div>
  );

  return (
    <SideModal isOpen={isOpen} onClose={onClose}>
      <FormProvider {...form}>
        <div className="space-y-6 pt-14 pb-5">
          <div className="w-full h-[180px]">
            <Image
              src={place?.coverImage || ""}
              alt={place.name}
              width={1200}
              height={560}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <div className="flex flex-col md:flex-row justify-between md:items-center">
            <div>
              <h2 className="text-base lg:text-[42px] mb-3 leading-[110%] text-black font-bold">
                {place.name}
              </h2>

              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-x-2">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={24}
                    color="#6F6D6D"
                  />
                  <p className="text-sm">
                    {place.city}, {place.state}
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <HugeiconsIcon icon={Time01Icon} size={24} color="#6F6D6D" />
                  {getOperatingHoursDisplay(place.operatingHours)}
                </div>
                <div className="flex items-center gap-x-2">
                  <HugeiconsIcon icon={Globe02Icon} size={24} color="#6F6D6D" />
                  <p className="text-sm">{place.website || "N/A"}</p>
                </div>
              </div>
            </div>

            <button className="flex items-center my-2 shrink-0 bg-primary gap-x-0.5 rounded-xl px-2.5 py-1.5">
              <Image
                src={"/logo-mark.svg"}
                alt={place.name}
                width={40}
                height={40}
                className="w-5 h-5 object-contain"
              />
              <p className="text-sm text-white">Follow</p>
            </button>
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Facility — `facilityId` */}
              {facilities.length > 1 && (
                <div className="space-y-3">
                  <h2 className="font-bold text-lg text-primary-text">
                    Choose a facility
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {facilities.map((item) => {
                      const isSelected = item.id === selectedFacilityId;
                      const from = (item.fees ?? [])
                        .map((fee) => Number(fee.amount) || 0)
                        .sort((a, b) => a - b)[0];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedFacilityId(item.id)}
                          className={cn(
                            "flex items-center gap-x-3 rounded-2xl border p-2 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary-accent/40"
                              : "border-[#E0E0E0] hover:border-neutral-accent",
                          )}
                        >
                          <Image
                            src={item.images?.[0] || place.coverImage || ""}
                            alt={item.name}
                            width={120}
                            height={120}
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-primary-text truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-secondary-text truncate">
                              {item.facilityCategory}
                            </p>
                            <p className="text-xs font-bold text-primary-text">
                              {from ? `from ${formatAmount(from)}` : "Free"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                              isSelected ? "border-primary" : "border-gray-300",
                            )}
                          >
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fee tier — `feeId` */}
              <div className="space-y-3">
                <h2 className="font-bold text-lg text-primary-text">
                  Select a rate
                </h2>
                {fees.length === 0 ? (
                  <p className="text-sm text-secondary-text">
                    {selectedFacility
                      ? "This facility is free to book — no payment required."
                      : "Select a facility to see its rates."}
                  </p>
                ) : (
                  <div className="flex">
                    <div className="h-auto w-1 border-l border-[#6F6D6D]" />
                    <div className="space-y-3 w-full flex-1">
                      {fees.map((fee) => {
                        const isSelected = fee.id === selectedFee?.id;
                        return (
                          <div key={fee.id} className="px-2">
                            <div className="flex items-start justify-between gap-x-4">
                              <div className="min-w-0">
                                <h3 className="text-sm">{fee.name}</h3>
                                {fee.description && (
                                  <p className="text-xs text-secondary-text">
                                    {fee.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center shrink-0 gap-x-2">
                                <p className="text-sm font-bold">
                                  {formatAmount(fee.amount)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSelectedFeeId(fee.id)}
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected
                                      ? "border-primary"
                                      : "border-gray-300",
                                  )}
                                >
                                  {isSelected && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dates — `checkInDate` / `checkOutDate` */}
              <div className="space-y-3">
                <h2 className="font-bold text-lg text-primary-text">
                  Your stay
                </h2>
                <div className="text-sm grid grid-cols-2 gap-3">
                  <div className="border-[#E0E0E0] py-1.5 px-2 flex items-center gap-x-1 border rounded-2xl">
                    <div className="bg-[#E0E0E0] shrink-0 rounded-2xl py-0.5 px-2">
                      <p className="text-primary-text">Check In</p>
                    </div>
                    <p className="text-primary-text truncate font-bold">
                      {dateRange?.from
                        ? format(dateRange.from, "d MMM")
                        : "Select"}
                    </p>
                  </div>
                  <div className="border-[#E0E0E0] py-1.5 px-2 flex items-center gap-x-1 border rounded-2xl">
                    <div className="bg-[#E0E0E0] shrink-0 rounded-2xl py-0.5 px-2">
                      <p className="text-primary-text">Check Out</p>
                    </div>
                    <p className="text-primary-text truncate font-bold">
                      {dateRange?.to ? format(dateRange.to, "d MMM") : "Select"}
                    </p>
                  </div>
                </div>

                <div className="border border-[#E0E0E0] rounded-2xl p-2 overflow-x-auto">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    disabled={{ before: new Date() }}
                    className="w-full [--cell-size:2.25rem] p-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkInTime"
                      className="text-sm font-medium text-primary-text"
                    >
                      Check-in time
                    </label>
                    <input
                      id="checkInTime"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-accent px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkOutTime"
                      className="text-sm font-medium text-primary-text"
                    >
                      Check-out time
                    </label>
                    <input
                      id="checkOutTime"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-accent px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {orderSummary}

              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canContinue}
                className="w-full"
                size={"lg"}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {orderSummary}

              <div>
                <h2 className="text-primary-text text-lg font-bold">
                  Contact Information
                </h2>
                <p className="text-sm text-primary-text">
                  <Link href="/login" className="font-bold text-primary">
                    Login to SpinStrip
                  </Link>{" "}
                  for a better experience
                </p>
                <div className="space-y-4 mt-3">
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
              </div>

              {/* Payment method — `paymentMethod` */}
              {/* {!isFree && (
                <div className="space-y-3">
                  <h2 className="text-primary-text text-lg font-bold">
                    Payment Method
                  </h2>
                  {(
                    [
                      {
                        value: "PAYSTACK",
                        label: "Paystack",
                        hint: "Card, bank transfer or USSD",
                        disabled: false,
                      },
                      {
                        value: "LEDGER_BLOCK",
                        label: "SpinStrip Wallet",
                        hint: "Sign in to pay from your wallet balance",
                        disabled: !userId,
                      },
                    ] as const
                  ).map((option) => {
                    const isSelected = paymentMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={option.disabled}
                        onClick={() => setPaymentMethod(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between gap-x-3 rounded-2xl border p-3 text-left transition-all",
                          option.disabled && "opacity-50 cursor-not-allowed",
                          isSelected
                            ? "border-primary bg-primary-accent/40"
                            : "border-[#E0E0E0]",
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold text-primary-text">
                            {option.label}
                          </p>
                          <p className="text-xs text-secondary-text">
                            {option.hint}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center",
                            isSelected ? "border-primary" : "border-gray-300",
                          )}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )} */}

              <div>
                <p className="text-sm text-[#000000E5]">
                  By clicking “Book Now” I Agree to the{" "}
                  <Link href="/login" className="font-bold text-primary">
                    SpinStrip Terms of Service
                  </Link>
                </p>
                {/* marketingConsentPlace */}
                <div className="flex gap-x-2 my-3 items-center">
                  <Checkbox
                    checked={consents.place}
                    onCheckedChange={(value) =>
                      setConsents((prev) => ({
                        ...prev,
                        place: value as boolean,
                      }))
                    }
                  />
                  <span className="text-[#000000E5] text-sm">
                    Keep me updated on more events and news from this Place.
                  </span>
                </div>
                {/* marketingConsentNews */}
                <div className="flex gap-x-2 my-2 items-center">
                  <Checkbox
                    checked={consents.news}
                    onCheckedChange={(value) =>
                      setConsents((prev) => ({
                        ...prev,
                        news: value as boolean,
                      }))
                    }
                  />
                  <span className="text-[#000000E5] text-sm">
                    Send me emails about the best events happening nearby or
                    online.
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  className="sm:w-[140px]"
                  size={"lg"}
                  disabled={loading}
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button
                  disabled={!form.formState.isValid || loading}
                  onClick={onSubmit}
                  className="flex-1"
                  size={"lg"}
                >
                  {loading
                    ? "Processing..."
                    : isFree
                      ? "Book Now"
                      : `Pay ${formatAmount(totalAmount)}`}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-x-1.5 border-t pt-4">
                <p className="text-sm">Powered by</p>
                <Image
                  src={"/logo-black.svg"}
                  alt="SpinStrip"
                  width={100}
                  height={100}
                  className="w-[78px] h-[24px] object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </FormProvider>
    </SideModal>
  );
}

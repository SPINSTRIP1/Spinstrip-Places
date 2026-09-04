"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import {
  Calendar03Icon,
  Location01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import SideModal from "@/components/side-modal";
import SectionHeader from "@/components/section-header";
import EmptyState from "@/components/empty-state";
import { FormInput } from "@/components/ui/form-input";
import CheckoutSteps from "@/components/checkout/checkout-steps";
import CheckoutActions from "@/components/checkout/checkout-actions";
import OptionCard from "@/components/checkout/option-card";
import QuantityStepper from "@/components/checkout/quantity-stepper";
import ConsentCheck from "@/components/checkout/consent-check";
import PaymentMethodPicker from "@/components/checkout/payment-method-picker";
import SummaryCard, { SummaryRow } from "@/components/checkout/summary-card";
import {
  CheckoutFooter,
  CheckoutHeader,
} from "@/components/checkout/checkout-header";
import { PublicEvent } from "@/hooks/use-events";
import { EVENTS_SERVER_URL } from "@/constants";
import apiClient from "@/lib/api/axios-client";
import { handleAxiosError } from "@/lib/api/handle-axios-error";
import { formatAmount, formatDateDisplay } from "@/utils";

interface AddEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PublicEvent;
}

interface TicketSelection {
  tierId: string;
  quantity: number;
  price: number;
}

const registerSchema = z
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
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Emails don't match",
    path: ["confirmEmail"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type EventPaymentProvider = "PAYSTACK" | "PAYONUS";

const PAYMENT_OPTIONS = [
  {
    value: "PAYSTACK",
    label: "Paystack",
    hint: "Card, bank transfer or USSD",
  },
  {
    value: "PAYONUS",
    label: "Fuspay",
    hint: "Card, bank transfer or USSD",
  },
] as const satisfies readonly {
  value: EventPaymentProvider;
  label: string;
  hint: string;
}[];

const STEPS = ["Tickets", "Details & payment"];

interface RegisterResponse {
  status: string;
  message: string;
  data: {
    registrationId: string;
    totalAmount: string;
    email: string;
    payment?: {
      authorizationUrl: string;
      accessCode: string;
      reference: string;
      provider: EventPaymentProvider;
    };
  };
}

export default function CheckOutModal({
  isOpen,
  onClose,
  event,
}: AddEventsModalProps) {
  const router = useRouter();
  const tiers = useMemo(() => event.ticketTiers ?? [], [event.ticketTiers]);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedTickets, setSelectedTickets] = useState<TicketSelection[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<EventPaymentProvider>("PAYSTACK");
  const [notificationPermission, setNotificationPermission] = useState({
    email: false,
    update: false,
  });
  const [loading, setLoading] = useState(false);

  const handleTicketSelect = (tierId: string, price: number) => {
    setSelectedTickets((previous) =>
      previous.some((ticket) => ticket.tierId === tierId)
        ? previous.filter((ticket) => ticket.tierId !== tierId)
        : [...previous, { tierId, quantity: 1, price }],
    );
  };

  const handleQuantityChange = (tierId: string, change: number) => {
    const tier = tiers.find((item) => item.id === tierId);
    const maxQuantity = tier?.quantityAvailable ?? 10;

    setSelectedTickets((previous) =>
      previous.map((ticket) => {
        if (ticket.tierId !== tierId) return ticket;
        const nextQuantity = ticket.quantity + change;
        return nextQuantity >= 1 && nextQuantity <= maxQuantity
          ? { ...ticket, quantity: nextQuantity }
          : ticket;
      }),
    );
  };

  const getTicketSelection = (tierId: string) =>
    selectedTickets.find((ticket) => ticket.tierId === tierId);

  const totalPrice = selectedTickets.reduce(
    (sum, ticket) => sum + ticket.price * ticket.quantity,
    0,
  );

  const totalTickets = selectedTickets.reduce(
    (sum, ticket) => sum + ticket.quantity,
    0,
  );

  const isFree = totalPrice === 0;
  const hasSelection = selectedTickets.length > 0;

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      confirmEmail: "",
    },
  });

  const handleReset = useCallback(() => {
    form.reset();
    setCurrentStep(1);
    setSelectedTickets([]);
    setNotificationPermission({ email: false, update: false });
    setPaymentMethod("PAYSTACK");
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (selectedTickets.length === 0) {
      toast.error("Please select at least one ticket");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post<RegisterResponse>(
        `${EVENTS_SERVER_URL}/events/public/${event.id}/register`,
        {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          confirmEmail: values.confirmEmail,
          tickets: selectedTickets.map((ticket) => ({
            ticketTierId: ticket.tierId,
            quantity: ticket.quantity,
          })),
          marketingConsentEvents: notificationPermission.email,
          marketingConsentNews: notificationPermission.update,
          paymentProvider: isFree ? "PAYSTACK" : paymentMethod,
          callbackUrl: `${window.location.origin}/preview/events/success`,
        },
      );

      const data = res.data.data;
      const paymentUrl = data?.payment?.authorizationUrl;
      if (paymentUrl) {
        setLoading(false);
        // Hand off to the provider; it returns to callbackUrl on completion.
        window.location.assign(paymentUrl);
        return;
      }
      // No payment required (e.g. free ticket) — go straight to success
      toast.success("Registration successful!");
      handleReset();
      onClose();
      router.push(
        `/preview/events/success?reference=${data?.registrationId ?? ""}`,
      );
    } catch (error) {
      const err = handleAxiosError(error as AxiosError);
      toast.error(err || "Something went wrong");
      setLoading(false);
    }
  });

  const orderSummary = (
    <SummaryCard
      total={isFree ? "Free" : formatAmount(totalPrice)}
      note={
        hasSelection
          ? undefined
          : "Select a ticket tier above to see your total."
      }
    >
      {hasSelection ? (
        selectedTickets.map((ticket) => {
          const tier = tiers.find((item) => item.id === ticket.tierId);
          return (
            <SummaryRow
              key={ticket.tierId}
              label={`${ticket.quantity} × ${tier?.name ?? "Ticket"}`}
              value={formatAmount(ticket.price * ticket.quantity)}
            />
          );
        })
      ) : (
        <SummaryRow label="Tickets" value="None selected" muted />
      )}
    </SummaryCard>
  );

  return (
    <SideModal
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout"
      subtitle={event.name}
    >
      <FormProvider {...form}>
        <div className="space-y-6 pb-2">
          <CheckoutHeader
            image={event.images?.[0]}
            title={event.name}
            metas={[
              {
                icon: Location01Icon,
                label: [event.city, event.state].filter(Boolean).join(", "),
              },
              {
                icon: Calendar03Icon,
                label: formatDateDisplay(event.startDate),
              },
            ]}
          />

          <CheckoutSteps
            current={currentStep}
            steps={STEPS}
            onStepClick={setCurrentStep}
          />

          {currentStep === 1 && (
            <div className="space-y-5">
              <section className="space-y-3">
                <SectionHeader
                  title="Choose your tickets"
                  subtitle={
                    tiers.length
                      ? "Pick a tier, then set how many you need."
                      : undefined
                  }
                />

                {tiers.length === 0 ? (
                  <EmptyState
                    icon={<HugeiconsIcon icon={Ticket01Icon} size={26} />}
                    title="No tickets on sale"
                    description="The organiser hasn't published any ticket tiers for this event yet. Follow the event to be notified when they go live."
                  />
                ) : (
                  <div className="space-y-3" role="radiogroup">
                    {tiers.map((tier) => {
                      const tierId = tier.id || "";
                      const selection = getTicketSelection(tierId);
                      const soldOut = tier.quantityAvailable <= 0;

                      return (
                        <OptionCard
                          key={tierId}
                          selected={!!selection}
                          disabled={soldOut}
                          onSelect={() =>
                            handleTicketSelect(tierId, tier.price)
                          }
                          title={tier.name}
                          subtitle={
                            soldOut
                              ? "Sold out"
                              : tier.description ||
                                `${tier.quantityAvailable} available`
                          }
                          trailing={
                            tier.price > 0 ? formatAmount(tier.price) : "Free"
                          }
                        >
                          {selection && (
                            <QuantityStepper
                              value={selection.quantity}
                              max={tier.quantityAvailable}
                              onChange={(delta) =>
                                handleQuantityChange(tierId, delta)
                              }
                            />
                          )}
                        </OptionCard>
                      );
                    })}
                  </div>
                )}
              </section>

              {orderSummary}

              <p className="text-xs text-secondary-text">
                Ticket sales end on {formatDateDisplay(event.startDate)}.
              </p>

              <CheckoutActions
                submitLabel={
                  hasSelection
                    ? `Continue with ${totalTickets} ${
                        totalTickets === 1 ? "ticket" : "tickets"
                      }`
                    : "Continue"
                }
                submitDisabled={!hasSelection}
                onSubmit={() => setCurrentStep(2)}
                hint={
                  hasSelection ? undefined : "Select at least one ticket tier"
                }
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {orderSummary}

              <section className="space-y-3">
                <SectionHeader
                  title="Contact information"
                  subtitle="Your tickets are sent to this email address."
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
                    id="event-consent-organizer"
                    checked={notificationPermission.update}
                    onChange={(value) =>
                      setNotificationPermission((prev) => ({
                        ...prev,
                        update: value,
                      }))
                    }
                  >
                    Keep me updated on more events and news from this organiser.
                  </ConsentCheck>
                  <ConsentCheck
                    id="event-consent-news"
                    checked={notificationPermission.email}
                    onChange={(value) =>
                      setNotificationPermission((prev) => ({
                        ...prev,
                        email: value,
                      }))
                    }
                  >
                    Send me updates about the best events happening nearby or
                    online.
                  </ConsentCheck>
                </div>
                <p className="text-xs leading-relaxed text-secondary-text">
                  By completing this registration you agree to the{" "}
                  <Link href="/login" className="font-bold text-primary">
                    SpinStrip Terms of Service
                  </Link>
                  .
                </p>
              </section>

              <CheckoutActions
                onBack={() => setCurrentStep(1)}
                submitLabel={
                  isFree
                    ? "Complete registration"
                    : `Pay ${formatAmount(totalPrice)}`
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

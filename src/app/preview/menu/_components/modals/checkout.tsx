"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import {
  PackageIcon,
  SpoonAndForkIcon,
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
import PaymentMethodPicker from "@/components/checkout/payment-method-picker";
import SummaryCard, { SummaryRow } from "@/components/checkout/summary-card";
import {
  CheckoutFooter,
  CheckoutHeader,
} from "@/components/checkout/checkout-header";
import {
  CreateMenuOrderPayload,
  CreateMenuOrderResponse,
  isMenuItemOrderable,
  MenuPaymentMethod,
  PublicMenuItem,
} from "@/hooks/use-menu";
import { MENU_API_URL } from "@/constants";
import apiClient from "@/lib/api/axios-client";
import { handleAxiosError } from "@/lib/api/handle-axios-error";
import { formatAmount, formatEnumLabel } from "@/utils";

/** menuItemId → quantity. */
export type MenuCart = Record<string, number>;

/**
 * Session key holding the last order's payment reference, so the success
 * page can still verify when a provider returns without `?reference=`.
 */
export const MENU_ORDER_REFERENCE_KEY = "spinstrip:menu-order-reference";

/** Upper bound for untracked stock, so a stray tap can't order 500 plates. */
const MAX_PER_ITEM = 20;

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The dish the customer opened checkout from. */
  item: PublicMenuItem;
  /** Everything this merchant sells — one order can hold several items. */
  merchantMenu: PublicMenuItem[];
  cart: MenuCart;
  onCartChange: (updater: (previous: MenuCart) => MenuCart) => void;
  /** Signed-in user, when there is one. Sent as `userId`. */
  userId?: string;
}

/**
 * Mirrors the customer fields of `POST /menu/public/orders`. The API takes a
 * single `customerName` (max 200) and `phone` (max 20); the name is split
 * here to match the places and events checkouts.
 */
const orderSchema = z
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
      .max(20, "Phone number must be 20 characters or fewer")
      .regex(/^\+?[0-9][0-9\s-]{8,18}$/, "Please enter a valid phone number"),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Emails don't match",
    path: ["confirmEmail"],
  });

type OrderFormData = z.infer<typeof orderSchema>;

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
  value: MenuPaymentMethod;
  label: string;
  hint: string;
}[];

const STEPS = ["Your order", "Details & payment"];

function maxQuantity(item: PublicMenuItem) {
  return item.quantity === null
    ? MAX_PER_ITEM
    : Math.min(item.quantity, MAX_PER_ITEM);
}

export default function CheckOutModal({
  isOpen,
  onClose,
  item,
  merchantMenu,
  cart,
  onCartChange,
  userId,
}: CheckOutModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] =
    useState<MenuPaymentMethod>("PAYSTACK");
  const [loading, setLoading] = useState(false);

  // The dish the customer came from first, then the rest of the menu.
  const orderableItems = useMemo(() => {
    const rest = merchantMenu.filter(
      (menuItem) =>
        menuItem.id !== item.id &&
        !menuItem.isHidden &&
        isMenuItemOrderable(menuItem),
    );
    return isMenuItemOrderable(item) ? [item, ...rest] : rest;
  }, [item, merchantMenu]);

  // Only lines for items that are still on the menu and orderable.
  const lines = orderableItems
    .filter((menuItem) => cart[menuItem.id] > 0)
    .map((menuItem) => ({
      item: menuItem,
      quantity: cart[menuItem.id],
      subtotal: Number(menuItem.price) * cart[menuItem.id],
    }));

  const totalPrice = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);
  const hasSelection = lines.length > 0;

  const toggleItem = (menuItem: PublicMenuItem) => {
    onCartChange((previous) => {
      if (previous[menuItem.id]) {
        const next = { ...previous };
        delete next[menuItem.id];
        return next;
      }
      return { ...previous, [menuItem.id]: 1 };
    });
  };

  const changeQuantity = (menuItem: PublicMenuItem, delta: number) => {
    onCartChange((previous) => {
      const next = (previous[menuItem.id] ?? 0) + delta;
      if (next < 1 || next > maxQuantity(menuItem)) return previous;
      return { ...previous, [menuItem.id]: next };
    });
  };

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      confirmEmail: "",
      phone: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!hasSelection) {
      toast.error("Please add at least one item to your order");
      return;
    }

    const payload: CreateMenuOrderPayload = {
      merchantUserId: item.userId,
      customerName: `${values.firstName.trim()} ${values.lastName.trim()}`,
      email: values.email,
      phone: values.phone.replace(/[\s-]/g, ""),
      paymentMethod,
      callbackUrl: `${window.location.origin}/preview/menu/success`,
      items: lines.map((line) => ({
        menuItemId: line.item.id,
        quantity: line.quantity,
      })),
    };
    if (userId) payload.userId = userId;

    setLoading(true);
    try {
      const res = await apiClient.post<CreateMenuOrderResponse>(
        `${MENU_API_URL}/menu/public/orders`,
        payload,
      );

      const data = res.data.data;
      const reference =
        data?.payment?.reference ??
        data?.reference ??
        data?.order?.reference ??
        "";
      const paymentUrl =
        data?.payment?.authorizationUrl ?? data?.authorizationUrl;

      if (reference) {
        try {
          sessionStorage.setItem(MENU_ORDER_REFERENCE_KEY, reference);
        } catch {
          // Storage can be blocked (private mode); the query param still works.
        }
      }

      if (paymentUrl) {
        setLoading(false);
        onCartChange(() => ({}));
        // Hand off to the provider; it returns to callbackUrl on completion.
        window.location.assign(paymentUrl);
        return;
      }

      // Every order is paid, so a missing URL means the provider didn't start.
      toast.error("We couldn't start your payment. Please try again.");
      setLoading(false);
    } catch (error) {
      const err = handleAxiosError(error as AxiosError);
      toast.error(err || "Something went wrong");
      setLoading(false);
    }
  });

  const orderSummary = (
    <SummaryCard
      total={formatAmount(totalPrice)}
      note={hasSelection ? undefined : "Add a dish above to see your total."}
    >
      {hasSelection ? (
        lines.map((line) => (
          <SummaryRow
            key={line.item.id}
            label={`${line.quantity} × ${line.item.name}`}
            value={formatAmount(line.subtotal)}
          />
        ))
      ) : (
        <SummaryRow label="Items" value="None selected" muted />
      )}
    </SummaryCard>
  );

  return (
    <SideModal
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout"
      subtitle={item.name}
    >
      <FormProvider {...form}>
        <div className="space-y-6 pb-2">
          <CheckoutHeader
            image={item.images?.[0]}
            title={item.name}
            metas={[
              {
                icon: SpoonAndForkIcon,
                label: formatEnumLabel(item.category) || "Menu",
              },
              {
                icon: PackageIcon,
                label: `${formatAmount(item.price)} per portion`,
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
                  title="Build your order"
                  subtitle="Pick dishes from this kitchen, then set how many portions."
                />

                {orderableItems.length === 0 ? (
                  <EmptyState
                    icon={<HugeiconsIcon icon={SpoonAndForkIcon} size={26} />}
                    title="Nothing available right now"
                    description="This restaurant has no dishes available to order at the moment. Check back later."
                  />
                ) : (
                  <div className="space-y-3">
                    {orderableItems.map((menuItem) => {
                      const quantity = cart[menuItem.id];
                      return (
                        <OptionCard
                          key={menuItem.id}
                          selected={!!quantity}
                          onSelect={() => toggleItem(menuItem)}
                          image={menuItem.images?.[0]}
                          title={menuItem.name}
                          subtitle={
                            menuItem.quantity === null
                              ? formatEnumLabel(menuItem.category)
                              : `${menuItem.quantity} left`
                          }
                          trailing={formatAmount(menuItem.price)}
                        >
                          {quantity ? (
                            <QuantityStepper
                              label="Portions"
                              value={quantity}
                              max={maxQuantity(menuItem)}
                              onChange={(delta) =>
                                changeQuantity(menuItem, delta)
                              }
                            />
                          ) : null}
                        </OptionCard>
                      );
                    })}
                  </div>
                )}
              </section>

              {orderSummary}

              <p className="text-xs text-secondary-text">
                Prices are confirmed by the restaurant when you pay.
              </p>

              <CheckoutActions
                submitLabel={
                  hasSelection
                    ? `Continue with ${totalItems} ${
                        totalItems === 1 ? "item" : "items"
                      }`
                    : "Continue"
                }
                submitDisabled={!hasSelection}
                onSubmit={() => setCurrentStep(2)}
                hint={hasSelection ? undefined : "Add at least one dish"}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {orderSummary}

              <section className="space-y-3">
                <SectionHeader
                  title="Contact information"
                  subtitle="Your receipt is sent to this email address."
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

              <section className="space-y-3">
                <SectionHeader title="Payment method" />
                <PaymentMethodPicker
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={PAYMENT_OPTIONS}
                />
              </section>

              <p className="text-xs leading-relaxed text-secondary-text">
                By placing this order you agree to the{" "}
                <Link href="/login" className="font-bold text-primary">
                  SpinStrip Terms of Service
                </Link>
                .
              </p>

              <CheckoutActions
                onBack={() => setCurrentStep(1)}
                submitLabel={`Pay ${formatAmount(totalPrice)}`}
                submitDisabled={!form.formState.isValid || !hasSelection}
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

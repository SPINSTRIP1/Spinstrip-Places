'use client'

import { discounted, formatNaira, type MenuItem, type Restaurant } from '@/data/restaurants'
import { BadgeCheck, ChevronLeft, CreditCard, Minus, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export interface CartLine {
  item: MenuItem
  qty: number
}

interface Props {
  restaurant: Restaurant
  lines: CartLine[]
  onClose: () => void
  onQty: (itemId: string, delta: number) => void
  onClear: () => void
}

type Stage = 'cart' | 'checkout' | 'processing' | 'done'

export default function CartSheet({ restaurant, lines, onClose, onQty, onClear }: Props) {
  const [stage, setStage] = useState<Stage>('cart')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orderId, setOrderId] = useState('')

  const subtotal = lines.reduce((s, l) => s + discounted(l.item) * l.qty, 0)
  const service = Math.round(subtotal * 0.05)
  const total = subtotal + service

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (form.name.trim().split(/\s+/).length < 2) e.name = 'Enter your full name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!/^[+\d][\d\s-]{6,}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const pay = () => {
    if (!validate()) return
    setStage('processing')
    setTimeout(() => {
      setOrderId('SS-' + Math.random().toString(36).slice(2, 8).toUpperCase())
      setStage('done')
      onClear()
    }, 1600)
  }

  const inputCls = (key: string) =>
    `w-full rounded-2xl border bg-white px-4 py-3 text-sm text-[#0F0F0F] outline-none transition-all placeholder:text-[#C8C8C8] focus:border-primary-light focus:ring-4 focus:ring-primary-accent ${
      errors[key] ? 'border-red-300' : 'border-background-light'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="sheet-overlay absolute inset-0 bg-[#0F0F0F]/50 backdrop-blur-sm" onClick={stage === 'processing' ? undefined : onClose} />
      <div className="sheet-panel relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-background-light px-5 py-4">
          <div className="flex items-center gap-2.5">
            {stage === 'checkout' && (
              <button onClick={() => setStage('cart')} className="btn-press -ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-accent text-[#0F0F0F]" aria-label="Back to cart">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="font-display text-lg font-bold text-[#0F0F0F]">
              {stage === 'cart' && `Your cart · ${restaurant.name}`}
              {stage === 'checkout' && 'Checkout'}
              {stage === 'processing' && 'Processing payment'}
              {stage === 'done' && 'Order confirmed'}
            </h3>
          </div>
          {stage !== 'processing' && (
            <button onClick={onClose} className="btn-press flex h-9 w-9 items-center justify-center rounded-full bg-primary-accent text-[#0F0F0F]" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Cart stage */}
        {stage === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              {lines.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#6F6D6D]">Your cart is empty — add something delicious.</p>
              ) : (
                <ul className="space-y-4">
                  {lines.map(({ item, qty }) => (
                    <li key={item.id} className="flex gap-3">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F0F0F]">{item.name}</p>
                        <p className="text-xs text-[#6F6D6D]">{formatNaira(discounted(item))} each</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button onClick={() => onQty(item.id, -1)} className="btn-press flex h-7 w-7 items-center justify-center rounded-full border border-background-light text-[#0F0F0F]" aria-label="Decrease">
                            {qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-red-400" /> : <Minus className="h-3.5 w-3.5" />}
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-[#0F0F0F]">{qty}</span>
                          <button onClick={() => onQty(item.id, 1)} className="btn-press flex h-7 w-7 items-center justify-center rounded-full border border-background-light text-[#0F0F0F]" aria-label="Increase">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <span className="font-display shrink-0 text-sm font-bold text-[#0F0F0F]">
                        {formatNaira(discounted(item) * qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {lines.length > 0 && (
              <div className="shrink-0 border-t border-background-light p-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
                <div className="mb-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#6F6D6D]"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div>
                  <div className="flex justify-between text-[#6F6D6D]"><span>Service fee (5%)</span><span>{formatNaira(service)}</span></div>
                  <div className="flex justify-between font-display text-base font-bold text-[#0F0F0F]"><span>Total</span><span>{formatNaira(total)}</span></div>
                </div>
                <button
                  onClick={() => setStage('checkout')}
                  className="btn-press w-full rounded-full py-3.5 font-display text-base font-semibold text-white shadow-lg"
                  style={{ background: restaurant.gradient }}
                >
                  Go to checkout · {formatNaira(total)}
                </button>
              </div>
            )}
          </>
        )}

        {/* Checkout stage */}
        {stage === 'checkout' && (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-5 rounded-2xl bg-[#F8F8F8] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6F6D6D]">Order summary</p>
                <p className="mt-1.5 text-sm text-[#6F6D6D]">
                  {lines.reduce((s, l) => s + l.qty, 0)} items at {restaurant.name}
                </p>
                <p className="font-display mt-1 text-xl font-bold text-[#0F0F0F]">{formatNaira(total)}</p>
              </div>

              <p className="mb-3 text-sm font-medium text-[#6F6D6D]">
                Create your SpinStrip account to pay and track this order:
              </p>
              <div className="space-y-3">
                <div>
                  <input className={inputCls('name')} placeholder="Full name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <input className={inputCls('email')} type="email" placeholder="Email address" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" inputMode="email" />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
                <div>
                  <input className={inputCls('phone')} type="tel" placeholder="Phone number" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" inputMode="tel" />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[#6F6D6D]">
                By paying you agree to SpinStrip&apos;s terms. This demo checkout simulates payment — no card is charged.
              </p>
            </div>
            <div className="shrink-0 border-t border-background-light p-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
              <button
                onClick={pay}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-display text-base font-semibold text-white shadow-lg"
                style={{ background: restaurant.gradient }}
              >
                <CreditCard className="h-5 w-5" />
                Pay {formatNaira(total)}
              </button>
            </div>
          </>
        )}

        {/* Processing */}
        {stage === 'processing' && (
          <div className="flex flex-col items-center gap-4 px-5 py-16">
            <div
              className="h-12 w-12 animate-spin rounded-full border-4 border-background-light"
              style={{ borderTopColor: restaurant.accent }}
            />
            <p className="text-sm font-medium text-[#6F6D6D]">Contacting your bank securely…</p>
          </div>
        )}

        {/* Done */}
        {stage === 'done' && (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-white"
              style={{ background: restaurant.gradient }}
            >
              <BadgeCheck className="h-8 w-8" />
            </span>
            <h4 className="font-display text-xl font-bold text-[#0F0F0F]">Payment successful</h4>
            <p className="max-w-xs text-sm leading-relaxed text-[#6F6D6D]">
              Order <strong className="text-[#0F0F0F]">{orderId}</strong> is confirmed at {restaurant.name}.
              A receipt was sent to <strong className="text-[#0F0F0F]">{form.email}</strong>.
            </p>
            <button
              onClick={onClose}
              className="btn-press mt-3 rounded-full px-8 py-3 font-display text-sm font-semibold text-white"
              style={{ background: restaurant.gradient }}
            >
              Back to menu
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

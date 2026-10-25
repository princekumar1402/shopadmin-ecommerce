'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { createOrder, ShippingAddress } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalCount, clearCart } = useCart();

  const [formData, setFormData] = useState<ShippingAddress>({
    full_name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'upi'>('cod');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic client validation
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.street.trim() || !formData.city.trim() || !formData.zip.trim()) {
      setErrorMessage('Please fill in all required shipping fields.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Add items before checking out.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: items.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
        })),
        shipping_address: {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || undefined,
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state?.trim() || undefined,
          zip: formData.zip.trim(),
          country: formData.country?.trim() || 'United States',
        },
        payment_method: paymentMethod,
      };

      // Submit order to existing Core PHP orders API
      const result = await createOrder(orderPayload);

      // Only clear the cart once the backend confirms order creation
      clearCart();

      // Navigate to order confirmation
      router.push(`/checkout/success?order_id=${result.order_id}&total=${result.total}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="container" style={{ flex: 1, padding: 'var(--space-3xl) var(--space-lg)', textAlign: 'center' }}>
          <div className="glass" style={{ maxWidth: '520px', margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🛍️</div>
            <h2 style={{ marginBottom: 'var(--space-sm)' }}>Your Cart is Empty</h2>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-xl)' }}>
              You do not have any items in your cart to proceed with checkout.
            </p>
            <Link href="/#products" className="btn btn--primary">
              Browse Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: 'var(--space-2xl) var(--space-lg)' }}>
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <Link href="/cart" className="text-sm text-muted hover:text-primary">
            ← Back to Cart
          </Link>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', marginTop: 'var(--space-xs)' }}>
            Checkout
          </h1>
          <p className="text-sm text-muted">Complete your shipping and order details below.</p>
        </div>

        {errorMessage && (
          <div
            className="glass"
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              marginBottom: 'var(--space-xl)',
              borderColor: 'var(--danger)',
              background: 'rgba(255, 71, 87, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <strong style={{ color: 'var(--danger)', display: 'block', fontSize: '0.9rem' }}>
                Order Processing Error
              </strong>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-2xl)',
              alignItems: 'start',
            }}
          >
            {/* Left: Shipping & Payment Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              {/* Shipping Address */}
              <div className="glass" style={{ padding: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍</span>
                  <span>Shipping Address</span>
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="full_name">
                      Full Name *
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      className="form-input"
                      placeholder="Jane Doe"
                      required
                      value={formData.full_name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="email">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-input"
                        placeholder="jane@example.com"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="phone">
                        Phone Number (Optional)
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="form-input"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="street">
                      Street Address *
                    </label>
                    <input
                      id="street"
                      name="street"
                      type="text"
                      className="form-input"
                      placeholder="123 Market Street, Apt 4B"
                      required
                      value={formData.street}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="city">
                        City *
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        className="form-input"
                        placeholder="San Francisco"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="state">
                        State / Province
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        className="form-input"
                        placeholder="CA"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="zip">
                        Postal Code / ZIP *
                      </label>
                      <input
                        id="zip"
                        name="zip"
                        type="text"
                        className="form-input"
                        placeholder="94103"
                        required
                        value={formData.zip}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="glass" style={{ padding: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💳</span>
                  <span>Payment Method</span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'cod' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: paymentMethod === 'cod' ? 'rgba(108,71,255,0.08)' : 'var(--surface-2)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>Cash on Delivery (COD)</strong>
                      <span className="text-xs text-muted">Pay securely with cash or card upon product arrival</span>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'card' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: paymentMethod === 'card' ? 'rgba(108,71,255,0.08)' : 'var(--surface-2)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>Credit / Debit Card (Demo)</strong>
                      <span className="text-xs text-muted">Simulated instant online card settlement</span>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'upi' ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: paymentMethod === 'upi' ? 'rgba(108,71,255,0.08)' : 'var(--surface-2)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>Instant UPI / QR (Demo)</strong>
                      <span className="text-xs text-muted">Fast mobile UPI checkout</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Order Summary Sidebar */}
            <div
              className="glass"
              style={{
                padding: 'var(--space-xl)',
                borderRadius: 'var(--radius-xl)',
                position: 'sticky',
                top: '90px',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                Order Summary ({totalCount})
              </h2>

              {/* Items List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-md)',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                  marginBottom: 'var(--space-lg)',
                }}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: 'var(--space-sm)',
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                          background: 'var(--surface-2)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        📦
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                      <div className="text-xs text-muted">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Estimated Subtotal</span>
                  <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Marketplace Shipping</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
                </div>
                <div className="divider" style={{ margin: 'var(--space-xs) 0' }} />
                <div className="flex justify-between items-baseline">
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total Due:</span>
                  <span
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'var(--primary-light)',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>
                  * Final total amount is verified and committed by the Core PHP backend during order placement.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--lg btn--full"
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? 'Verifying & Placing Order...' : `Place Order ($${subtotal.toFixed(2)}) →`}
              </button>

              <div className="mt-md text-xs text-muted text-center">
                🔒 By placing this order, you agree to the marketplace buyer terms.
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

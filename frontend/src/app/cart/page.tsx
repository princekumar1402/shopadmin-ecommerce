'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalCount } = useCart();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: 'var(--space-2xl) var(--space-lg)' }}>
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '4px' }}>
              Shopping Cart
            </h1>
            <p className="text-sm text-muted">
              {items.length === 0
                ? 'Your basket is currently empty'
                : `You have ${totalCount} ${totalCount === 1 ? 'item' : 'items'} in your cart`}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ color: 'var(--danger)' }}
              onClick={clearCart}
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div
            className="glass"
            style={{
              padding: 'var(--space-3xl) var(--space-xl)',
              textAlign: 'center',
              maxWidth: '560px',
              margin: 'var(--space-xl) auto',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>🛍️</div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 'var(--space-sm)' }}>
              Your cart is waiting to be filled!
            </h2>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-xl)' }}>
              Explore our marketplace catalog to discover top-rated electronics, gadgets, and apparel.
            </p>
            <Link href="/#products" className="btn btn--primary">
              Explore Products →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-xl)',
              alignItems: 'start',
            }}
          >
            {/* Items Table / List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {items.map((item) => {
                const lineTotal = item.price * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="glass"
                    style={{
                      padding: 'var(--space-lg)',
                      display: 'flex',
                      gap: 'var(--space-lg)',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: 'var(--radius-md)',
                          objectFit: 'cover',
                          background: 'var(--surface-2)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                        }}
                      >
                        📦
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      {item.vendor_name && (
                        <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>
                          🏪 {item.vendor_name}
                        </div>
                      )}
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
                        <Link href={`/products/${item.id}`} className="hover:text-primary">
                          {item.name}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-sm text-sm">
                        <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-muted">each</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-md">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-sm">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Line total */}
                      <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem' }}>
                        ${lineTotal.toFixed(2)}
                      </div>

                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          padding: '4px 8px',
                        }}
                        onClick={() => removeFromCart(item.id)}
                        title="Remove item from cart"
                        aria-label="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Card */}
            <div
              className="glass"
              style={{
                padding: 'var(--space-xl)',
                borderRadius: 'var(--radius-xl)',
                position: 'sticky',
                top: '90px',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal ({totalCount} items)</span>
                  <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Estimated Shipping</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Taxes</span>
                  <span className="text-muted">Included</span>
                </div>

                <div className="divider" style={{ margin: 'var(--space-xs) 0' }} />

                <div className="flex justify-between items-baseline">
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total:</span>
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
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <Link href="/checkout" className="btn btn--primary btn--lg btn--full">
                  Proceed to Checkout →
                </Link>
                <Link href="/#products" className="btn btn--ghost btn--sm btn--full">
                  ← Continue Shopping
                </Link>
              </div>

              <div
                style={{
                  marginTop: 'var(--space-lg)',
                  paddingTop: 'var(--space-md)',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  color: 'var(--text-3)',
                  textAlign: 'center',
                }}
              >
                🔒 Guaranteed 256-bit encrypted checkout with buyer satisfaction protection.
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

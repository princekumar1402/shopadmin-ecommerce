'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, subtotal, totalCount } =
    useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className={`cart-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      <aside className={`cart-drawer ${isCartOpen ? 'open' : ''}`} aria-label="Shopping Cart Drawer">
        <div className="cart-drawer__header">
          <div className="flex items-center gap-sm">
            <span style={{ fontSize: '1.25rem' }}>🛒</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Your Cart ({totalCount})
            </h3>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart drawer"
          >
            ✕
          </button>
        </div>

        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🛍️</div>
              <p className="text-sm font-bold" style={{ marginBottom: 'var(--space-xs)' }}>
                Your cart is empty
              </p>
              <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
                Explore products and add items to your cart to begin checkout.
              </p>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setIsCartOpen(false)}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cart-item">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item__image"
                  />
                ) : (
                  <div
                    className="cart-item__image"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    📦
                  </div>
                )}

                <div className="cart-item__details">
                  <div className="cart-item__name">
                    <Link
                      href={`/products/${item.id}`}
                      onClick={() => setIsCartOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </div>
                  {item.vendor_name && (
                    <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>
                      🏪 {item.vendor_name}
                    </div>
                  )}
                  <div className="cart-item__price">${item.price.toFixed(2)}</div>

                  <div className="cart-item__qty">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label="Increase quantity"
                      title={item.quantity >= item.stock ? `Max stock (${item.stock}) reached` : undefined}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        marginLeft: 'auto',
                        padding: '4px',
                      }}
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__total">
              <span>Subtotal:</span>
              <span style={{ color: 'var(--primary-light)' }}>${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-md)' }}>
              Final shipping and taxes calculated at checkout.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <Link
                href="/checkout"
                className="btn btn--primary btn--full"
                onClick={() => setIsCartOpen(false)}
              >
                Proceed to Checkout →
              </Link>
              <Link
                href="/cart"
                className="btn btn--ghost btn--sm btn--full"
                onClick={() => setIsCartOpen(false)}
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

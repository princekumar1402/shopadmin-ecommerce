'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const total = searchParams.get('total');

  if (!orderId) {
    return (
      <div className="glass" style={{ maxWidth: '560px', margin: 'var(--space-3xl) auto', padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🔍</div>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>No Order Reference Found</h2>
        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-xl)' }}>
          We could not locate an active order receipt. Please check your order history or return to the marketplace.
        </p>
        <Link href="/#products" className="btn btn--primary">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const parsedTotal = total ? parseFloat(total).toFixed(2) : '0.00';

  return (
    <div
      className="glass animate-fadeUp"
      style={{
        maxWidth: '640px',
        margin: 'var(--space-2xl) auto',
        padding: 'var(--space-3xl) var(--space-2xl)',
        textAlign: 'center',
        border: '1px solid rgba(46, 213, 115, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(46, 213, 115, 0.1)',
      }}
    >
      {/* Success Badge */}
      <div
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'rgba(46, 213, 115, 0.15)',
          color: 'var(--success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto var(--space-lg) auto',
          border: '2px solid rgba(46, 213, 115, 0.4)',
        }}
      >
        ✓
      </div>

      <span className="badge badge--success" style={{ marginBottom: 'var(--space-sm)' }}>
        Order Confirmed
      </span>

      <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)', marginBottom: 'var(--space-sm)' }}>
        Thank You for Your Order!
      </h1>

      <p className="text-sm text-muted" style={{ maxWidth: '460px', margin: '0 auto var(--space-2xl) auto', lineHeight: 1.7 }}>
        Your order has been recorded in the database and sent to the merchant for fulfillment. A confirmation receipt has been generated.
      </p>

      {/* Order Info Card */}
      <div
        style={{
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl)',
          marginBottom: 'var(--space-2xl)',
          textAlign: 'left',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-lg)' }}>
          <div>
            <span className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Order Number
            </span>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '4px' }}>
              #{orderId}
            </div>
          </div>

          <div>
            <span className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Confirmed Total
            </span>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
              ${parsedTotal}
            </div>
          </div>

          <div>
            <span className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Payment Method
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
              Cash on Delivery (COD)
            </div>
          </div>

          <div>
            <span className="text-xs text-muted font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Fulfillment Status
            </span>
            <div style={{ marginTop: '4px' }}>
              <span className="badge badge--warning">Pending Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="flex gap-md justify-center" style={{ flexWrap: 'wrap' }}>
        <Link href="/#products" className="btn btn--primary">
          Continue Shopping →
        </Link>
        <Link href="/" className="btn btn--ghost">
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="container" style={{ flex: 1, padding: 'var(--space-2xl) var(--space-lg)' }}>
        <Suspense fallback={<div className="text-center" style={{ padding: 'var(--space-3xl) 0' }}>Loading receipt...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

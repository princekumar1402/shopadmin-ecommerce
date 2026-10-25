import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)', padding: 'var(--space-3xl) 0 var(--space-xl) 0', marginTop: 'var(--space-3xl)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 800, background: 'var(--grad-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 'var(--space-md)' }}>
              Cretzo
            </div>
            <p className="text-sm" style={{ maxWidth: '300px', lineHeight: 1.7 }}>
              The modern multi-vendor marketplace platform connecting verified independent sellers with discerning buyers worldwide.
            </p>
            <div className="flex gap-sm mt-md">
              <span className="badge badge--success">✓ Verified Vendors</span>
              <span className="badge badge--primary">🔒 Secure Checkout</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-md)', color: 'var(--text)' }}>
              Marketplace
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <li>
                <Link href="/#products" className="text-sm text-muted" style={{ transition: 'color var(--duration)' }}>
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="text-sm text-muted">
                  Explore Categories
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="text-sm text-muted">
                  Verified Stores
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-muted">
                  Track Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-md)', color: 'var(--text)' }}>
              Vendor Hub
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <li>
                <Link href="/register?role=vendor" className="text-sm text-muted">
                  Open a Store
                </Link>
              </li>
              <li>
                <Link href="/vendor/dashboard" className="text-sm text-muted">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link href="/vendor/products/new" className="text-sm text-muted">
                  List Products
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-md)', color: 'var(--text)' }}>
              Architecture
            </h4>
            <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
              Powered by Next.js 16 App Router on frontend, Core PHP 8.2 API on backend, and MySQL 8.0 containerized in Docker.
            </p>
          </div>
        </div>

        <div className="divider" />

        <div className="flex justify-between items-center text-xs text-muted" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <p>© 2026 Cretzo Multi-Vendor Marketplace. All rights reserved.</p>
          <div className="flex gap-md">
            <span>Core PHP Backend</span>
            <span>•</span>
            <span>Next.js App Router</span>
            <span>•</span>
            <span>Docker Compose</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAuthToken, setAuthToken, loginVendorDemo, getCurrentUser } from '@/lib/api';

export default function VendorNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (token) {
        const user = await getCurrentUser();
        if (user && user.role === 'vendor') {
          setCurrentUser(user);
          return;
        }
      }
      // Auto-authenticate as default demo vendor Bob if not logged in
      autoConnectVendor();
    }
    checkAuth();
  }, []);

  const autoConnectVendor = async () => {
    setIsAuthenticating(true);
    try {
      const data = await loginVendorDemo();
      if (data?.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.warn('Vendor auto-connect notice:', e);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const navLinks = [
    { href: '/vendor', label: '📊 Dashboard Overview' },
    { href: '/vendor/products', label: '📦 Product Catalog' },
    { href: '/vendor/orders', label: '📑 Customer Orders' },
  ];

  return (
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-subtle)', padding: '0 var(--space-lg)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div className="flex items-center gap-md">
          <Link href="/vendor" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, background: 'var(--grad-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cretzo Vendor Hub
          </Link>
          <span className="badge badge--success">✓ Verified Store</span>
        </div>

        <nav className="flex items-center gap-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`btn btn--sm ${isActive ? 'btn--primary' : 'btn--ghost'}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-sm">
          {currentUser ? (
            <div className="flex items-center gap-sm text-xs">
              <span className="text-muted">Active:</span>
              <strong style={{ color: 'var(--primary-light)' }}>
                {currentUser.name} (TechGear Store)
              </strong>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={isAuthenticating}
              onClick={autoConnectVendor}
            >
              {isAuthenticating ? 'Connecting...' : '⚡ Reconnect Vendor Session'}
            </button>
          )}

          <Link href="/" className="btn btn--ghost btn--sm">
            ← Marketplace
          </Link>
        </div>
      </div>
    </header>
  );
}

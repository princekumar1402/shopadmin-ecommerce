'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAuthToken, getCurrentUser, loginAdminDemo, AuthUser } from '@/lib/api';

export default function AdminNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (token) {
        const user = await getCurrentUser();
        if (user && user.role === 'admin') {
          setCurrentUser(user);
          return;
        }
      }
      // Auto-authenticate as default seeded admin account if not already logged in
      autoConnectAdmin();
    }
    checkAuth();
  }, []);

  const autoConnectAdmin = async () => {
    setIsAuthenticating(true);
    try {
      const user = await loginAdminDemo();
      if (user) {
        setCurrentUser(user);
      }
    } catch (e) {
      console.warn('Admin auto-connect notice:', e);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const navLinks = [
    { href: '/admin', label: '📊 Overview', id: 'admin-nav-overview' },
    { href: '/admin/vendors', label: '🏪 Vendor Management', id: 'admin-nav-vendors' },
    { href: '/admin/products', label: '📦 Product Catalog', id: 'admin-nav-products' },
    { href: '/admin/orders', label: '📑 Marketplace Orders', id: 'admin-nav-orders' },
  ];

  return (
    <header
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 var(--space-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
        }}
      >
        <div className="flex items-center gap-md">
          <Link
            href="/admin"
            id="admin-brand-logo"
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '1.35rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🛡️</span>
            <span>ShopAdmin Portal</span>
          </Link>
          <span className="badge badge--primary" style={{ fontSize: '0.75rem' }}>
            System Administrator
          </span>
        </div>

        <nav className="flex items-center gap-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                id={link.id}
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
            <div
              className="badge badge--success"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Verified System Administrator Session"
            >
              <span>🔑</span>
              <span>{currentUser.email}</span>
            </div>
          ) : isAuthenticating ? (
            <span className="text-xs text-muted">Authenticating Admin...</span>
          ) : (
            <button
              id="admin-reconnect-btn"
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={autoConnectAdmin}
            >
              Connect Admin Session
            </button>
          )}

          <Link
            id="admin-return-marketplace-btn"
            href="/"
            className="btn btn--outline btn--sm"
          >
            ← Marketplace
          </Link>
        </div>
      </div>
    </header>
  );
}

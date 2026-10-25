'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  cartCount?: number;
}

export default function Navbar({
  searchQuery: externalQuery,
  onSearchChange,
  cartCount: externalCount,
}: NavbarProps) {
  const router = useRouter();
  const { totalCount, setIsCartOpen } = useCart();
  const [internalQuery, setInternalQuery] = useState('');

  const displayCount = externalCount !== undefined ? externalCount : totalCount;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = onSearchChange ? externalQuery : internalQuery;
    if (q && q.trim()) {
      router.push(`/#products?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link href="/" className="navbar__logo">
          Cretzo
        </Link>

        <form onSubmit={handleSearchSubmit} className="navbar__search">
          <span className="navbar__search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search products, brands, categories..."
            value={onSearchChange ? externalQuery : internalQuery}
            onChange={(e) => {
              if (onSearchChange) {
                onSearchChange(e.target.value);
              } else {
                setInternalQuery(e.target.value);
              }
            }}
            aria-label="Search products"
          />
        </form>

        <div className="navbar__actions">
          <Link href="/#categories" className="btn btn--ghost btn--sm">
            Categories
          </Link>
          <Link href="/#products" className="btn btn--ghost btn--sm">
            Products
          </Link>

          <button
            type="button"
            className="navbar__cart"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Shopping cart with ${displayCount} items`}
          >
            🛒
            {displayCount > 0 && (
              <span className="navbar__cart-count">{displayCount}</span>
            )}
          </button>

          <Link href="/vendor" className="btn btn--ghost btn--sm">
            Vendor
          </Link>
          <Link href="/admin" className="btn btn--ghost btn--sm" style={{ color: 'var(--primary-light)' }}>
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}

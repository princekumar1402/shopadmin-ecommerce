'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';
import { getCategories, getProducts, Category, Product } from '@/lib/api';

import { useCart } from '@/context/CartContext';

export default function HomePage() {
  const { addToCart, setIsCartOpen } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories once on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const catList = await getCategories();
        setCategories(catList);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch products whenever filters or sort change
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProducts({
        category: selectedCategory || undefined,
        q: debouncedSearch || undefined,
        sort: sortBy,
        limit: 50,
      });
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, debouncedSearch, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddToCart = (product: Product) => {
    const res = addToCart(product, 1);
    setToastMessage(res.message);
    setIsCartOpen(true);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast toast--success">
            <span>🛒</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="container">
          <div className="hero__grid">
            <div>
              <div className="hero__badge">
                <span>🌟</span>
                <span>Verified Multi-Vendor Platform</span>
              </div>
              <h1 className="hero__title">
                Shop independent stores, <br />
                <span className="hero__title-gradient">all in one place.</span>
              </h1>
              <p className="hero__desc">
                Discover curated tech, fashion, handcrafted goods, and more from
                verified independent merchants with direct seller support.
              </p>
              <div className="hero__actions">
                <a href="#products" className="btn btn--primary">
                  Explore Catalog ↓
                </a>
                <a href="#categories" className="btn btn--secondary">
                  Browse Categories
                </a>
              </div>
              <div className="hero__stats">
                <div>
                  <div className="hero__stat-value">{categories.length > 0 ? categories.length : '8'}+</div>
                  <div className="hero__stat-label">Categories</div>
                </div>
                <div>
                  <div className="hero__stat-value">100%</div>
                  <div className="hero__stat-label">Verified Stores</div>
                </div>
                <div>
                  <div className="hero__stat-value">Instant</div>
                  <div className="hero__stat-label">Buyer Protection</div>
                </div>
              </div>
            </div>

            <div
              className="glass"
              style={{
                padding: 'var(--space-xl)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  marginBottom: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>🔥</span>
                <span>Featured Store Highlight</span>
              </div>
              <p className="text-sm" style={{ marginBottom: 'var(--space-md)' }}>
                TechGear Store is featuring its newest noise-cancelling headphones and mechanical gaming gear with exclusive introductory rates.
              </p>
              <div
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>TechGear Store</div>
                  <div className="text-xs text-muted">Electronics & Gaming Accessories</div>
                </div>
                <span className="badge badge--success">Verified Vendor</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section id="categories" style={{ padding: 'var(--space-xl) 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div className="flex items-center justify-between mb-md" style={{ flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Browse by Category</h2>
              <p className="text-xs text-muted">Select a category to filter the marketplace</p>
            </div>
            {selectedCategory && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setSelectedCategory('')}
              >
                ✕ Clear Category
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
            }}
          >
            <button
              type="button"
              className={`btn ${selectedCategory === '' ? 'btn--primary' : 'btn--ghost'} btn--sm`}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
              onClick={() => setSelectedCategory('')}
            >
              All Items ({totalProducts})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`btn ${selectedCategory === cat.slug ? 'btn--primary' : 'btn--ghost'} btn--sm`}
                style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
              >
                <span>{cat.icon || '🏷️'}</span>
                <span>{cat.name}</span>
                {cat.product_count > 0 && (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      marginLeft: '4px',
                    }}
                  >
                    {cat.product_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main id="products" className="container" style={{ flex: 1, padding: 'var(--space-2xl) var(--space-lg)' }}>
        {/* Filter & Controls Toolbar */}
        <div
          className="flex justify-between items-center mb-lg"
          style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {selectedCategory
                ? `${categories.find((c) => c.slug === selectedCategory)?.name || 'Category'} Catalog`
                : 'Marketplace Products'}
            </h2>
            <p className="text-sm text-muted">
              {isLoading
                ? 'Loading catalog...'
                : `Showing ${products.length} of ${totalProducts} available ${totalProducts === 1 ? 'item' : 'items'}`}
            </p>
          </div>

          <div className="flex items-center gap-md">
            <div className="flex items-center gap-sm">
              <label htmlFor="sort-select" className="text-xs text-muted font-bold">
                Sort By:
              </label>
              <select
                id="sort-select"
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'price_asc' | 'price_desc')}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || debouncedSearch) && (
          <div
            className="flex items-center gap-sm mb-lg"
            style={{ flexWrap: 'wrap', background: 'var(--surface-2)', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
          >
            <span className="text-xs text-muted font-bold">Active Filters:</span>
            {selectedCategory && (
              <span className="badge badge--primary">
                Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
              </span>
            )}
            {debouncedSearch && (
              <span className="badge badge--accent">
                Search: &ldquo;{debouncedSearch}&rdquo;
              </span>
            )}
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={clearFilters}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Catalog States */}
        {isLoading ? (
          <Loading count={6} message="Loading real marketplace products from backend..." />
        ) : error ? (
          <ErrorState
            title="Failed to Load Products"
            message={error}
            onRetry={loadProducts}
          />
        ) : products.length === 0 ? (
          <div
            className="glass"
            style={{
              padding: 'var(--space-3xl) var(--space-xl)',
              textAlign: 'center',
              margin: 'var(--space-2xl) auto',
              maxWidth: '560px',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>🔍</div>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>No Products Found</h3>
            <p className="text-sm" style={{ marginBottom: 'var(--space-lg)' }}>
              {debouncedSearch
                ? `No products match "${debouncedSearch}". Try checking your spelling or selecting another category.`
                : 'No products are currently available in this category.'}
            </p>
            <button type="button" className="btn btn--primary btn--sm" onClick={clearFilters}>
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="product-grid animate-fadeIn">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';
import {
  getAdminProducts,
  getAdminVendors,
  getCategories,
  toggleProductActive,
  loginAdminDemo,
  Product,
  Category,
  AdminVendor,
} from '@/lib/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginAdminDemo();

      const [catList, vendRes, prodRes] = await Promise.all([
        getCategories(),
        getAdminVendors(),
        getAdminProducts({
          status: statusFilter,
          q: searchQuery,
          category: selectedCategory || undefined,
          vendor_id: selectedVendorId ? Number(selectedVendorId) : undefined,
          limit: 100,
        }),
      ]);

      setCategories(catList);
      setVendors(vendRes.vendors || []);
      setProducts(prodRes.products || []);
      setTotalCount(prodRes.total || (prodRes.products ? prodRes.products.length : 0));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch product catalog';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, selectedCategory, selectedVendorId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleProduct = async (product: Product) => {
    const nextActive = (product.is_active ?? 1) === 1 ? 0 : 1;
    const actionLabel = nextActive === 1 ? 'reactivate and publish' : 'deactivate and archive';

    if (!confirm(`Are you sure you want to ${actionLabel} "${product.name}"? Order history will be preserved.`)) {
      return;
    }

    setUpdatingProductId(product.id);
    try {
      await toggleProductActive(product.id, nextActive);
      setToastMessage(
        nextActive === 1
          ? `Product "${product.name}" is now active in the marketplace.`
          : `Product "${product.name}" has been deactivated and hidden from the store.`
      );
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update product state';
      alert(msg);
    } finally {
      setUpdatingProductId(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminNav />

      {toastMessage && (
        <div className="toast-container">
          <div className="toast toast--success">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="container" style={{ flex: 1, padding: 'var(--space-2xl) var(--space-lg)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-xl" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <div className="flex items-center gap-sm">
              <Link href="/admin" className="text-xs text-muted hover:text-primary">
                ← Admin Console
              </Link>
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.3rem)', marginTop: '4px' }}>
              Global Product Catalog
            </h1>
            <p className="text-sm text-muted">
              Audit, search, and manage product listings across all registered marketplace vendors.
            </p>
          </div>

          <div className="flex items-center gap-sm">
            <button
              id="admin-products-refresh-btn"
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={loadData}
              disabled={isLoading}
            >
              🔄 Refresh Catalog
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div
          className="glass mb-xl"
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <form
              onSubmit={handleSearchSubmit}
              style={{ display: 'flex', gap: 'var(--space-sm)', flex: 1, minWidth: '260px' }}
            >
              <input
                id="admin-product-search-input"
                type="text"
                className="form-input"
                placeholder="Search products by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              />
              <button id="admin-product-search-btn" type="submit" className="btn btn--primary btn--sm">
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    loadData();
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Secondary filter selectors */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              flexWrap: 'wrap',
              fontSize: '0.85rem',
            }}
          >
            {/* Status */}
            <div className="flex items-center gap-xs">
              <span className="text-xs text-muted">Status:</span>
              <select
                id="admin-product-status-filter"
                className="form-input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All Products</option>
                <option value="active">Active Catalog Listings</option>
                <option value="inactive">Deactivated / Archived</option>
              </select>
            </div>

            {/* Category */}
            <div className="flex items-center gap-xs">
              <span className="text-xs text-muted">Category:</span>
              <select
                id="admin-product-category-filter"
                className="form-input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.icon || ''} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor */}
            <div className="flex items-center gap-xs">
              <span className="text-xs text-muted">Merchant:</span>
              <select
                id="admin-product-vendor-filter"
                className="form-input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
              >
                <option value="">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.shop_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
              Showing {products.length} {products.length === 1 ? 'listing' : 'listings'}
            </div>
          </div>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <Loading count={4} message="Fetching product listings across merchants..." />
        ) : error ? (
          <ErrorState title="Catalog Management Error" message={error} onRetry={loadData} />
        ) : products.length === 0 ? (
          <div className="glass" style={{ padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center', maxWidth: '520px', margin: 'var(--space-2xl) auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>📦</div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>No Products Found</h2>
            <p className="text-sm text-muted">
              {searchQuery
                ? `No products matched "${searchQuery}".`
                : 'No products currently match the selected filters.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product Listing</th>
                  <th>Category</th>
                  <th>Merchant Store</th>
                  <th>Unit Price</th>
                  <th>Available Stock</th>
                  <th>Status</th>
                  <th>Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const priceNum = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
                  const isActive = (p.is_active ?? 1) === 1;
                  const isUpdating = updatingProductId === p.id;
                  const imgUrl = p.images && p.images.length > 0 ? p.images[0] : null;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-md">
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              flexShrink: 0,
                            }}
                          >
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              '📦'
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                            <div className="text-xs text-muted">ID: #{p.id} • /{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge--ghost" style={{ fontSize: '0.75rem' }}>
                          {p.category || 'General'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {p.vendor_name || 'Vendor'}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>${priceNum.toFixed(2)}</strong>
                      </td>
                      <td>
                        {p.stock <= 5 ? (
                          <span className="badge badge--warning">⚠️ {p.stock} units</span>
                        ) : (
                          <span className="text-sm">{p.stock} units</span>
                        )}
                      </td>
                      <td>
                        {isActive ? (
                          <span className="badge badge--success">✓ Active Listing</span>
                        ) : (
                          <span className="badge badge--danger">Archived / Inactive</span>
                        )}
                      </td>
                      <td>
                        <button
                          id={`toggle-product-active-btn-${p.id}`}
                          type="button"
                          className={`btn btn--sm ${isActive ? 'btn--danger' : 'btn--primary'}`}
                          onClick={() => handleToggleProduct(p)}
                          disabled={isUpdating}
                        >
                          {isUpdating
                            ? 'Updating...'
                            : isActive
                            ? 'Deactivate'
                            : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

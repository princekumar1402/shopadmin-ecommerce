'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';
import {
  getAdminVendors,
  updateVendorApproval,
  loginAdminDemo,
  AdminVendor,
} from '@/lib/api';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [updatingVendorId, setUpdatingVendorId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadVendors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginAdminDemo();

      const res = await getAdminVendors({
        status: statusFilter,
        q: searchQuery,
      });
      setVendors(res.vendors || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch vendor list';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVendors();
  };

  const handleToggleApproval = async (vendor: AdminVendor) => {
    const nextStatus = vendor.is_approved === 1 ? 0 : 1;
    const actionLabel = nextStatus === 1 ? 'approve and activate' : 'suspend and deactivate';

    if (!confirm(`Are you sure you want to ${actionLabel} "${vendor.shop_name}"?`)) {
      return;
    }

    setUpdatingVendorId(vendor.id);
    try {
      await updateVendorApproval(vendor.id, nextStatus);
      setToastMessage(
        nextStatus === 1
          ? `Vendor "${vendor.shop_name}" is now approved and active!`
          : `Vendor "${vendor.shop_name}" has been suspended.`
      );
      await loadVendors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update vendor status';
      alert(msg);
    } finally {
      setUpdatingVendorId(null);
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
              Vendor & Merchant Management
            </h1>
            <p className="text-sm text-muted">
              Oversee marketplace sellers, review newly registered shops, and toggle store approval permissions.
            </p>
          </div>

          <div className="flex items-center gap-sm">
            <button
              id="admin-vendors-refresh-btn"
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={loadVendors}
              disabled={isLoading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          className="glass mb-xl"
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-md)',
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', gap: 'var(--space-sm)', flex: 1, minWidth: '260px' }}
          >
            <input
              id="admin-vendor-search-input"
              type="text"
              className="form-input"
              placeholder="Search store name, owner, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.9rem' }}
            />
            <button id="admin-vendor-search-btn" type="submit" className="btn btn--primary btn--sm">
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setSearchQuery('');
                  loadVendors();
                }}
              >
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-sm">
            <span className="text-xs text-muted">Filter Status:</span>
            <select
              id="admin-vendor-status-select"
              className="form-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'approved' | 'pending')}
            >
              <option value="all">All Vendors ({vendors.length})</option>
              <option value="approved">Approved & Active Only</option>
              <option value="pending">Pending / Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Vendor Table */}
        {isLoading ? (
          <Loading count={4} message="Fetching merchant records..." />
        ) : error ? (
          <ErrorState title="Vendor Management Error" message={error} onRetry={loadVendors} />
        ) : vendors.length === 0 ? (
          <div className="glass" style={{ padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center', maxWidth: '520px', margin: 'var(--space-2xl) auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🏪</div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>No Vendors Found</h2>
            <p className="text-sm text-muted">
              {searchQuery ? `No merchants matched "${searchQuery}".` : 'No vendors currently registered in the database.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Store Information</th>
                  <th>Owner Contact</th>
                  <th>Active Catalog</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => {
                  const isUpdating = updatingVendorId === v.id;
                  const isApproved = v.is_approved === 1;

                  return (
                    <tr key={v.id}>
                      <td>
                        <strong style={{ color: 'var(--primary-light)' }}>#{v.id}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.shop_name}</div>
                        <div className="text-xs text-muted">slug: /{v.slug}</div>
                        {v.description && (
                          <div className="text-xs text-muted" style={{ maxWidth: '280px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{v.owner_name}</div>
                        <div className="text-xs text-muted">{v.email}</div>
                      </td>
                      <td>
                        <span className="badge badge--primary">
                          {v.product_count} {v.product_count === 1 ? 'product' : 'products'}
                        </span>
                      </td>
                      <td className="text-sm">
                        {new Date(v.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td>
                        {isApproved ? (
                          <span className="badge badge--success">✓ Approved</span>
                        ) : (
                          <span className="badge badge--warning">⏳ Pending / Suspended</span>
                        )}
                      </td>
                      <td>
                        <button
                          id={`toggle-vendor-approval-btn-${v.id}`}
                          type="button"
                          className={`btn btn--sm ${isApproved ? 'btn--danger' : 'btn--primary'}`}
                          onClick={() => handleToggleApproval(v)}
                          disabled={isUpdating}
                        >
                          {isUpdating
                            ? 'Updating...'
                            : isApproved
                            ? 'Suspend Store'
                            : 'Approve & Activate'}
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

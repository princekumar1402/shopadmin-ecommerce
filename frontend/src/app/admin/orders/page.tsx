'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';
import {
  getAdminOrders,
  updateOrderStatus,
  loginAdminDemo,
  AdminRecentOrder,
} from '@/lib/api';

const ALLOWED_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminRecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginAdminDemo();

      const res = await getAdminOrders({
        status: statusFilter,
        q: searchQuery,
      });
      setOrders(res.orders || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch marketplace orders';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (!ALLOWED_STATUSES.includes(newStatus as any)) {
      alert('Invalid order status transition.');
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setToastMessage(`Order #${orderId} status successfully transitioned to "${newStatus.toUpperCase()}".`);
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status';
      alert(msg);
    } finally {
      setUpdatingOrderId(null);
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
              Marketplace Order Management
            </h1>
            <p className="text-sm text-muted">
              Inspect buyer transactions, monitor fulfillment across vendor stores, and manage order progression.
            </p>
          </div>

          <div className="flex items-center gap-sm">
            <button
              id="admin-orders-refresh-btn"
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={loadOrders}
              disabled={isLoading}
            >
              🔄 Refresh Orders
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
              id="admin-order-search-input"
              type="text"
              className="form-input"
              placeholder="Search by order #, buyer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.9rem' }}
            />
            <button id="admin-order-search-btn" type="submit" className="btn btn--primary btn--sm">
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setSearchQuery('');
                  loadOrders();
                }}
              >
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-sm">
            <span className="text-xs text-muted">Filter Status:</span>
            <select
              id="admin-order-status-filter"
              className="form-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Orders ({orders.length})</option>
              {ALLOWED_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <Loading count={4} message="Fetching customer orders across marketplace..." />
        ) : error ? (
          <ErrorState title="Orders Error" message={error} onRetry={loadOrders} />
        ) : orders.length === 0 ? (
          <div className="glass" style={{ padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center', maxWidth: '520px', margin: 'var(--space-2xl) auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>📑</div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>No Orders Found</h2>
            <p className="text-sm text-muted">
              {searchQuery
                ? `No orders matched "${searchQuery}".`
                : 'No orders have been recorded in the database yet.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Order Date</th>
                  <th>Customer Information</th>
                  <th>Vendors Involved</th>
                  <th>Line Items</th>
                  <th>Total Amount</th>
                  <th>Current Status</th>
                  <th>Administrative Transition</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const totalNum = typeof ord.total_amount === 'string' ? parseFloat(ord.total_amount) : ord.total_amount;
                  const isUpdating = updatingOrderId === ord.id;

                  return (
                    <tr key={ord.id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--primary-light)' }}>
                          #{ord.id}
                        </strong>
                      </td>
                      <td className="text-sm">
                        {new Date(ord.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.buyer_name || 'Customer'}</div>
                        <div className="text-xs text-muted">{ord.buyer_email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                          {ord.vendor_names || 'Direct / Platform'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge--primary">
                          {ord.item_count} {ord.item_count === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
                        ${totalNum.toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            ord.status === 'delivered'
                              ? 'badge--success'
                              : ord.status === 'shipped'
                              ? 'badge--primary'
                              : ord.status === 'cancelled'
                              ? 'badge--danger'
                              : 'badge--warning'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-sm">
                          <select
                            id={`admin-order-status-select-${ord.id}`}
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
                            value={ord.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          >
                            {ALLOWED_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st.toUpperCase()}
                              </option>
                            ))}
                          </select>
                          {isUpdating && <span className="text-xs text-muted">Updating...</span>}
                        </div>
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

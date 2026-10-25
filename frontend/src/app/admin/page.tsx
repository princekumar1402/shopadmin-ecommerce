'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';
import {
  getAdminDashboard,
  loginAdminDemo,
  AdminDashboardData,
} from '@/lib/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Connect admin session if needed
      await loginAdminDemo();

      // Fetch platform metrics and recents from real backend API
      const res = await getAdminDashboard();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load admin metrics';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminNav />

      <main className="container" style={{ flex: 1, padding: 'var(--space-2xl) var(--space-lg)' }}>
        {/* Header */}
        <div
          className="glass"
          style={{
            padding: 'var(--space-xl)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-2xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-lg)',
          }}
        >
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <span className="badge badge--primary">Platform Administration</span>
              <span className="badge badge--success">✓ Live MySQL Connected</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)', marginBottom: '4px' }}>
              System Control Center
            </h1>
            <p className="text-sm text-muted">
              Real-time platform metrics, marketplace oversight, vendor onboarding, and global order fulfillment.
            </p>
          </div>

          <div className="flex gap-sm">
            <button
              id="admin-refresh-metrics-btn"
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={loadData}
              disabled={isLoading}
            >
              🔄 Refresh Data
            </button>
            <Link
              id="admin-quick-vendors-btn"
              href="/admin/vendors"
              className="btn btn--outline btn--sm"
            >
              🏪 Manage Vendors
            </Link>
            <Link
              id="admin-quick-products-btn"
              href="/admin/products"
              className="btn btn--primary btn--sm"
            >
              📦 Product Catalog
            </Link>
          </div>
        </div>

        {isLoading ? (
          <Loading count={5} message="Loading platform metrics & recent activity..." />
        ) : error ? (
          <ErrorState title="Admin Dashboard Error" message={error} onRetry={loadData} />
        ) : !data ? (
          <div className="glass" style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
            <p className="text-muted">No dashboard data available.</p>
          </div>
        ) : (
          <>
            {/* KPI Metrics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 'var(--space-lg)',
                marginBottom: 'var(--space-2xl)',
              }}
            >
              {/* Total Users */}
              <div
                className="glass"
                style={{
                  padding: 'var(--space-xl)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                }}
              >
                <div className="flex items-center justify-between text-muted text-xs">
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Users
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>👥</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                  {data.metrics.total_users}
                </div>
                <span className="text-xs text-muted">Buyers, vendors & staff</span>
              </div>

              {/* Total Vendors */}
              <div
                className="glass"
                style={{
                  padding: 'var(--space-xl)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                }}
              >
                <div className="flex items-center justify-between text-muted text-xs">
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Vendors
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>🏪</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#38bdf8' }}>
                  {data.metrics.total_vendors}
                </div>
                <span className="text-xs text-muted">Registered merchant stores</span>
              </div>

              {/* Active & Total Products */}
              <div
                className="glass"
                style={{
                  padding: 'var(--space-xl)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                }}
              >
                <div className="flex items-center justify-between text-muted text-xs">
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active Products
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>📦</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#4ade80' }}>
                  {data.metrics.active_products}
                </div>
                <span className="text-xs text-muted">
                  {data.metrics.total_products} total catalog entries
                </span>
              </div>

              {/* Total Orders */}
              <div
                className="glass"
                style={{
                  padding: 'var(--space-xl)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                }}
              >
                <div className="flex items-center justify-between text-muted text-xs">
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Orders
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>📑</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fb923c' }}>
                  {data.metrics.total_orders}
                </div>
                <span className="text-xs text-muted">Completed & in-flight</span>
              </div>

              {/* Gross Sales Volume */}
              <div
                className="glass"
                style={{
                  padding: 'var(--space-xl)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                }}
              >
                <div className="flex items-center justify-between text-muted text-xs">
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total GMV
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>💰</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f43f5e' }}>
                  ${Number(data.metrics.total_order_value).toFixed(2)}
                </div>
                <span className="text-xs text-muted">Excludes cancelled orders</span>
              </div>
            </div>

            {/* Split Section: Recent Orders & Newly Registered Vendors */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: 'var(--space-xl)',
              }}
            >
              {/* Recent Orders */}
              <div className="glass" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)' }}>
                <div className="flex items-center justify-between mb-lg">
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Marketplace Orders</h2>
                    <p className="text-xs text-muted">Latest customer purchases across merchants</p>
                  </div>
                  <Link href="/admin/orders" className="btn btn--ghost btn--sm">
                    View All Orders →
                  </Link>
                </div>

                {data.recent_orders.length === 0 ? (
                  <p className="text-sm text-muted" style={{ padding: 'var(--space-lg) 0' }}>
                    No orders placed yet.
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_orders.map((ord) => {
                          const totalNum = typeof ord.total_amount === 'string' ? parseFloat(ord.total_amount) : ord.total_amount;
                          return (
                            <tr key={ord.id}>
                              <td>
                                <strong style={{ color: 'var(--primary-light)' }}>#{ord.id}</strong>
                                <div className="text-xs text-muted">
                                  {new Date(ord.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{ord.buyer_name}</div>
                                <div className="text-xs text-muted">{ord.buyer_email}</div>
                              </td>
                              <td style={{ fontWeight: 700 }}>${totalNum.toFixed(2)}</td>
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
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Newly Registered Vendors */}
              <div className="glass" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)' }}>
                <div className="flex items-center justify-between mb-lg">
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Merchant Stores</h2>
                    <p className="text-xs text-muted">Registered vendor accounts & approval status</p>
                  </div>
                  <Link href="/admin/vendors" className="btn btn--ghost btn--sm">
                    Manage All Vendors →
                  </Link>
                </div>

                {data.recent_vendors.length === 0 ? (
                  <p className="text-sm text-muted" style={{ padding: 'var(--space-lg) 0' }}>
                    No vendors registered yet.
                  </p>
                ) : (
                  <div className="table-container">
                    <table className="table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Shop</th>
                          <th>Owner</th>
                          <th>Products</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_vendors.map((v) => (
                          <tr key={v.id}>
                            <td>
                              <strong style={{ color: 'var(--text)' }}>{v.shop_name}</strong>
                              <div className="text-xs text-muted">/{v.slug}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{v.owner_name}</div>
                              <div className="text-xs text-muted">{v.email}</div>
                            </td>
                            <td>
                              <span className="badge badge--primary" style={{ fontSize: '0.7rem' }}>
                                {v.product_count} active
                              </span>
                            </td>
                            <td>
                              {v.is_approved === 1 ? (
                                <span className="badge badge--success" style={{ fontSize: '0.7rem' }}>
                                  ✓ Approved
                                </span>
                              ) : (
                                <span className="badge badge--warning" style={{ fontSize: '0.7rem' }}>
                                  ⏳ Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

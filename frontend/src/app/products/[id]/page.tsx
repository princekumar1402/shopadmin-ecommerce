'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loading from '@/components/Loading';
import ErrorState from '@/components/ErrorState';
import { getProduct, Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);

  const { addToCart, setIsCartOpen } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(productId) || productId <= 0) {
      setError('Invalid product ID');
      setIsLoading(false);
      return;
    }

    async function loadProduct() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProduct(productId);
        if (!data) {
          setError('Product not found or has been discontinued.');
        } else {
          setProduct(data);
          if (data.images && data.images.length > 0) {
            setSelectedImage(data.images[0]);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load product details';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    const res = addToCart(product, quantity);
    setToastMessage(res.message);
    if (res.success) {
      setIsCartOpen(true);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    router.push('/checkout');
  };

  const priceNum = product
    ? typeof product.price === 'string'
      ? parseFloat(product.price)
      : product.price
    : 0;

  const compareNum = product?.compare_price
    ? typeof product.compare_price === 'string'
      ? parseFloat(product.compare_price)
      : product.compare_price
    : null;

  const discountPercent =
    compareNum && compareNum > priceNum
      ? Math.round(((compareNum - priceNum) / compareNum) * 100)
      : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {toastMessage && (
        <div className="toast-container">
          <div className="toast toast--info">
            <span>🛒</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="container" style={{ flex: 1, padding: 'var(--space-2xl) var(--space-lg)' }}>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            fontSize: '0.85rem',
            color: 'var(--text-3)',
            marginBottom: 'var(--space-xl)',
          }}
        >
          <Link href="/" className="hover:text-primary">
            Marketplace
          </Link>
          <span>/</span>
          {product?.category && (
            <>
              <Link
                href={`/#products?category=${product.category_slug || ''}`}
                className="hover:text-primary"
              >
                {product.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--text)' }}>{product?.name || 'Product Details'}</span>
        </nav>

        {isLoading ? (
          <Loading count={1} message="Fetching product specifications..." />
        ) : error || !product ? (
          <ErrorState
            title="Product Unavailable"
            message={error || 'We could not find the requested item.'}
            onRetry={() => window.location.reload()}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 'var(--space-2xl)',
              alignItems: 'start',
            }}
          >
            {/* Left: Image Gallery */}
            <div>
              <div
                className="glass"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  marginBottom: 'var(--space-md)',
                  aspectRatio: '1/1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface-2)',
                }}
              >
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ fontSize: '5rem' }}>📦</div>
                )}
              </div>

              {/* Thumbnails if multiple images exist */}
              {product.images && product.images.length > 1 && (
                <div style={{ display: 'flex', gap: 'var(--space-sm)', overflowX: 'auto' }}>
                  {product.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(imgUrl)}
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: selectedImage === imgUrl ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                        background: 'var(--surface-2)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details & Buying Actions */}
            <div>
              {product.vendor_name && (
                <div className="flex items-center gap-sm mb-sm">
                  <span className="badge badge--primary">
                    🏪 {product.vendor_name}
                  </span>
                  {product.category && (
                    <span className="badge badge--accent">
                      {product.category}
                    </span>
                  )}
                </div>
              )}

              <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', marginBottom: 'var(--space-sm)' }}>
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-sm text-sm" style={{ marginBottom: 'var(--space-md)', color: 'var(--warning)' }}>
                <span>★ {product.avg_rating > 0 ? product.avg_rating.toFixed(1) : '5.0'}</span>
                <span className="text-muted">
                  ({product.review_count} customer {product.review_count === 1 ? 'review' : 'reviews'})
                </span>
                <span className="text-muted">•</span>
                <span className="badge badge--success">Verified Merchant</span>
              </div>

              {/* Price Box */}
              <div
                className="glass"
                style={{
                  padding: 'var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--space-xl)',
                }}
              >
                <div className="flex items-baseline gap-md">
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
                    ${priceNum.toFixed(2)}
                  </span>
                  {compareNum && compareNum > priceNum && (
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>
                      ${compareNum.toFixed(2)}
                    </span>
                  )}
                  {discountPercent !== null && (
                    <span className="badge badge--success">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>

                <div className="mt-sm">
                  {product.stock > 0 ? (
                    <span className="text-xs" style={{ color: 'var(--success)', fontWeight: 600 }}>
                      ✓ In Stock ({product.stock} units ready to ship)
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--danger)', fontWeight: 600 }}>
                      ✕ Currently Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                  Product Description
                </h3>
                <p className="text-sm" style={{ lineHeight: 1.8 }}>
                  {product.description || 'No detailed description provided by vendor.'}
                </p>
              </div>

              {/* Quantity Selector & Actions */}
              {product.stock > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div className="flex items-center gap-md">
                    <label htmlFor="qty-select" className="text-sm font-bold">
                      Quantity:
                    </label>
                    <div className="flex items-center gap-sm">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ width: '36px', height: '36px', padding: 0 }}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        id="qty-select"
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setQuantity(Math.min(product.stock, Math.max(1, val)));
                          }
                        }}
                        style={{
                          width: '56px',
                          textAlign: 'center',
                          padding: '6px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text)',
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ width: '36px', height: '36px', padding: 0 }}
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-muted">
                      (Max {product.stock})
                    </span>
                  </div>

                  <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn--primary btn--lg"
                      style={{ flex: 1, minWidth: '180px' }}
                      onClick={handleAddToCart}
                    >
                      🛒 Add to Cart
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary btn--lg"
                      style={{ flex: 1, minWidth: '180px' }}
                      onClick={handleBuyNow}
                    >
                      ⚡ Buy Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="badge badge--danger" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  This product is currently out of stock.
                </div>
              )}

              {/* Guarantees Box */}
              <div
                style={{
                  marginTop: 'var(--space-2xl)',
                  paddingTop: 'var(--space-lg)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 'var(--space-md)',
                }}
              >
                <div className="text-xs text-muted">
                  <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '2px' }}>
                    🚚 Fast Dispatch
                  </strong>
                  Ships within 24-48 business hours.
                </div>
                <div className="text-xs text-muted">
                  <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '2px' }}>
                    🛡️ Buyer Protection
                  </strong>
                  30-day money-back satisfaction guarantee.
                </div>
                <div className="text-xs text-muted">
                  <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '2px' }}>
                    💬 Direct Support
                  </strong>
                  Contact vendor directly for questions.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<Loading count={1} message="Loading product details..." />}>
      <ProductDetailContent />
    </Suspense>
  );
}

import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { addToCart, setIsCartOpen } = useCart();

  const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const compareNum = product.compare_price
    ? typeof product.compare_price === 'string'
      ? parseFloat(product.compare_price)
      : product.compare_price
    : null;

  const discountPercent =
    compareNum && compareNum > priceNum
      ? Math.round(((compareNum - priceNum) / compareNum) * 100)
      : null;

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="block">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="product-card__image"
            loading="lazy"
          />
        ) : (
          <div className="product-card__image-placeholder" aria-hidden="true">
            📦
          </div>
        )}
      </Link>

      <div className="product-card__body">
        {product.vendor_name && (
          <div className="product-card__vendor">
            🏪 {product.vendor_name}
          </div>
        )}

        <h3 className="product-card__name" title={product.name}>
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>

        <div className="product-card__rating">
          <span>★ {product.avg_rating > 0 ? product.avg_rating.toFixed(1) : 'New'}</span>
          <span>({product.review_count} {product.review_count === 1 ? 'review' : 'reviews'})</span>
        </div>

        <div className="product-card__price">
          <span className="product-card__price-current">
            ${priceNum.toFixed(2)}
          </span>
          {compareNum && compareNum > priceNum && (
            <span className="product-card__price-compare">
              ${compareNum.toFixed(2)}
            </span>
          )}
          {discountPercent !== null && (
            <span className="product-card__discount">
              -{discountPercent}%
            </span>
          )}
        </div>

        <div className="mt-sm">
          {product.stock > 0 ? (
            <span className="text-xs text-muted">
              {product.stock <= 5 ? `⚠️ Only ${product.stock} left in stock` : `✓ In Stock (${product.stock})`}
            </span>
          ) : (
            <span className="text-xs text-muted" style={{ color: 'var(--danger)' }}>
              ✕ Out of Stock
            </span>
          )}
        </div>
      </div>

      <div className="product-card__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm btn--full"
          disabled={product.stock <= 0}
          onClick={(e) => {
            e.preventDefault();
            if (onAddToCart) {
              onAddToCart(product);
            } else {
              addToCart(product, 1);
              setIsCartOpen(true);
            }
          }}
        >
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </article>
  );
}

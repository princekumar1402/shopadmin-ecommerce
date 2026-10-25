import React from 'react';

interface LoadingProps {
  count?: number;
  message?: string;
}

export default function Loading({ count = 8, message = 'Loading marketplace items...' }: LoadingProps) {
  return (
    <div style={{ padding: 'var(--space-xl) 0' }}>
      <div className="flex items-center justify-between mb-lg">
        <p className="text-sm text-muted">{message}</p>
      </div>

      <div className="product-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="product-card" style={{ cursor: 'default' }}>
            <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1' }} />
            <div className="product-card__body">
              <div className="skeleton" style={{ width: '40%', height: '12px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '85%', height: '18px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '30%', height: '14px', marginBottom: '12px' }} />
              <div className="skeleton" style={{ width: '50%', height: '24px' }} />
            </div>
            <div className="product-card__actions">
              <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-full)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

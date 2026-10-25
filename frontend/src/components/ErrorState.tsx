import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Unable to Load Products',
  message = 'Failed to connect to the marketplace API. Please ensure the backend server is running.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="glass"
      style={{
        padding: 'var(--space-2xl) var(--space-xl)',
        textAlign: 'center',
        maxWidth: '520px',
        margin: 'var(--space-2xl) auto',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⚠️</div>
      <h3 style={{ marginBottom: 'var(--space-sm)' }}>{title}</h3>
      <p className="text-sm" style={{ marginBottom: 'var(--space-lg)' }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="btn btn--primary btn--sm" onClick={onRetry}>
          🔄 Retry Connection
        </button>
      )}
    </div>
  );
}

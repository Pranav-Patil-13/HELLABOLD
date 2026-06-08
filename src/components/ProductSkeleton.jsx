import React from 'react';

export const GridSkeleton = ({ count = 6 }) => {
  return (
    <div className="shop__products-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="product-card skeleton-card">
          <div className="product-card__image-container skeleton-shimmer" style={{ background: '#f5f5f5' }}></div>
          <div className="product-card__info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div className="skeleton-line skeleton-shimmer" style={{ width: '70%', height: '1.2rem' }}></div>
            <div className="skeleton-line skeleton-shimmer" style={{ width: '40%', height: '1rem' }}></div>
          </div>
          <div className="skeleton-line skeleton-shimmer" style={{ width: '100%', height: '3rem', marginTop: 'auto' }}></div>
        </div>
      ))}
    </div>
  );
};

export const DetailsSkeleton = () => {
  return (
    <div className="pdp-container">
      {/* Breadcrumb skeleton */}
      <div className="skeleton-line skeleton-shimmer" style={{ width: '150px', height: '1rem', marginBottom: '2.5rem' }}></div>
      
      <div className="pdp-layout">
        {/* Gallery Image skeleton */}
        <div className="pdp-gallery">
          <div className="pdp-gallery__main skeleton-shimmer" style={{ height: '500px', background: '#f5f5f5' }}></div>
        </div>

        {/* Info skeleton */}
        <div className="pdp-info" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="skeleton-line skeleton-shimmer" style={{ width: '80%', height: '2.5rem' }}></div>
          <div className="skeleton-line skeleton-shimmer" style={{ width: '30%', height: '2rem' }}></div>
          <div className="skeleton-line skeleton-shimmer" style={{ width: '100%', height: '4rem' }}></div>
          
          <hr className="pdp-divider" />
          
          <div className="skeleton-line skeleton-shimmer" style={{ width: '50%', height: '1.5rem' }}></div>
          <div className="skeleton-line skeleton-shimmer" style={{ width: '100%', height: '3.5rem' }}></div>
        </div>
      </div>
    </div>
  );
};

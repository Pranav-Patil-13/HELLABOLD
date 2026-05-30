import React, { useState } from 'react';

const FavoritesDrawer = ({ 
  isOpen, 
  onClose, 
  likedProducts, 
  onToggleLike, 
  onAddToCart 
}) => {
  if (!isOpen) return null;

  // Track size selections per product ID
  const [selectedSizes, setSelectedSizes] = useState({});

  const handleSizeChange = (productId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  const handleAddClick = (product) => {
    const isOutOfStock = product.label === 'out-of-stock';
    if (isOutOfStock) return;

    const size = selectedSizes[product.id] || product.sizes?.[0] || 'M';
    onAddToCart(product, size);
  };

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer favorites-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer__header">
          <h2>My Favorites ({likedProducts.length})</h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close favorites">
            &times;
          </button>
        </div>

        <div className="cart-drawer__content">
          {likedProducts.length === 0 ? (
            <div className="cart-drawer__empty">
              <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <p>Your favorites list is currently empty.</p>
              <button className="btn btn--primary" onClick={onClose} style={{ marginTop: '1.5rem' }}>
                Discover Products
              </button>
            </div>
          ) : (
            <div className="cart-drawer__list">
              {likedProducts.map((product) => {
                const isOutOfStock = product.label === 'out-of-stock';
                const currentSize = selectedSizes[product.id] || product.sizes?.[0] || '';

                return (
                  <div key={product.id} className="cart-item fav-item" style={{ position: 'relative' }}>
                    <img src={product.images?.[0]} alt={product.title} className="cart-item__img" />
                    <div className="cart-item__info" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                      <h3 className="cart-item__title">{product.title}</h3>
                      <p className="cart-item__price" style={{ fontWeight: 'bold' }}>{product.price}</p>
                      
                      {!isOutOfStock && product.sizes && product.sizes.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.2rem 0' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Size:</span>
                          <select 
                            value={currentSize} 
                            onChange={(e) => handleSizeChange(product.id, e.target.value)}
                            style={{ 
                              padding: '2px 8px', 
                              fontSize: '0.75rem', 
                              border: '1px solid var(--border-color)', 
                              background: '#fff', 
                              fontFamily: 'inherit' 
                            }}
                          >
                            {product.sizes.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
                        <button 
                          className="btn btn--primary" 
                          onClick={() => handleAddClick(product)}
                          disabled={isOutOfStock}
                          style={{ 
                            flex: 1, 
                            padding: '0.6rem', 
                            fontSize: '0.75rem', 
                            letterSpacing: '1px',
                            backgroundColor: isOutOfStock ? '#ccc' : 'var(--accent-color)',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isOutOfStock ? 'Sold Out' : 'Add to Bag'}
                        </button>
                        <button 
                          className="btn btn--outline" 
                          onClick={() => onToggleLike(product.id)}
                          style={{ 
                            padding: '0.6rem 0.8rem', 
                            fontSize: '0.75rem', 
                            borderColor: 'rgba(0,0,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove from favorites"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="2">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesDrawer;

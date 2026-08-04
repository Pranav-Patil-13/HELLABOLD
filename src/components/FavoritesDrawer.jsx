import React, { useState } from 'react';
import { cloudinaryOptimize } from '../utils/cloudinary';

const modelImages = {
  front: {
    male: {
      black: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771788/front_black_male.webp',
      white: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771788/front_white_male.webp',
      grey: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771788/front_grey_male.webp'
    },
    female: {
      black: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771789/front_black_female.webp',
      white: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771789/front_white_female.webp',
      grey: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771788/front_grey_female.webp'
    }
  },
  back: {
    male: {
      black: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771789/back_black_male.webp',
      white: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771789/back_white_male.webp',
      grey: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771789/back_grey_male.webp'
    },
    female: {
      black: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771789/back_black_female.webp',
      white: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771789/back_white_female.webp',
      grey: 'https://res.cloudinary.com/dyg9n8665/image/upload/v1727771789/back_grey_female.webp'
    }
  }
};

const FavoritesDrawer = ({ 
  isOpen, 
  onClose, 
  likedProducts, 
  onToggleLike, 
  onAddToCart 
}) => {
  if (!isOpen) return null;

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
                const currentSize = selectedSizes[product.id] || product.sizes?.[0] || 'M';

                // Render unavailable custom design fallback
                if (product.isCustomDesign && product.isUnavailable) {
                  return (
                    <div key={product.id} className="cart-item fav-item" style={{ border: '1px solid #fee2e2', padding: '0.8rem', backgroundColor: '#fef2f2', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div>
                        <h3 className="cart-item__title" style={{ color: '#dc2626', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {product.title}
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.2rem', lineHeight: '1.3' }}>
                          This community design is no longer available because the creator deleted it.
                        </p>
                      </div>
                      <button 
                        className="btn btn--outline" 
                        onClick={() => onToggleLike(product.id)}
                        style={{ 
                          padding: '0.4rem', 
                          fontSize: '0.7rem', 
                          borderColor: '#fca5a5',
                          color: '#b91c1c',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          width: '100%'
                        }}
                      >
                        Remove from Favorites
                      </button>
                    </div>
                  );
                }

                // Render active custom design preview
                if (product.isCustomDesign) {
                  const design = product.designData || {};
                  const side = design.defaultSide || (design.frontImage ? 'front' : 'back');
                  const graphicUrl = side === 'front' ? design.frontImage : design.backImage;
                  const modelImg = '/assets/custom_placeholder.png';
                  const placement = design.customMeta?.placement?.[side] || {};
                  
                  const scale = placement.scale || 100;
                  const posX = placement.x !== undefined ? placement.x : 5;
                  const posY = placement.y !== undefined ? placement.y : 5;
                  const rotation = placement.rotation || 0;
                  const opacity = placement.opacity !== undefined ? placement.opacity : 100;

                  return (
                    <div key={product.id} className="cart-item fav-item" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div className="cart-item__preview-wrapper" style={{ position: 'relative', width: '80px', height: '100px', backgroundColor: '#f3f4f6', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={modelImg} alt="Model Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {graphicUrl && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: '40%',
                              left: '50%',
                              width: '40%',
                              height: '40%',
                              transform: `translate(-50%, -50%) translate(${posX}px, ${posY}px) rotate(${rotation}deg) scale(${scale / 100})`,
                              opacity: opacity / 100,
                              pointerEvents: 'none',
                              mixBlendMode: design.color === 'white' ? 'multiply' : 'normal'
                            }}
                          >
                            <img src={graphicUrl} alt="Graphic" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>

                      <div className="cart-item__info" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                        <h3 className="cart-item__title">{product.title}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>by @{design.author}</p>
                        <p className="cart-item__price" style={{ fontWeight: 'bold' }}>{product.price}</p>
                        
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

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
                          <button 
                            className="btn btn--primary" 
                            onClick={() => {
                              const customProduct = {
                                id: design.id,
                                title: design.title,
                                price: `₹${design.customMeta?.price || 999}`,
                                isCustom: true,
                                remixOf: {
                                  designId: design.id,
                                  creator: design.author || 'Bold Creator',
                                  creatorEmail: design.authorEmail || null
                                },
                                customMeta: {
                                  ...design.customMeta,
                                  isBothSides: !!(design.frontImage && design.backImage),
                                  placement: design.customMeta?.placement,
                                  size: currentSize
                                },
                                frontImage: design.frontImage,
                                backImage: design.backImage,
                                customDesign: design.frontImage || null,
                                customDesignBack: design.backImage || null,
                                customDesignName: design.frontImage ? 'custom-design-front.png' : '',
                                customDesignBackName: design.backImage ? 'custom-design-back.png' : '',
                                images: [
                                  design.frontImage || design.backImage || ''
                                ],
                                color: design.color,
                                gender: design.gender,
                                garmentType: design.garmentType
                              };
                              onAddToCart(customProduct, currentSize);
                            }}
                            style={{ 
                              flex: 1, 
                              padding: '0.6rem', 
                              fontSize: '0.75rem', 
                              letterSpacing: '1px'
                            }}
                          >
                            Add to Bag
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
                }

                // Render standard product item
                const isOutOfStock = product.label === 'out-of-stock';
                return (
                  <div key={product.id} className="cart-item fav-item" style={{ position: 'relative' }}>
                    <img src={cloudinaryOptimize(product.images?.[0])} alt={product.title} className="cart-item__img" loading="lazy" />
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

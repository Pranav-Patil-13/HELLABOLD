import React, { useState } from 'react';
import { cloudinaryOptimize } from '../utils/cloudinary';

const ProductCard = ({ product, onAddToCart, isLiked = false, onToggleLike, cardIndex = 99, isTransitionTarget = false, isInCart = false, onOpenCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const isAboveFold = cardIndex < 3;

  const handleNextImage = (e) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleLike = (e) => {
    e.preventDefault();
    if (onToggleLike) {
      onToggleLike(product.id);
    }
  };

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    if (isInCart) {
      if (onOpenCart) {
        onOpenCart();
      }
      return;
    }
    onAddToCart();
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1000);
  };

  const handleDotClick = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const handleCardClick = (e) => {
    if (
      e.target.closest('.carousel-btn') || 
      e.target.closest('.like-btn') || 
      e.target.closest('.add-to-cart-btn') ||
      e.target.closest('.product-card__dot')
    ) {
      return;
    }
    const imgEl = e.currentTarget.querySelector('.product-card__img.active');
    if (imgEl) {
      imgEl.style.viewTransitionName = `product-image-${product.id}`;
    }
    const currentMainImg = document.querySelector('.pdp-gallery__main-img');
    if (currentMainImg) {
      currentMainImg.style.viewTransitionName = 'none';
    }
    window.history.pushState({}, '', `/?product=${product.id}&img=${currentImageIndex}`);
    window.dispatchEvent(new Event('popstate'));
  };

  const renderProductBadge = () => {
    if (!product.label) return null;
    let icon = null;
    let text = '';
    
    if (product.label === 'selling-fast') {
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      );
      text = 'Selling Fast';
    } else if (product.label === 'few-left') {
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      );
      text = 'Few Left';
    } else if (product.label === 'out-of-stock') {
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      );
      text = 'Out of Stock';
    }

    return (
      <span className={`product-badge product-badge--${product.label}`}>
        {icon}
        <span>{text}</span>
      </span>
    );
  };

  return (
    <article className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        <div className="product-card__image-container">
            {renderProductBadge()}

            <div className="product-card__carousel">
              {product.images.map((imgSrc, index) => (
                <img 
                  key={index}
                  src={cloudinaryOptimize(imgSrc)} 
                  alt={`${product.title} view ${index + 1}`} 
                  className={`product-card__img ${index === currentImageIndex ? 'active' : ''}`}
                  loading={isAboveFold && index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={isAboveFold && index === 0 ? 'high' : 'auto'}
                  style={isTransitionTarget && index === currentImageIndex ? { viewTransitionName: `product-image-${product.id}` } : {}}
                />
              ))}
            </div>
            
            {product.images.length > 1 && (
              <>
                <button className="carousel-btn carousel-btn--prev" aria-label="Previous image" onClick={handlePrevImage}>‹</button>
                <button className="carousel-btn carousel-btn--next" aria-label="Next image" onClick={handleNextImage}>›</button>
              </>
            )}
            
            <button 
              className={`like-btn ${isLiked ? 'liked' : ''}`} 
              aria-label="Like product"
              onClick={handleLike}
              style={{ transform: isLiked ? 'scale(1.1)' : 'scale(1)' }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>

            {product.images.length > 1 && (
              <div className="product-card__dots">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    className={`product-card__dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={(e) => handleDotClick(e, index)}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
        </div>
        <div className="product-card__info">
            <h3 className="product-card__title">{product.title}</h3>
            <p className="product-card__price">
              <span>{product.price}</span>
              {product.original_price && (
                <span className="product-card__original-price">{product.original_price}</span>
              )}
            </p>
        </div>
        <button 
          className={`btn add-to-cart-btn ${isInCart ? 'btn--outline' : 'btn--primary'}`} 
          onClick={handleAddToCartClick}
          disabled={product.label === 'out-of-stock'}
          style={isAdded ? { backgroundColor: 'var(--text-primary)' } : product.label === 'out-of-stock' ? { backgroundColor: '#e2e8f0', color: '#a0aec0', cursor: 'not-allowed', borderColor: '#e2e8f0' } : {}}
        >
          {product.label === 'out-of-stock' ? 'Sold Out' : isAdded ? 'Added' : isInCart ? 'View Cart' : 'Add to Cart'}
        </button>
    </article>
  );
};

export default ProductCard;

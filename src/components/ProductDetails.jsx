import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import { cloudinaryOptimize } from '../utils/cloudinary';
import BargainModal from './BargainModal';

const ProductDetails = ({ product, products = [], reviews = [], onAddToCart, onAddBargainedToCart, isLiked = false, onToggleLike, initialImageIndex = 0, cartItems = [], onOpenCart }) => {
  if (!product) {
    return (
      <div className="pdp-error">
        <h2>Product not found.</h2>
        <a href="/" className="btn btn--primary">Back to Shop</a>
      </div>
    );
  }

  const isInCart = cartItems.some(item => String(item.id) === String(product.id));
  const [activeImageIndex, setActiveImageIndex] = useState(initialImageIndex);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [activeTab, setActiveTab] = useState('details'); // details, sizing, shipping
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const [showPeekingMascot, setShowPeekingMascot] = useState(false);
  const [isWishlistHovered, setIsWishlistHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    setActiveImageIndex(initialImageIndex);
  }, [product.id, initialImageIndex]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (product.label === 'out-of-stock') return;
    if (showPeekingMascot) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPeekingMascot(true);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Lightbox carousel states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const renderProductBadgeInline = () => {
    if (!product.label) return null;
    let icon = null;
    let text = '';

    if (product.label === 'selling-fast') {
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
      text = 'Selling Fast';
    } else if (product.label === 'few-left') {
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
      text = 'Few Left';
    } else if (product.label === 'out-of-stock') {
      icon = (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      );
      text = 'Out of Stock';
    }

    return (
      <span className={`product-badge product-badge--inline product-badge--${product.label}`} style={{ position: 'static', transform: 'none' }}>
        {icon}
        <span>{text}</span>
      </span>
    );
  };

  const similarProducts = products
    .filter(p => p.id !== product.id)
    .slice(0, 8);

  const productReviews = reviews.filter(r => r.productId === product.id);

  // Extract all review images globally for this product to feed the carousel
  const reviewImages = productReviews.reduce((acc, review) => {
    if (review.images && review.images.length > 0) {
      review.images.forEach(imgUrl => {
        acc.push({
          url: imgUrl,
          author: review.author,
          rating: review.rating,
          date: review.date,
          verified: review.verified,
          comment: review.comment
        });
      });
    }
    return acc;
  }, []);

  const totalRating = productReviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = productReviews.length ? totalRating / productReviews.length : 5.0;

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextLightbox = () => {
    setLightboxIndex(prev => (prev + 1) % reviewImages.length);
  };

  const prevLightbox = () => {
    setLightboxIndex(prev => (prev - 1 + reviewImages.length) % reviewImages.length);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className="star filled">★</span>
        );
      } else {
        stars.push(
          <span key={i} className="star">☆</span>
        );
      }
    }
    return stars;
  };

  return (
    <div className="pdp-container">
      {/* Breadcrumb */}
      <div className="pdp-breadcrumbs">
        <a href="/">Shop</a> &gt; <span className="active">{product.title}</span>
      </div>

      <div className="pdp-layout">
        {/* Left Column: Image Gallery */}
        <div className="pdp-gallery">
          <div className="pdp-gallery__main">
            <img
              src={cloudinaryOptimize(product.images[activeImageIndex])}
              alt={`${product.title} view ${activeImageIndex + 1}`}
              className="pdp-gallery__main-img"
              fetchPriority="high"
              loading="eager"
              style={{ viewTransitionName: `product-image-${product.id}` }}
            />
          </div>
        </div>

        {/* Right Column: Info & Actions */}
        <div className="pdp-info">
          <h1 className="pdp-info__title" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
            {product.title}
            {renderProductBadgeInline()}
          </h1>
          <div className="pdp-info__price">
            <span>{product.price}</span>
            {product.original_price && (
              <span className="pdp-info__original-price">{product.original_price}</span>
            )}
          </div>

          <p className="pdp-info__description">{product.description}</p>

          <hr className="pdp-divider" />

          {/* View Selector (Moved thumbnails here) */}
          {product.images.length > 1 && (
            <div className="pdp-selector">
              <span className="pdp-selector__label">Select View</span>
              <div className="pdp-gallery__thumbnails">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`pdp-gallery__thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={cloudinaryOptimize(img)} alt={`Thumbnail ${idx + 1}`} className="pdp-gallery__thumb-img" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="pdp-selector">
              <span className="pdp-selector__label">Size: <strong>{selectedSize}</strong></span>
              <div className="pdp-selector__options">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    className={`pdp-size-chip ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                    disabled={product.label === 'out-of-stock'}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <button
                className={`btn pdp-add-btn ${isInCart ? 'btn--outline' : 'btn--primary'}`}
                onClick={() => {
                  if (isInCart) {
                    if (onOpenCart) onOpenCart();
                  } else {
                    onAddToCart(selectedSize);
                  }
                }}
                disabled={product.label === 'out-of-stock'}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                  width: '100%',
                  marginTop: 0,
                  ...(product.label === 'out-of-stock' ? { backgroundColor: '#e2e8f0', color: '#a0aec0', cursor: 'not-allowed', borderColor: '#e2e8f0' } : {})
                }}
              >
                {product.label === 'out-of-stock' ? 'Sold Out' : isInCart ? 'View Bag' : 'Add to Bag'}
              </button>

              {/* Easter Egg Peeking Mascot */}
              {showPeekingMascot && product.label !== 'out-of-stock' && (
                <div
                  className="pdp-easter-egg-peek"
                  onClick={() => setIsBargainOpen(true)}
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: '-7px',
                    width: '175px',
                    height: 'auto',
                    cursor: 'pointer',
                    zIndex: 10,
                    marginBottom: '-32px', // slight overlap with button
                    transformOrigin: 'bottom center',
                    animation: 'peekUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                  }}
                  title="Negotiate with Hella!"
                >
                  <img
                    src="https://res.cloudinary.com/dtx3jvozs/image/upload/f_auto,q_auto/v1780513301/hellabold/products/hella_bargain-Photoroom.png"
                    alt="Bargain Easter Egg"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              )}
            </div>

            <button
              className="btn btn--outline"
              onClick={() => onToggleLike && onToggleLike(product.id)}
              onMouseEnter={() => setIsWishlistHovered(true)}
              onMouseLeave={() => setIsWishlistHovered(false)}
              style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: 'var(--border-color)',
                color: isWishlistHovered ? 'var(--white)' : (isLiked ? 'var(--accent-red)' : 'var(--text-primary)'),
                transition: 'transform var(--transition-fast)'
              }}
              title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "var(--accent-red)" : "none"} stroke={isLiked ? "var(--accent-red)" : (isWishlistHovered ? "var(--white)" : "currentColor")} strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          </div>

          {/* Bargain Modal Trigger Overlay */}
          <BargainModal
            isOpen={isBargainOpen}
            onClose={() => setIsBargainOpen(false)}
            product={product}
            onAddToCart={(bargainedProduct) => onAddBargainedToCart(bargainedProduct, selectedSize)}
          />

          {/* Product Tabs / Accordion */}
          <div className="pdp-tabs">
            <div className="pdp-tabs__nav">
              <button
                className={`pdp-tabs__link ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details & Care
              </button>
              <button
                className={`pdp-tabs__link ${activeTab === 'shipping' ? 'active' : ''}`}
                onClick={() => setActiveTab('shipping')}
              >
                Shipping & Returns
              </button>
            </div>
            <div className="pdp-tabs__content">
              {activeTab === 'details' && (
                <ul className="pdp-tabs__list">
                  {product.details?.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              )}
              {activeTab === 'shipping' && (
                <p>
                  Complimentary standard shipping on all orders. Returns are accepted within 14 days of delivery.
                  Items must be returned in original, unworn condition with tags attached.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Bottom Layout: Reviews on Left, FAQs on Right */}
      <div className="pdp-bottom-layout">
        {/* Customer Feedback & Reviews Section */}
        <section className="pdp-reviews-section">
          <div className="pdp-reviews-header-inline">
            <h2 className="pdp-reviews-title">Customer Reviews</h2>
            <div className="pdp-reviews-summary-inline">
              <span className="summary-stars">{renderStars(avgRating)}</span>
              <span className="summary-text">{avgRating.toFixed(1)} / 5</span>
              <span className="summary-count">({productReviews.length} reviews)</span>
            </div>
          </div>

          {/* Customer Gallery Image Strip */}
          {reviewImages.length > 0 && (
            <div className="pdp-gallery-strip">
              <h3 className="pdp-gallery-strip__title">Customer Gallery</h3>
              <div className="pdp-gallery-strip__container">
                {reviewImages.map((revImg, idx) => (
                  <div
                    key={idx}
                    className="pdp-gallery-strip__img-wrapper"
                    onClick={() => openLightbox(idx)}
                  >
                    <img src={cloudinaryOptimize(revImg.url)} alt={`Customer review photo ${idx + 1}`} className="pdp-gallery-strip__img" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Comments list */}
          <div className="pdp-comments-list">
            <h3 className="pdp-comments-list__title">Recent Reviews</h3>
            <div className="pdp-comments-list__grid">
              {productReviews.map(review => (
                <div key={review.id} className="pdp-review-card">
                  <div className="pdp-review-card__header">
                    <div>
                      <span className="pdp-review-card__author">{review.author}</span>
                      {review.verified && <span className="pdp-review-card__verified">Verified Purchase</span>}
                    </div>
                    <span className="pdp-review-card__date">{review.date}</span>
                  </div>
                  <div className="pdp-review-card__rating">
                    {renderStars(review.rating)}
                  </div>
                  <p className="pdp-review-card__comment">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="pdp-review-card__images">
                      {review.images.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={cloudinaryOptimize(imgUrl)}
                          alt="Customer uploaded review detail"
                          className="pdp-review-card__thumbnail"
                          loading="lazy"
                          onClick={() => {
                            const globalIdx = reviewImages.findIndex(ri => ri.url === imgUrl);
                            if (globalIdx > -1) openLightbox(globalIdx);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: FAQ & Help Accordion */}
        <section className="pdp-help-section">
          <h2 className="pdp-help-title">Help & FAQs</h2>
          <div className="pdp-faq-accordion">
            <details className="faq-item" name="atelier-faq" open>
              <summary className="faq-question">Sizing & Fit</summary>
              <div className="faq-answer">
                <p>
                  HELLABOLD garments are cut to a modern, tailored silhouette. We recommend taking your standard size. If you are between sizes, size up for a more relaxed aesthetic. For footwear, our Chelsea boots run slightly large—consider sizing down one size if you prefer a snug fit.
                </p>
              </div>
            </details>

            <details className="faq-item" name="atelier-faq">
              <summary className="faq-question">Care Instructions</summary>
              <div className="faq-answer">
                <p>
                  <strong>Leather & Suede:</strong> Dry clean only by a certified specialist leather cleaner. Avoid contact with rain or moisture. If wet, let it air dry away from heat sources.
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                  <strong>Silk:</strong> Dry clean only. Iron inside-out on low heat setting if necessary.
                </p>
              </div>
            </details>

            <details className="faq-item" name="atelier-faq">
              <summary className="faq-question">Shipping & Bespoke Delivery</summary>
              <div className="faq-answer">
                <p>
                  Complimentary express shipping on all orders. Domestic delivery takes 2–4 business days, international delivery takes 4–7 business days. A tracking link is dispatched immediately upon shipment.
                </p>
              </div>
            </details>

            <details className="faq-item" name="atelier-faq">
              <summary className="faq-question">Returns & Concierge Exchanges</summary>
              <div className="faq-answer">
                <p>
                  Returns are complimentary and accepted within 14 days of delivery. The item must be in its original, unworn condition with all tags and security seals intact. Contact our concierge to arrange a courier pickup.
                </p>
              </div>
            </details>
          </div>
        </section>
      </div>

      {/* Lightbox Carousel Modal Overlay */}
      {lightboxOpen && (
        <div className="pdp-lightbox-overlay" onClick={closeLightbox}>
          <button className="pdp-lightbox__close" onClick={closeLightbox}>&times;</button>

          <button
            className="pdp-lightbox__nav pdp-lightbox__nav--prev"
            onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
          >
            &#8249;
          </button>

          <div className="pdp-lightbox__modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdp-lightbox__media">
              <img
                src={cloudinaryOptimize(reviewImages[lightboxIndex]?.url)}
                alt="Enlarged customer upload review"
                className="pdp-lightbox__img"
              />
            </div>
            <div className="pdp-lightbox__sidebar">
              <div className="pdp-lightbox__sidebar-header">
                <span className="pdp-lightbox__author">{reviewImages[lightboxIndex]?.author}</span>
                {reviewImages[lightboxIndex]?.verified && (
                  <span className="pdp-lightbox__verified-tag">Verified Purchase</span>
                )}
              </div>
              <div className="pdp-lightbox__rating">
                {renderStars(reviewImages[lightboxIndex]?.rating || 5)}
              </div>
              <span className="pdp-lightbox__date">{reviewImages[lightboxIndex]?.date}</span>
              <hr className="pdp-divider" />
              <p className="pdp-lightbox__comment">{reviewImages[lightboxIndex]?.comment}</p>
            </div>
          </div>

          <button
            className="pdp-lightbox__nav pdp-lightbox__nav--next"
            onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
          >
            &#8250;
          </button>
        </div>
      )}

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <div className="pdp-similar">
          <h2 className="pdp-similar__title">You May Also Like</h2>
          <div className="pdp-similar__grid">
            {similarProducts.map(item => (
              <ProductCard
                key={item.id}
                product={item}
                onAddToCart={onAddToCart}
                isInCart={cartItems.some(c => String(c.id) === String(item.id))}
                onOpenCart={onOpenCart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;

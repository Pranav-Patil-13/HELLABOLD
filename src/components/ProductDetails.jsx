import React, { useState } from 'react';
import ProductCard from './ProductCard';

// Comprehensive high-quality reviews database mapped by product ID
const MOCK_REVIEWS_DB = {
  1: [
    {
      id: 101,
      author: "Aditya R.",
      rating: 5,
      date: "May 24, 2026",
      verified: true,
      comment: "Absolutely unmatched quality. The leather is buttery soft, thick enough to hold structured shoulders, yet fits perfectly. Exceeded my high expectations.",
      images: ["/assets/product1_B.png"]
    },
    {
      id: 102,
      author: "Nisha K.",
      rating: 4,
      date: "May 10, 2026",
      verified: true,
      comment: "Incredibly stylish and the asymmetric front zip gives it a real high-fashion edge. The sleeves run slightly long but it works with the overall rock-star silhouette.",
      images: []
    },
    {
      id: 103,
      author: "Kabir D.",
      rating: 5,
      date: "April 29, 2026",
      verified: true,
      comment: "A classic look done with premium craftsmanship. The hardware is custom, heavy, and glides perfectly. Worth every rupee.",
      images: ["/assets/product3_B.png"]
    }
  ],
  2: [
    {
      id: 201,
      author: "Meera J.",
      rating: 5,
      date: "May 27, 2026",
      verified: true,
      comment: "Understated and elegant. The hand-painted edges are clean, and the brushed gold clasp is pure luxury. Fits my phone, keys, and cards perfectly.",
      images: ["/assets/product4_A.png"]
    },
    {
      id: 202,
      author: "Rohan P.",
      rating: 5,
      date: "May 18, 2026",
      verified: false,
      comment: "Bought this as a gift and the recipient was absolutely thrilled. The calfskin feels extremely premium.",
      images: []
    }
  ],
  3: [
    {
      id: 301,
      author: "Vikram S.",
      rating: 5,
      date: "May 22, 2026",
      verified: true,
      comment: "A rugged masterpiece. Fits perfectly around the shoulders and has that classic heavy leather jacket weight. Highly recommended.",
      images: ["/assets/product3_A.png"]
    },
    {
      id: 302,
      author: "Siddharth N.",
      rating: 4,
      date: "May 14, 2026",
      verified: true,
      comment: "Durable cowhide, feels like it will last a lifetime. Breaking it in takes a few wears but it looks amazing.",
      images: []
    }
  ],
  4: [
    {
      id: 401,
      author: "Anjali G.",
      rating: 5,
      date: "May 25, 2026",
      verified: true,
      comment: "Perfect mini bag. It goes with every outfit. The magnetic flap is strong and secure, and the chain detail feels premium.",
      images: ["/assets/product2_B.png"]
    },
    {
      id: 402,
      author: "Divya L.",
      rating: 4,
      date: "April 30, 2026",
      verified: true,
      comment: "Sleek and minimal. I wish it was just a tiny bit larger to fit a full-sized wallet, but it forces me to carry only the essentials.",
      images: []
    }
  ],
  5: [
    {
      id: 501,
      author: "Aman T.",
      rating: 5,
      date: "May 28, 2026",
      verified: true,
      comment: "The drape of the split suede is gorgeous. It moves so elegantly. Perfect transitional weather piece.",
      images: ["/assets/product5_B.png"]
    },
    {
      id: 502,
      author: "Ritu V.",
      rating: 5,
      date: "May 20, 2026",
      verified: true,
      comment: "Unbelievable quality. It feels like a high-end luxury designer coat worth thousands of dollars. The color is rich.",
      images: []
    }
  ],
  6: [
    {
      id: 601,
      author: "Karan B.",
      rating: 5,
      date: "May 29, 2026",
      verified: true,
      comment: "Extremely comfortable right out of the box. The elastic panels make it easy to slide on, and the welt construction is flawless.",
      images: ["/assets/product6_B.png"]
    },
    {
      id: 602,
      author: "Varun Y.",
      rating: 4,
      date: "May 11, 2026",
      verified: true,
      comment: "Classy boots. Runs slightly large, so you might want to size down by one if you prefer a snug fit with thin socks.",
      images: []
    }
  ],
  7: [
    {
      id: 701,
      author: "Esha M.",
      rating: 5,
      date: "May 26, 2026",
      verified: true,
      comment: "100% pure silk and it shows. The hand-rolled edges are extremely neat. The print matches the online photos perfectly.",
      images: ["/assets/product7_B.png"]
    }
  ],
  1780135441890: [
    {
      id: 801,
      author: "Pranav A.",
      rating: 5,
      date: "May 30, 2026",
      verified: true,
      comment: "A work of art. The abstract design looks incredible in hand. The packaging and details are pristine.",
      images: ["/assets/product8_B.png"]
    }
  ],
  1780135554770: [
    {
      id: 901,
      author: "Nikhil S.",
      rating: 5,
      date: "May 30, 2026",
      verified: true,
      comment: "Amazing graphic and excellent quality fabric. Standard size L fits exactly how I wanted. Definite recommendation.",
      images: ["/assets/product9_B.png"]
    }
  ]
};

// Generic reviews for newly created items
const DEFAULT_REVIEWS = [
  {
    id: 9991,
    author: "Happy Customer",
    rating: 5,
    date: "May 29, 2026",
    verified: true,
    comment: "Excellent design and super fast delivery. Will definitely buy from HELLABOLD again!",
    images: []
  }
];

const ProductDetails = ({ product, products = [], reviews = [], onAddToCart, isLiked = false, onToggleLike }) => {
  if (!product) {
    return (
      <div className="pdp-error">
        <h2>Product not found.</h2>
        <a href="/" className="btn btn--primary">Back to Shop</a>
      </div>
    );
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [activeTab, setActiveTab] = useState('details'); // details, sizing, shipping

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
              src={product.images[activeImageIndex]} 
              alt={`${product.title} view ${activeImageIndex + 1}`} 
              className="pdp-gallery__main-img" 
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
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="pdp-gallery__thumb-img" />
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
            <button 
              className="btn btn--primary pdp-add-btn" 
              onClick={() => onAddToCart(selectedSize)}
              disabled={product.label === 'out-of-stock'}
              style={{
                flex: 1,
                marginTop: 0,
                ...(product.label === 'out-of-stock' ? { backgroundColor: '#e2e8f0', color: '#a0aec0', cursor: 'not-allowed', borderColor: '#e2e8f0' } : {})
              }}
            >
              {product.label === 'out-of-stock' ? 'Sold Out' : 'Add to Bag'}
            </button>
            <button 
              className="btn btn--outline"
              onClick={() => onToggleLike && onToggleLike(product.id)}
              style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: 'var(--border-color)',
                color: isLiked ? 'var(--accent-red)' : 'var(--text-primary)',
                transition: 'transform var(--transition-fast)'
              }}
              title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "var(--accent-red)" : "none"} stroke={isLiked ? "var(--accent-red)" : "currentColor"} strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          </div>

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
                    <img src={revImg.url} alt={`Customer review photo ${idx + 1}`} className="pdp-gallery-strip__img" />
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
                          src={imgUrl} 
                          alt="Customer uploaded review detail" 
                          className="pdp-review-card__thumbnail"
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
                src={reviewImages[lightboxIndex]?.url} 
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;

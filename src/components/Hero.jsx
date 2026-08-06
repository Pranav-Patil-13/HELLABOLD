import React, { useState, useEffect } from 'react';
import { cloudinaryOptimize } from '../utils/cloudinary';

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      tag: "LIMITED TIME DISCOUNT",
      title: "GET 10% OFF ALL ITEMS",
      description: "Level up your streetwear rotation. Use coupon code BOLD10 at checkout."
    },
    {
      tag: "MID-SEASON OFFER",
      title: "SAVE EXTRA 20% OFF",
      description: "Upgrade your style with bold designs. 20% off orders above ₹899 with code BOLD20."
    },
    {
      tag: "BLACK FRIDAY SALE",
      title: "50% FLAT DISCOUNT",
      description: "Unmatched premium quality. Get 50% off orders above ₹1299 using code HELLA50."
    },
    {
      tag: "HELLA-LAB CUSTOMS",
      title: "DESIGN YOUR STREETWEAR",
      description: "Express yourself with our interactive studio. Made by you, printed by us."
    }
  ];

  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    } else if (isRightSwipe) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    }

    // Reset touch coordinates
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleShopScroll = (e) => {
    e.preventDefault();
    const shopSection = document.querySelector('.shop');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoToStudio = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/custom-studio');
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <section className="hero">
      <img
        src={cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/v1786011076/c78863c5-84c4-4252-b566-fccfa916a913_jmhtsi.png')}
        alt="HELLABOLD Streetwear Banner"
        className="hero__bg"
        fetchPriority="high"
        loading="eager"
      />
      <div className="hero__container">
        <div 
          className="hero__carousel"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="hero__carousel-window">
            <div 
              className="hero__carousel-track" 
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div className="hero__slide" key={index}>
                  <span className="hero__slide-tag">{slide.tag}</span>
                  <h2 className="hero__slide-title">{slide.title}</h2>
                  <p className="hero__slide-desc">{slide.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hero__actions">
            <button className="btn btn--primary hero__btn" onClick={handleShopScroll}>
              Explore Collection
            </button>
            <button className="btn btn--outline hero__btn hero__btn--outline" onClick={handleGoToStudio}>
              Custom Studio
            </button>
          </div>

          <div className="hero__dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`hero__dot ${index === currentIndex ? 'hero__dot--active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

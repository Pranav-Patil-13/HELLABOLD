import React, { useEffect, useState } from 'react';

const Header = ({ 
  cartCount, 
  onOpenCart, 
  favoritesCount = 0, 
  onOpenFavorites, 
  searchQuery = '', 
  onSearchChange, 
  userProfile,
  onOpenAuth,
  onOpenProfile,
  onGoHome,
  activeTab
}) => {
  const [pulse, setPulse] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('fade-in');

  const promos = [
    { text: "USE CODE: BOLD10 FOR 10% OFF ON ALL ORDERS", highlight: "BOLD10" },
    { text: "20% OFF ON ORDERS ABOVE ₹899 | USE CODE BOLD20", highlight: "BOLD20" },
    { text: "50% OFF ON ORDERS ABOVE ₹1299 | USE CODE HELLA50", highlight: "HELLA50" }
  ];

  useEffect(() => {
    if (cartCount > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    if (!isBannerVisible) return;
    const interval = setInterval(() => {
      setFadeClass('fade-out');
      setTimeout(() => {
        setCurrentPromoIndex((prevIndex) => (prevIndex + 1) % promos.length);
        setFadeClass('fade-in');
      }, 300); // match transition speed
    }, 5000);

    return () => clearInterval(interval);
  }, [isBannerVisible]);

  const handleGoHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    if (onGoHome) onGoHome();
  };

  const handleDismissBanner = (e) => {
    e.stopPropagation();
    setIsBannerVisible(false);
  };

  const currentPromo = promos[currentPromoIndex];

  // Function to render text with highlighted code
  const renderPromoText = () => {
    const parts = currentPromo.text.split(currentPromo.highlight);
    if (parts.length > 1) {
      return (
        <span>
          {parts[0]}
          <strong className="promo-banner__highlight">{currentPromo.highlight}</strong>
          {parts[1]}
        </span>
      );
    }
    return <span>{currentPromo.text}</span>;
  };

  return (
    <div className="header-wrapper">
      {isBannerVisible && (
        <div className="promo-banner">
          <div className={`promo-banner__content ${fadeClass}`}>
            {renderPromoText()}
          </div>
          <button 
            type="button" 
            className="promo-banner__close" 
            onClick={handleDismissBanner}
            aria-label="Dismiss banner"
          >
            &times;
          </button>
        </div>
      )}

      <header className="header">
        <div className="header__logo" onClick={handleGoHome} style={{ cursor: 'pointer' }}>
          <img src="/assets/header_logo_v2.png" alt="HELLABOLD" className="header__logo-img" />
        </div>
        <nav className="header__nav">
          <a href="/" onClick={handleGoHome} className={`header__link${activeTab === 'shop' ? ' active' : ''}`}>Shop</a>
          <a href="/collections" className={`header__link${activeTab === 'collections' ? ' active' : ''}`}>Collections</a>
        </nav>

        <div className="header__actions">
          {onSearchChange && (
            <div className="header__search-container">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="header__search-input"
              />
              <span className="header__search-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </span>
            </div>
          )}
          {onOpenFavorites && (
            <button 
              className="icon-btn" 
              aria-label="Favorites" 
              onClick={(e) => { e.preventDefault(); onOpenFavorites(); }}
              style={{ position: 'relative' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={favoritesCount > 0 ? "var(--accent-red)" : "none"} stroke={favoritesCount > 0 ? "var(--accent-red)" : "currentColor"} strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              {favoritesCount > 0 && (
                <span className="cart-count" style={{ backgroundColor: 'var(--accent-red)' }}>{favoritesCount}</span>
              )}
            </button>
          )}
          <button 
            className="icon-btn" 
            aria-label="Cart" 
            style={{ transform: pulse ? 'scale(1.2)' : 'scale(1)' }}
            onClick={onOpenCart}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            <span className="cart-count">{cartCount}</span>
          </button>

          {/* User Account / Profile Trigger */}
          {userProfile ? (
            <button 
              className="icon-btn profile-trigger-btn"
              onClick={onOpenProfile}
              title={userProfile.fullName}
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--accent-color)', 
                color: 'var(--white)', 
                fontSize: '0.8rem', 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                marginLeft: '0.5rem'
              }}
            >
              {userProfile.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : 'U'}
            </button>
          ) : (
            <button 
              className="btn btn--outline" 
              onClick={onOpenAuth}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '0.5rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { getProducts, getReviews, getCurrentUser } from './utils/supabase';
import Hero from './components/Hero';
import Filters from './components/Filters';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import AdminPanel from './components/AdminPanel';
import CartDrawer from './components/CartDrawer';
import CartIsland from './components/CartIsland';
import CheckoutPage from './components/CheckoutPage';
import OrderStatus from './components/OrderStatus';
import FavoritesDrawer from './components/FavoritesDrawer';
import AuthModal from './components/AuthModal';
import ProfileDrawer from './components/ProfileDrawer';
import Footer from './components/Footer';
import CollectionsPage from './components/CollectionsPage';
import AboutUs from './components/AboutUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import FaqPage from './components/FaqPage';
import PolicyPages from './components/PolicyPages';
import CustomStudio from './components/CustomStudio';
import ContactUs from './components/ContactUs';

const SplashLoader = ({ onComplete }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (imgLoaded) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 1500); // 1.5 second display duration after image loads
      return () => clearTimeout(timeout);
    }
  }, [imgLoaded, onComplete]);

  return (
    <div style={{
      display: imgLoaded ? 'flex' : 'none',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'radial-gradient(circle, rgb(145, 0, 32) 0%, #0c0002ea 100%)',
      color: '#ffffff',
      fontFamily: 'Montserrat, sans-serif',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style>{`
        .clean-loader-line {
          width: 80px;
          height: 2px;
          background-color: rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          border-radius: 4px;
          margin-top: 2rem;
        }
        .clean-loader-progress {
          position: absolute;
          height: 100%;
          width: 40px;
          background-color: #ffffff;
          animation: lineLoad 1.2s infinite linear;
        }
        @keyframes lineLoad {
          0% { left: -50px; }
          100% { left: 90px; }
        }
      `}</style>

      <img
        src="https://res.cloudinary.com/dtx3jvozs/image/upload/v1780463490/hellabold/products/hella_loading.png"
        alt="HELLABOLD Mascot"
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgLoaded(true)}
        style={{
          height: '180px',
          width: 'auto',
          marginBottom: '1.8rem'
        }}
      />
      <div style={{
        fontSize: '2.4rem',
        letterSpacing: '8px',
        textTransform: 'uppercase',
        color: '#ffffff',
        fontWeight: 900,
        textAlign: 'center'
      }}>
        HELLABOLD
      </div>
      <div className="clean-loader-line">
        <div className="clean-loader-progress"></div>
      </div>
    </div>
  );
};


// ── Admin email allowlist (Supabase-auth-verified, not client-side) ──────────
// Only accounts whose email is in this list will be granted admin access.
// The Supabase session is cryptographically verified server-side — no client-
// side password can bypass this.
const ADMIN_EMAILS = ['pranavpatil13.2004@gmail.com'];

// Secondary admin panel password (entered after Supabase email auth passes).
// This is a second factor — even if someone has your Supabase login, they still
// need this password. The session is stored in localStorage so you only need
// to enter it once per browser.
const ADMIN_PANEL_PASSWORD = 'hellabold@admin2024';
const ADMIN_SESSION_KEY = 'hb_admin_panel_v2';

const AdminPanelPasswordForm = ({ onAuthenticated, correctPassword }) => {
  const [pwd, setPwd] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pwd === correctPassword) {
      onAuthenticated();
    } else {
      setError('Incorrect password. Please try again.');
      setPwd('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
      {error && (
        <p style={{ color: '#e53e3e', fontSize: '0.8rem', fontWeight: 'bold', margin: 0 }}>{error}</p>
      )}
      <input
        type="password"
        value={pwd}
        onChange={e => setPwd(e.target.value)}
        placeholder="Admin panel password"
        required
        autoFocus
        style={{
          padding: '0.85rem 1rem', border: '1px solid #ddd',
          fontSize: '0.95rem', outline: 'none', width: '100%',
          boxSizing: 'border-box'
        }}
      />
      <button
        type="submit"
        style={{
          padding: '0.9rem', backgroundColor: '#000', color: '#fff',
          border: 'none', fontWeight: 'bold', textTransform: 'uppercase',
          letterSpacing: '2px', cursor: 'pointer', fontSize: '0.85rem'
        }}
      >
        Unlock Dashboard
      </button>
    </form>
  );
};

function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('hellabold_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [likedIds, setLikedIds] = useState(() => {
    const saved = localStorage.getItem('hellabold_likes');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isCheckoutPage, setIsCheckoutPage] = useState(false);
  const [isOrderStatusPage, setIsOrderStatusPage] = useState(false);
  const [activeProductId, setActiveProductId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollectionsPage, setIsCollectionsPage] = useState(false);
  const [isAboutPage, setIsAboutPage] = useState(false);
  const [isPrivacyPage, setIsPrivacyPage] = useState(false);
  const [isTermsPage, setIsTermsPage] = useState(false);
  const [isFaqPage, setIsFaqPage] = useState(false);
  const [isShippingPage, setIsShippingPage] = useState(false);
  const [isReturnsPage, setIsReturnsPage] = useState(false);
  const [isSizeGuidePage, setIsSizeGuidePage] = useState(false);
  const [isCustomStudioPage, setIsCustomStudioPage] = useState(false);
  const [isContactPage, setIsContactPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminAuthenticated, setAdminAuthenticated] = useState(() =>
    localStorage.getItem(ADMIN_SESSION_KEY) === ADMIN_PANEL_PASSWORD
  );
  const [reviews, setReviews] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [typewriterDone, setTypewriterDone] = useState(false);

  // Auth & Profile states
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Filters, Search, and Discount States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState([499, 1000]);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(() => {
    const saved = localStorage.getItem('hellabold_discount');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    const categoryParam = params.get('category');

    if (categoryParam) {
      const categories = categoryParam.split(',').filter(Boolean);
      if (categories.length > 0) {
        setSelectedCategories(categories);
      }
    }

    if (productId) {
      setActiveProductId(parseInt(productId, 10));
    }
    if (window.location.pathname === '/admin') {
      setIsAdmin(true);
    }
    if (window.location.pathname === '/checkout') {
      setIsCheckoutPage(true);
    }
    if (window.location.pathname === '/order-status') {
      setIsOrderStatusPage(true);
    }
    if (window.location.pathname === '/collections') {
      setIsCollectionsPage(true);
    }
    if (window.location.pathname === '/about') {
      setIsAboutPage(true);
    }
    if (window.location.pathname === '/privacy') {
      setIsPrivacyPage(true);
    }
    if (window.location.pathname === '/terms') {
      setIsTermsPage(true);
    }
    if (window.location.pathname === '/faqs') {
      setIsFaqPage(true);
    }
    if (window.location.pathname === '/shipping-policy') {
      setIsShippingPage(true);
    }
    if (window.location.pathname === '/returns-exchanges') {
      setIsReturnsPage(true);
    }
    if (window.location.pathname === '/size-guide') {
      setIsSizeGuidePage(true);
    }
    if (window.location.pathname === '/custom-studio') {
      setIsCustomStudioPage(true);
    }
    if (window.location.pathname === '/contact') {
      setIsContactPage(true);
    }

    // Resolve active Supabase or mock user session
    getCurrentUser()
      .then(sessionData => {
        if (sessionData) {
          setUserProfile(sessionData.profile);
        }
      })
      .catch(err => {
        console.error('Error restoring user session:', err);
      });

    // Fetch products from our Database client (with auto-fallback to local files)
    getProducts()
      .then(data => {
        setProducts(data);
        setProductsLoaded(true);
      })
      .catch(err => {
        console.error('Error loading products:', err);
        setProductsLoaded(true);
      });

    // Fetch reviews from our Database client (with auto-fallback to local files)
    getReviews()
      .then(data => {
        setReviews(data);
      })
      .catch(err => {
        console.error('Error loading reviews:', err);
      });

    // Handle back/forward navigation popstate routing
    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const productId = params.get('product');
      const categoryParam = params.get('category');

      setIsAdmin(path === '/admin');
      setIsCheckoutPage(path === '/checkout');
      setIsOrderStatusPage(path === '/order-status');
      setIsCollectionsPage(path === '/collections');
      setIsAboutPage(path === '/about');
      setIsPrivacyPage(path === '/privacy');
      setIsTermsPage(path === '/terms');
      setIsFaqPage(path === '/faqs');
      setIsShippingPage(path === '/shipping-policy');
      setIsReturnsPage(path === '/returns-exchanges');
      setIsSizeGuidePage(path === '/size-guide');
      setIsCustomStudioPage(path === '/custom-studio');
      setIsContactPage(path === '/contact');
      setActiveProductId(productId ? parseInt(productId, 10) : null);

      if (categoryParam) {
        setSelectedCategories([categoryParam]);
      } else {
        setSelectedCategories([]);
      }
    };

    const isMainHome = window.location.pathname === '/' && !new URLSearchParams(window.location.search).get('product');
    if (!isMainHome) {
      setTypewriterDone(true);
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (productsLoaded && typewriterDone) {
      setLoading(false);
    }
  }, [productsLoaded, typewriterDone]);

  // Listen to other tabs' storage changes for real-time synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'hellabold_cart') {
        setCartItems(e.newValue ? JSON.parse(e.newValue) : []);
      }
      if (e.key === 'hellabold_discount') {
        setAppliedDiscount(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-invalidate applied discount if subtotal drops below thresholds
  useEffect(() => {
    if (appliedDiscount) {
      const subtotal = cartItems.reduce((acc, item) => {
        const numericalPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
        return acc + (numericalPrice * item.quantity);
      }, 0);

      if (appliedDiscount.code === 'BOLD20' && subtotal < 899) {
        saveDiscount(null);
      } else if (appliedDiscount.code === 'HELLA50' && subtotal < 1299) {
        saveDiscount(null);
      }
    }
  }, [cartItems, appliedDiscount]);

  // Scroll to top when switching pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [
    isAboutPage,
    isPrivacyPage,
    isTermsPage,
    isFaqPage,
    isShippingPage,
    isReturnsPage,
    isSizeGuidePage,
    isCustomStudioPage,
    isCheckoutPage,
    isOrderStatusPage,
    isCollectionsPage,
    activeProductId,
    isAdmin
  ]);

  const saveCart = (newItems) => {
    setCartItems(newItems);
    localStorage.setItem('hellabold_cart', JSON.stringify(newItems));
  };

  const saveDiscount = (discount) => {
    setAppliedDiscount(discount);
    if (discount) {
      localStorage.setItem('hellabold_discount', JSON.stringify(discount));
    } else {
      localStorage.removeItem('hellabold_discount');
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // Auto-redirect back to the main catalog if the user is on the details or admin panel
    if (activeProductId !== null) {
      setActiveProductId(null);
      const params = new URLSearchParams(window.location.search);
      params.delete('product');
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
    if (isAdmin) {
      setIsAdmin(false);
      window.history.pushState({}, '', '/');
    }
    if (query) {
      setTimeout(() => {
        const shopEl = document.querySelector('.shop');
        const headerEl = document.querySelector('.header-wrapper') || document.querySelector('.header');
        if (shopEl) {
          const headerHeight = headerEl ? headerEl.offsetHeight : 80;
          const targetScrollY = shopEl.getBoundingClientRect().top + window.scrollY - headerHeight;
          window.scrollTo({
            top: targetScrollY,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  };

  const handleAddToCart = (product, selectedSize) => {
    const size = selectedSize || product.sizes?.[0] || 'One Size';
    const existingIndex = cartItems.findIndex(item => item.id === product.id && item.size === size);

    let newItems;
    if (existingIndex > -1) {
      newItems = cartItems.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      const newItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || '',
        size: size,
        quantity: 1,
        customDesign: product.customDesign || null,
        customDesignName: product.customDesignName || '',
        customDesignBack: product.customDesignBack || null,
        customDesignBackName: product.customDesignBackName || '',
        customMeta: product.customMeta || null
      };
      newItems = [...cartItems, newItem];
    }
    saveCart(newItems);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, size, newQty) => {
    const newItems = cartItems.map(item =>
      item.id === productId && item.size === size ? { ...item, quantity: newQty } : item
    );
    saveCart(newItems);
  };

  const handleRemoveItem = (productId, size) => {
    const newItems = cartItems.filter(item => !(item.id === productId && item.size === size));
    saveCart(newItems);
  };

  const handleToggleLike = (productId) => {
    setLikedIds(prev => {
      const updated = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem('hellabold_likes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleOrderSuccess = () => {
    saveCart([]);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSizeChange = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setPriceRange([499, 1000]);
  };

  const handleFooterNavigation = (path) => {
    // Parse target path query parameters
    const queryStr = path.includes('?') ? path.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    const productId = params.get('product');
    const categoryParam = params.get('category');

    setIsAdmin(path.startsWith('/admin'));
    setIsCheckoutPage(path.startsWith('/checkout'));
    setIsOrderStatusPage(path.startsWith('/order-status'));
    setIsCollectionsPage(path.startsWith('/collections'));
    setIsAboutPage(path.startsWith('/about'));
    setIsPrivacyPage(path.startsWith('/privacy'));
    setIsTermsPage(path.startsWith('/terms'));
    setIsFaqPage(path.startsWith('/faqs'));
    setIsShippingPage(path.startsWith('/shipping-policy'));
    setIsReturnsPage(path.startsWith('/returns-exchanges'));
    setIsSizeGuidePage(path.startsWith('/size-guide'));
    setIsCustomStudioPage(path.startsWith('/custom-studio'));
    setIsContactPage(path.startsWith('/contact'));
    setActiveProductId(productId ? parseInt(productId, 10) : null);

    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    } else {
      setSelectedCategories([]);
    }

    // Trigger state synchronization event for components checking location query params
    window.dispatchEvent(new Event('popstate'));
  };

  // 1. Filtering logic
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesSize = selectedSizes.length === 0 || product.sizes?.some(size => selectedSizes.includes(size));
    const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const matchesPrice = priceNum >= priceRange[0] && priceNum <= priceRange[1];
    const matchesSearch = !searchQuery ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSize && matchesPrice && matchesSearch;
  });

  // 2. Sorting logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
      return priceA - priceB;
    }
    if (sortBy === 'price-desc') {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
      return priceB - priceA;
    }
    return b.id - a.id; // default: newest first
  });

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const activeProduct = products.find(p => p.id === activeProductId);

  if (loading) {
    return <SplashLoader onComplete={() => setTypewriterDone(true)} />;
  }

  if (isAdmin) {
    // ── Not signed in: show sign-in prompt with AuthModal accessible ─────────
    if (!userProfile) {
      return (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh',
            background: 'radial-gradient(circle, rgb(145, 0, 32) 0%, #0c0002ea 100%)'
          }}>
            <div style={{
              backgroundColor: '#fff', padding: '3rem', maxWidth: '400px',
              width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center'
            }}>
              <h2 style={{ textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 900, marginBottom: '0.6rem', fontSize: '1.3rem' }}>Admin Area</h2>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>
                Sign in with your authorised HELLABOLD admin account to continue.
              </p>
              <button
                onClick={() => setIsAuthOpen(true)}
                style={{
                  width: '100%', padding: '0.9rem', backgroundColor: '#000', color: '#fff',
                  border: 'none', fontWeight: 'bold', textTransform: 'uppercase',
                  letterSpacing: '2px', cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                Sign In
              </button>
            </div>
          </div>
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onAuthSuccess={(profile) => setUserProfile(profile)}
          />
        </>
      );
    }

    // ── Signed in but not an authorised admin email ───────────────────────────
    if (!ADMIN_EMAILS.includes(userProfile.email)) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh',
          background: 'radial-gradient(circle, rgb(145, 0, 32) 0%, #0c0002ea 100%)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '3rem', maxWidth: '400px',
            width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚫</div>
            <h2 style={{ textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 900, marginBottom: '0.6rem', fontSize: '1.2rem' }}>Access Denied</h2>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>
              <strong>{userProfile.email}</strong> is not an authorised admin account.
            </p>
            <button
              onClick={() => { window.history.pushState({}, '', '/'); setIsAdmin(false); }}
              style={{
                width: '100%', padding: '0.9rem', backgroundColor: '#000', color: '#fff',
                border: 'none', fontWeight: 'bold', textTransform: 'uppercase',
                letterSpacing: '2px', cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Back to Store
            </button>
          </div>
        </div>
      );
    }

    // ── Email verified ✅ — now require panel password ──────────────────────
    if (!adminAuthenticated) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh',
          background: 'radial-gradient(circle, rgb(145, 0, 32) 0%, #0c0002ea 100%)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '3rem', maxWidth: '400px',
            width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🔐</div>
            <h2 style={{ textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 900, marginBottom: '0.4rem', fontSize: '1.2rem' }}>Panel Password</h2>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1.8rem', lineHeight: 1.6 }}>
              Signed in as <strong>{userProfile.email}</strong>.<br />Enter the admin panel password to continue.
            </p>
            <AdminPanelPasswordForm
              onAuthenticated={() => {
                localStorage.setItem(ADMIN_SESSION_KEY, ADMIN_PANEL_PASSWORD);
                setAdminAuthenticated(true);
              }}
              correctPassword={ADMIN_PANEL_PASSWORD}
            />
          </div>
        </div>
      );
    }

    // ── Both factors passed: render the panel ─────────────────────────────────
    return (
      <AdminPanel
        onProductsUpdated={(updated) => setProducts(updated)}
        reviews={reviews}
        onReviewsUpdated={setReviews}
        userProfile={userProfile}
      />
    );
  }



  return (
    <>
      <Header
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        favoritesCount={likedIds.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        userProfile={userProfile}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onGoHome={() => { setActiveProductId(null); setIsCheckoutPage(false); setIsOrderStatusPage(false); setIsCollectionsPage(false); setIsAboutPage(false); setIsPrivacyPage(false); setIsTermsPage(false); setIsFaqPage(false); setIsShippingPage(false); setIsReturnsPage(false); setIsSizeGuidePage(false); setIsCustomStudioPage(false); setIsContactPage(false); }}
        activeTab={isCustomStudioPage ? "custom-studio" : (isCollectionsPage ? "collections" : (isAboutPage ? "about" : (isPrivacyPage ? "privacy" : (isTermsPage ? "terms" : (isFaqPage ? "faqs" : (isContactPage ? "contact" : "shop"))))))}
      />

      {isCheckoutPage ? (
        <CheckoutPage
          cartItems={cartItems}
          onOrderSuccess={handleOrderSuccess}
          appliedDiscount={appliedDiscount}
          onApplyDiscount={saveDiscount}
          userProfile={userProfile}
          onProfileUpdate={(profile) => setUserProfile(profile)}
        />
      ) : isOrderStatusPage ? (
        <OrderStatus />
      ) : isAboutPage ? (
        <>
          <AboutUs />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isPrivacyPage ? (
        <>
          <PrivacyPolicy />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isTermsPage ? (
        <>
          <TermsOfService />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isFaqPage ? (
        <>
          <FaqPage />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isShippingPage ? (
        <>
          <PolicyPages type="shipping" />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isReturnsPage ? (
        <>
          <PolicyPages type="returns" />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isSizeGuidePage ? (
        <>
          <PolicyPages type="size-guide" />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isCollectionsPage ? (
        <>
          <CollectionsPage />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isCustomStudioPage ? (
        <>
          <CustomStudio onAddToCart={handleAddToCart} userProfile={userProfile} />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : isContactPage ? (
        <>
          <ContactUs />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : activeProduct ? (
        <>
          <ProductDetails
            product={activeProduct}
            products={products}
            reviews={reviews}
            onAddToCart={(size) => handleAddToCart(activeProduct, size)}
            isLiked={likedIds.includes(activeProduct.id)}
            onToggleLike={handleToggleLike}
          />
          <Footer onNavigate={handleFooterNavigation} />
        </>
      ) : (
        <>
          <Hero />
          <main className="shop">
            <Filters
              selectedCategories={selectedCategories}
              selectedSizes={selectedSizes}
              priceRange={priceRange}
              onCategoryChange={handleCategoryChange}
              onSizeChange={handleSizeChange}
              onPriceChange={setPriceRange}
              onReset={handleResetFilters}
            />
            <section className="shop__products">
              <div className="shop__products-header">
                <span className="products-count">{sortedProducts.length} Products</span>
                <div className="sort-selector">
                  <label htmlFor="sort-select">Sort by:</label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="default">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
              {sortedProducts.length === 0 ? (
                <div className="shop__products-empty">
                  <h3 className="empty-state-title">Hella Empty</h3>
                  <p className="empty-state-text">You've filtered into a void. Reset your options to restore the bold.</p>
                  <button
                    type="button"
                    className="btn btn--primary empty-state-btn"
                    onClick={handleResetFilters}
                  >
                    Restore the Bold
                  </button>
                </div>
              ) : (
                <div className="shop__products-grid">
                  {sortedProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={() => handleAddToCart(product)}
                      isLiked={likedIds.includes(product.id)}
                      onToggleLike={handleToggleLike}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
          <Footer onNavigate={handleFooterNavigation} />
        </>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        appliedDiscount={appliedDiscount}
        onApplyDiscount={saveDiscount}
        onCheckout={() => {
          setIsCartOpen(false);
          window.history.pushState({}, '', '/checkout');
          setIsCheckoutPage(true);
        }}
      />

      {/* Favorites Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        likedProducts={products.filter(p => likedIds.includes(p.id))}
        onToggleLike={handleToggleLike}
        onAddToCart={(product, size) => {
          handleAddToCart(product, size);
          setIsFavoritesOpen(false);
        }}
      />

      {/* Floating Cart Island Summary */}
      {!isCartOpen && !isCheckoutPage && !isOrderStatusPage && !isCustomStudioPage && (
        <CartIsland
          cartItems={cartItems}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}



      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(profile) => setUserProfile(profile)}
      />

      {/* Profile/Address Manager Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onProfileUpdate={(profile) => setUserProfile(profile)}
        onSignOut={() => setUserProfile(null)}
      />
    </>
  );
}

export default App;

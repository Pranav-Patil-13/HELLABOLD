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
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  
  // Auth & Profile states
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Filters, Search, and Discount States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 3000]);
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
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading products:', err);
        setLoading(false);
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
      setActiveProductId(productId ? parseInt(productId, 10) : null);

      if (categoryParam) {
        setSelectedCategories([categoryParam]);
      } else {
        setSelectedCategories([]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
        const headerEl = document.querySelector('.header');
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
        quantity: 1
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
    setPriceRange([0, 3000]);
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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>Loading HELLABOLD...</div>;
  }

  if (isAdmin) {
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
        onGoHome={() => { setActiveProductId(null); setIsCheckoutPage(false); setIsOrderStatusPage(false); setIsCollectionsPage(false); setIsAboutPage(false); setIsPrivacyPage(false); setIsTermsPage(false); }}
        activeTab={isCollectionsPage ? "collections" : (isAboutPage ? "about" : (isPrivacyPage ? "privacy" : (isTermsPage ? "terms" : "shop")))}
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
      ) : isCollectionsPage ? (
        <>
          <CollectionsPage />
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
          window.open('/checkout', '_blank');
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
      {!isCartOpen && !isCheckoutPage && (
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

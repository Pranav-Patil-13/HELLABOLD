// src/utils/analytics.js

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

/**
 * Helper to retrieve a cookie value
 */
const getCookie = (name) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
};

/**
 * Helper to retrieve user profile from localStorage fallback
 */
const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const mockUser = localStorage.getItem('hellabold_mock_user');
    if (mockUser) {
      return JSON.parse(mockUser);
    }
  } catch (e) {
    // Ignore
  }
  return null;
};

/**
 * Generates a unique event ID for deduplication
 */
const generateEventId = () => {
  return 'evt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
};

/**
 * Helper to post events to the backend Conversions API
 */
const sendServerEvent = (eventName, eventId, customData = {}, userData = {}) => {
  if (typeof window === 'undefined') return;

  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const storedUser = getStoredUser();

  const mergedUserData = {
    fbp,
    fbc,
    email: userData.email || storedUser?.email || '',
    fullName: userData.fullName || userData.name || storedUser?.fullName || '',
    phone: userData.phone || storedUser?.phone || '',
    city: userData.city || '',
    state: userData.state || '',
    zipCode: userData.zipCode || '',
    country: userData.country || 'IN',
    ...userData
  };

  fetch('/api/track-conversion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventName,
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: window.location.href,
      customData,
      userData: mergedUserData
    })
  }).catch(err => {
    console.error(`[Analytics] Conversions API call failed for ${eventName}:`, err);
  });
};

/**
 * Injects Google Analytics 4 and Meta Pixel tracking scripts.
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  // 1. Google Analytics 4 (gtag.js)
  if (GA_ID && !window.gtag) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false }); // Handled manually
    console.log(`[Analytics] GA4 initialized: ${GA_ID}`);
  }

  // 2. Meta Pixel (fbq)
  if (PIXEL_ID && !window.fbq) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', PIXEL_ID);
    console.log(`[Analytics] Meta Pixel initialized: ${PIXEL_ID}`);
  }
};

/**
 * Track standard page view events
 */
export const trackPageView = (path, title = '') => {
  if (typeof window === 'undefined') return;
  const pageTitle = title || document.title;
  const eventId = generateEventId();

  // Google Analytics
  if (window.gtag && GA_ID) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: pageTitle,
      send_to: GA_ID
    });
  }

  // Meta Pixel (Client)
  if (window.fbq) {
    window.fbq('track', 'PageView', {}, { eventID: eventId });
  }

  // Meta Conversions API (Server)
  sendServerEvent('PageView', eventId);

  console.log(`[Analytics] PageView: ${path} (ID: ${eventId})`);
};

/**
 * Track when a user views a specific product
 */
export const trackViewItem = (product) => {
  if (!product) return;
  const priceNum = parseFloat(String(product.price || '').replace(/[^0-9.]/g, '') || 0);
  const eventId = generateEventId();

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'INR',
      value: priceNum,
      items: [{
        item_id: String(product.id),
        item_name: product.title,
        item_category: product.category,
        price: priceNum
      }]
    });
  }

  const customData = {
    content_name: product.title,
    content_category: product.category,
    content_ids: [String(product.id)],
    content_type: 'product',
    value: priceNum,
    currency: 'INR'
  };

  // Meta Pixel (Client)
  if (window.fbq) {
    window.fbq('track', 'ViewContent', customData, { eventID: eventId });
  }

  // Meta Conversions API (Server)
  sendServerEvent('ViewContent', eventId, customData);

  console.log(`[Analytics] ViewContent: ${product.title} (ID: ${eventId})`);
};

/**
 * Track when a user adds a product to the cart
 */
export const trackAddToCart = (product, quantity = 1, color = '', size = '') => {
  if (!product) return;
  const priceNum = parseFloat(String(product.price || '').replace(/[^0-9.]/g, '') || 0);
  const eventId = generateEventId();

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'INR',
      value: priceNum * quantity,
      items: [{
        item_id: String(product.id),
        item_name: product.title,
        item_category: product.category,
        price: priceNum,
        quantity: quantity,
        item_variant: `${color || 'Default'}/${size || 'Default'}`
      }]
    });
  }

  const customData = {
    content_name: product.title,
    content_category: product.category,
    content_ids: [String(product.id)],
    content_type: 'product',
    value: priceNum * quantity,
    currency: 'INR',
    contents: [{ id: String(product.id), quantity }]
  };

  // Meta Pixel (Client)
  if (window.fbq) {
    window.fbq('track', 'AddToCart', customData, { eventID: eventId });
  }

  // Meta Conversions API (Server)
  sendServerEvent('AddToCart', eventId, customData);

  console.log(`[Analytics] AddToCart: ${product.title} x ${quantity} (ID: ${eventId})`);
};

/**
 * Track when a user initiates checkout
 */
export const trackInitiateCheckout = (cartItems, subtotal) => {
  if (!cartItems || cartItems.length === 0) return;
  const eventId = generateEventId();

  const gaItems = cartItems.map(item => {
    const priceNum = parseFloat(String(item.price || '').replace(/[^0-9.]/g, '') || 0);
    return {
      item_id: String(item.id),
      item_name: item.title,
      item_category: item.category,
      price: priceNum,
      quantity: item.quantity,
      item_variant: `${item.selectedColor || 'Default'}/${item.selectedSize || 'Default'}`
    };
  });

  const itemIds = cartItems.map(item => String(item.id));

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'INR',
      value: subtotal,
      items: gaItems
    });
  }

  const customData = {
    content_ids: itemIds,
    content_type: 'product',
    value: subtotal,
    currency: 'INR',
    num_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    contents: cartItems.map(item => ({ id: String(item.id), quantity: item.quantity }))
  };

  // Meta Pixel (Client)
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', customData, { eventID: eventId });
  }

  // Meta Conversions API (Server)
  sendServerEvent('InitiateCheckout', eventId, customData);

  console.log(`[Analytics] InitiateCheckout: subtotal: ${subtotal} (ID: ${eventId})`);
};

/**
 * Track completed purchase transaction
 */
export const trackPurchase = (order) => {
  if (!order) return;
  const eventId = generateEventId();

  const gaItems = (order.items || []).map(item => {
    const priceNum = parseFloat(String(item.price || '').replace(/[^0-9.]/g, '') || 0);
    return {
      item_id: String(item.id),
      item_name: item.title,
      item_category: item.category,
      price: priceNum,
      quantity: item.quantity,
      item_variant: `${item.selectedColor || 'Default'}/${item.selectedSize || 'Default'}`
    };
  });

  const itemIds = (order.items || []).map(item => String(item.id));

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: String(order.id),
      value: order.total,
      tax: 0,
      shipping: order.shipping || 0,
      currency: 'INR',
      items: gaItems
    });
  }

  const customData = {
    content_ids: itemIds,
    content_type: 'product',
    value: order.total,
    currency: 'INR',
    num_items: (order.items || []).reduce((sum, item) => sum + item.quantity, 0),
    contents: (order.items || []).map(item => ({ id: String(item.id), quantity: item.quantity }))
  };

  const details = order.shippingDetails || {};
  const userData = {
    email: details.email || '',
    fullName: details.name || '',
    phone: details.phone || '',
    city: details.city || '',
    state: details.state || '',
    zipCode: details.zipCode || '',
    country: 'IN'
  };

  // Meta Pixel (Client)
  if (window.fbq) {
    window.fbq('track', 'Purchase', customData, { eventID: eventId });
  }

  // Meta Conversions API (Server)
  sendServerEvent('Purchase', eventId, customData, userData);

  console.log(`[Analytics] Purchase Complete. ID: ${order.id}, Revenue: ${order.total} (ID: ${eventId})`);
};

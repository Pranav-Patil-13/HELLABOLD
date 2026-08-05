import { createClient } from '@supabase/supabase-js';
import productsJson from '../data/products.json';
import reviewsJson from '../data/reviews.json';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'HELLABOLD: Supabase VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY environment variables are not set. ' +
    'The app will run in local mock fallback mode (using local JSON endpoints and localStorage).'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// 1. PRODUCTS DATABASE ACTIONS
// ==========================================

export const getProducts = async () => {
  if (isSupabaseConfigured) {
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching products from Supabase:', error);
      throw error;
    }

    // Only auto-seed if the database table is completely empty (first-time setup)
    if (data && data.length === 0) {
      console.log('Supabase products table is empty. Auto-seeding from products.json...');
      const { data: seededData, error: seedError } = await supabase
        .from('products')
        .insert(productsJson)
        .select();

      if (seedError) {
        console.error('Failed to auto-seed products:', seedError);
      } else {
        console.log('Successfully seeded products:', seededData);
        data = seededData;
      }
    }
    return data.map(p => {
      const localProduct = productsJson.find(lp => lp.id === p.id);
      return {
        ...p,
        colors: localProduct?.colors || p.colors || null,
        colorImages: localProduct?.colorImages || p.colorImages || null,
        skus: localProduct?.skus || p.skus || null
      };
    });
  } else {
    const res = await fetch('/api/products');
    return res.json();
  }
};

export const saveProduct = async (productData, editingId = null) => {
  if (isSupabaseConfigured) {
    const { colors, colorImages, skus, ...dbPayload } = productData;

    const performSave = async (payload) => {
      if (editingId) {
        return await supabase
          .from('products')
          .update(payload)
          .eq('id', editingId)
          .select();
      } else {
        return await supabase
          .from('products')
          .insert([payload])
          .select();
      }
    };

    // Try saving the full payload (which might include colors and colorImages if they exist in schema)
    let result = await performSave(productData);
    let usedFallback = false;

    if (result.error && (result.error.code === '42703' || result.error.message?.includes('colors') || result.error.message?.includes('colorImages') || result.error.message?.includes('skus') || result.error.message?.includes('color_images'))) {
      console.warn('Supabase products table is missing colors/colorImages/skus columns. Retrying with standard fields only.');
      result = await performSave(dbPayload);
      usedFallback = true;
    }

    if (result.error && (result.error.code === 'PGRST204' || (result.error.message && result.error.message.includes('original_price')))) {
      console.warn('Supabase products table is missing original_price column. Retrying without it.');
      const { original_price, ...minimalPayload } = dbPayload;
      result = await performSave(minimalPayload);
      usedFallback = true;
    }

    if (result.error) {
      console.error('Error saving product in Supabase:', result.error);
      throw result.error;
    }

    const savedRecord = result.data?.[0];
    if (savedRecord) {
      if (usedFallback) {
        savedRecord._warning = "Product saved to Supabase. Note: Variant settings (colors, colorImages, skus) were synced to products.json locally as columns do not exist in Supabase yet.";
      }

      // Sync local products.json
      try {
        const localRes = await fetch('/api/products');
        if (localRes.ok) {
          const localProducts = await localRes.json();
          let updatedProducts;
          
          const localIndex = localProducts.findIndex(lp => lp.id === savedRecord.id);
          const fullProduct = {
            ...savedRecord,
            colors: colors || undefined,
            colorImages: colorImages || undefined,
            skus: skus || undefined
          };

          if (localIndex !== -1) {
            localProducts[localIndex] = { ...localProducts[localIndex], ...fullProduct };
            updatedProducts = [...localProducts];
          } else {
            updatedProducts = [...localProducts, fullProduct];
          }

          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProducts)
          });
        }
      } catch (syncErr) {
        console.error('Error syncing variant configuration locally:', syncErr);
      }
    }

    return result.data;
  } else {
    // Local API mode: send complete list (handled inside AdminPanel using POST /api/products)
    const currentProducts = await getProducts();
    let updatedList;
    if (editingId) {
      updatedList = currentProducts.map(p => p.id === editingId ? { ...p, ...productData } : p);
    } else {
      const newProduct = { id: Date.now(), ...productData };
      updatedList = [...currentProducts, newProduct];
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedList)
    });
    if (!res.ok) throw new Error('Local product write failed');
    return updatedList;
  }
};

export const deleteProduct = async (id) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting product from Supabase:', error);
      throw error;
    }
    return true;
  } else {
    const currentProducts = await getProducts();
    const updatedList = currentProducts.filter(p => p.id !== id);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedList)
    });
    if (!res.ok) throw new Error('Local product delete failed');
    return updatedList;
  }
};

// ==========================================
// 2. REVIEWS DATABASE ACTIONS
// ==========================================

export const getReviews = async () => {
  if (isSupabaseConfigured) {
    let { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error('Error fetching reviews from Supabase:', error);
      throw error;
    }

    // Auto-seed if the database table is empty
    if (data && data.length === 0) {
      console.log('Supabase reviews table is empty. Auto-seeding from reviews.json...');
      
      let productIds = [];
      try {
        const { data: dbProducts } = await supabase.from('products').select('id');
        if (dbProducts) {
          productIds = dbProducts.map(p => p.id);
        }
      } catch (e) {
        console.warn('Could not fetch products to validate review foreign keys:', e);
      }

      const reviewsToInsert = reviewsJson
        .filter(r => productIds.includes(parseInt(r.productId, 10)))
        .map(r => ({
          id: r.id,
          product_id: parseInt(r.productId, 10),
          author: r.author,
          rating: r.rating,
          comment: r.comment,
          verified: r.verified,
          images: r.images,
          date: r.date
        }));

      if (reviewsToInsert.length > 0) {
        const { data: seededData, error: seedError } = await supabase
          .from('reviews')
          .insert(reviewsToInsert)
          .select();

        if (seedError) {
          console.error('Failed to auto-seed reviews:', seedError);
        } else {
          console.log('Successfully seeded reviews:', seededData);
          data = seededData;
        }
      } else {
        console.log('No reviews matched existing products. Seeding skipped.');
      }
    }

    // Supabase returns camel_case columns or maps correctly; ensure field matching
    return data.map(r => ({
      id: r.id,
      productId: r.product_id, // map DB snake_case to React code camelCase
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      verified: r.verified,
      images: r.images,
      date: r.date
    }));
  } else {
    const res = await fetch('/api/reviews');
    return res.json();
  }
};

export const addReview = async (reviewData) => {
  if (isSupabaseConfigured) {
    const dbReview = {
      product_id: parseInt(reviewData.productId, 10), // map camelCase to snake_case
      author: reviewData.author,
      rating: reviewData.rating,
      comment: reviewData.comment,
      verified: reviewData.verified,
      images: reviewData.images,
      date: reviewData.date
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert([dbReview])
      .select();

    if (error) {
      console.error('Error adding review to Supabase:', error);
      throw error;
    }
    return data;
  } else {
    const currentReviews = await getReviews();
    const newReview = { id: Date.now(), ...reviewData };
    const updatedList = [...currentReviews, newReview];

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedList)
    });
    if (!res.ok) throw new Error('Local review write failed');
    return updatedList;
  }
};

export const deleteReview = async (id) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting review from Supabase:', error);
      throw error;
    }
    return true;
  } else {
    const currentReviews = await getReviews();
    const updatedList = currentReviews.filter(r => r.id !== id);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedList)
    });
    if (!res.ok) throw new Error('Local review delete failed');
    return updatedList;
  }
};

// ==========================================
// 3. ORDERS DATABASE ACTIONS
// ==========================================

export const getOrders = async () => {
  if (isSupabaseConfigured) {
    // Get current user — orders are private, only accessible when logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Security: if not authenticated, return nothing
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders from Supabase:', error);
      throw error;
    }
    return data.map(o => ({
      id: o.id,
      awb: o.awb,
      courier: o.courier,
      shiprocketOrderId: o.shiprocket_order_id,
      shiprocketSynced: o.shiprocket_synced,
      items: o.items,
      subtotal: parseFloat(o.subtotal),
      discount: parseFloat(o.discount),
      appliedPromo: o.applied_promo,
      shipping: parseFloat(o.shipping),
      total: parseFloat(o.total),
      status: o.status,
      shippingDetails: o.shipping_details,
      date: o.date
    }));
  } else {
    // Local mock mode: only show orders for the currently mocked-in user
    const mockUser = JSON.parse(localStorage.getItem('hellabold_mock_user') || 'null');
    if (!mockUser) return [];
    const allOrders = JSON.parse(localStorage.getItem('hellabold_orders') || '[]');
    // Filter by user_id if orders were stored with one, otherwise show all local orders
    return allOrders.filter(o => !o.user_id || o.user_id === mockUser.id);
  }
};

export const getAllOrdersForAdmin = async () => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching admin orders from Supabase:', error);
      throw error;
    }
    return data.map(o => ({
      id: o.id,
      awb: o.awb,
      courier: o.courier,
      shiprocketOrderId: o.shiprocket_order_id,
      shiprocketSynced: o.shiprocket_synced,
      items: o.items,
      subtotal: parseFloat(o.subtotal),
      discount: parseFloat(o.discount),
      appliedPromo: o.applied_promo,
      shipping: parseFloat(o.shipping),
      total: parseFloat(o.total),
      status: o.status,
      shippingDetails: o.shipping_details,
      date: o.date
    }));
  } else {
    return JSON.parse(localStorage.getItem('hellabold_orders') || '[]');
  }
};

export const createOrder = async (orderData) => {
  if (isSupabaseConfigured) {
    // Attach the current user's ID so we can filter orders per-user
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (_) {}

    const dbOrder = {
      id: orderData.id,
      awb: orderData.awb,
      courier: orderData.courier,
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      applied_promo: orderData.appliedPromo,
      shipping: orderData.shipping,
      total: orderData.total,
      status: orderData.status,
      shipping_details: orderData.shippingDetails,
      date: orderData.date,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([dbOrder])
      .select();

    if (error) {
      console.error('Error creating order in Supabase:', error);
      throw error;
    }
    return data;
  } else {
    // Local fallback: handled in components by saving to localStorage
    return orderData;
  }
};

export const updateOrderStatusInDB = async (orderId, newStatus) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('Error updating order status in Supabase:', error);
      throw error;
    }
    return data;
  } else {
    return null;
  }
};

// ==========================================
// 4. USER ACCOUNTS & AUTH ACTIONS
// ==========================================

export const signUpUser = async (email, password, fullName, phone) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: 'customer'
        }
      }
    });

    if (error) {
      console.error('Error signing up user in Supabase Auth:', error);
      throw error;
    }
    
    // Fetch profile created by DB trigger (will only succeed if session is active or profile row is accessible)
    let profile = null;
    try {
      profile = await getProfileById(data.user.id);
    } catch (e) {
      console.warn('Could not load profile instantly on signup:', e);
      profile = { id: data.user.id, fullName: fullName, phone: phone, role: 'customer' };
    }
    return { user: data.user, session: data.session, profile: { ...profile, email: data.user.email } };
  } else {
    // Local fallback: create mock user session
    const mockUser = {
      id: 'mock-uid-' + Date.now(),
      email,
      fullName,
      phone,
      role: email.includes('admin') ? 'admin' : 'customer',
      address: '',
      city: '',
      zipCode: '',
      handle: fullName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 20) || 'creator'
    };
    localStorage.setItem('hellabold_mock_user', JSON.stringify(mockUser));
    return { user: { id: mockUser.id, email }, session: { id: 'mock-session-id' }, profile: mockUser };
  }
};

export const signInUser = async (email, password) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error signing in user with Supabase Auth:', error);
      throw error;
    }

    const profile = await getProfileById(data.user.id);
    return { user: data.user, profile: { ...profile, email: data.user.email } };
  } else {
    // Local fallback logic
    const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user'));
    if (savedMockUser && savedMockUser.email === email) {
      return { user: { id: savedMockUser.id, email }, profile: savedMockUser };
    }
    
    // Create new mock session if credentials match generally
    const mockUser = {
      id: 'mock-uid-' + Date.now(),
      email,
      fullName: email.split('@')[0].toUpperCase(),
      role: email.includes('admin') ? 'admin' : 'customer',
      address: '',
      city: '',
      zipCode: ''
    };
    localStorage.setItem('hellabold_mock_user', JSON.stringify(mockUser));
    return { user: { id: mockUser.id, email }, profile: mockUser };
  }
};

export const signOutUser = async () => {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out user in Supabase:', error);
      throw error;
    }
  } else {
    localStorage.removeItem('hellabold_mock_user');
  }
  return true;
};

export const getCurrentUser = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user'));
        if (savedMockUser) {
          return { user: { id: savedMockUser.id, email: savedMockUser.email }, profile: ensureMockUserHandle(savedMockUser) };
        }
        return null;
      }
      const profile = await getProfileById(user.id);
      return { user, profile: { ...profile, email: user.email } };
    } catch (e) {
      // Fallback if network fails
      const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user'));
      if (savedMockUser) {
        return { user: { id: savedMockUser.id, email: savedMockUser.email }, profile: ensureMockUserHandle(savedMockUser) };
      }
      return null;
    }
  } else {
    const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user'));
    if (savedMockUser) {
      return { user: { id: savedMockUser.id, email: savedMockUser.email }, profile: ensureMockUserHandle(savedMockUser) };
    }
    return null;
  }
};

export const updateProfile = async (profileData) => {
  if (isSupabaseConfigured) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const dbProfile = {
      updated_at: new Date().toISOString()
    };
    if (profileData.fullName !== undefined) dbProfile.full_name = profileData.fullName;
    if (profileData.phone !== undefined) dbProfile.phone = profileData.phone;
    if (profileData.address !== undefined) dbProfile.address = profileData.address;
    if (profileData.city !== undefined) dbProfile.city = profileData.city;
    if (profileData.zipCode !== undefined) dbProfile.zip_code = profileData.zipCode;
    if (profileData.addresses !== undefined) dbProfile.addresses = profileData.addresses;
    if (profileData.hellaMoney !== undefined) dbProfile.hella_money = profileData.hellaMoney;
    if (profileData.handle !== undefined) dbProfile.handle = profileData.handle;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbProfile)
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('Error updating user profile in Supabase:', error);
      throw error;
    }

    // Sync all their existing shared designs to their new handle too!
    if (profileData.handle !== undefined) {
      try {
        await supabase
          .from('shared_designs')
          .update({ author_handle: profileData.handle })
          .eq('author_email', user.email);
      } catch (err) {
        console.warn('Could not sync handle to existing designs:', err);
      }
    }

    // Normalize to camelCase before returning
    const row = data[0];
    return {
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      city: row.city,
      zipCode: row.zip_code,
      role: row.role,
      addresses: row.addresses || [],
      hellaMoney: row.hella_money || 0,
      handle: row.handle || ''
    };
  } else {
    const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user') || '{}');
    const oldHandle = savedMockUser.handle;
    const updatedUser = { ...savedMockUser, ...profileData };
    localStorage.setItem('hellabold_mock_user', JSON.stringify(updatedUser));

    // Fallback sync for localStorage
    if (profileData.handle !== undefined && oldHandle !== profileData.handle) {
      try {
        const localSaved = localStorage.getItem('hellabold_shared_designs');
        if (localSaved) {
          let userDesigns = JSON.parse(localSaved);
          let changed = false;
          userDesigns = userDesigns.map(d => {
            if (d.authorEmail === savedMockUser.email || d.authorHandle === oldHandle) {
              changed = true;
              return { ...d, authorHandle: profileData.handle };
            }
            return d;
          });
          if (changed) {
            localStorage.setItem('hellabold_shared_designs', JSON.stringify(userDesigns));
          }
        }
      } catch (e) {}
    }

    return updatedUser;
  }
};

// Generates a unique handle from a full name, checking for collisions in profiles table
const generateUniqueHandle = async (fullName) => {
  const base = fullName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20) || 'creator';
  if (!isSupabaseConfigured) return base;
  const { data: existing } = await supabase.from('profiles').select('handle').eq('handle', base).maybeSingle();
  if (!existing) return base;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base.slice(0, 17)}${Math.floor(Math.random() * 900) + 100}`;
    const { data: taken } = await supabase.from('profiles').select('handle').eq('handle', candidate).maybeSingle();
    if (!taken) return candidate;
  }
  return `${base.slice(0, 16)}${Date.now() % 10000}`;
};

// Ensures a mock (localStorage) user has a handle — generates one from name if missing
const ensureMockUserHandle = (user) => {
  if (!user) return user;
  if (!user.handle) {
    const name = user.fullName || user.full_name || (user.email ? user.email.split('@')[0] : 'creator');
    user.handle = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 20) || 'creator';
    try { localStorage.setItem('hellabold_mock_user', JSON.stringify(user)); } catch (e) {}
  }
  return user;
};

// Internal helper for resolving profiles
const getProfileById = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error resolving user profile row:', error);
    // fallback row to prevent crash
    return { id: userId, full_name: 'Valued Customer', phone: '', role: 'customer', addresses: [] };
  }
  // Auto-assign a handle on first login if the user doesn't have one yet
  if (!data.handle && data.full_name) {
    try {
      const newHandle = await generateUniqueHandle(data.full_name);
      await supabase.from('profiles').update({ handle: newHandle }).eq('id', data.id);
      data.handle = newHandle;
    } catch (e) {}
  }

  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone,
    email: data.email || null,
    address: data.address,
    city: data.city,
    zipCode: data.zip_code,
    role: data.role,
    addresses: data.addresses || [],
    hellaMoney: data.hella_money || 0,
    handle: data.handle || ''
  };
};

export const getProfileByHandle = async (handle) => {
  if (!handle) return null;
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, handle, email')
        .eq('handle', handle.toLowerCase())
        .single();
      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        fullName: data.full_name,
        handle: data.handle,
        email: data.email || null
      };
    } catch (e) {}
  }
  // localStorage fallback — check if the current mock user has this handle
  try {
    const saved = localStorage.getItem('hellabold_mock_user');
    if (saved) {
      const u = JSON.parse(saved);
      if ((u.handle || '').toLowerCase() === handle.toLowerCase()) {
        return { fullName: u.full_name || u.fullName, handle: u.handle, email: u.email || null };
      }
    }
  } catch (e) {}
  return null;
};

// ── Coupons / Discount Manager ──────────────────────────────────────────────
export const getCoupons = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('code', { ascending: true });
      if (!error && data) {
        return data.map(c => ({
          code: c.code,
          type: c.type,
          value: c.value,
          minOrder: c.min_order,
          expiry: c.expiry,
          active: c.active
        }));
      }
    } catch (e) {
      console.warn('Supabase coupons table query failed, falling back to localStorage:', e);
    }
  }
  
  // Fallback to local storage (initialized with default seed coupons)
  const local = localStorage.getItem('hellabold_coupons');
  if (!local) {
    const seed = [
      { code: 'BOLD10', type: 'percent', value: 10, minOrder: 0, expiry: '', active: true },
      { code: 'BOLD20', type: 'percent', value: 20, minOrder: 899, expiry: '', active: true },
      { code: 'HELLA50', type: 'percent', value: 50, minOrder: 1299, expiry: '', active: true }
    ];
    localStorage.setItem('hellabold_coupons', JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(local);
};

export const saveCoupon = async (coupon) => {
  if (isSupabaseConfigured) {
    try {
      const dbCoupon = {
        code: coupon.code.toUpperCase(),
        type: coupon.type,
        value: Number(coupon.value),
        min_order: Number(coupon.minOrder || 0),
        expiry: coupon.expiry || null,
        active: coupon.active !== false
      };

      const { data, error } = await supabase
        .from('coupons')
        .upsert(dbCoupon)
        .select();

      if (!error) return true;
      console.warn('Failed to save coupon to Supabase, falling back to localStorage:', error);
    } catch (e) {
      console.warn('Upsert coupon to Supabase failed:', e);
    }
  }

  // Local storage fallback
  const coupons = await getCoupons();
  const index = coupons.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
  const updatedCoupon = {
    code: coupon.code.toUpperCase(),
    type: coupon.type,
    value: Number(coupon.value),
    minOrder: Number(coupon.minOrder || 0),
    expiry: coupon.expiry || '',
    active: coupon.active !== false
  };

  if (index >= 0) {
    coupons[index] = updatedCoupon;
  } else {
    coupons.push(updatedCoupon);
  }
  localStorage.setItem('hellabold_coupons', JSON.stringify(coupons));
  return true;
};

export const deleteCoupon = async (code) => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('code', code.toUpperCase());
      if (!error) return true;
    } catch (e) {
      console.warn('Failed to delete coupon from Supabase:', e);
    }
  }

  // Local storage fallback
  const coupons = await getCoupons();
  const filtered = coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
  localStorage.setItem('hellabold_coupons', JSON.stringify(filtered));
  return true;
};

// ==========================================
// 6. SHARED DESIGNS DATABASE ACTIONS
// ==========================================

const MOCK_SHARED_DESIGNS = [
  {
    id: 'shared-mock-1',
    title: 'CYBER-PUNK NEON DRIFT',
    author: 'ZeroCool',
    gender: 'male',
    color: 'black',
    garmentType: 'tee',
    frontImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
    backImage: null,
    instructionText: 'Make the neon printing extra reflective under dark lights.',
    likes: 142,
    customMeta: {
      model: 'male_black',
      garmentType: 'tee',
      color: 'black',
      gender: 'male',
      size: 'L',
      price: 999,
      isBothSides: false,
      placement: {
        front: { scale: 100, x: 5, y: 5, rotation: 0, opacity: 100 },
        back: { scale: 100, x: 5, y: 5, rotation: 0, opacity: 100 }
      }
    }
  },
  {
    id: 'shared-mock-2',
    title: 'ABSTRACT GEOMETRIC SPACE',
    author: 'VaporKate',
    gender: 'female',
    color: 'white',
    garmentType: 'tee',
    frontImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop',
    backImage: null,
    instructionText: 'Center aligning is important, high contrast.',
    likes: 98,
    customMeta: {
      model: 'female_white',
      garmentType: 'tee',
      color: 'white',
      gender: 'female',
      size: 'M',
      price: 999,
      isBothSides: false,
      placement: {
        front: { scale: 80, x: 0, y: 8, rotation: 0, opacity: 90 },
        back: { scale: 100, x: 5, y: 5, rotation: 0, opacity: 100 }
      }
    }
  },
  {
    id: 'shared-mock-3',
    title: 'TOKYO FUTURE LIGHTS',
    author: 'HarajukuDrip',
    gender: 'male',
    color: 'black',
    garmentType: 'tee',
    frontImage: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop',
    backImage: null,
    instructionText: 'Slightly oversized decal alignment.',
    likes: 215,
    customMeta: {
      model: 'male_black',
      garmentType: 'tee',
      color: 'black',
      gender: 'male',
      size: 'XL',
      price: 999,
      isBothSides: false,
      placement: {
        front: { scale: 95, x: 5, y: 5, rotation: -5, opacity: 100 },
        back: { scale: 100, x: 5, y: 5, rotation: 0, opacity: 100 }
      }
    }
  }
];

export const getSharedDesigns = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('shared_designs')
        .select('*')
        .order('likes', { ascending: false });

      if (error) {
        console.error('Supabase shared_designs table query error:', error);
      }
      if (!error && data) {
        return data.map(d => ({
          id: d.id,
          title: d.title,
          author: d.author,
          authorEmail: d.author_email || null,
          authorHandle: d.author_handle || null,
          gender: d.gender,
          color: d.color,
          garmentType: d.garment_type,
          frontImage: d.front_image,
          backImage: d.back_image,
          instructionText: d.instruction_text,
          likes: d.likes || 0,
          customMeta: d.custom_meta
        }));
      }
    } catch (err) {
      console.error('Supabase shared_designs exception:', err);
    }
  }

  // Fallback to local storage + mock data
  const localSaved = localStorage.getItem('hellabold_shared_designs');
  let userDesigns = [];
  if (localSaved) {
    try {
      userDesigns = JSON.parse(localSaved);
    } catch (e) {
      userDesigns = [];
    }
  }
  // Merge user-made designs with seed mock data, sorted by likes descending
  const allDesigns = [...userDesigns, ...MOCK_SHARED_DESIGNS];
  return allDesigns.sort((a, b) => b.likes - a.likes);
};

export const saveSharedDesign = async (design) => {
  const payload = {
    id: design.id || `design-${Date.now()}`,
    title: design.title || 'UNTITLED DESIGN',
    author: design.author || 'Anonymous Creator',
    author_email: design.authorEmail || null,
    gender: design.gender || 'male',
    color: design.color || 'black',
    garment_type: design.garmentType || 'tee',
    front_image: design.frontImage,
    back_image: design.backImage,
    instruction_text: design.instructionText || '',
    likes: design.likes || 0,
    author_handle: design.authorHandle || null,
    custom_meta: design.customMeta
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('shared_designs')
        .insert([payload])
        .select();

      if (!error && data) {
        return true;
      }
      console.warn('Failed to save to Supabase shared_designs table:', error);
    } catch (err) {
      console.warn('Error saving shared design in Supabase:', err);
    }
  }

  // Local storage fallback
  const localSaved = localStorage.getItem('hellabold_shared_designs');
  let userDesigns = [];
  if (localSaved) {
    try {
      userDesigns = JSON.parse(localSaved);
    } catch (e) {
      userDesigns = [];
    }
  }
  
  // Format for local storage to match key style
  const localPayload = {
    id: payload.id,
    title: payload.title,
    author: payload.author,
    gender: payload.gender,
    color: payload.color,
    garmentType: payload.garment_type,
    frontImage: payload.front_image,
    backImage: payload.back_image,
    instructionText: payload.instruction_text,
    likes: payload.likes,
    authorHandle: payload.author_handle || null,
    customMeta: payload.custom_meta
  };

  userDesigns.push(localPayload);
  localStorage.setItem('hellabold_shared_designs', JSON.stringify(userDesigns));
  return true;
};

export const likeSharedDesign = async (designId, isAlreadyLiked = false) => {
  if (isSupabaseConfigured) {
    try {
      const { data: current } = await supabase
        .from('shared_designs')
        .select('likes')
        .eq('id', designId)
        .single();
      
      const newLikes = Math.max(0, (current?.likes || 0) + (isAlreadyLiked ? -1 : 1));
      const { error } = await supabase
        .from('shared_designs')
        .update({ likes: newLikes })
        .eq('id', designId);

      if (!error) return newLikes;
    } catch (err) {
      console.warn('Error updating likes in Supabase:', err);
    }
  }

  // Local storage fallback (or mock design increment)
  const isMock = MOCK_SHARED_DESIGNS.find(d => d.id === designId);
  if (isMock) {
    isMock.likes = Math.max(0, isMock.likes + (isAlreadyLiked ? -1 : 1));
    return isMock.likes;
  }

  const localSaved = localStorage.getItem('hellabold_shared_designs');
  let userDesigns = [];
  if (localSaved) {
    try {
      userDesigns = JSON.parse(localSaved);
    } catch (e) {
      userDesigns = [];
    }
  }

  const designIndex = userDesigns.findIndex(d => d.id === designId);
  if (designIndex >= 0) {
    userDesigns[designIndex].likes = Math.max(0, (userDesigns[designIndex].likes || 0) + (isAlreadyLiked ? -1 : 1));
    localStorage.setItem('hellabold_shared_designs', JSON.stringify(userDesigns));
    return userDesigns[designIndex].likes;
  }

  return isAlreadyLiked ? 0 : 1;
};

// ==========================================
// 7. HELLA MONEY & ROYALTY ACTIONS
// ==========================================

export const getHellaMoneyLedger = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('hella_money_ledger')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data.map(d => ({
        id: d.id,
        orderId: d.order_id,
        itemTitle: d.item_title,
        price: d.price,
        creator: d.creator,
        amount: d.amount,
        createdAt: d.created_at
      }));
    } catch (e) {
      console.warn('Supabase hella_money_ledger error:', e);
    }
  }
  return JSON.parse(localStorage.getItem('hellabold_hm_ledger') || '[]');
};

export const getPayoutRequests = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data.map(d => ({
        id: d.id,
        creator: d.creator,
        upiId: d.upi_id,
        amount: d.amount,
        status: d.status,
        createdAt: d.created_at
      }));
    } catch (e) {
      console.warn('Supabase payout_requests error:', e);
    }
  }
  return JSON.parse(localStorage.getItem('hellabold_payout_requests') || '[]');
};

export const createPayoutRequest = async (creator, upiId, amount) => {
  const request = {
    id: `req-${Date.now()}`,
    creator,
    upi_id: upiId,
    amount: Number(amount),
    status: 'Pending',
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('payout_requests')
        .insert([request]);
      if (!error) {
        // Deduct from profile balance using the authenticated user's UUID (most reliable)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('hella_money')
              .eq('id', user.id)
              .single();
            if (profile) {
              const newBal = Math.max(0, (profile.hella_money || 0) - Number(amount));
              const { error: updateErr } = await supabase
                .from('profiles')
                .update({ hella_money: newBal })
                .eq('id', user.id);
              if (updateErr) {
                console.warn('Failed to update hella_money in profiles:', updateErr);
              } else {
                console.log(`✅ Deducted ${amount} HM from profile ${user.id}. New balance: ${newBal}`);
              }
            }
          }
        } catch (deductErr) {
          console.warn('Failed to deduct balance after payout request:', deductErr);
        }
        return true;
      }
    } catch (e) {
      console.warn('Supabase create payout error:', e);
    }
  }

  // Deduct from local user profile balance first
  const mockUser = JSON.parse(localStorage.getItem('hellabold_mock_user') || '{}');
  if (mockUser && mockUser.fullName === creator) {
    mockUser.hellaMoney = Math.max(0, (mockUser.hellaMoney || 0) - amount);
    localStorage.setItem('hellabold_mock_user', JSON.stringify(mockUser));
  }

  const requests = await getPayoutRequests();
  const localRequest = {
    id: request.id,
    creator: request.creator,
    upiId: request.upi_id,
    amount: request.amount,
    status: request.status,
    createdAt: request.created_at
  };
  requests.push(localRequest);
  localStorage.setItem('hellabold_payout_requests', JSON.stringify(requests));
  return true;
};

export const settlePayoutRequest = async (requestId) => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({ status: 'Settled' })
        .eq('id', requestId);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase settle payout error:', e);
    }
  }

  const requests = await getPayoutRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index >= 0) {
    requests[index].status = 'Settled';
    localStorage.setItem('hellabold_payout_requests', JSON.stringify(requests));
  }
  return true;
};

export const awardRoyaltiesForOrder = async (order) => {
  if (!order || !order.items) return;

  const ledger = await getHellaMoneyLedger();

  for (const item of order.items) {
    let remixOf = item.remixOf;

    // Fallback: If remixOf is missing, try to resolve it from the shared_designs DB table
    if (!remixOf && isSupabaseConfigured && (String(item.id).startsWith('design-') || String(item.id).startsWith('shared-mock-'))) {
      try {
        const { data: designData } = await supabase
          .from('shared_designs')
          .select('author, author_email')
          .eq('id', item.id)
          .single();
        if (designData && designData.author) {
          remixOf = {
            designId: item.id,
            creator: designData.author,
            creatorEmail: designData.author_email || null
          };
        }
      } catch (err) {
        console.warn('Could not resolve creator fallback from shared_designs:', err);
      }
    }

    if (remixOf) {
      const creator = remixOf.creator;
      const royalty = remixOf.royaltyAmount || Math.round(parseFloat(String(item.price).replace(/[^0-9.]/g, '')) * 0.05);

      const ledgerEntry = {
        id: `hm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        orderId: order.id,
        itemTitle: item.title,
        price: item.price,
        creator,
        amount: royalty,
        createdAt: new Date().toISOString()
      };
      ledger.push(ledgerEntry);

      if (isSupabaseConfigured) {
        try {
          let matches = [];
          const creatorEmail = remixOf.creatorEmail;
          if (creatorEmail) {
            const { data: byEmail } = await supabase.from('profiles').select('id, hella_money').eq('email', creatorEmail);
            if (byEmail && byEmail.length > 0) {
              matches = byEmail;
            }
          }
          if (matches.length === 0) {
            const { data: byName } = await supabase.from('profiles').select('id, hella_money').eq('full_name', creator);
            if (byName && byName.length > 0) {
              matches = byName;
            } else {
              const { data: byEmailFallback } = await supabase.from('profiles').select('id, hella_money').eq('email', creator);
              if (byEmailFallback && byEmailFallback.length > 0) {
                matches = byEmailFallback;
              }
            }
          }
          
          if (matches && matches.length > 0) {
            const profile = matches[0];
            const newBal = (profile.hella_money || 0) + royalty;
            await supabase
              .from('profiles')
              .update({ hella_money: newBal })
              .eq('id', profile.id);
            console.log(`Successfully awarded ${royalty} Hella Money to ${creator}. New balance: ${newBal}`);
          } else {
            console.warn(`Could not find profile for creator: ${creator}`);
          }

          // Always write ledger entry to Supabase for earnings history
          const { error: ledgerInsertErr } = await supabase.from('hella_money_ledger').insert([{
            id: ledgerEntry.id,
            order_id: ledgerEntry.orderId,
            item_title: ledgerEntry.itemTitle,
            price: ledgerEntry.price,
            creator: ledgerEntry.creator,
            amount: ledgerEntry.amount,
            created_at: ledgerEntry.createdAt
          }]);
          if (ledgerInsertErr) {
            console.error('❌ Ledger insert failed:', JSON.stringify(ledgerInsertErr));
          } else {
            console.log('✅ Ledger entry saved for', ledgerEntry.creator, '+', ledgerEntry.amount, 'HM');
          }
        } catch (err) {
          console.warn('Failed to award royalties in Supabase profiles:', err);
        }
      } else {
        const mockUser = JSON.parse(localStorage.getItem('hellabold_mock_user') || '{}');
        if (mockUser && mockUser.fullName === creator) {
          mockUser.hellaMoney = (mockUser.hellaMoney || 0) + royalty;
          localStorage.setItem('hellabold_mock_user', JSON.stringify(mockUser));
        }
      }
    }
  }

  localStorage.setItem('hellabold_hm_ledger', JSON.stringify(ledger));
};

export const deductHellaMoney = async (creator, amount, orderId) => {
  const ledger = await getHellaMoneyLedger();
  const ledgerEntry = {
    id: `hm-ded-${Date.now()}`,
    orderId,
    itemTitle: 'Redeemed Store Credit',
    price: `₹${amount}`,
    creator,
    amount: -amount,
    createdAt: new Date().toISOString()
  };
  ledger.push(ledgerEntry);
  localStorage.setItem('hellabold_hm_ledger', JSON.stringify(ledger));

  if (isSupabaseConfigured) {
    try {
      let matches = [];
      const { data: byName } = await supabase.from('profiles').select('id, hella_money').eq('full_name', creator);
      if (byName && byName.length > 0) {
        matches = byName;
      } else {
        const { data: byEmail } = await supabase.from('profiles').select('id, hella_money').eq('email', creator);
        if (byEmail && byEmail.length > 0) {
          matches = byEmail;
        }
      }
      
      if (matches && matches.length > 0) {
        const profile = matches[0];
        const newBal = Math.max(0, (profile.hella_money || 0) - amount);
        await supabase
          .from('profiles')
          .update({ hella_money: newBal })
          .eq('id', profile.id);
      }
    } catch (err) {
      console.warn('Failed to deduct Hella Money in Supabase:', err);
    }
  } else {
    const mockUser = JSON.parse(localStorage.getItem('hellabold_mock_user') || '{}');
    if (mockUser && mockUser.fullName === creator) {
      mockUser.hellaMoney = Math.max(0, (mockUser.hellaMoney || 0) - amount);
      localStorage.setItem('hellabold_mock_user', JSON.stringify(mockUser));
    }
  }
};

export const deleteSharedDesign = async (designId) => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('shared_designs')
        .delete()
        .eq('id', designId);
      if (!error) {
        return true;
      } else {
        console.error('Supabase deleteSharedDesign error:', error);
        return false;
      }
    } catch (e) {
      console.error('Supabase deleteSharedDesign exception:', e);
      return false;
    }
  }

  const localSaved = localStorage.getItem('hellabold_shared_designs');
  if (localSaved) {
    try {
      const userDesigns = JSON.parse(localSaved);
      const filtered = userDesigns.filter(d => d.id !== designId);
      localStorage.setItem('hellabold_shared_designs', JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Local storage shared design deletion error:', e);
    }
  }
  return false;
};



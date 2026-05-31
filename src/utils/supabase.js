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
    // Force sync database to use updated local printed t-shirts data
    try {
      const { data: currentDbData } = await supabase.from('products').select('*');
      if (currentDbData) {
        const hasLegacy = currentDbData.some(p => p.title === 'Born to Stand Out' || p.title === 'Signature Saddle Bag' || p.title.includes('Boot') || p.title.includes('Coat'));
        if (hasLegacy || currentDbData.length !== 9) {
          console.log('Syncing product count or items mismatch. Re-seeding printed t-shirts...');
          await supabase.from('products').delete().neq('id', 0); // Clear old records
          await supabase.from('products').insert(productsJson);  // Insert updated list
        }
      }
    } catch (e) {
      console.error('Failed to sync updated items to database:', e);
    }

    let { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching products from Supabase:', error);
      throw error;
    }

    // Auto-seed if the database table is empty
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
    return data;
  } else {
    const res = await fetch('/api/products');
    return res.json();
  }
};

export const saveProduct = async (productData, editingId = null) => {
  if (isSupabaseConfigured) {
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

    let { data, error } = await performSave(productData);

    if (error && (error.code === 'PGRST204' || (error.message && error.message.includes('original_price'))) && 'original_price' in productData) {
      console.warn('Supabase products table is missing original_price column. Retrying without it.');
      const { original_price, ...fallbackPayload } = productData;
      const retryResult = await performSave(fallbackPayload);
      if (retryResult.error) throw retryResult.error;
      if (retryResult.data && retryResult.data[0]) {
        retryResult.data[0]._warning = "Supabase is missing the 'original_price' column. The product was saved, but your original price was not persisted. Please add the column in your Supabase dashboard.";
      }
      return retryResult.data;
    }

    if (error) {
      console.error('Error saving product in Supabase:', error);
      throw error;
    }
    return data;
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
      const reviewsToInsert = reviewsJson.map(r => ({
        id: r.id,
        product_id: r.productId,
        author: r.author,
        rating: r.rating,
        comment: r.comment,
        verified: r.verified,
        images: r.images,
        date: r.date
      }));
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

export const signUpUser = async (email, password, fullName) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
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
      profile = { id: data.user.id, fullName: fullName, role: 'customer' };
    }
    return { user: data.user, session: data.session, profile };
  } else {
    // Local fallback: create mock user session
    const mockUser = {
      id: 'mock-uid-' + Date.now(),
      email,
      fullName,
      role: email.includes('admin') ? 'admin' : 'customer',
      address: '',
      city: '',
      zipCode: ''
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
    return { user: data.user, profile };
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
        // Check if a guest has logged in locally
        const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user'));
        if (savedMockUser) {
          return { user: { id: savedMockUser.id, email: savedMockUser.email }, profile: savedMockUser };
        }
        return null;
      }
      const profile = await getProfileById(user.id);
      return { user, profile };
    } catch (e) {
      // Fallback if network fails
      const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user'));
      if (savedMockUser) {
        return { user: { id: savedMockUser.id, email: savedMockUser.email }, profile: savedMockUser };
      }
      return null;
    }
  } else {
    const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user'));
    if (savedMockUser) {
      return { user: { id: savedMockUser.id, email: savedMockUser.email }, profile: savedMockUser };
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
    if (profileData.address !== undefined) dbProfile.address = profileData.address;
    if (profileData.city !== undefined) dbProfile.city = profileData.city;
    if (profileData.zipCode !== undefined) dbProfile.zip_code = profileData.zipCode;
    if (profileData.addresses !== undefined) dbProfile.addresses = profileData.addresses;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbProfile)
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('Error updating user profile in Supabase:', error);
      throw error;
    }
    // Normalize to camelCase before returning
    const row = data[0];
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      address: row.address,
      city: row.city,
      zipCode: row.zip_code,
      role: row.role,
      addresses: row.addresses || []
    };
  } else {
    const savedMockUser = JSON.parse(localStorage.getItem('hellabold_mock_user') || '{}');
    const updatedUser = { ...savedMockUser, ...profileData };
    localStorage.setItem('hellabold_mock_user', JSON.stringify(updatedUser));
    return updatedUser;
  }
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
    return { id: userId, full_name: 'Valued Customer', role: 'customer', addresses: [] };
  }
  return {
    id: data.id,
    fullName: data.full_name,
    address: data.address,
    city: data.city,
    zipCode: data.zip_code,
    role: data.role,
    addresses: data.addresses || []
  };
};

import React, { useState, useEffect } from 'react';
import { 
  getProducts, 
  saveProduct, 
  deleteProduct, 
  getReviews, 
  addReview, 
  deleteReview, 
  getOrders, 
  getAllOrdersForAdmin,
  updateOrderStatusInDB,
  getCoupons,
  saveCoupon,
  deleteCoupon,
  getHellaMoneyLedger,
  getPayoutRequests,
  settlePayoutRequest,
  awardRoyaltiesForOrder,
  getDonationReceipts,
  saveDonationReceipt,
  deleteDonationReceipt,
  supabase
} from '../utils/supabase';
import { createShiprocketOrder } from '../utils/shiprocket';
import { cloudinaryOptimize } from '../utils/cloudinary';

const PincodeResolver = ({ pin }) => {
  const [location, setLocation] = useState('Resolving location...');
  
  useEffect(() => {
    if (!pin) {
      setLocation('');
      return;
    }
    let isMounted = true;
    fetch(`https://api.postalpincode.in/pincode/${pin}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
            const po = data[0].PostOffice[0];
            setLocation(`${po.District || po.Name}, ${po.State}`);
          } else {
            setLocation('Unknown Pincode Location');
          }
        }
      })
      .catch(err => {
        if (isMounted) setLocation('Error fetching location');
      });
    return () => { isMounted = false; };
  }, [pin]);

  return <span style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '0.8rem' }}> ({location})</span>;
};

const AdminPanel = ({ onProductsUpdated, reviews = [], onReviewsUpdated, userProfile }) => {
  const [products, setProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [sizes, setSizes] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [category, setCategory] = useState('Tops');
  const [label, setLabel] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Tab Selection
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);

  // Meta Pixel Metrics states
  const [metaStatsList, setMetaStatsList] = useState([]);
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState('');

  // Reviews Form Fields
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewVerified, setReviewVerified] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSelectedImage, setReviewSelectedImage] = useState('');

  const [feedbackImages, setFeedbackImages] = useState([]);

  // Color Variants States
  const [hasColors, setHasColors] = useState(false);
  const [colors, setColors] = useState([]);
  const [colorImages, setColorImages] = useState({});
  const [newColorInput, setNewColorInput] = useState('');

  // Coupon States
  const [couponsList, setCouponsList] = useState([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('percent');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState('');

  // Hella Money States
  const [hmLedger, setHmLedger] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);

  // Charity Receipts States
  const [charityReceipts, setCharityReceipts] = useState([]);
  const [charityImageUrl, setCharityImageUrl] = useState('');
  const [charityDisplayOrder, setCharityDisplayOrder] = useState(1);
  const [charityDescription, setCharityDescription] = useState('');
  const [charityReceiptNo, setCharityReceiptNo] = useState('');
  const [charityDate, setCharityDate] = useState('');
  const [charityAmount, setCharityAmount] = useState('');
  const [charityNgo, setCharityNgo] = useState('');
  const [editingReceiptId, setEditingReceiptId] = useState(null);

  const fetchCharityReceipts = async () => {
    try {
      const res = await getDonationReceipts();
      setCharityReceipts(res);
      if (!editingReceiptId) {
        setCharityDisplayOrder(res.length + 1);
      }
    } catch (e) {
      console.error('Failed to load receipts:', e);
    }
  };

  const handleSaveCharityReceipt = async (e) => {
    e.preventDefault();
    if (!charityImageUrl) {
      alert('Please enter a Cloudinary image URL.');
      return;
    }
    try {
      await saveDonationReceipt({
        id: editingReceiptId,
        imageUrl: charityImageUrl,
        displayOrder: parseInt(charityDisplayOrder || 0, 10),
        description: charityDescription,
        receiptNo: charityReceiptNo,
        date: charityDate,
        amount: parseFloat(charityAmount || 0),
        ngo: charityNgo
      });
      alert('Charity receipt saved successfully!');
      setCharityImageUrl('');
      setCharityDescription('');
      setCharityReceiptNo('');
      setCharityDate('');
      setCharityAmount('');
      setCharityNgo('');
      setEditingReceiptId(null);
      fetchCharityReceipts();
    } catch (err) {
      console.error(err);
      alert('Failed to save charity receipt.');
    }
  };

  const handleEditReceipt = (receipt) => {
    setEditingReceiptId(receipt.id);
    setCharityImageUrl(receipt.imageUrl);
    setCharityDisplayOrder(receipt.displayOrder);
    setCharityDescription(receipt.description || '');
    setCharityReceiptNo(receipt.receiptNo || '');
    setCharityDate(receipt.date || '');
    setCharityAmount(receipt.amount || '');
    setCharityNgo(receipt.ngo || '');
  };

  const handleDeleteReceipt = async (id) => {
    if (confirm('Are you sure you want to delete this donation receipt?')) {
      try {
        await deleteDonationReceipt(id);
        fetchCharityReceipts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchHellaMoneyData = async () => {
    try {
      const ledger = await getHellaMoneyLedger();
      setHmLedger(ledger);
      const requests = await getPayoutRequests();
      setPayoutRequests(requests);
    } catch (e) {
      console.error('Failed to load Hella Money ledger:', e);
    }
  };

  const handleSettlePayout = async (requestId) => {
    if (confirm('Are you sure you have paid this creator via UPI and want to mark it as Settled?')) {
      try {
        await settlePayoutRequest(requestId);
        fetchHellaMoneyData();
      } catch (err) {
        console.error(err);
        alert('Failed to settle payout request.');
      }
    }
  };

  // Load products, images, and orders on mount
  useEffect(() => {
    fetchProducts();
    fetchImages();
    fetchFeedbackImages();
    fetchOrders();
    fetchCoupons();
    fetchHellaMoneyData();
    fetchCharityReceipts();
  }, []);

  useEffect(() => {
    if (activeAdminTab === 'orders' || activeAdminTab === 'dashboard') {
      fetchOrders();
    }
    if (activeAdminTab === 'coupons') {
      fetchCoupons();
    }
    if (activeAdminTab === 'hellamoney') {
      fetchHellaMoneyData();
    }
    if (activeAdminTab === 'charity') {
      fetchCharityReceipts();
    }
    if (activeAdminTab === 'meta') {
      fetchMetaStats();
    }
  }, [activeAdminTab]);

  const fetchMetaStats = async () => {
    setMetaLoading(true);
    setMetaError('');
    try {
      const res = await fetch('/api/pixel-stats');
      const data = await res.json();
      if (res.ok && data.success) {
        setMetaStatsList(data.stats);
        setMetaPixelId(data.pixelId);
      } else {
        const errMsg = data.error?.message || data.error || 'Failed to retrieve Meta event metrics.';
        setMetaError(typeof errMsg === 'object' ? JSON.stringify(errMsg) : String(errMsg));
      }
    } catch (err) {
      console.error('Meta stats fetch failed:', err);
      setMetaError('Network error connecting to stats endpoint.');
    } finally {
      setMetaLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await getCoupons();
      setCouponsList(data);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponValue) {
      alert('Coupon code and discount value are required.');
      return;
    }
    const newCoupon = {
      code: newCouponCode.trim().toUpperCase(),
      type: newCouponType,
      value: parseFloat(newCouponValue),
      minOrder: parseFloat(newCouponMinOrder || 0),
      expiry: newCouponExpiry,
      active: true
    };
    try {
      await saveCoupon(newCoupon);
      alert('Coupon saved successfully!');
      setNewCouponCode('');
      setNewCouponValue('');
      setNewCouponMinOrder('');
      setNewCouponExpiry('');
      fetchCoupons();
    } catch (err) {
      console.error('Failed to save coupon:', err);
      alert('Failed to save coupon.');
    }
  };

  const handleToggleCoupon = async (coupon) => {
    const updated = { ...coupon, active: !coupon.active };
    try {
      await saveCoupon(updated);
      fetchCoupons();
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!window.confirm(`Are you sure you want to revoke coupon ${code}?`)) return;
    try {
      await deleteCoupon(code);
      fetchCoupons();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const dbOrders = await getAllOrdersForAdmin();
      
      const patchedOrders = await Promise.all((dbOrders || []).map(async (order) => {
        const patchedItems = await Promise.all((order.items || []).map(async (item) => {
          if ((String(item.id).startsWith('design-') || String(item.id).startsWith('shared-mock-')) && !item.customDesign && !item.frontImage) {
            try {
              const { data: designData } = await supabase
                .from('shared_designs')
                .select('*')
                .eq('id', item.id)
                .single();
              
              if (designData) {
                return {
                  ...item,
                  customDesign: designData.front_image || null,
                  customDesignBack: designData.back_image || null,
                  customMeta: {
                    ...item.customMeta,
                    placement: designData.custom_meta?.placement || item.customMeta?.placement,
                    instructions: designData.instruction_text || item.customMeta?.instructions
                  }
                };
              }
            } catch (err) {
              console.warn('Could not patch older order item from shared_designs:', err);
            }
          }
          return item;
        }));
        return { ...order, items: patchedItems };
      }));

      setOrders(patchedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatusInDB(orderId, newStatus);
    } catch (err) {
      console.error('Error updating order status in DB:', err);
    }

    // Trigger royalties when order is marked Delivered
    if (newStatus === 'Delivered') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        try {
          await awardRoyaltiesForOrder(order);
        } catch (e) {
          console.warn('Failed to award royalties on status change:', e);
        }
      }
    }

    // Update local state
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    // Fallback sync to localStorage
    const savedOrders = JSON.parse(localStorage.getItem('hellabold_orders') || '[]');
    const updated = savedOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    localStorage.setItem('hellabold_orders', JSON.stringify(updated));
  };

  const handleResyncToShiprocket = async (order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, _resyncing: true } : o));
    try {
      const srResult = await createShiprocketOrder(order);
      if (srResult.success) {
        setOrders(prev => prev.map(o => o.id === order.id ? {
          ...o,
          awb: srResult.awb,
          courier: srResult.courier,
          shiprocketOrderId: srResult.shiprocketOrderId,
          shiprocketSynced: true,
          _resyncing: false
        } : o));
        alert(`✅ Successfully synced to Shiprocket!\nAWB: ${srResult.awb}\nCourier: ${srResult.courier}`);
      } else {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, _resyncing: false } : o));
        alert('❌ Shiprocket sync failed: ' + srResult.error);
      }
    } catch (err) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, _resyncing: false } : o));
      alert('❌ Unexpected error: ' + err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/images');
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  const fetchFeedbackImages = async () => {
    try {
      const res = await fetch('/api/feedback-images');
      const data = await res.json();
      setFeedbackImages(data);
    } catch (err) {
      console.error('Error fetching feedback images:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            base64
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages(prev => [data.url, ...prev]);
          fetchImages();
        } else {
          alert(data.error || 'Upload failed');
        }
      } catch (err) {
        console.error('Error uploading:', err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = async (imgUrl) => {
    try {
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imgUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setImages(prev => prev.filter(img => img !== imgUrl));
        setSelectedImages(prev => prev.filter(img => img !== imgUrl));
      } else {
        alert(data.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Error deleting image: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productData = {
      title,
      price,
      original_price: originalPrice || null,
      description,
      details: details.split('\n').filter(line => line.trim() !== ''),
      sizes,
      images: selectedImages,
      category,
      label,
      colors: hasColors ? colors : null,
      colorImages: hasColors ? colorImages : null
    };

    try {
      const savedData = await saveProduct(productData, isEditing ? editingId : null);
      if (savedData && savedData[0] && savedData[0]._warning) {
        alert(savedData[0]._warning + "\n\nTo enable this, go to your Supabase Dashboard Table Editor and add a column 'original_price' (type: text, nullable) to the 'products' table.");
      }
      const allProducts = await getProducts();
      onProductsUpdated(allProducts);
      setProducts(allProducts);
      resetForm();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product: ' + (err.message || err));
    }
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setTitle(product.title);
    setPrice(product.price);
    setOriginalPrice(product.original_price || '');
    setDescription(product.description || '');
    setDetails(product.details?.join('\n') || '');
    setSizes(product.sizes || []);
    
    // Load union of standard images and variant-specific color images
    const unionImages = new Set(product.images || []);
    if (product.colorImages) {
      Object.values(product.colorImages).forEach(imgs => {
        if (Array.isArray(imgs)) {
          imgs.forEach(img => unionImages.add(img));
        }
      });
    }
    setSelectedImages(Array.from(unionImages));

    setCategory(product.category || 'Outerwear');
    setLabel(product.label || '');
    const hasVariants = !!(product.colors && product.colors.length > 0);
    setHasColors(hasVariants);
    setColors(product.colors || []);
    setColorImages(product.colorImages || {});
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      const allProducts = await getProducts();
      onProductsUpdated(allProducts);
      setProducts(allProducts);
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setPrice('');
    setOriginalPrice('');
    setDescription('');
    setDetails('');
    setSizes([]);
    setSelectedImages([]);
    setCategory('Outerwear');
    setLabel('');
    setHasColors(false);
    setColors([]);
    setColorImages({});
    setNewColorInput('');
  };

  const toggleSize = (size) => {
    if (sizes.includes(size)) {
      setSizes(sizes.filter(s => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewProductId) {
      alert('Please select a product');
      return;
    }

    const reviewData = {
      productId: reviewProductId,
      author: reviewAuthor,
      rating: parseInt(reviewRating),
      verified: reviewVerified,
      comment: reviewComment,
      images: reviewSelectedImage ? [reviewSelectedImage] : [],
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    try {
      await addReview(reviewData);
      const allReviews = await getReviews();
      onReviewsUpdated(allReviews);
      setReviewProductId('');
      setReviewAuthor('');
      setReviewComment('');
      setReviewSelectedImage('');
      alert('Review published successfully!');
    } catch (err) {
      console.error('Error publishing review:', err);
    }
  };

  const handleReviewDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
      const allReviews = await getReviews();
      onReviewsUpdated(allReviews);
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const handleEditSku = async (product, size, currentSku) => {
    const newSku = prompt(`Enter custom SKU for ${product.title} (Size: ${size}):`, currentSku);
    if (newSku === null) return;
    
    const updatedSkus = {
      ...(product.skus || {}),
      [size]: newSku.trim() || undefined
    };
    
    if (updatedSkus[size] === undefined) {
      delete updatedSkus[size];
    }
    
    const updatedProduct = {
      ...product,
      skus: updatedSkus
    };
    
    try {
      await saveProduct(updatedProduct, product.id);
      const allProducts = await getProducts();
      onProductsUpdated(allProducts);
      setProducts(allProducts);
    } catch (err) {
      console.error('Error updating SKU:', err);
      alert('Failed to update SKU: ' + (err.message || err));
    }
  };

  const toggleImageSelect = (imgUrl) => {
    if (selectedImages.includes(imgUrl)) {
      setSelectedImages(selectedImages.filter(url => url !== imgUrl));
    } else {
      setSelectedImages([...selectedImages, imgUrl]);
    }
  };

  const commonSizes = ['S', 'M', 'L', 'XL'];

  // =========================================
  // Dashboard Calculations
  // =========================================
  const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const activeShipments = orders.filter(order => order.status !== 'Delivered').length;

  // Best Sellers Calculations
  const productSalesMap = {};
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        if (!productSalesMap[item.id]) {
          productSalesMap[item.id] = {
            title: item.title,
            qty: 0,
            revenue: 0,
            image: item.images?.[0] || cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/favicon.png')
          };
        }
        productSalesMap[item.id].qty += (item.quantity || 0);
        let priceNum = 0;
        if (typeof item.price === 'string') {
          priceNum = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        } else {
          priceNum = parseFloat(item.price) || 0;
        }
        productSalesMap[item.id].revenue += priceNum * (item.quantity || 0);
      });
    }
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Promo Codes Usage
  const promoMap = {};
  orders.forEach(order => {
    if (order.appliedPromo) {
      const code = order.appliedPromo.toUpperCase();
      if (!promoMap[code]) {
        promoMap[code] = {
          code: code,
          count: 0,
          discountTotal: 0
        };
      }
      promoMap[code].count += 1;
      promoMap[code].discountTotal += (order.discount || 0);
    }
  });
  const promoStats = Object.values(promoMap).sort((a, b) => b.count - a.count).slice(0, 5);


  // Shipment Milestone breakdown
  const statusCounts = {
    'Order Received': 0,
    'Manifested & Picked Up': 0,
    'In Transit': 0,
    'Out for Delivery': 0,
    'Delivered': 0
  };
  orders.forEach(order => {
    if (statusCounts[order.status] !== undefined) {
      statusCounts[order.status] += 1;
    } else {
      statusCounts['Order Received'] += 1;
    }
  });

  // Sales Timeline Chart parsing (last 7 days)
  const salesByDate = {};
  orders.forEach(order => {
    let dateStr = 'Today';
    if (order.timestamp) {
      try {
        const d = new Date(order.timestamp);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        } else {
          dateStr = order.timestamp.split(',')[0];
        }
      } catch (e) {
        dateStr = 'Today';
      }
    }
    salesByDate[dateStr] = (salesByDate[dateStr] || 0) + (order.total || 0);
  });

  const timelineData = Object.entries(salesByDate).slice(0, 7).reverse();
  const displayTimeline = timelineData;
  
  const maxSaleValue = displayTimeline.length > 0 ? Math.max(...displayTimeline.map(item => item[1]), 1000) : 1000;

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontFamily: 'Montserrat, sans-serif', 
        textTransform: 'uppercase', 
        letterSpacing: '2px', 
        fontSize: '0.9rem',
        gap: '1.5rem',
        color: 'var(--text-primary)'
      }}>
        <h2 style={{ fontWeight: 900 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', textTransform: 'none' }}>
          This administrative panel is restricted to authorized credentials only.
        </p>
        <a href="/" className="btn btn--primary" style={{ padding: '0.8rem 1.5rem' }}>Return to Storefront</a>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-loading">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>HELLABOLD Administrative Panel</h1>
        <a href="/" className="btn btn--outline">View Storefront</a>
      </div>

      <div className="admin-tabs-nav" style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          className={`admin-tab-btn ${activeAdminTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('dashboard')}
          style={{ paddingBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: activeAdminTab === 'dashboard' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeAdminTab === 'dashboard' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Dashboard
        </button>
        <button 
          className={`admin-tab-btn ${activeAdminTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('products')}
          style={{ paddingBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: activeAdminTab === 'products' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeAdminTab === 'products' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Manage Products
        </button>
        <button 
          className={`admin-tab-btn ${activeAdminTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('reviews')}
          style={{ paddingBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: activeAdminTab === 'reviews' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeAdminTab === 'reviews' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Manage Reviews
        </button>
        <button 
          className={`admin-tab-btn ${activeAdminTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('orders')}
          style={{ paddingBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: activeAdminTab === 'orders' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeAdminTab === 'orders' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Manage Shipments
        </button>
        <button 
          className={`admin-tab-btn ${activeAdminTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('coupons')}
          style={{ paddingBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: activeAdminTab === 'coupons' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeAdminTab === 'coupons' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Manage Coupons
        </button>
        <button 
          className={`admin-tab-btn ${activeAdminTab === 'hellamoney' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('hellamoney')}
          style={{ paddingBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: activeAdminTab === 'hellamoney' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeAdminTab === 'hellamoney' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Hella Money Ledger
        </button>
        <button 
          className={`admin-tab-btn ${activeAdminTab === 'charity' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('charity')}
          style={{ paddingBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: activeAdminTab === 'charity' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeAdminTab === 'charity' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Manage Charity
        </button>
        <button 
          className={`admin-tab-btn ${activeAdminTab === 'meta' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('meta')}
          style={{ paddingBottom: '1rem', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: activeAdminTab === 'meta' ? '2px solid var(--accent-color)' : '2px solid transparent', color: activeAdminTab === 'meta' ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Meta Metrics
        </button>
      </div>

      {activeAdminTab === 'dashboard' && (
        <div className="admin-dashboard">
          <div className="dashboard-kpi-grid">
            <div className="kpi-card">
              <span className="kpi-card__title">Total Revenue</span>
              <span className="kpi-card__value">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(totalSales)}
              </span>
              <span className="kpi-card__indicator">Live checkout receipts</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-card__title">Total Orders</span>
              <span className="kpi-card__value">{totalOrders}</span>
              <span className="kpi-card__indicator">Completed transactions</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-card__title">Average Order Value</span>
              <span className="kpi-card__value">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(aov)}
              </span>
              <span className="kpi-card__indicator">Basket size average</span>
            </div>

            <div className="kpi-card animate-pulse-kpi">
              <span className="kpi-card__title">Active Shipments</span>
              <span className="kpi-card__value">{activeShipments}</span>
              <span className="kpi-card__indicator">In Shiprocket pipeline</span>
            </div>
          </div>

          <div className="dashboard-charts-grid">
            <div className="admin-card chart-card">
              <h3>Sales Timeline (INR)</h3>
              <div className="sales-chart-wrapper">
                {displayTimeline.length === 0 ? (
                  <p className="empty-message" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-secondary)', margin: 0 }}>
                    No sales recorded yet.
                  </p>
                ) : (
                  <svg viewBox="0 0 500 220" className="sales-svg-chart">
                    <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
                    <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
                    <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
                    <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />

                    {displayTimeline.map((item, idx) => {
                      const x = 60 + idx * 60;
                      const height = (item[1] / maxSaleValue) * 130;
                      const y = 170 - height;
                      return (
                        <g key={idx} className="chart-bar-group">
                          <rect x={x} y={y} width="24" height={height} fill="var(--accent-color)" rx="2" />
                          <text x={x + 12} y="192" textAnchor="middle" className="chart-label-text">{item[0]}</text>
                          <text x={x + 12} y={y - 8} textAnchor="middle" className="chart-val-text">{new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(item[1])}</text>
                        </g>
                      );
                    })}
                    <line x1="40" y1="170" x2="480" y2="170" stroke="var(--accent-color)" strokeWidth="1.5" />
                  </svg>
                )}
              </div>
            </div>

            <div className="admin-card chart-card">
              <h3>Shipment Status Split</h3>
              <div className="status-progress-wrapper">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                  return (
                    <div key={status} className="status-row">
                      <div className="status-meta">
                        <span className="status-name">{status}</span>
                        <span className="status-count">{count} order{count !== 1 ? 's' : ''} ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="status-bar-bg">
                        <div 
                          className="status-bar-fill" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: status === 'Delivered' ? '#2e7d32' : 
                                             status === 'Out for Delivery' ? '#1565c0' :
                                             status === 'In Transit' ? '#f57c00' :
                                             status === 'Manifested & Picked Up' ? '#6a1b9a' : '#d84315'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="dashboard-details-grid">
            <div className="admin-card table-card">
              <h3>Top Selling Products</h3>
              <div className="table-wrapper">
                {bestSellers.length === 0 ? <p className="empty-message">No items sold yet.</p> : (
                  <table className="dashboard-table">
                    <thead>
                      <tr><th>Product</th><th style={{ textAlign: 'center' }}>Qty Sold</th><th style={{ textAlign: 'right' }}>Revenue</th></tr>
                    </thead>
                    <tbody>
                      {bestSellers.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <img src={item.image} alt={item.title} className="table-product-img" />
                            <span className="table-product-title">{item.title}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="admin-card table-card">
              <h3>Promo Code Redeeming</h3>
              <div className="table-wrapper">
                {promoStats.length === 0 ? <p className="empty-message">No promo codes used yet.</p> : (
                  <table className="dashboard-table">
                    <thead>
                      <tr><th>Promo Code</th><th style={{ textAlign: 'center' }}>Uses</th><th style={{ textAlign: 'right' }}>Total Discount</th></tr>
                    </thead>
                    <tbody>
                      {promoStats.map((promo, idx) => (
                        <tr key={idx}>
                          <td><span className="table-promo-badge">{promo.code}</span></td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{promo.count}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600', color: '#e53e3e' }}>-{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(promo.discountTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Product SKU Directory */}
          <div className="admin-card table-card" style={{ marginTop: '2rem' }}>
            <h3>Product SKU & Variant Directory</h3>
            <p className="kpi-card__indicator" style={{ marginBottom: '1.5rem', textTransform: 'none' }}>Auto-generated SKUs used for Shiprocket shipping integrations</p>
            <div className="table-wrapper">
              {products.length === 0 ? <p className="empty-message">No products in catalog.</p> : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Size Variant</th>
                      <th>SKU Code</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.flatMap(p => {
                      const sizesList = p.sizes && p.sizes.length > 0 ? p.sizes : ['One Size'];
                      return sizesList.map(size => {
                        const customSku = p.skus?.[size];
                        const skuCode = customSku || `HB-${p.id}-${size}`;
                        return (
                          <tr key={`${p.id}-${size}`}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <img src={p.images?.[0] || cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/favicon.png')} alt={p.title} className="table-product-img" />
                              <span className="table-product-title">{p.title}</span>
                            </td>
                            <td>{p.category}</td>
                            <td><span className="table-promo-badge" style={{ backgroundColor: '#f1f1f1', color: '#111' }}>{size}</span></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <code style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.5px', color: customSku ? 'var(--accent-color)' : 'inherit' }}>{skuCode}</code>
                                <button 
                                  type="button" 
                                  onClick={() => handleEditSku(p, size, skuCode)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center', opacity: 0.6 }}
                                  title="Edit SKU Code"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '600' }}>{p.price}</td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {activeAdminTab === 'products' && (
        <div className="admin-grid">
          <div className="admin-card admin-form-card">
            <h2>{isEditing ? 'Edit Product Details' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Product Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Price * (e.g. ₹699)</label>
                <input type="text" value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
 
              <div className="form-group">
                <label>Original Price (Strikethrough - Optional, e.g. ₹1499)</label>
                <input type="text" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="form-select" style={{ padding: '0.8rem 1rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.95rem' }} required>
                  <option value="Tops">Tops</option>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status Label</label>
                <select value={label} onChange={e => setLabel(e.target.value)} className="form-select" style={{ padding: '0.8rem 1rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.95rem' }}>
                  <option value="">None (Standard)</option>
                  <option value="selling-fast">Selling Fast</option>
                  <option value="few-left">Few Left</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Details & Fit (one bullet point per line)</label>
                <textarea rows="4" value={details} onChange={e => setDetails(e.target.value)} placeholder="e.g. 100% full-grain calf leather&#10;Made in Italy" />
              </div>

              <div className="form-group">
                <label>Available Sizes</label>
                <div className="admin-size-chips">
                  {commonSizes.map(size => (
                    <button
                      type="button"
                      key={size}
                      className={`admin-size-chip-btn ${sizes.includes(size) ? 'active' : ''}`}
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Select Images for Product ({selectedImages.length} selected)</label>
                <div className="admin-image-picker">
                  {images.map(img => {
                    const imgUrl = (img.startsWith('http') || img.startsWith('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/')) ? cloudinaryOptimize(img) : cloudinaryOptimize(`https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/${img}`);
                    const isSelected = selectedImages.includes(imgUrl);
                    return (
                      <div 
                        key={img} 
                        className={`admin-picker-img-wrapper ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleImageSelect(imgUrl)}
                      >
                        <img src={imgUrl} alt={img} className="admin-picker-img" />
                        <div className="admin-picker-checkbox">
                          {isSelected ? '✓' : ''}
                        </div>
                        <button
                          type="button"
                          className="admin-picker-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this image? This will also remove it from Cloudinary.')) {
                              handleDeleteImage(imgUrl);
                            }
                          }}
                          title="Delete Image"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '6px', backgroundColor: '#fafafa', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="enable-color-variants"
                    checked={hasColors} 
                    onChange={e => setHasColors(e.target.checked)} 
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                  />
                  <label htmlFor="enable-color-variants" style={{ cursor: 'pointer', marginBottom: 0, fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enable Color Variants</label>
                </div>

                {hasColors && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <input 
                        type="text" 
                        placeholder="Add Color (e.g. Black, White)" 
                        value={newColorInput} 
                        onChange={e => setNewColorInput(e.target.value)}
                        style={{ flex: 1, padding: '0.8rem 1rem', border: '1px solid var(--border-color)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.95rem' }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newColorInput.trim()) {
                              const newColor = newColorInput.trim();
                              if (!colors.includes(newColor)) {
                                setColors([...colors, newColor]);
                              }
                              setNewColorInput('');
                            }
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn btn--outline" 
                        onClick={() => {
                          if (newColorInput.trim()) {
                            const newColor = newColorInput.trim();
                            if (!colors.includes(newColor)) {
                              setColors([...colors, newColor]);
                            }
                            setNewColorInput('');
                          }
                        }}
                        style={{ padding: '0.8rem 1.5rem' }}
                      >
                        Add
                      </button>
                    </div>

                    {colors.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>No colors added yet. Type a color name above and click Add.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {colors.map(color => (
                          <div key={color} style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '1rem', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid #ccc', backgroundColor: color.toLowerCase() === 'white' ? '#fff' : color.toLowerCase() === 'black' ? '#000' : '#888' }} />
                                {color}
                              </span>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                onClick={() => {
                                  setColors(colors.filter(c => c !== color));
                                  const updatedMap = { ...colorImages };
                                  delete updatedMap[color];
                                  setColorImages(updatedMap);
                                }}
                              >
                                Remove
                              </button>
                            </div>

                            {selectedImages.length === 0 ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Please select/upload images for the product first above.</p>
                            ) : (
                              <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Select images for this variant:</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  {selectedImages.map(imgUrl => {
                                    const mappedList = colorImages[color] || [];
                                    const isMapped = mappedList.includes(imgUrl);
                                    return (
                                      <div 
                                        key={imgUrl} 
                                        onClick={() => {
                                          const currentList = colorImages[color] || [];
                                          const newList = currentList.includes(imgUrl) 
                                            ? currentList.filter(url => url !== imgUrl) 
                                            : [...currentList, imgUrl];
                                          setColorImages({
                                            ...colorImages,
                                            [color]: newList
                                          });
                                        }}
                                        style={{ 
                                          position: 'relative', 
                                          width: '60px', 
                                          height: '60px', 
                                          cursor: 'pointer', 
                                          border: isMapped ? '2.5px solid var(--accent-color)' : '1px solid var(--border-color)', 
                                          borderRadius: '4px',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        <img src={imgUrl} alt={color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', top: '2px', right: '2px', background: isMapped ? 'var(--accent-color)' : 'transparent', color: '#fff', borderRadius: '50%', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
                                          {isMapped ? '✓' : ''}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Upload New Asset to Cloudinary</label>
                <div className="admin-upload-zone">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    id="file-upload" 
                    disabled={uploading} 
                  />
                  <label htmlFor="file-upload" className="admin-upload-label">
                    {uploading ? 'Uploading asset...' : 'Choose image to upload'}
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  {isEditing ? 'Save Changes' : 'Publish Product'}
                </button>
                {isEditing && (
                  <button type="button" className="btn btn--outline" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-card admin-catalog-card">
            <h2>Product Catalog ({products.length})</h2>
            <div className="admin-catalog-list">
              {products.map(product => (
                <div key={product.id} className="admin-catalog-item">
                  <img 
                    src={cloudinaryOptimize(product.images?.[0]) || cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/favicon.png')} 
                    alt={product.title} 
                    className="admin-catalog-img" 
                  />
                  <div className="admin-catalog-info">
                    <h3>{product.title}</h3>
                    <p>
                      {product.price}
                      {product.original_price && (
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                          {product.original_price}
                        </span>
                      )}
                      {` — `}
                      <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {product.category || 'Outerwear'}
                      </span>
                    </p>
                    <span className="admin-catalog-sizes">
                      {product.sizes?.join(', ') || 'No sizes'}
                    </span>
                  </div>
                  <div className="admin-catalog-actions">
                    <button className="admin-icon-btn edit" onClick={() => handleEdit(product)} title="Edit">
                      Edit
                    </button>
                    <button className="admin-icon-btn delete" onClick={() => handleDelete(product.id)} title="Delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'reviews' && (
        <div className="admin-grid">
          <div className="admin-card admin-form-card">
            <h2>Add Customer Feedback</h2>
            <form onSubmit={handleReviewSubmit} className="admin-form">
              <div className="form-group">
                <label>Select Product *</label>
                <select 
                  value={reviewProductId} 
                  onChange={e => setReviewProductId(e.target.value)} 
                  className="form-select"
                  style={{ padding: '0.8rem 1rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.95rem' }} 
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reviewer Name *</label>
                <input 
                  type="text" 
                  value={reviewAuthor} 
                  onChange={e => setReviewAuthor(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Star Rating *</label>
                <select 
                  value={reviewRating} 
                  onChange={e => setReviewRating(e.target.value)} 
                  className="form-select"
                  style={{ padding: '0.8rem 1rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.95rem' }} 
                  required
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="verified-review"
                  checked={reviewVerified} 
                  onChange={e => setReviewVerified(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
                />
                <label htmlFor="verified-review" style={{ cursor: 'pointer', marginBottom: 0 }}>Verified Purchaser</label>
              </div>

              <div className="form-group">
                <label>Review Comment *</label>
                <textarea 
                  rows="4" 
                  value={reviewComment} 
                  onChange={e => setReviewComment(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Direct Image URL (Cloudinary Link)</label>
                <input 
                  type="text" 
                  value={reviewSelectedImage} 
                  onChange={e => setReviewSelectedImage(e.target.value)} 
                  placeholder="https://res.cloudinary.com/..." 
                />
              </div>

              <div className="form-group">
                <label>Or Select Review Image from Uploads</label>
                <div className="admin-image-picker" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.8rem' }}>
                  {feedbackImages.map(img => {
                    const rawImgUrl = (img.startsWith('http') || img.startsWith('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/')) ? img : `https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/feedback_images/${img}`;
                    const isSelected = reviewSelectedImage === rawImgUrl;
                    return (
                      <div 
                        key={img} 
                        className={`admin-picker-img-wrapper ${isSelected ? 'selected' : ''}`}
                        onClick={() => setReviewSelectedImage(isSelected ? '' : rawImgUrl)}
                        style={{ position: 'relative', aspectRatio: '1', cursor: 'pointer', border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', outline: 'none', transition: 'border-color var(--transition-fast)' }}
                      >
                        <img src={cloudinaryOptimize(rawImgUrl)} alt={img} className="admin-picker-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="admin-picker-checkbox" style={{ position: 'absolute', top: '4px', right: '4px', background: isSelected ? 'var(--accent-color)' : 'transparent', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
                Publish Review
              </button>
            </form>
          </div>

          <div className="admin-card admin-catalog-card">
            <h2>Existing Feedback ({reviews.length})</h2>
            <div className="admin-catalog-list">
              {reviews.map(review => {
                const product = products.find(p => p.id === review.productId);
                return (
                  <div key={review.id} className="admin-catalog-item" style={{ alignItems: 'flex-start' }}>
                    {review.images?.[0] && (
                      <img 
                        src={review.images[0]} 
                        alt="Review upload" 
                        className="admin-catalog-img" 
                      />
                    )}
                    <div className="admin-catalog-info" style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{review.author}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Product: <strong>{product?.title || `ID: ${review.productId}`}</strong>
                      </p>
                      <p style={{ margin: '0.4rem 0', fontSize: '0.85rem' }}>{review.comment}</p>
                      <span className="admin-catalog-sizes" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} — {review.date}
                      </span>
                    </div>
                    <div className="admin-catalog-actions">
                      <button 
                        className="admin-icon-btn delete" 
                        onClick={() => handleReviewDelete(review.id)} 
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'orders' && (
        <div className="admin-orders-tab" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="admin-card" style={{ padding: '2.5rem', backgroundColor: 'var(--white)', border: '1px solid var(--border-color)' }}>
            <h2>Active Logistics & Shipments ({orders.length})</h2>
            <div className="admin-orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {orders.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>No orders placed yet.</p>
              ) : (
                orders.map(order => {
                  const customer = order.shippingDetails || {};
                  return (
                    <div key={order.id} className="admin-order-item-row" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', border: '1px solid var(--border-color)', backgroundColor: '#fafafa', borderRadius: '6px' }}>
                      {/* Top Header Row of the Order */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Order ID: {order.id}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            AWB: <strong>{order.awb || '—'}</strong>{order.courier ? ` (${order.courier})` : ''}
                          </span>
                          {order.shiprocketOrderId && (
                            <span style={{ fontSize: '0.75rem', color: '#6b46c1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              🚀 Shiprocket ID: <strong>{order.shiprocketOrderId}</strong>
                              {order.shiprocketSynced
                                ? <span style={{ color: '#38a169', fontWeight: 700 }}>✓ Synced</span>
                                : <span style={{ color: '#e53e3e', fontWeight: 700 }}>⚠ Pending</span>
                              }
                            </span>
                          )}
                          {order.shiprocketSynced === false && !order.shiprocketOrderId && (
                            <span style={{ fontSize: '0.75rem', color: '#e53e3e', fontWeight: 600 }}>⚠ Not yet synced to Shiprocket</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Total Paid</span>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-color)' }}>
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(order.total)}
                            </strong>
                          </div>
                          {/* Shiprocket re-sync button for failed/unsynced orders */}
                          {(order.shiprocketSynced === false || (!order.awb || order.awb?.startsWith?.('SR-'))) && (
                            <button
                              type="button"
                              className="btn btn--primary"
                              onClick={() => handleResyncToShiprocket(order)}
                              disabled={order._resyncing}
                              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', opacity: order._resyncing ? 0.6 : 1 }}
                            >
                              {order._resyncing ? '⏳ Syncing...' : '🚀 Sync to Shiprocket'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Columns: Left (Items & Placements) | Right (Customer Details) */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                        
                        {/* Column 1: Items List (2/3 width on large screens) */}
                        <div style={{ flex: '2 1 450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {order.items?.map((item, idx) => {
                            const isCustom = item.customDesignLocalUrl || item.customDesignBackLocalUrl || item.customDesign || item.customDesignBack || item.frontImage || item.backImage;
                            return (
                              <div key={idx} style={{ padding: '1rem 1.2rem', backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.4rem' }}>
                                  <span>{item.title}</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>Size {item.size} × {item.quantity}</span>
                                </div>
                                
                                {isCustom && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                      <span style={{ backgroundColor: 'rgba(56, 161, 105, 0.1)', color: '#38a169', padding: '0.25rem 0.5rem', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.5px' }}>CUSTOM DESIGNED</span>
                                      {(item.customDesignLocalUrl || item.customDesign || item.frontImage) && (
                                        <a href={item.customDesignLocalUrl || item.customDesign || item.frontImage} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--accent-color)', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>👁 View Front Artwork</a>
                                      )}
                                      {(item.customDesignBackLocalUrl || item.customDesignBack || item.backImage) && (
                                        <a href={item.customDesignBackLocalUrl || item.customDesignBack || item.backImage} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--accent-color)', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>👁 View Back Artwork</a>
                                      )}
                                    </div>

                                    {/* Placements Details Table */}
                                    {item.customMeta?.placement && (
                                      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', marginTop: '0.2rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', minWidth: '350px' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: '#fcfcfc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                              <th style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>Side</th>
                                              <th style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>Scale</th>
                                              <th style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>X Pos</th>
                                              <th style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>Y Pos</th>
                                              <th style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>Rotation</th>
                                              <th style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>Opacity</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(item.customDesignLocalUrl || item.customDesign || item.frontImage) && item.customMeta.placement.front && (
                                              <tr style={{ borderBottom: '1px solid #f2f2f2' }}>
                                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 700 }}>Front</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.front.scale}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.front.x}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.front.y}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.front.rotation}°</td>
                                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>{item.customMeta.placement.front.opacity ?? 100}%</td>
                                              </tr>
                                            )}
                                            {(item.customDesignBackLocalUrl || item.customDesignBack || item.backImage) && item.customMeta.placement.back && (
                                              <tr>
                                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 700 }}>Back</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.back.scale}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.back.x}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.back.y}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.back.rotation}°</td>
                                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>{item.customMeta.placement.back.opacity ?? 100}%</td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}

                                    {/* Printing Instructions Box */}
                                    {item.customMeta?.instructions && (
                                      <div style={{ backgroundColor: 'rgba(255, 69, 0, 0.04)', borderLeft: '3.5px solid var(--accent-red)', padding: '0.6rem 0.8rem', fontSize: '0.8rem', borderRadius: '0 4px 4px 0' }}>
                                        <strong style={{ color: 'var(--accent-red)', display: 'block', marginBottom: '0.15rem', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>Print Instructions:</strong>
                                        <span style={{ fontStyle: 'italic', color: 'var(--text-primary)', fontWeight: 500 }}>"{item.customMeta.instructions}"</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Column 2: Customer Shipping Profile (1/3 width) */}
                        <div style={{ flex: '1 1 280px', padding: '1rem 1.2rem', backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', color: 'var(--text-primary)' }}>Customer Profile</h4>
                          <div style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.4rem 0.5rem', lineHeight: '1.4' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Name:</strong>
                            <span style={{ fontWeight: 600 }}>{customer.name || '—'}</span>
                            <strong style={{ color: 'var(--text-secondary)' }}>Email:</strong>
                            <span style={{ wordBreak: 'break-all' }}>{customer.email || '—'}</span>
                            <strong style={{ color: 'var(--text-secondary)' }}>Phone:</strong>
                            <span>{customer.phone || '—'}</span>
                            <strong style={{ color: 'var(--text-secondary)' }}>Address:</strong>
                            <span>{customer.address || '—'}</span>
                            <strong style={{ color: 'var(--text-secondary)' }}>City/State:</strong>
                            <span>{customer.city ? `${customer.city}, ${customer.state || ''}` : '—'}</span>
                            <strong style={{ color: 'var(--text-secondary)' }}>PIN Code:</strong>
                            <span>
                              <span style={{ fontWeight: 600 }}>{customer.zipCode || '—'}</span>
                              {customer.zipCode && <PincodeResolver pin={customer.zipCode} />}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Bottom Order Status Switcher */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Status: <strong style={{ color: 'var(--text-primary)' }}>{order.status}</strong>
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                          {['Order Received', 'Manifested & Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].map(status => (
                            <button
                              key={status}
                              type="button"
                              className="btn btn--outline"
                              onClick={() => updateOrderStatus(order.id, status)}
                              style={{
                                padding: '0.35rem 0.7rem',
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                backgroundColor: order.status === status ? 'var(--accent-color)' : 'transparent',
                                color: order.status === status ? 'var(--white)' : 'var(--text-primary)',
                                borderColor: order.status === status ? 'var(--accent-color)' : 'var(--border-color)'
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'coupons' && (
        <div className="admin-coupons-tab">
          <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Create Coupon Card */}
            <div className="admin-card form-card">
              <h3>Create Discount Coupon</h3>
              <form onSubmit={handleSaveCoupon} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group">
                  <label htmlFor="couponCode">Coupon Code</label>
                  <input
                    id="couponCode"
                    type="text"
                    placeholder="e.g. SUMMER20"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    required
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                
                <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="couponType">Discount Type</label>
                    <select
                      id="couponType"
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value)}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="couponValue">Value</label>
                    <input
                      id="couponValue"
                      type="number"
                      placeholder="e.g. 15 or 150"
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(e.target.value)}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="couponMinOrder">Min Order Requirement (₹)</label>
                    <input
                      id="couponMinOrder"
                      type="number"
                      placeholder="e.g. 500"
                      value={newCouponMinOrder}
                      onChange={(e) => setNewCouponMinOrder(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="couponExpiry">Expiry Date (Optional)</label>
                    <input
                      id="couponExpiry"
                      type="date"
                      value={newCouponExpiry}
                      onChange={(e) => setNewCouponExpiry(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>Create Coupon</button>
              </form>
            </div>

            {/* Coupons Directory List */}
            <div className="admin-card table-card">
              <h3>Active Coupons Directory</h3>
              <div className="table-wrapper">
                {couponsList.length === 0 ? (
                  <p className="empty-message">No coupons found.</p>
                ) : (
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Benefit</th>
                        <th>Min Order</th>
                        <th>Expires</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {couponsList.map((coupon) => (
                        <tr key={coupon.code}>
                          <td>
                            <span className="table-promo-badge" style={{ fontSize: '0.85rem' }}>{coupon.code}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                          </td>
                          <td>₹{coupon.minOrder || 0}</td>
                          <td>{coupon.expiry ? new Date(coupon.expiry).toLocaleDateString() : 'Never'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn--outline"
                              onClick={() => handleToggleCoupon(coupon)}
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                backgroundColor: coupon.active ? '#38a169' : 'transparent',
                                color: coupon.active ? '#fff' : '#e53e3e',
                                borderColor: coupon.active ? '#38a169' : '#e53e3e'
                              }}
                            >
                              {coupon.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn--outline"
                              onClick={() => handleDeleteCoupon(coupon.code)}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#e53e3e', borderColor: '#e53e3e' }}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'hellamoney' && (
        <div className="admin-hellamoney-tab" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Payout Requests Card */}
          <div className="admin-card table-card">
            <h2>Pending UPI Payout Requests</h2>
            <div className="table-wrapper">
              {payoutRequests.length === 0 ? (
                <p className="empty-message">No payout requests found.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Creator</th>
                      <th>UPI ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutRequests.map((req) => (
                      <tr key={req.id}>
                        <td><code>#{req.id.slice(-6)}</code></td>
                        <td style={{ fontWeight: 'bold' }}>@{req.creator}</td>
                        <td><code>{req.upiId}</code></td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>₹{req.amount} ({req.amount} HM)</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            borderRadius: '2px',
                            backgroundColor: req.status === 'Settled' ? '#e8f5e9' : '#fff3e0',
                            color: req.status === 'Settled' ? '#2e7d32' : '#e65100',
                          }}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {req.status === 'Pending' ? (
                            <button
                              type="button"
                              className="btn btn--primary"
                              onClick={() => handleSettlePayout(req.id)}
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                            >
                              Settle UPI Payout
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Paid & Cleared</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Royalty Earnings Ledger Card */}
          <div className="admin-card table-card">
            <h2>Hella Money Royalty Ledger</h2>
            <div className="table-wrapper">
              {hmLedger.length === 0 ? (
                <p className="empty-message">No royalty earnings ledger entries found.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Order ID</th>
                      <th>Item Title</th>
                      <th>Item Retail Price</th>
                      <th>Design Creator</th>
                      <th style={{ textAlign: 'right' }}>Royalty Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hmLedger.map((tx) => {
                      const isRedemption = tx.amount < 0;
                      return (
                        <tr key={tx.id}>
                          <td><code>#{tx.id.slice(-6)}</code></td>
                          <td><code>#{tx.orderId.slice(0, 8)}</code></td>
                          <td>{tx.itemTitle}</td>
                          <td>{tx.price}</td>
                          <td style={{ fontWeight: 'bold' }}>@{tx.creator}</td>
                          <td style={{ textAlign: 'right', color: isRedemption ? '#e53e3e' : '#38a169', fontFamily: 'monospace', fontWeight: 600 }}>
                            {isRedemption ? `${tx.amount} HM (₹${Math.abs(tx.amount)})` : `+${tx.amount} HM (₹${tx.amount})`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {activeAdminTab === 'charity' && (
        <div className="admin-charity-tab" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="admin-card form-card">
            <h2 className="admin-card-title">{editingReceiptId ? 'Edit Donation Receipt' : 'Add Donation Receipt'}</h2>
            <form onSubmit={handleSaveCharityReceipt} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Receipt Image URL (Cloudinary Link)</label>
                <input 
                  type="text" 
                  value={charityImageUrl} 
                  onChange={e => setCharityImageUrl(e.target.value)} 
                  placeholder="https://res.cloudinary.com/..." 
                  required
                />
              </div>

              <div className="form-group">
                <label>NGO Partner Name</label>
                <input 
                  type="text" 
                  value={charityNgo} 
                  onChange={e => setCharityNgo(e.target.value)} 
                  placeholder="e.g. Annamrita Foundation" 
                  required
                />
              </div>

              <div className="form-group">
                <label>Receipt / Transaction No.</label>
                <input 
                  type="text" 
                  value={charityReceiptNo} 
                  onChange={e => setCharityReceiptNo(e.target.value)} 
                  placeholder="e.g. PVT-IN-LC208391cc99c66" 
                  required
                />
              </div>

              <div className="form-group">
                <label>Donation Date</label>
                <input 
                  type="text" 
                  value={charityDate} 
                  onChange={e => setCharityDate(e.target.value)} 
                  placeholder="e.g. 11-06-2026" 
                  required
                />
              </div>

              <div className="form-group">
                <label>Donation Amount (INR)</label>
                <input 
                  type="number" 
                  value={charityAmount} 
                  onChange={e => setCharityAmount(e.target.value)} 
                  placeholder="e.g. 500" 
                  required
                />
              </div>

              <div className="form-group">
                <label>Display Order (Priority)</label>
                <input 
                  type="number" 
                  value={charityDisplayOrder} 
                  onChange={e => setCharityDisplayOrder(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Description / Fundraiser Details</label>
                <input 
                  type="text" 
                  value={charityDescription} 
                  onChange={e => setCharityDescription(e.target.value)} 
                  placeholder="e.g. Give a million meals to India's hungry" 
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn--primary">
                  {editingReceiptId ? 'Update Receipt' : 'Save Receipt'}
                </button>
                {editingReceiptId && (
                  <button 
                    type="button" 
                    className="btn btn--outline" 
                    onClick={() => {
                      setEditingReceiptId(null);
                      setCharityImageUrl('');
                      setCharityDescription('');
                      setCharityReceiptNo('');
                      setCharityDate('');
                      setCharityAmount('');
                      setCharityNgo('');
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-card table-card">
            <h2 className="admin-card-title">Verified Donation Receipts</h2>
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>NGO</th>
                    <th>Receipt No.</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charityReceipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td><code>#{receipt.displayOrder}</code></td>
                      <td>{receipt.date}</td>
                      <td>
                        <strong style={{ display: 'block' }}>{receipt.ngo}</strong>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{receipt.description}</span>
                      </td>
                      <td><code>{receipt.receiptNo}</code></td>
                      <td style={{ fontWeight: 'bold' }}>₹{receipt.amount}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button 
                            className="btn btn--outline" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                            onClick={() => handleEditReceipt(receipt)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn--outline" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: '#e53e3e', borderColor: '#feb2b2' }}
                            onClick={() => handleDeleteReceipt(receipt.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeAdminTab === 'meta' && (
        <div className="admin-meta-metrics" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'var(--font-body)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900, fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>Meta Pixel Metrics</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                Real-time event counts directly from Meta Dataset Graph API
              </p>
            </div>
            <button 
              className="btn btn--primary" 
              onClick={fetchMetaStats} 
              disabled={metaLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '0.85rem' }}
            >
              {metaLoading ? 'Loading...' : 'Refresh Metrics'}
            </button>
          </div>

          {metaError ? (
            <div style={{ padding: '2rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '4px', color: '#c53030' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Failed to retrieve data</h4>
              <p>{metaError}</p>
            </div>
          ) : metaLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Querying Meta events database...</p>
            </div>
          ) : (
            <>
              {/* Dataset Info Header */}
              <div style={{ background: '#fafafa', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', display: 'block' }}>Dataset Name</span>
                  <strong style={{ fontSize: '1.1rem', marginTop: '0.2rem', display: 'block' }}>HELLABOLD Pixel</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', display: 'block' }}>Dataset ID</span>
                  <strong style={{ fontSize: '1.1rem', marginTop: '0.2rem', display: 'block', fontFamily: 'monospace' }}>{metaPixelId || '2310361926167392'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', display: 'block' }}>Connection Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#48bb78', display: 'inline-block' }} />
                    <span style={{ fontWeight: 'bold', color: '#48bb78', fontSize: '0.9rem' }}>Active</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {metaStatsList.length > 0 ? (
                  metaStatsList.map((stat, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '1.8rem', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.event}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                        <span style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1 }}>{stat.value}</span>
                        <span style={{ fontSize: '0.75rem', color: '#48bb78', fontWeight: 600 }}>Matched</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: '#fafafa', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No active conversion event stats found for this pixel yet.</p>
                  </div>
                )}
              </div>

              {/* Conversion rates meter */}
              {metaStatsList.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '2rem', borderRadius: '4px' }}>
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Funnels & Event Ratios</h3>
                  
                  {(() => {
                    const getVal = (name) => {
                      const found = metaStatsList.find(s => s.event.toLowerCase() === name.toLowerCase());
                      return found ? found.value : 0;
                    };

                    const views = getVal('ViewContent') || getVal('View content') || 0;
                    const carts = getVal('AddToCart') || getVal('Add to cart') || 0;
                    const buys = getVal('Purchase') || 0;

                    const cartToView = views > 0 ? ((carts / views) * 100).toFixed(1) : '0.0';
                    const purchaseToCart = carts > 0 ? ((buys / carts) * 100).toFixed(1) : '0.0';

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600 }}>View Content to Add-to-Cart Ratio</span>
                            <span style={{ fontWeight: 'bold' }}>{cartToView}% ({carts} / {views})</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, parseFloat(cartToView))}%`, height: '100%', background: '#4a5568', borderRadius: '4px' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600 }}>Cart to Purchase Conversion</span>
                            <span style={{ fontWeight: 'bold' }}>{purchaseToCart}% ({buys} / {carts})</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, parseFloat(purchaseToCart))}%`, height: '100%', background: '#ff3c3c', borderRadius: '4px' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

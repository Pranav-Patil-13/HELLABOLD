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
  updateOrderStatusInDB 
} from '../utils/supabase';
import { createShiprocketOrder } from '../utils/shiprocket';

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
  const [category, setCategory] = useState('Outerwear');
  const [label, setLabel] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Tab Selection
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);

  // Reviews Form Fields
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewVerified, setReviewVerified] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSelectedImage, setReviewSelectedImage] = useState('');

  const [feedbackImages, setFeedbackImages] = useState([]);

  // Load products, images, and orders on mount
  useEffect(() => {
    fetchProducts();
    fetchImages();
    fetchFeedbackImages();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (activeAdminTab === 'orders' || activeAdminTab === 'dashboard') {
      fetchOrders();
    }
  }, [activeAdminTab]);

  const fetchOrders = async () => {
    try {
      const dbOrders = await getAllOrdersForAdmin();
      setOrders(dbOrders);
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
      label
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
    setSelectedImages(product.images || []);
    setCategory(product.category || 'Outerwear');
    setLabel(product.label || '');
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
            image: item.images?.[0] || 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/favicon.png'
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
  const displayTimeline = timelineData.length > 0 ? timelineData : [
    ['Mon', 12000],
    ['Tue', 18500],
    ['Wed', 9000],
    ['Thu', 24000],
    ['Fri', 31000],
    ['Sat', 15000],
    ['Sun', 42000]
  ];
  
  const maxSaleValue = Math.max(...displayTimeline.map(item => item[1]), 1000);

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
                  <option value="Outerwear">Outerwear</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Tops">Tops</option>
                  <option value="Bottoms">Bottoms</option>
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
                    const imgUrl = (img.startsWith('http') || img.startsWith('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/')) ? img : `https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/${img}`;
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
                    src={product.images?.[0] || 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/favicon.png'} 
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
                <label>Select Review Image (Optional)</label>
                <div className="admin-image-picker" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '0.8rem' }}>
                  {feedbackImages.map(img => {
                    const imgUrl = (img.startsWith('http') || img.startsWith('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/')) ? img : `https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/feedback_images/${img}`;
                    const isSelected = reviewSelectedImage === imgUrl;
                    return (
                      <div 
                        key={img} 
                        className={`admin-picker-img-wrapper ${isSelected ? 'selected' : ''}`}
                        onClick={() => setReviewSelectedImage(isSelected ? '' : imgUrl)}
                        style={{ position: 'relative', aspectRatio: '1', cursor: 'pointer', border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', outline: 'none', transition: 'border-color var(--transition-fast)' }}
                      >
                        <img src={imgUrl} alt={img} className="admin-picker-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                            const isCustom = item.customDesignLocalUrl || item.customDesignBackLocalUrl || item.customDesign || item.customDesignBack;
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
                                      {(item.customDesignLocalUrl || item.customDesign) && (
                                        <a href={item.customDesignLocalUrl || item.customDesign} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--accent-color)', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>👁 View Front Artwork</a>
                                      )}
                                      {(item.customDesignBackLocalUrl || item.customDesignBack) && (
                                        <a href={item.customDesignBackLocalUrl || item.customDesignBack} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--accent-color)', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>👁 View Back Artwork</a>
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
                                            {(item.customDesignLocalUrl || item.customDesign) && item.customMeta.placement.front && (
                                              <tr style={{ borderBottom: '1px solid #f2f2f2' }}>
                                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 700 }}>Front</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.front.scale}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.front.x}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.front.y}%</td>
                                                <td style={{ padding: '0.5rem 0.8rem' }}>{item.customMeta.placement.front.rotation}°</td>
                                                <td style={{ padding: '0.5rem 0.8rem', fontWeight: 600 }}>{item.customMeta.placement.front.opacity ?? 100}%</td>
                                              </tr>
                                            )}
                                            {(item.customDesignBackLocalUrl || item.customDesignBack) && item.customMeta.placement.back && (
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
    </div>
  );
};

export default AdminPanel;

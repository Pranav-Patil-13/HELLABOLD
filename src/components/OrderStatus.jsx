import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatusInDB } from '../utils/supabase';

const OrderStatus = () => {
  const [order, setOrder] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shiprocket milestones
  const steps = [
    { label: 'Order Received', desc: 'Seller has received and confirmed your order.' },
    { label: 'Manifested & Picked Up', desc: 'Package registered and picked up by courier.' },
    { label: 'In Transit', desc: 'Package is moving between logistics hubs.' },
    { label: 'Out for Delivery', desc: 'Package is with the local delivery agent.' },
    { label: 'Delivered', desc: 'Package delivered successfully.' }
  ];

  useEffect(() => {
    const fetchOrder = () => {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('id');

      setLoading(true);
      getOrders()
        .then(orders => {
          setAllOrders(orders || []);
          if (orderId) {
            const foundOrder = orders.find(o => o.id === orderId);
            setOrder(foundOrder || null);
          } else {
            setOrder(null);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching order tracking info:', err);
          setLoading(false);
        });
    };

    fetchOrder();

    // Listen to changes in navigation history
    const handlePopState = () => {
      fetchOrder();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [window.location.search]);

  const handleUpdateStatus = async (newStatus) => {
    if (!order) return;
    const updatedOrder = { ...order, status: newStatus };
    setOrder(updatedOrder);

    // Save back to database
    try {
      await updateOrderStatusInDB(order.id, newStatus);
    } catch (err) {
      console.error('Failed to update order status in DB:', err);
    }

    // Save back to localStorage list (fallback/local cache)
    const savedOrders = JSON.parse(localStorage.getItem('hellabold_orders') || '[]');
    const updatedList = savedOrders.map(o => o.id === order.id ? updatedOrder : o);
    localStorage.setItem('hellabold_orders', JSON.stringify(updatedList));
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'Order Received': return 0;
      case 'Manifested & Picked Up': return 1;
      case 'In Transit': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      default: return 0;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="order-status-loading">
        <p>FETCHING TRACKING INFORMATION...</p>
      </div>
    );
  }

  if (!order) {
    const handleTrackOrderClick = (id) => {
      window.history.pushState({}, '', `/order-status?id=${id}`);
      window.dispatchEvent(new Event('popstate'));
    };

    return (
      <div className="order-status-container">
        <div className="order-status__header">
          <div className="order-status__meta">
            <h1>Your Orders</h1>
            <p>Select any of your premium HELLABOLD orders below to view tracking information.</p>
          </div>
        </div>

        {allOrders.length === 0 ? (
          <div className="order-status-error-view" style={{ marginTop: '2rem' }}>
            <h2>No Orders Placed Yet</h2>
            <p>We couldn't find any order history in your account. Once you place an order, it will appear here.</p>
            <a href="/" className="btn btn--primary" style={{ marginTop: '1rem' }}>Shop Now</a>
          </div>
        ) : (
          <div className="orders-list-grid" style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
            {allOrders.map(o => (
              <div 
                key={o.id} 
                style={{ 
                  border: '1px solid var(--border-color)', 
                  padding: '1.5rem', 
                  backgroundColor: 'var(--white)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Order {o.id}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>Placed on {o.date} | Status: <strong style={{ color: 'var(--accent-color)' }}>{o.status}</strong></p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: 0 }}>Total: {formatCurrency(o.total)}</p>
                </div>
                <button 
                  onClick={() => handleTrackOrderClick(o.id)}
                  className="btn btn--primary" 
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}
                >
                  Track Package
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="order-status-container">
      {/* Shiprocket Tracker Header */}
      <div className="order-status__header">
        <div className="order-status__brand-shiprocket">
          <img src="/assets/header_logo_v2.png" alt="HELLABOLD" className="header__logo-img" style={{ height: '24px', marginRight: '1rem' }} />
          <span>×</span>
          <span className="shiprocket-badge">Shiprocket Fulfillment</span>
        </div>
        <div className="order-status__meta">
          <h1>Track Shipment</h1>
          <p className="order-status__id-date">Order ID: <strong>{order.id}</strong> | Placed on {order.date}</p>
        </div>
      </div>

      <div className="order-status__layout">
        {/* Left Side: Timeline Progress */}
        <div className="order-status__main">
          <div className="shiprocket-timeline-box">
            <div className="shiprocket-awb-card">
              <div className="awb-card__left">
                <span className="awb-label">AWB TRACKING NUMBER</span>
                <strong className="awb-value">{order.awb}</strong>
              </div>
              <div className="awb-card__right">
                <span className="awb-label">COURIER PARTNER</span>
                <strong className="awb-value courier-name">{order.courier}</strong>
              </div>
            </div>

          {/* Visual Steps Timeline */}
            <div className="timeline-steps">
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.label} className={`timeline-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="timeline-step__node">
                      <span className="node-dot"></span>
                      {idx < steps.length - 1 && (
                        <div className={`node-line-connector ${idx < currentStepIdx ? 'filled' : ''}`}></div>
                      )}
                    </div>
                    <div className="timeline-step__info">
                      <h3 className="timeline-step__title">{step.label}</h3>
                      <p className="timeline-step__desc">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Order Receipt Details */}
        <div className="order-status__sidebar">
          <h2 className="sidebar-section-title">Delivery Details</h2>
          <div className="sidebar-address-card">
            <h4>Shipping Address</h4>
            <p className="customer-name">{order.shippingDetails?.name}</p>
            <p>{order.shippingDetails?.address}</p>
            <p>{order.shippingDetails?.city} - {order.shippingDetails?.zipCode}</p>
            <p className="customer-email">{order.shippingDetails?.email}</p>
          </div>

          <hr className="pdp-divider" />

          <h2 className="sidebar-section-title">Order Items</h2>
          <div className="sidebar-items-list">
            {order.items.map(item => (
              <div key={`${item.id}-${item.size}`} className="sidebar-item-row">
                <div className="sidebar-item-img-wrap">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="sidebar-item-info">
                  <h4>{item.title}</h4>
                  <p>Size: {item.size} × {item.quantity}</p>
                  <span className="sidebar-item-price">{item.price}</span>
                </div>
              </div>
            ))}
          </div>

          <hr className="pdp-divider" />

          <div className="sidebar-math">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="summary-row discount-row" style={{ color: '#38a169' }}>
                <span>Discount ({order.appliedPromo})</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <span>{formatCurrency(order.shipping)}</span>
            </div>
            <hr className="pdp-divider" />
            <div className="summary-row total-row">
              <span>Total Paid</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;

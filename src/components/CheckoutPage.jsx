import React, { useState, useEffect } from 'react';
import { triggerConfettiBurst } from '../utils/confetti';
import { createOrder, updateProfile } from '../utils/supabase';

const CheckoutPage = ({ cartItems, onOrderSuccess, appliedDiscount, onApplyDiscount, userProfile, onProfileUpdate }) => {
  const [step, setStep] = useState('form'); // form, success
  const [placedOrder, setPlacedOrder] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Saved Address Selector State
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);
  const [saveAddressLabel, setSaveAddressLabel] = useState('');
  const [addressSaveError, setAddressSaveError] = useState('');

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setName(addr.fullName || '');
    setAddress(addr.address || '');
    setCity(addr.city || '');
    setZipCode(addr.zipCode || '');
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setSelectedAddressId(null);
  };

  useEffect(() => {
    if (userProfile) {
      setEmail(userProfile.email || '');
      const saved = userProfile.addresses || [];
      if (saved.length > 0) {
        handleSelectAddress(saved[0]);
      } else {
        setName(userProfile.fullName || '');
        setAddress(userProfile.address || '');
        setCity(userProfile.city || '');
        setZipCode(userProfile.zipCode || '');
      }
    }
  }, [userProfile]);

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const subtotal = cartItems.reduce((acc, item) => {
    const numericalPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
    return acc + (numericalPrice * item.quantity);
  }, 0);

  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percent / 100) : 0;
  const shipping = 50; // INR flat rate shipping
  const total = subtotal - discountAmount + shipping;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(value.slice(0, 19));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setCardExpiry(value.slice(0, 5));
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'BOLD10') {
      onApplyDiscount({ code, percent: 10 });
      setPromoError('');
      setPromoCode('');
      triggerConfettiBurst(e.target);
    } else if (code === 'HELLA50') {
      onApplyDiscount({ code, percent: 50 });
      setPromoError('');
      setPromoCode('');
      triggerConfettiBurst(e.target);
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const handleRemovePromo = () => {
    onApplyDiscount(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Generate order ID and Shiprocket tracking details
    const orderId = 'HB-' + Math.floor(10000 + Math.random() * 90000);
    const awb = 'SR-' + Math.floor(100000000 + Math.random() * 900000000);
    const couriers = ['Delhivery', 'Blue Dart', 'Shadowfax', 'Xpressbees'];
    const courier = couriers[Math.floor(Math.random() * couriers.length)];
    
    const newOrder = {
      id: orderId,
      awb: awb,
      courier: courier,
      items: cartItems,
      subtotal: subtotal,
      discount: discountAmount,
      appliedPromo: appliedDiscount ? appliedDiscount.code : null,
      shipping: shipping,
      total: total,
      status: 'Order Received',
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      shippingDetails: {
        name,
        email,
        address,
        city,
        zipCode
      }
    };

    // Auto-save address to user profile if checkbox is checked
    if (saveAddressToProfile && userProfile) {
      try {
        const newAddr = {
          id: Math.random().toString(36).substring(2, 9),
          label: saveAddressLabel.trim() || 'Saved Address',
          fullName: name,
          address: address,
          city: city,
          zipCode: zipCode
        };
        const currentAddresses = userProfile.addresses || [];
        const updatedAddresses = [...currentAddresses, newAddr];

        const updated = await updateProfile({ addresses: updatedAddresses });
        if (onProfileUpdate) {
          onProfileUpdate({
            ...userProfile,
            addresses: updated.addresses || updatedAddresses
          });
        }
      } catch (err) {
        console.error('Error auto-saving address at checkout:', err);
        setAddressSaveError('Could not save address to profile. You can add it manually from your profile.');
      }
    }

    // Save to live Supabase database
    try {
      await createOrder(newOrder);
    } catch (err) {
      console.error('Failed to create order in database:', err);
    }

    // Save to localStorage list of orders
    const existingOrders = JSON.parse(localStorage.getItem('hellabold_orders') || '[]');
    existingOrders.push(newOrder);
    localStorage.setItem('hellabold_orders', JSON.stringify(existingOrders));

    setPlacedOrder(newOrder);
    setStep('success');
  };

  const handleFinish = () => {
    onOrderSuccess();
    onApplyDiscount(null); // Clear discount code after order is placed successfully
    window.location.href = '/';
  };

  if (step === 'success') {
    return (
      <div className="checkout-page-container success-state">
        <div className="checkout-success-layout">
          {/* Left Column: Messages & Buttons */}
          <div className="checkout-success-info">
            <div className="checkout-success-view__icon">✓</div>
            <h2>Order Confirmed</h2>
            <p className="checkout-success-msg">
              Thank you for shopping with HELLABOLD. Your premium order is being prepared and will ship shortly.
            </p>
            {saveAddressToProfile && !addressSaveError && (
              <p style={{ fontSize: '0.8rem', color: '#38a169', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>
                ✓ Address saved to your profile
              </p>
            )}
            {addressSaveError && (
              <p style={{ fontSize: '0.8rem', color: '#c53030', fontWeight: 'bold', marginBottom: '1rem' }}>
                ⚠ {addressSaveError}
              </p>
            )}
            <div className="checkout-success-actions">
              <button 
                className="btn btn--primary" 
                onClick={() => window.open(`/order-status?id=${placedOrder?.id}`, '_blank')}
              >
                Track Order (Shiprocket)
              </button>
              <button className="btn btn--outline" onClick={handleFinish}>
                Back to Homepage
              </button>
            </div>
          </div>

          {/* Right Column: Receipt Summary */}
          <div className="checkout-success-receipt-card">
            <div className="checkout-success-view__receipt">
              <h3>Receipt & Order Details (ID: {placedOrder?.id})</h3>
              <p className="checkout-success-awb">
                Shiprocket AWB: <strong>{placedOrder?.awb}</strong> via {placedOrder?.courier}
              </p>
              <div className="receipt-items-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {cartItems.map(item => (
                  <div key={`${item.id}-${item.size}`} className="receipt-item-row">
                    <span>{item.title} (Size {item.size}) × {item.quantity}</span>
                    <span>{item.price}</span>
                  </div>
                ))}
              </div>
              {placedOrder?.discount > 0 && (
                <>
                  <hr className="pdp-divider" />
                  <div className="receipt-item-row discount-row" style={{ color: '#38a169' }}>
                    <span>Discount ({placedOrder.appliedPromo})</span>
                    <span>-{formatCurrency(placedOrder.discount)}</span>
                  </div>
                </>
              )}
              <hr className="pdp-divider" />
              <div className="receipt-item-row total-row">
                <span>Total Paid</span>
                <strong>{formatCurrency(placedOrder?.total || total)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-page-header">
        <h1>Secure Checkout</h1>
        <a href="/" className="btn btn--outline">Continue Shopping</a>
      </div>

      {cartItems.length === 0 ? (
        <div className="checkout-page-empty">
          <p>Your bag is empty. Add products to proceed to checkout.</p>
          <a href="/" className="btn btn--primary">View Products</a>
        </div>
      ) : (
        <div className="checkout-page-layout">
          {/* Left Side: Form Details */}
          <div className="checkout-page-form-section">
             <form onSubmit={handleSubmit} className="checkout-form">
              <h2 className="checkout-page-section-title">Shipping Address</h2>

              {/* Saved Address Selector */}
              {userProfile && userProfile.addresses && userProfile.addresses.length > 0 && (
                <div className="checkout-address-selector-section">
                  <h3 className="checkout-address-selector-title">Select Saved Address</h3>
                  <div className="checkout-address-selector-grid">
                    {userProfile.addresses.map((addr) => (
                      <div 
                        key={addr.id}
                        className={`checkout-address-card ${selectedAddressId === addr.id ? 'active' : ''}`}
                        onClick={() => handleSelectAddress(addr)}
                      >
                        {selectedAddressId === addr.id && (
                          <span className="checkout-address-card__badge">Selected</span>
                        )}
                        <span className="checkout-address-card__label">{addr.label}</span>
                        <span className="checkout-address-card__name">{addr.fullName}</span>
                        <span className="checkout-address-card__details">
                          {addr.address}, {addr.city} - {addr.zipCode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="form-group-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={handleInputChange(setName)} 
                    required 
                    placeholder="e.g. Alexander McQueen" 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    placeholder="e.g. alex@hellabold.com" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={handleInputChange(setAddress)} 
                  required 
                  placeholder="e.g. 10 Bond Street" 
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={handleInputChange(setCity)} 
                    required 
                    placeholder="e.g. Mumbai" 
                  />
                </div>
                <div className="form-group">
                  <label>ZIP / Postal Code</label>
                  <input 
                    type="text" 
                    value={zipCode} 
                    onChange={handleInputChange(setZipCode)} 
                    required 
                    placeholder="e.g. 400001" 
                  />
                </div>
              </div>

              {/* Save Address Checkbox */}
              {userProfile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.2rem', marginBottom: '1.5rem' }}>
                  <label className="checkout-save-address-wrapper" style={{ margin: 0 }}>
                    <input 
                      type="checkbox" 
                      className="checkout-save-address-checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                    />
                    <span>Save this address to my profile for future checkouts</span>
                  </label>
                  {saveAddressToProfile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', paddingLeft: '1.6rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Label as:</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Home, Office, Work" 
                        value={saveAddressLabel}
                        onChange={(e) => setSaveAddressLabel(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-color)', fontSize: '0.8rem', maxWidth: '200px', backgroundColor: '#fff' }}
                      />
                    </div>
                  )}
                </div>
              )}

              <h2 className="checkout-page-section-title">Payment Information</h2>

              {/* Mock Credit Card Graphic */}
              <div className="mock-card">
                <div className="mock-card__chip"></div>
                <div className="mock-card__number">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="mock-card__footer">
                  <div className="mock-card__holder">
                    <span className="label">Card Holder</span>
                    <span className="value">{name.toUpperCase() || 'YOUR NAME'}</span>
                  </div>
                  <div className="mock-card__expiry">
                    <span className="label">Expires</span>
                    <span className="value">{cardExpiry || 'MM/YY'}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input 
                  type="text" 
                  value={cardNumber} 
                  onChange={handleCardNumberChange} 
                  required 
                  placeholder="0000 0000 0000 0000" 
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Expiration Date</label>
                  <input 
                    type="text" 
                    value={cardExpiry} 
                    onChange={handleExpiryChange} 
                    placeholder="MM/YY" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>CVC</label>
                  <input 
                    type="password" 
                    value={cardCvc} 
                    onChange={e => setCardCvc(e.target.value.slice(0, 3))} 
                    placeholder="•••" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn--primary checkout-submit-btn">
                Pay and Place Order ({formatCurrency(total)})
              </button>
            </form>
          </div>

          {/* Right Side: Order Summary */}
          <div className="checkout-page-summary-section">
            <h2 className="checkout-page-section-title">Order Summary</h2>
            <div className="checkout-summary__list">
              {cartItems.map(item => (
                <div key={`${item.id}-${item.size}`} className="summary-item">
                  <img src={item.image} alt={item.title} className="summary-item__img" />
                  <div className="summary-item__info">
                    <h4>{item.title}</h4>
                    <p>Size: {item.size} × {item.quantity}</p>
                  </div>
                  <span className="summary-item__price">{item.price}</span>
                </div>
              ))}
            </div>

            {/* Promo Code Form */}
            <div className="checkout-summary__promo">
              {appliedDiscount ? (
                <div className="promo-badge">
                  <span>Promo: <strong>{appliedDiscount.code}</strong> (-{appliedDiscount.percent}%)</span>
                  <button className="promo-remove-btn" onClick={handleRemovePromo}>Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="promo-form">
                  <input 
                    type="text" 
                    placeholder="PROMO CODE" 
                    value={promoCode} 
                    onChange={e => setPromoCode(e.target.value)}
                    className="promo-input"
                  />
                  <button type="submit" className="btn btn--primary promo-btn">Apply</button>
                </form>
              )}
              {promoError && <p className="promo-error">{promoError}</p>}
            </div>

            <div className="checkout-summary__math">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {appliedDiscount && (
                <div className="summary-row discount-row">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span className="discount-amount">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Flat Rate Shipping</span>
                <span>{formatCurrency(shipping)}</span>
              </div>
              <hr className="pdp-divider" />
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

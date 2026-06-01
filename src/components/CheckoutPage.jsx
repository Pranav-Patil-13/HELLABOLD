import React, { useState, useEffect } from 'react';
import { triggerConfettiBurst } from '../utils/confetti';
import { createOrder, updateProfile } from '../utils/supabase';
import { createShiprocketOrder } from '../utils/shiprocket';

const CheckoutPage = ({ cartItems, onOrderSuccess, appliedDiscount, onApplyDiscount, userProfile, onProfileUpdate }) => {
  const [step, setStep] = useState('form'); // form, success
  const [placedOrder, setPlacedOrder] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // razorpay, cod
  const [paymentError, setPaymentError] = useState('');
  const [tempOrder, setTempOrder] = useState(null);

  // COD Verification State
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

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
    setState(addr.state || '');
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
        setState(userProfile.state || '');
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

  const discountAmount = appliedDiscount ? Math.round(subtotal * appliedDiscount.percent / 100) : 0;
  const shipping = paymentMethod === 'razorpay' ? 0 : 50; // WAIVE shipping for online payments (incentive)
  const total = subtotal - discountAmount + shipping;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'BOLD10') {
      onApplyDiscount({ code, percent: 10 });
      setPromoError('');
      setPromoCode('');
      triggerConfettiBurst(e.target);
    } else if (code === 'BOLD20') {
      if (subtotal < 899) {
        const diff = 899 - subtotal;
        setPromoError(`Add items worth ₹${Math.round(diff)} more to redeem this offer`);
      } else {
        onApplyDiscount({ code, percent: 20 });
        setPromoError('');
        setPromoCode('');
        triggerConfettiBurst(e.target);
      }
    } else if (code === 'HELLA50') {
      if (subtotal < 1299) {
        const diff = 1299 - subtotal;
        setPromoError(`Add items worth ₹${Math.round(diff)} more to redeem this offer`);
      } else {
        onApplyDiscount({ code, percent: 50 });
        setPromoError('');
        setPromoCode('');
        triggerConfettiBurst(e.target);
      }
    } else {
      setPromoError('Invalid promo code');
    }
  };

  const handleRemovePromo = () => {
    onApplyDiscount(null);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentSuccess = async (completedOrder) => {
    // ── Push order to Shiprocket ────────────────────────────────────────────
    // This replaces the fake generated AWB/courier with real Shiprocket data.
    // If Shiprocket is unreachable, we fall back gracefully and keep the order.
    let finalizedOrder = { ...completedOrder };
    try {
      const srResult = await createShiprocketOrder(completedOrder);
      if (srResult.success) {
        finalizedOrder = {
          ...completedOrder,
          awb: srResult.awb,
          courier: srResult.courier,
          shiprocketOrderId: srResult.shiprocketOrderId,
          shipmentId: srResult.shipmentId,
          shiprocketSynced: true
        };
      } else {
        console.warn('[Shiprocket] Fallback: order saved locally without real AWB.', srResult.error);
        finalizedOrder = { ...completedOrder, shiprocketSynced: false };
      }
    } catch (err) {
      console.error('[Shiprocket] Unexpected error, continuing with local order:', err);
      finalizedOrder = { ...completedOrder, shiprocketSynced: false };
    }

    // ── Auto-save address to user profile if checkbox is checked ────────────
    if (saveAddressToProfile && userProfile) {
      try {
        const newAddr = {
          id: Math.random().toString(36).substring(2, 9),
          label: saveAddressLabel.trim() || 'Saved Address',
          fullName: name,
          address: address,
          city: city,
          state: state,
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

    // ── Save to Supabase ────────────────────────────────────────────────────
    try {
      await createOrder(finalizedOrder);
    } catch (err) {
      console.error('Failed to create order in database:', err);
    }

    // ── Save to localStorage (local cache / fallback) ────────────────────────
    const existingOrders = JSON.parse(localStorage.getItem('hellabold_orders') || '[]');
    existingOrders.push(finalizedOrder);
    localStorage.setItem('hellabold_orders', JSON.stringify(existingOrders));

    setPlacedOrder(finalizedOrder);
    setStep('success');
  };

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      setOtpError('Please enter a valid 10-digit phone number.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    setTimeout(() => {
      setOtpLoading(false);
      setOtpSent(true);
    }, 1200);
  };

  const handleVerifyOtpAndPlaceOrder = async () => {
    if (otpCode !== '1234' && otpCode !== '0000') {
      setOtpError('Invalid OTP code. Please enter 1234 or 0000.');
      return;
    }

    if (!tempOrder) return;

    setOtpLoading(true);
    setOtpError('');

    const finalizedOrder = {
      ...tempOrder,
      shippingDetails: {
        ...tempOrder.shippingDetails,
        phone: '+91 ' + phone
      }
    };

    setTimeout(async () => {
      await handlePaymentSuccess(finalizedOrder);
      setShowOtpVerification(false);
      setOtpSent(false);
      setOtpCode('');
      setPhone('');
      setOtpLoading(false);
    }, 1800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');

    // Generate a local order ID (AWB will be replaced by the real Shiprocket AWB
    // once createShiprocketOrder() runs inside handlePaymentSuccess).
    const orderId = 'HB-' + Math.floor(10000 + Math.random() * 90000);

    const newOrder = {
      id: orderId,
      awb: null,       // filled by Shiprocket after payment
      courier: null,   // filled by Shiprocket after payment
      items: cartItems,
      subtotal: subtotal,
      discount: discountAmount,
      appliedPromo: appliedDiscount ? appliedDiscount.code : null,
      shipping: shipping,
      total: total,
      status: 'Order Received',
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)',
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      shippingDetails: {
        name,
        email,
        phone: '+91 ' + phone,
        address,
        city,
        state,
        zipCode
      }
    };

    if (paymentMethod === 'cod') {
      if (!phone || phone.length < 10) {
        setPaymentError('Please enter a valid 10-digit phone number in the shipping form.');
        return;
      }
      setTempOrder(newOrder);
      setShowOtpVerification(true);
      setOtpSent(true); // Phone is already captured, go directly to code entry
      return;
    }

    // Load Razorpay Script dynamically
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setPaymentError('Failed to load Razorpay payment SDK. Please check your internet connection.');
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

    const options = {
      key: razorpayKey,
      amount: total * 100, // Amount in paise
      currency: 'INR',
      name: 'HELLABOLD',
      description: `Purchase for Order ${orderId}`,
      image: '/logo.png',
      handler: async function (response) {
        const completedOrder = {
          ...newOrder,
          razorpayPaymentId: response.razorpay_payment_id
        };
        await handlePaymentSuccess(completedOrder);
      },
      prefill: {
        name: name,
        email: email
      },
      theme: {
        color: '#000000'
      },
      modal: {
        ondismiss: function () {
          setPaymentError('Payment window was closed by the user.');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay execution failed:', err);
      setPaymentError('Could not initialize Razorpay checkout client.');
    }
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

              <div className="form-group-row">
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
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="phone-input-wrapper">
                    <span className="phone-country-code">+91</span>
                    <div className="phone-input-container">
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        placeholder=""
                        maxLength="10"
                        pattern="[0-9]{10}"
                        title="Please enter a valid 10-digit phone number"
                      />
                      <div className="phone-dashes-overlay">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const isCursor = phone.length === i;
                          return (
                            <span 
                              key={i} 
                              className={`phone-dash ${phone.length > i ? 'active' : ''} ${isCursor ? 'is-cursor' : ''}`}
                            >
                              {phone[i] || ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
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
                  <label>State</label>
                  <select
                    value={state}
                    onChange={(e) => { setState(e.target.value); setSelectedAddressId(null); }}
                    required
                    style={{ padding: '0.8rem 1rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontSize: '0.95rem', width: '100%', backgroundColor: 'var(--white)' }}
                  >
                    <option value="">Select State</option>
                    <option>Andhra Pradesh</option>
                    <option>Arunachal Pradesh</option>
                    <option>Assam</option>
                    <option>Bihar</option>
                    <option>Chhattisgarh</option>
                    <option>Goa</option>
                    <option>Gujarat</option>
                    <option>Haryana</option>
                    <option>Himachal Pradesh</option>
                    <option>Jharkhand</option>
                    <option>Karnataka</option>
                    <option>Kerala</option>
                    <option>Madhya Pradesh</option>
                    <option>Maharashtra</option>
                    <option>Manipur</option>
                    <option>Meghalaya</option>
                    <option>Mizoram</option>
                    <option>Nagaland</option>
                    <option>Odisha</option>
                    <option>Punjab</option>
                    <option>Rajasthan</option>
                    <option>Sikkim</option>
                    <option>Tamil Nadu</option>
                    <option>Telangana</option>
                    <option>Tripura</option>
                    <option>Uttar Pradesh</option>
                    <option>Uttarakhand</option>
                    <option>West Bengal</option>
                    <option>Andaman and Nicobar Islands</option>
                    <option>Chandigarh</option>
                    <option>Dadra and Nagar Haveli and Daman and Diu</option>
                    <option>Delhi</option>
                    <option>Jammu and Kashmir</option>
                    <option>Ladakh</option>
                    <option>Lakshadweep</option>
                    <option>Puducherry</option>
                  </select>
                </div>
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

              {/* Payment Method Selector */}
              <h2 className="checkout-page-section-title" style={{ marginTop: '2rem' }}>Payment Method</h2>
              <div className="payment-method-selector-grid">
                <div
                  className={`payment-method-card ${paymentMethod === 'razorpay' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  <div className="payment-method-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span className="payment-method-card__bullet">●</span>
                      <strong>Online Payment</strong>
                    </div>
                    <span className="prepaid-badge-green">SAVE ₹50</span>
                  </div>
                  <span className="payment-method-card__details">Pay securely with Cards, UPI, Netbanking, or Wallets (via Razorpay). Includes free shipping.</span>
                </div>
                <div
                  className={`payment-method-card ${paymentMethod === 'cod' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="payment-method-card__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span className="payment-method-card__bullet">●</span>
                      <strong>Cash on Delivery (COD)</strong>
                    </div>
                  </div>
                  <span className="payment-method-card__details">Pay with cash upon delivery. <br></br><p style={{ color: '#e11d48', textDecoration: 'underline' }}>Standard shipping fee ₹50 applies.</p></span>
                </div>
              </div>

              {paymentError && (
                <div style={{ padding: '1rem', backgroundColor: '#fed7d7', color: '#9b2c2c', borderRadius: '4px', marginBottom: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠</span> {paymentError}
                </div>
              )}

              <button type="submit" className="btn btn--primary checkout-submit-btn" style={{ marginTop: '1.5rem' }}>
                {paymentMethod === 'cod' ? 'Place COD Order' : 'Proceed to Payment'} ({formatCurrency(total)})
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
                <span>Shipping</span>
                {shipping === 0 ? (
                  <span style={{ color: '#38a169', fontWeight: 'bold' }}>FREE</span>
                ) : (
                  <span>{formatCurrency(shipping)}</span>
                )}
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

      {showOtpVerification && (
        <div className="otp-overlay">
          <div className="otp-modal">
            <button className="otp-close-btn" onClick={() => {
              setShowOtpVerification(false);
              setOtpSent(false);
              setOtpError('');
              setOtpCode('');
            }}>✕</button>
            
            <div className="otp-modal__header">
              <h2>Order Verification</h2>
              <p>Confirm your phone number to place your Cash on Delivery (COD) order.</p>
            </div>

            <div className="otp-modal__body">
              {otpLoading ? (
                <div className="otp-loading-state">
                  <div className="otp-spinner-container">
                    <span className="otp-spinner-box">📦</span>
                    <div className="otp-spinner-road"></div>
                  </div>
                  <h3>Placing Your Order...</h3>
                  <p>Securing your items and generating Shiprocket tracking details.</p>
                </div>
              ) : (
                <div className="otp-form-step">
                  {otpError && (
                    <div className="otp-error-banner">
                      <span>⚠</span> {otpError}
                    </div>
                  )}
                  <p className="otp-sent-alert">🎉 Verification code sent to <strong>{phone}</strong>.</p>
                  <div className="form-group">
                    <label>Enter 4-Digit OTP</label>
                    <div className="otp-input-wrapper">
                      <div className="otp-input-container">
                        <input 
                          type="tel" 
                          value={otpCode}
                          maxLength="4"
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          required
                          className="otp-hidden-input"
                        />
                        <div className="otp-boxes-overlay">
                          {Array.from({ length: 4 }).map((_, i) => {
                            const isCursor = otpCode.length === i;
                            return (
                              <span 
                                key={i} 
                                className={`otp-box ${otpCode.length > i ? 'active' : ''} ${isCursor ? 'is-cursor' : ''}`}
                              >
                                {otpCode[i] || ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn--primary otp-action-btn"
                    onClick={handleVerifyOtpAndPlaceOrder}
                  >
                    Verify & Confirm Order
                  </button>
                </div>
              )}
            </div>

            <div className="otp-modal__footer">
              <span className="otp-secure-tag">🛡 Verified COD Order</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

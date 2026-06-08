import React, { useState } from 'react';
import { triggerConfettiBurst } from '../utils/confetti';
import { cloudinaryOptimize } from '../utils/cloudinary';

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  appliedDiscount,
  onApplyDiscount,
  onCheckout 
}) => {
  if (!isOpen) return null;

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const subtotal = cartItems.reduce((acc, item) => {
    const numericalPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
    return acc + (numericalPrice * item.quantity);
  }, 0);

  const unbargainedSubtotal = cartItems.reduce((acc, item) => {
    if (item.customMeta?.isBargained) return acc;
    const numericalPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
    return acc + (numericalPrice * item.quantity);
  }, 0);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (unbargainedSubtotal === 0) {
      setPromoError('Promo codes cannot be applied to bargained items.');
      return;
    }

    const code = promoCode.trim().toUpperCase();
    if (code === 'BOLD10') {
      onApplyDiscount({ code, percent: 10 });
      setPromoError('');
      setPromoCode('');
      triggerConfettiBurst(e.target);
    } else if (code === 'BOLD20') {
      if (unbargainedSubtotal < 899) {
        const diff = 899 - unbargainedSubtotal;
        setPromoError(`Add eligible items worth ₹${Math.round(diff)} more to redeem this offer`);
      } else {
        onApplyDiscount({ code, percent: 20 });
        setPromoError('');
        setPromoCode('');
        triggerConfettiBurst(e.target);
      }
    } else if (code === 'HELLA50') {
      if (unbargainedSubtotal < 1299) {
        const diff = 1299 - unbargainedSubtotal;
        setPromoError(`Add eligible items worth ₹${Math.round(diff)} more to redeem this offer`);
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

  const discountAmount = appliedDiscount ? (unbargainedSubtotal * appliedDiscount.percent / 100) : 0;
  const finalSubtotal = subtotal - discountAmount;

  const formatVal = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer__header">
          <h2>Your Bag ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close cart">
            &times;
          </button>
        </div>

        <div className="cart-drawer__content">
          {cartItems.length === 0 ? (
            <div className="cart-drawer__empty">
              <img
                src={cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/v1780506713/hellabold/products/hella_is_sad.png')}
                alt="Hella is sad — your bag is empty"
                className="cart-drawer__empty-img"
              />
              <p className="cart-drawer__empty-title">Your bag is empty.</p>
              <p className="cart-drawer__empty-sub">Don't leave Hella hanging — add something bold!</p>
              <button className="btn btn--primary" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-drawer__list">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.size}`} className="cart-item">
                  <img 
                    src={(item.customDesign || item.customDesignBack || String(item.id ?? '').startsWith('custom-')) ? cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/custom_placeholder.png') : cloudinaryOptimize(item.image)} 
                    alt={item.title} 
                    className="cart-item__img"
                    loading="lazy"
                  />
                  <div className="cart-item__info">
                    <h3 className="cart-item__title">{item.title}</h3>
                    <p className="cart-item__size">Size: {item.size}</p>
                    {(() => {
                      const isBargained = item.customMeta?.isBargained;
                      if (appliedDiscount && !isBargained) {
                        const numericalPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
                        const discountedVal = Math.round(numericalPrice * (100 - appliedDiscount.percent) / 100);
                        return (
                          <p className="cart-item__price">
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', marginRight: '6px' }}>{item.price}</span>
                            <span>₹{discountedVal}</span>
                          </p>
                        );
                      }
                      return <p className="cart-item__price">{item.price}</p>;
                    })()}
                    
                    <div className="cart-item__controls">
                      <div className="cart-item__quantity">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.size, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.size, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="cart-item__remove"
                        onClick={() => onRemoveItem(item.id, item.size)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer__footer">
            {/* Promo Code Form */}
            <div className="cart-drawer__promo">
              {appliedDiscount ? (
                <div className="promo-badge">
                  <span>Code Applied: <strong>{appliedDiscount.code}</strong> (-{appliedDiscount.percent}%)</span>
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

            <div className="cart-drawer__math">
              <div className="cart-drawer__subtotal">
                <span>Subtotal</span>
                <span>{formatVal(subtotal)}</span>
              </div>
              {appliedDiscount && (
                <div className="cart-drawer__discount">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span className="discount-amount">-{formatVal(discountAmount)}</span>
                </div>
              )}
              <hr className="pdp-divider" />
              <div className="cart-drawer__total">
                <span>Estimated Total</span>
                <strong>{formatVal(finalSubtotal)}</strong>
              </div>
            </div>

            <p className="cart-drawer__note">Shipping & duties calculated at checkout.</p>
            <button className="btn btn--primary cart-drawer__checkout-btn" onClick={onCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;

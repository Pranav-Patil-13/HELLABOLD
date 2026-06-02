import React, { useState } from 'react';
import { triggerConfettiBurst } from '../utils/confetti';

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

  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percent / 100) : 0;
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
              <p>Your bag is currently empty.</p>
              <button className="btn btn--primary" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-drawer__list">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.size}`} className="cart-item">
                  <img 
                    src={(item.customDesign || item.customDesignBack || String(item.id ?? '').startsWith('custom-')) ? '/assets/custom_placeholder.png' : item.image} 
                    alt={item.title} 
                    className="cart-item__img" 
                  />
                  <div className="cart-item__info">
                    <h3 className="cart-item__title">{item.title}</h3>
                    <p className="cart-item__size">Size: {item.size}</p>
                    <p className="cart-item__price">{item.price}</p>
                    
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

import React from 'react';

const CartIsland = ({ cartItems, onOpenCart }) => {
  const count = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  if (count === 0) return null;

  const subtotal = cartItems.reduce((acc, item) => {
    const numericalPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
    return acc + (numericalPrice * item.quantity);
  }, 0);

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(subtotal);

  return (
    <div className="cart-island" onClick={onOpenCart}>
      <div className="cart-island__info">
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, opacity: 0.9 }}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span
            className="cart-island__badge"
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-10px',
              backgroundColor: 'rgb(145 0 32)', // premium red
              color: '#ffffff',
              fontSize: '0.7rem',
              height: '20px',
              minWidth: '20px',
              padding: '0 4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: '1.5px solid var(--accent-color)', // match border offset
              margin: 0
            }}
          >
            {count}
          </span>
        </div>
        <span className="cart-island__text" style={{ marginLeft: '0.8rem' }}>Bag — <strong>{formattedSubtotal}</strong></span>
      </div>
      <span className="cart-island__cta">Open bag →</span>
    </div>
  );
};

export default CartIsland;

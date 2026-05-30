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
        <span className="cart-island__badge">{count}</span>
        <span className="cart-island__text">Bag — <strong>{formattedSubtotal}</strong></span>
      </div>
      <span className="cart-island__cta">Open bag →</span>
    </div>
  );
};

export default CartIsland;

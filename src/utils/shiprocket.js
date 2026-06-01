// src/utils/shiprocket.js
// Frontend utility that calls the Shiprocket proxy endpoint (Vercel fn in prod,
// Vite dev middleware in development). Never calls Shiprocket directly.

/**
 * Push a placed order to Shiprocket and receive a real AWB number.
 *
 * @param {Object} orderData – The HELLABOLD order object from checkout
 * @returns {{ awb: string, courier: string, shiprocketOrderId: string|null, success: boolean }}
 */
export const createShiprocketOrder = async (orderData) => {
  const {
    id: orderId,
    items,
    subtotal,
    discount,
    shipping,
    total,
    paymentMethod,
    shippingDetails,
    date
  } = orderData;

  // Map "Cash on Delivery" → "COD", everything else → "Prepaid"
  const isCOD = paymentMethod && paymentMethod.toLowerCase().includes('cash');

  const payload = {
    orderId,
    orderDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    customerName: shippingDetails.name,
    email: shippingDetails.email,
    phone: String(shippingDetails.phone).replace(/\D/g, '').slice(-10), // strip to 10 digits
    address: shippingDetails.address,
    city: shippingDetails.city,
    state: shippingDetails.state,
    pincode: shippingDetails.zipCode,
    country: 'India',
    items,
    paymentMethod: isCOD ? 'COD' : 'Prepaid',
    subTotal: subtotal,
    discount: discount || 0,
    shipping: shipping || 0,
    total
  };

  try {
    console.log('[Shiprocket] Pushing order to Shiprocket:', orderId);
    const res = await fetch('/api/shiprocket/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Shiprocket] Order push failed:', data);
      return { success: false, awb: null, courier: null, shiprocketOrderId: null, error: data.error };
    }

    console.log(`[Shiprocket] ✅ Order created. AWB: ${data.awb} via ${data.courier}`);
    return {
      success: true,
      awb: data.awb,
      courier: data.courier,
      shiprocketOrderId: String(data.shiprocketOrderId || ''),
      shipmentId: data.shipmentId
    };
  } catch (err) {
    console.error('[Shiprocket] Network error pushing order:', err);
    return { success: false, awb: null, courier: null, shiprocketOrderId: null, error: err.message };
  }
};

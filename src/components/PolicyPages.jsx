import React from 'react';

const PolicyPages = ({ type }) => {
  if (type === 'shipping') {
    return (
      <div className="legal-page-container" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem', borderBottom: '2px solid var(--text-primary)', paddingBottom: '1rem' }}>Shipping Policy</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Last updated: May 31, 2026</p>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>1. Delivery Options & Rates</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            - **Online Prepaid Orders**: We offer **Free Shipping** on all orders paid securely online via Credit/Debit Cards, UPI, Netbanking, or Wallets.
            - **Cash on Delivery (COD)**: Subject to a flat **₹50 shipping fee** to cover additional logistics verification processes.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>2. Dispatch & Timeline</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            All premium t-shirt drops are processed and dispatched within **24 to 48 hours**. Once dispatched, standard shipping takes **3 to 5 business days** depending on your pin code.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>3. Tracking Your Order</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            Once your order is hand-packaged, a custom Shiprocket AWB tracking number will be generated. You can check the live logistics status anytime by visiting our **Track My Order** page in the footer.
          </p>
        </section>
      </div>
    );
  }

  if (type === 'returns') {
    return (
      <div className="legal-page-container" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem', borderBottom: '2px solid var(--text-primary)', paddingBottom: '1rem' }}>Returns & Exchanges</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Last updated: May 31, 2026</p>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>1. Limited Edition Exchange Policy</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            Due to the highly limited nature of our streetwear drops, we only accept size exchanges or returns within **7 days** of delivery. Once a specific drop sells out completely, we cannot provide size exchanges.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>2. Return Eligibility Guidelines</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            To qualify for an exchange or refund, the garment must be:
            - Unworn, unwashed, and in its original folding state.
            - Retaining all original product tags, stickers, and packaging intact.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>3. How to Request</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            Please email our support team at **support@hellabold.com** with your Order ID (e.g. HB-12345) and photos of the unused product. We will dispatch a courier pickup agent within 48 hours of approval.
          </p>
        </section>
      </div>
    );
  }

  if (type === 'size-guide') {
    return (
      <div className="legal-page-container" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
        <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem', borderBottom: '2px solid var(--text-primary)', paddingBottom: '1rem' }}>Size Guide</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Streetwear Fit Guidelines</p>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>1. Streetwear Silhouette</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            All HELLABOLD graphic t-shirts feature a custom-engineered **boxy, oversized silhouette** with dropped shoulders and a heavy-weight drape (240 GSM).
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem', border: '1px solid var(--border-color)', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#000', color: '#fff' }}>
                <th style={{ padding: '12px' }}>Size</th>
                <th style={{ padding: '12px' }}>Chest (inches)</th>
                <th style={{ padding: '12px' }}>Length (inches)</th>
                <th style={{ padding: '12px' }}>Sleeve (inches)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>S</td>
                <td style={{ padding: '12px' }}>44"</td>
                <td style={{ padding: '12px' }}>28"</td>
                <td style={{ padding: '12px' }}>9"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>M</td>
                <td style={{ padding: '12px' }}>46"</td>
                <td style={{ padding: '12px' }}>29"</td>
                <td style={{ padding: '12px' }}>9.5"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>L</td>
                <td style={{ padding: '12px' }}>48"</td>
                <td style={{ padding: '12px' }}>30"</td>
                <td style={{ padding: '12px' }}>10"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>XL</td>
                <td style={{ padding: '12px' }}>50"</td>
                <td style={{ padding: '12px' }}>31"</td>
                <td style={{ padding: '12px' }}>10.5"</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ marginBottom: '2.5rem', marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>2. Sizing Recommendation</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            - **For an oversized look**: Order your regular standard size.
            - **For a closer, classic fit**: Order **one size down** from your usual chest size.
          </p>
        </section>
      </div>
    );
  }

  return null;
};

export default PolicyPages;

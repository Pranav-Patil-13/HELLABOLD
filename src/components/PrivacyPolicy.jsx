import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page-container" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem', borderBottom: '2px solid var(--text-primary)', paddingBottom: '1rem' }}>Privacy Policy</h1>
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Last updated: May 31, 2026</p>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>1. Information We Collect</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          We collect information you provide directly to us when making a purchase, creating an account, subscribing to our newsletter, or communicating with us. This includes your name, email address, phone number, shipping address, and payment preferences.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>2. How We Use Your Information</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          We use the information we collect to fulfill your orders, process payments, facilitate shipment tracking, send promotional updates (if you opt-in), and improve our storefront services.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>3. Data Security & Storage</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          Your payment transactions are processed through secure gateway providers (like Razorpay) and we do not store sensitive card or netbanking details directly on our servers. Personal shipping info is secured via database rules and local storage encryption mechanisms.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>4. Cookies & Trackers</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          We use functional cookies to retain your shopping bag items, login session statuses, and discount promo code preferences. You can disable cookies in your browser settings, though some storefront interactions may not work correctly.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;

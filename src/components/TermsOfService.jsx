import React from 'react';

const TermsOfService = () => {
  return (
    <div className="legal-page-container" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem', borderBottom: '2px solid var(--text-primary)', paddingBottom: '1rem' }}>Terms of Service</h1>
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Last updated: May 31, 2026</p>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>1. Agreement to Terms</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          By accessing and browsing the HELLABOLD streetwear storefront, you agree to comply with and be bound by these terms. If you disagree with any part of these terms, please do not use our services.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>2. Product Pricing & Specifications</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          All products, sizes, prices, and promotional banners are subject to change without prior notice. We make every effort to display garment colors, cuts, and textures accurately, but cannot guarantee that your monitor displays them identically.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>3. Shipping & Verification</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          - **Prepaid Orders**: Eligible for free delivery via standard courier systems.
          - **Cash on Delivery (COD)**: Subject to a flat ₹50 shipping surcharge. Placing a COD order requires completing phone verification.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>4. Intellectual Property</h2>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          All media assets, header logos, product cards, collection titles, design tokens, and stylesheets are the exclusive property of HELLABOLD. Copying, republishing, or commercially exploiting our materials is strictly prohibited.
        </p>
      </section>
    </div>
  );
};

export default TermsOfService;

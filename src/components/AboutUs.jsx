import React from 'react';

const AboutUs = () => {
  return (
    <div className="about-page-container" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem', borderBottom: '2px solid var(--text-primary)', paddingBottom: '1rem' }}>About HELLABOLD</h1>
      
      <div style={{ position: 'relative', marginBottom: '3rem', backgroundColor: '#000', color: '#fff', padding: '2.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: '500', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 1rem 0' }}>Unapologetically Loud.</h2>
        <p style={{ fontSize: '1rem', fontStyle: 'italic', margin: 0, opacity: 0.9 }}>Built for those who refuse to blend in.</p>
      </div>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Our DNA</h2>
        <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          HELLABOLD is not just a brand; it is a movement. Born out of the chaotic streets and inspired by the raw aesthetic of industrial design and underground youth culture, we build premium streetwear garments that stand as declarations. No compromises. No basic templates.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Premium Craftsmanship</h2>
        <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          Every hoodie, crewneck, cut-and-sew t-shirt, and accessory is meticulously crafted using heavy-weight custom-milled cotton fabrics, premium high-density screen prints, and reinforced double-needle tailoring. We prioritize build quality and comfort over fast fashion cycles.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Join the Tribe</h2>
        <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          We drop limited signature collections every Friday. Once a collection sells out, it will never be printed again. Thank you for stepping into our universe and supporting authentic, independent streetwear design.
        </p>
      </section>
    </div>
  );
};

export default AboutUs;

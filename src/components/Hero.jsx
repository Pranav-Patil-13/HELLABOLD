import React from 'react';

const Hero = () => {
  return (
    <section className="hero">
        <img src="/assets/hero_section_banner.png" alt="HELLABOLD Spring Collection" className="hero__bg" />
        <div className="hero__content">
            <h1 className="hero__title">The Signature Collection</h1>
            <p className="hero__subtitle">Discover unmatched premium quality and bold designs.</p>
        </div>
    </section>
  );
};

export default Hero;

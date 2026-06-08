import React from 'react';
import { cloudinaryOptimize } from '../utils/cloudinary';

const Hero = () => {
  return (
    <section className="hero">
      <img
        src={cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/hero_section_banner.png')}
        alt="HELLABOLD Spring Collection"
        className="hero__bg"
        fetchPriority="high"
        loading="eager"
      />
      <div className="hero__content">
        <h1 className="hero__title">The Signature Collection</h1>
        <p className="hero__subtitle">Discover unmatched premium quality and bold designs.</p>
      </div>
    </section>
  );
};

export default Hero;

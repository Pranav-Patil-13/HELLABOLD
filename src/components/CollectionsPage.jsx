import React from 'react';
import { cloudinaryOptimize } from '../utils/cloudinary';

const collections = [
  {
    id: 'outerwear',
    title: 'Outerwear',
    subtitle: 'Jackets & Coats That Define You',
    description: 'From premium lambskin leather to durable cowhide, each piece is built to develop a distinct character over time.',
    image: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/product1_A.png'),
    count: 3,
    category: 'Outerwear'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    subtitle: 'Bags & Beyond',
    description: 'Signature saddle bags, crossbody minis, and silk scarves — every detail hand-finished, every piece a statement.',
    image: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/product4_B.png'),
    count: 4,
    category: 'Accessories'
  },
  {
    id: 'essentials',
    title: 'Essentials',
    subtitle: 'Tops & Bottoms',
    description: 'Bold boots and striking tops that bridge edge and elegance. Foundation pieces engineered to command attention.',
    image: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/product6_A.png'),
    count: 2,
    category: 'Tops,Bottoms'
  },
  {
    id: 'all',
    title: 'The Full Collection',
    subtitle: 'Every Piece. Every Statement.',
    description: 'Explore the complete HELLABOLD universe — all categories, all styles, one destination.',
    image: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/hero_section_banner.png'),
    count: 9,
    category: ''
  }
];

const CollectionsPage = () => {
  const handleShopCollection = (category) => {
    if (category) {
      window.location.href = `/?category=${encodeURIComponent(category)}`;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="collections-page">
      <section className="collections-hero">
        <img
          src={cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/hero_section_banner.png')}
          alt="HELLABOLD Collections"
          className="collections-hero__bg"
          fetchPriority="high"
          loading="eager"
        />
        <div className="collections-hero__overlay" />
        <div className="collections-hero__content">
          <p className="collections-hero__label">Curated for the bold</p>
          <h1 className="collections-hero__title">Collections</h1>
          <p className="collections-hero__subtitle">
          </p>
        </div>
      </section>

      <section className="collections-grid">
        {collections.map((collection, index) => (
          <div
            key={collection.id}
            className={`collection-card ${index % 2 === 1 ? 'collection-card--reverse' : ''}`}
          >
            <div className="collection-card__image-wrapper">
              <img
                src={collection.image}
                alt={collection.title}
                className="collection-card__image"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
            <div className="collection-card__content">
              <span className="collection-card__count">{collection.count} {collection.count === 1 ? 'Piece' : 'Pieces'}</span>
              <h2 className="collection-card__title">{collection.title}</h2>
              <p className="collection-card__subtitle">{collection.subtitle}</p>
              <p className="collection-card__description">{collection.description}</p>
              <button
                className="btn collection-card__btn"
                onClick={() => handleShopCollection(collection.category)}
              >
                Shop the Collection
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default CollectionsPage;

import React, { useState } from 'react';
import { cloudinaryOptimize } from '../utils/cloudinary';

const EntryGate = ({ onSelectGender }) => {
  const [maleLoaded, setMaleLoaded] = useState(false);
  const [femaleLoaded, setFemaleLoaded] = useState(false);

  const maleImage = cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/v1780459388/hellabold/products/model_male_white.png');
  const femaleImage = cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/v1780459369/hellabold/products/Model_Female_White.png');

  return (
    <div className="entry-gate">
      <style>{`
        .entry-gate {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 99999;
          display: flex;
          background-color: #000000;
          overflow: hidden;
          font-family: 'Montserrat', sans-serif;
        }

        .entry-gate__side {
          position: relative;
          flex: 1;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          transition: flex 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Hover effect: expand hovered panel slightly */
        @media (min-width: 769px) {
          .entry-gate__side:hover {
            flex: 1.15;
          }
        }

        .entry-gate__bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease;
          transform: scale(1.02);
          filter: brightness(0.65) contrast(1.05);
        }

        .entry-gate__side:hover .entry-gate__bg {
          transform: scale(1.08);
          filter: brightness(0.85) contrast(1.1);
        }

        .entry-gate__overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%);
          z-index: 1;
          transition: background 0.6s ease;
        }

        .entry-gate__side:hover .entry-gate__overlay {
          background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 100%);
        }

        .entry-gate__content {
          position: relative;
          z-index: 2;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .entry-gate__title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3.5rem;
          font-weight: 300;
          color: #ffffff;
          letter-spacing: 6px;
          text-transform: uppercase;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          margin: 0;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .entry-gate__side:hover .entry-gate__title {
          transform: translateY(-5px);
        }

        .entry-gate__btn {
          padding: 1.2rem 3rem;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #000000;
          background-color: #ffffff;
          border: 1px solid #ffffff;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }

        .entry-gate__side:hover .entry-gate__btn {
          background-color: transparent;
          color: #ffffff;
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
          transform: translateY(2px);
        }

        /* Logo Floating Overlay */
        .entry-gate__logo-container {
          position: absolute;
          top: 8%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          text-align: center;
          pointer-events: none;
        }

        .entry-gate__logo-text {
          font-size: 3rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 12px;
          text-transform: uppercase;
          text-shadow: 0 4px 20px rgba(0,0,0,0.8);
          margin: 0;
        }

        .entry-gate__logo-subtext {
          font-size: 0.8rem;
          font-weight: 500;
          color: #ffffff;
          opacity: 0.8;
          letter-spacing: 8px;
          text-transform: uppercase;
          margin-top: 0.5rem;
          text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .entry-gate {
            flex-direction: column;
          }

          .entry-gate__side {
            width: 100%;
            height: 50%;
          }

          .entry-gate__bg {
            object-position: center 30%;
          }

          .entry-gate__logo-container {
            top: 5%;
          }

          .entry-gate__logo-text {
            font-size: 2.2rem;
            letter-spacing: 8px;
          }

          .entry-gate__logo-subtext {
            font-size: 0.65rem;
            letter-spacing: 5px;
          }

          .entry-gate__title {
            font-size: 2.4rem;
            letter-spacing: 4px;
          }

          .entry-gate__btn {
            padding: 0.9rem 2.2rem;
            font-size: 0.75rem;
            letter-spacing: 2px;
          }
        }
      `}</style>

      {/* Floating Logo Header */}
      <div className="entry-gate__logo-container">
        <h1 className="entry-gate__logo-text">HELLABOLD</h1>
        <div className="entry-gate__logo-subtext">Manifest Your Boldness</div>
      </div>

      {/* Male Selection Side */}
      <div 
        className="entry-gate__side"
        onClick={() => onSelectGender('male')}
      >
        <img 
          src={maleImage} 
          alt="HELLABOLD Mens" 
          className="entry-gate__bg"
          onLoad={() => setMaleLoaded(true)}
          style={{ opacity: maleLoaded ? 1 : 0 }}
        />
        <div className="entry-gate__overlay"></div>
        <div className="entry-gate__content">
          <h2 className="entry-gate__title">MENS</h2>
          <button type="button" className="entry-gate__btn">Explore Catalog</button>
        </div>
      </div>

      {/* Female Selection Side */}
      <div 
        className="entry-gate__side"
        onClick={() => onSelectGender('female')}
      >
        <img 
          src={femaleImage} 
          alt="HELLABOLD Womens" 
          className="entry-gate__bg"
          onLoad={() => setFemaleLoaded(true)}
          style={{ opacity: femaleLoaded ? 1 : 0 }}
        />
        <div className="entry-gate__overlay"></div>
        <div className="entry-gate__content">
          <h2 className="entry-gate__title">WOMENS</h2>
          <button type="button" className="entry-gate__btn">Explore Catalog</button>
        </div>
      </div>
    </div>
  );
};

export default EntryGate;

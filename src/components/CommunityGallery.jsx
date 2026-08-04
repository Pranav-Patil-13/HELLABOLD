import React, { useState, useEffect } from 'react';
import { getSharedDesigns, likeSharedDesign } from '../utils/supabase';
import { cloudinaryOptimize } from '../utils/cloudinary';

const modelImages = {
  front: {
    male: {
      black: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/model_male_black.png'),
      white: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/model_male_white.png')
    },
    female: {
      black: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Female_Black.png'),
      white: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Female_White.png')
    }
  },
  back: {
    male: {
      black: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Male_Black_BackSide.png'),
      white: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Male_White_BackSide.png')
    },
    female: {
      black: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Female_Black_BackSide.png'),
      white: cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Female_White_BackSide.png')
    }
  }
};

const GalleryCard = ({ design, likedIds, onLike, onRemix, onCopyLink }) => {
  const { id, title, author, gender, color, frontImage, backImage, customMeta, likes } = design;
  const hasBothSides = !!(frontImage && backImage);
  const [activeSide, setActiveSide] = useState(frontImage ? 'front' : 'back');

  const placement = customMeta?.placement || {};
  const graphicUrl = activeSide === 'front' ? frontImage : backImage;
  const modelImg = modelImages[activeSide][gender || 'male'][color || 'black'];
  
  const currentPlacement = activeSide === 'front' ? placement.front : placement.back;
  const scale = currentPlacement?.scale || 100;
  const posX = currentPlacement?.x !== undefined ? currentPlacement.x : 5;
  const posY = currentPlacement?.y !== undefined ? currentPlacement.y : 5;
  const rotation = currentPlacement?.rotation || 0;
  const opacity = currentPlacement?.opacity !== undefined ? currentPlacement.opacity : 100;

  const isLiked = likedIds.includes(id);

  return (
    <div className="gallery-card">
      <div className="gallery-card-preview">
        <img src={modelImg} alt="Garment Model" className="gallery-card-base-img" />
        
        {graphicUrl && (
          <div 
            className="gallery-card-graphic"
            style={{
              transform: `translate(-50%, -50%) translate(${posX}%, ${posY}%) rotate(${rotation}deg) scale(${scale / 100})`,
              opacity: opacity / 100,
              mixBlendMode: color === 'white' ? 'multiply' : 'normal'
            }}
          >
            <img src={graphicUrl} alt="Design Graphic" />
          </div>
        )}

        {hasBothSides && (
          <div className="gallery-card-side-toggle" style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            display: 'flex',
            gap: '0.2rem',
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '0.2rem',
            borderRadius: '2px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveSide('front'); }}
              style={{
                background: activeSide === 'front' ? '#fff' : 'none',
                color: activeSide === 'front' ? '#000' : '#fff',
                border: 'none',
                padding: '0.2rem 0.4rem',
                fontSize: '0.55rem',
                fontWeight: '900',
                cursor: 'pointer',
                textTransform: 'uppercase',
                borderRadius: '1px',
                letterSpacing: '0.5px'
              }}
            >
              Front
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveSide('back'); }}
              style={{
                background: activeSide === 'back' ? '#fff' : 'none',
                color: activeSide === 'back' ? '#000' : '#fff',
                border: 'none',
                padding: '0.2rem 0.4rem',
                fontSize: '0.55rem',
                fontWeight: '900',
                cursor: 'pointer',
                textTransform: 'uppercase',
                borderRadius: '1px',
                letterSpacing: '0.5px'
              }}
            >
              Back
            </button>
          </div>
        )}

        <div className="gallery-card-badge">
          {gender.toUpperCase()} FIT • {color.toUpperCase()}
        </div>

        <div className="gallery-card-hover-overlay">
          <button className="btn btn--primary remix-btn" onClick={() => onRemix(design)}>
            REMIX IN LAB
          </button>
        </div>
      </div>

      <div className="gallery-card-info">
        <div className="gallery-card-title-row">
          <h3 className="gallery-card-title">{title}</h3>
          <button 
            className={`gallery-card-like-btn ${isLiked ? 'liked' : ''}`}
            onClick={(e) => onLike(e, id)}
            disabled={isLiked}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{likes}</span>
          </button>
        </div>
        
        <div className="gallery-card-author-row">
          <span className="gallery-card-author">by @{author}</span>
          <button className="gallery-card-share-btn" onClick={(e) => onCopyLink(e, id)} title="Copy shareable link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

const CommunityGallery = ({ onRemix, refreshTrigger }) => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(() => {
    const saved = localStorage.getItem('hellabold_liked_designs');
    return saved ? JSON.parse(saved) : [];
  });
  const [toastMessage, setToastMessage] = useState('');

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const data = await getSharedDesigns();
      setDesigns(data);
    } catch (err) {
      console.error('Failed to load shared designs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [refreshTrigger]);

  const handleLike = async (e, designId) => {
    e.stopPropagation();
    if (likedIds.includes(designId)) return; // prevent multiple likes

    try {
      const updatedLikes = await likeSharedDesign(designId);
      setDesigns(prev => prev.map(d => d.id === designId ? { ...d, likes: updatedLikes } : d));
      
      const newLiked = [...likedIds, designId];
      setLikedIds(newLiked);
      localStorage.setItem('hellabold_liked_designs', JSON.stringify(newLiked));
    } catch (err) {
      console.error('Failed to like design:', err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleCopyLink = (e, designId) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?remix=${designId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast('Share link copied to clipboard!'))
      .catch(() => showToast('Failed to copy link.'));
  };

  if (loading && designs.length === 0) {
    return (
      <div className="gallery-section-container">
        <h2 className="gallery-section-title">COMMUNITY DESIGNS</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading community creations...
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-section-container">
      {toastMessage && (
        <div className="gallery-toast">
          {toastMessage}
        </div>
      )}
      
      <div className="gallery-header-row">
        <div>
          <h2 className="gallery-section-title">COMMUNITY DESIGNS</h2>
          <p className="gallery-section-subtitle">Get inspired and remix other creators' designs or buy them directly.</p>
        </div>
        <button className="gallery-refresh-btn" onClick={fetchDesigns} title="Refresh Gallery">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </button>
      </div>

      {designs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
          No custom designs shared yet. Be the first to share your boldness!
        </div>
      ) : (
        <div className="gallery-grid">
          {designs.map((design) => (
            <GalleryCard 
              key={design.id}
              design={design}
              likedIds={likedIds}
              onLike={handleLike}
              onRemix={onRemix}
              onCopyLink={handleCopyLink}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityGallery;

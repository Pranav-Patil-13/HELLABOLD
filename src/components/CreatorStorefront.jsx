import React, { useState, useEffect } from 'react';
import { getSharedDesigns, likeSharedDesign } from '../utils/supabase';
import { GalleryCard } from './CommunityGallery';

const CreatorStorefront = ({ creatorId, creatorHandle, userProfile, likedIds, onToggleLike, onRemix, onBack }) => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const effectiveHandle = creatorHandle || null;

  useEffect(() => {
    if (!effectiveHandle && !creatorId) return;
    const load = async () => {
      try {
        setLoading(true);
        const all = await getSharedDesigns();

        if (effectiveHandle) {
          // Filter purely by handle stored on the design — no name matching needed
          const filtered = all.filter(d =>
            d.authorHandle === effectiveHandle ||
            // Fallback: for designs shared before this system, check if current user matches
            (d.authorHandle == null && creatorId && d.author === creatorId)
          );
          setDesigns(filtered);
        } else {
          // Legacy: filter by author name (old designs without authorHandle)
          setDesigns(all.filter(d => d.author === creatorId || d.authorEmail === creatorId));
        }
      } catch (err) {
        console.error('Failed to load creator designs:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [effectiveHandle, creatorId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleLike = async (e, designId) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedIds?.includes(designId);
    try {
      await likeSharedDesign(designId, isCurrentlyLiked);
      setDesigns(prev =>
        prev.map(d => d.id === designId
          ? { ...d, likes: Math.max(0, (d.likes || 0) + (isCurrentlyLiked ? -1 : 1)) }
          : d
        )
      );
      if (onToggleLike) onToggleLike(designId);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleCopyLink = (e, designId) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/custom-studio?remix=${designId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast('Share link copied!'))
      .catch(() => showToast('Failed to copy link.'));
  };

  // Display: prefer effectiveHandle, then creatorId
  const displayHandle = effectiveHandle || null;
  const displayName = creatorId || effectiveHandle;
  const totalLikes = designs.reduce((sum, d) => sum + (d.likes || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {toastMessage && <div className="gallery-toast">{toastMessage}</div>}

      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase',
          letterSpacing: '1.5px', display: 'flex', alignItems: 'center',
          gap: '0.5rem', marginBottom: '2.5rem', padding: 0, opacity: 0.5,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
      >
        ← Community Marketplace
      </button>

      {/* Creator Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.5rem',
        marginBottom: '3rem', paddingBottom: '2rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#000', color: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', fontWeight: 900, flexShrink: 0, letterSpacing: '-1px'
        }}>
          {(displayHandle || displayName || '??').slice(0, 2).toUpperCase()}
        </div>

        <div>
          <div style={{
            fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '1px', lineHeight: 1, marginBottom: '0.3rem'
          }}>
            {displayHandle ? `@${displayHandle}` : displayName}
          </div>
          {displayHandle && displayName && displayName !== displayHandle && (
            <div style={{ fontSize: '0.8rem', opacity: 0.45, marginBottom: '0.4rem' }}>
              {displayName}
            </div>
          )}
          <div style={{
            fontSize: '0.72rem', opacity: 0.5, display: 'flex', gap: '1.25rem',
            textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold'
          }}>
            <span>{designs.length} {designs.length === 1 ? 'drop' : 'drops'}</span>
            <span>♥ {totalLikes} likes</span>
          </div>
        </div>
      </div>

      <div style={{
        fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase',
        letterSpacing: '2px', opacity: 0.35, marginBottom: '1.5rem'
      }}>
        Their Drops
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Loading drops...
        </div>
      ) : designs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          border: '1px dashed var(--border-color)', color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🫙</div>
          <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            No drops yet
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            This creator hasn't shared any designs yet.
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {designs.map(design => (
            <GalleryCard
              key={design.id}
              design={design}
              likedIds={likedIds || []}
              onLike={handleLike}
              onRemix={onRemix}
              onCopyLink={handleCopyLink}
              userProfile={userProfile}
              onDeleteSuccess={() => setDesigns(prev => prev.filter(d => d.id !== design.id))}
              onCreatorClick={null}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CreatorStorefront;

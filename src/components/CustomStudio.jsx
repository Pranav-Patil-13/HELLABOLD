import React, { useState, useRef, useEffect } from 'react';
import { triggerConfettiBurst } from '../utils/confetti';

const CustomStudio = ({ onAddToCart, userProfile }) => {
  const [gender, setGender] = useState('male'); // male, female
  const [color, setColor] = useState('black'); // black, white
  const [garmentType, setGarmentType] = useState('tee'); // tee
  const [size, setSize] = useState('L');
  const [currentSide, setCurrentSide] = useState('front'); // 'front' or 'back'

  // Front side states
  const [frontImage, setFrontImage] = useState(null);
  const [frontFileName, setFrontFileName] = useState('');
  const [frontScale, setFrontScale] = useState(100);
  const [frontPositionX, setFrontPositionX] = useState(5);
  const [frontPositionY, setFrontPositionY] = useState(5);
  const [frontRotation, setFrontRotation] = useState(0);
  const [frontOpacity, setFrontOpacity] = useState(100);

  // Back side states
  const [backImage, setBackImage] = useState(null);
  const [backFileName, setBackFileName] = useState('');
  const [backScale, setBackScale] = useState(100);
  const [backPositionX, setBackPositionX] = useState(5);
  const [backPositionY, setBackPositionY] = useState(5);
  const [backRotation, setBackRotation] = useState(0);
  const [backOpacity, setBackOpacity] = useState(100);

  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [instructionText, setInstructionText] = useState('');
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');

  // Per-side URL input fields — preserved when switching between front/back
  const [frontUrlInput, setFrontUrlInput] = useState('');
  const [backUrlInput, setBackUrlInput] = useState('');

  useEffect(() => {
    const instructionPlaceholders = [
      "Remove the background from the image...",
      "Remove extra white space from the image...",
      "Make the design center-aligned and slightly higher...",
      "Increase saturation of the artwork before printing..."
    ];
    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer;

    const tick = () => {
      const currentWord = instructionPlaceholders[wordIdx];
      
      if (!isDeleting) {
        setCurrentPlaceholder(currentWord.substring(0, charIdx + 1));
        charIdx++;
        
        if (charIdx === currentWord.length) {
          isDeleting = true;
          timer = setTimeout(tick, 2000);
        } else {
          timer = setTimeout(tick, 50);
        }
      } else {
        setCurrentPlaceholder(currentWord.substring(0, charIdx - 1));
        charIdx--;
        
        if (charIdx === 0) {
          isDeleting = false;
          wordIdx = (wordIdx + 1) % instructionPlaceholders.length;
          timer = setTimeout(tick, 500);
        } else {
          timer = setTimeout(tick, 30);
        }
      }
    };

    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage((current) => current === msg ? '' : current);
    }, 5000);
  };

  // Virtual mapped variables for current active side
  const uploadedImage = currentSide === 'front' ? frontImage : backImage;
  const uploadFileName = currentSide === 'front' ? frontFileName : backFileName;
  const scale = currentSide === 'front' ? frontScale : backScale;
  const positionX = currentSide === 'front' ? frontPositionX : backPositionX;
  const positionY = currentSide === 'front' ? frontPositionY : backPositionY;
  const rotation = currentSide === 'front' ? frontRotation : backRotation;
  const opacity = currentSide === 'front' ? frontOpacity : backOpacity;

  const setUploadedImage = (val) => currentSide === 'front' ? setFrontImage(val) : setBackImage(val);
  const setUploadFileName = (val) => currentSide === 'front' ? setFrontFileName(val) : setBackFileName(val);
  const setScale = (val) => currentSide === 'front' ? setFrontScale(val) : setBackScale(val);
  const setPositionX = (val) => currentSide === 'front' ? setFrontPositionX(val) : setBackPositionX(val);
  const setPositionY = (val) => currentSide === 'front' ? setFrontPositionY(val) : setBackPositionY(val);
  const setRotation = (val) => currentSide === 'front' ? setFrontRotation(val) : setBackRotation(val);
  const setOpacity = (val) => currentSide === 'front' ? setFrontOpacity(val) : setBackOpacity(val);

  // Active URL input for current side
  const urlInput = currentSide === 'front' ? frontUrlInput : backUrlInput;
  const setUrlInput = (val) => currentSide === 'front' ? setFrontUrlInput(val) : setBackUrlInput(val);

  const fileInputRef = useRef(null);
  const dragAreaRef = useRef(null);
  const canvasBodyRef = useRef(null);
  const overlayRef = useRef(null);

  // Transform controls states
  const [isSelected, setIsSelected] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // 'move', 'resize', 'rotate'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [transformStart, setTransformStart] = useState({
    scale: 40,
    rotation: 0,
    distance: 1,
    angle: 0
  });

  const handleInteractionStart = (action) => (e) => {
    // Prevent default to prevent scrolling/text selection
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    setIsSelected(true);
    setActiveAction(action);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setDragStart({ x: clientX, y: clientY });
    setStartPos({ x: positionX, y: positionY });

    if (overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      setTransformStart({
        scale,
        rotation,
        distance: dist || 1,
        angle
      });
    }
  };

  const handleInteractionMove = (e) => {
    if (!activeAction || !canvasBodyRef.current) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (activeAction === 'move') {
      const rect = canvasBodyRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      
      const pctX = (deltaX / rect.width) * 100;
      const pctY = (deltaY / rect.height) * 100;
      
      const newX = Math.min(50, Math.max(-50, startPos.x + pctX));
      const newY = Math.min(20, Math.max(-60, startPos.y + pctY));
      
      setPositionX(Math.round(newX));
      setPositionY(Math.round(newY));
    } else if (activeAction === 'resize' && overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);

      const ratio = currentDist / transformStart.distance;
      const newScale = Math.min(120, Math.max(10, transformStart.scale * ratio));
      setScale(Math.round(newScale));
    } else if (activeAction === 'rotate' && overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const currentAngle = Math.atan2(dy, dx);

      const angleDiff = currentAngle - transformStart.angle;
      const degDiff = (angleDiff * 180) / Math.PI;
      const newRotation = ((transformStart.rotation + degDiff + 180) % 360) - 180;
      setRotation(Math.round(newRotation));
    }
  };

  const handleInteractionEnd = () => {
    setActiveAction(null);
  };

  const handleCanvasBodyClick = (e) => {
    // Click outside deselects editor controls
    if (e.target.classList.contains('canvas-body') || e.target.classList.contains('canvas-model-img')) {
      setIsSelected(false);
    }
  };

  // Model image paths
  // Model image paths
  const modelImages = {
    front: {
      male: {
        black: 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/model_male_black.png',
        white: 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/model_male_white.png'
      },
      female: {
        black: 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Female_Black.png',
        white: 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Female_White.png'
      }
    },
    back: {
      male: {
        black: 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Male_Black_BackSide.png',
        white: 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Male_White_BackSide.png'
      },
      female: {
        black: 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Female_Black_BackSide.png',
        white: 'https://res.cloudinary.com/dtx3jvozs/image/upload/hellabold/products/Model_Female_White_BackSide.png'
      }
    }
  };

  const garmentPrices = {
    tee: 1499
  };

  const garmentNames = {
    tee: 'HELLA-LAB Streetwear Tee'
  };

  // Garment colors map
  const colorNames = {
    black: 'hella-BLACK',
    white: 'hella-WHITE'
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file (PNG, JPG, SVG).');
      return;
    }

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.add('drag-active');
    }
  };

  const handleDragLeave = () => {
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('drag-active');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove('drag-active');
    }
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const triggerUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    if (newGender === 'female') {
      // Front default: x=0, y=8
      setFrontPositionX(0);
      setFrontPositionY(8);
      // Back default: x=5, y=8
      setBackPositionX(5);
      setBackPositionY(8);
    } else {
      // Front default: x=5, y=5
      setFrontPositionX(5);
      setFrontPositionY(5);
      // Back default: x=5, y=5
      setBackPositionX(5);
      setBackPositionY(5);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setUploadFileName('');
    setScale(100);
    if (currentSide === 'front') {
      if (gender === 'female') {
        setFrontPositionX(0);
        setFrontPositionY(8);
      } else {
        setFrontPositionX(5);
        setFrontPositionY(5);
      }
    } else {
      if (gender === 'female') {
        setBackPositionX(5);
        setBackPositionY(8);
      } else {
        setBackPositionX(5);
        setBackPositionY(5);
      }
    }
    setRotation(0);
    setOpacity(100);
  };

  const handleAddCustomToCart = (e) => {
    if (!frontImage && !backImage) {
      showError('Please upload a design on the front or back first to manifest your boldness.');
      return;
    }

    const isBothSides = frontImage && backImage;
    const priceNum = isBothSides ? garmentPrices[garmentType] + 79 : garmentPrices[garmentType];
    const itemTitle = `${garmentNames[garmentType]} (${colorNames[color]})`;
    // Base preview model image (always use front view for main catalog/cart thumb)
    const imagePath = modelImages.front[gender][color];
    
    // Create a special custom product payload
    const customProduct = {
      id: `custom-${Date.now()}`,
      title: itemTitle,
      price: `₹${priceNum}`,
      images: [imagePath], // base preview model
      category: 'Custom',
      sizes: [size],
      customDesign: frontImage, // base64 encoded front design
      customDesignName: frontFileName || (frontImage ? 'custom-design-front.png' : ''),
      customDesignBack: backImage, // base64 encoded back design
      customDesignBackName: backFileName || (backImage ? 'custom-design-back.png' : ''),
      customMeta: {
        model: `${gender}_${color}`,
        garmentType,
        color, // map selected color to model (black/white)
        gender,
        size,
        price: priceNum,
        isBothSides,
        instructions: instructionText,
        placement: {
          front: {
            scale: frontScale,
            x: frontPositionX,
            y: frontPositionY,
            rotation: frontRotation,
            opacity: frontOpacity
          },
          back: {
            scale: backScale,
            x: backPositionX,
            y: backPositionY,
            rotation: backRotation,
            opacity: backOpacity
          }
        }
      }
    };

    onAddToCart(customProduct, size);
    triggerConfettiBurst(e.currentTarget);
  };

  return (
    <div className="custom-studio-container" style={{ position: 'relative' }}>
      {errorMessage && (
        <div 
          className="studio-toast"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#111111',
            color: '#ffffff',
            padding: '1rem 1.5rem',
            borderLeft: '4px solid var(--accent-red)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 3000,
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
            animation: 'fadeIn 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '400px'
          }}
        >
          <span>{errorMessage}</span>
          <button 
            type="button" 
            onClick={() => setErrorMessage('')}
            style={{ color: '#ffffff', opacity: 0.6, fontSize: '1rem', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
      <div className="custom-studio-layout">
        
        {/* Left Column: Interactive Live Preview Canvas */}
        <div className="custom-studio-preview-card">
          <div className="preview-canvas-wrapper">

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
              accept="image/*"
            />

            <div 
              className="canvas-body"
              ref={canvasBodyRef}
              onMouseMove={handleInteractionMove}
              onTouchMove={handleInteractionMove}
              onMouseUp={handleInteractionEnd}
              onMouseLeave={handleInteractionEnd}
              onTouchEnd={handleInteractionEnd}
              onClick={handleCanvasBodyClick}
              onDragOver={!uploadedImage ? handleDragOver : null}
              onDragLeave={!uploadedImage ? handleDragLeave : null}
              onDrop={!uploadedImage ? handleDrop : null}
            >
              {/* Garment Base Model Image */}
              <img 
                src={modelImages[currentSide][gender][color]} 
                alt="HELLA-LAB Garment Preview" 
                className="canvas-model-img"
              />

              {/* Uploaded Design Graphic Overlay */}
              {uploadedImage ? (
                <div 
                  className={`canvas-graphic-overlay ${isSelected ? 'is-selected' : ''}`}
                  ref={overlayRef}
                  style={{
                    transform: `translate(-50%, -50%) translate(${positionX}%, ${positionY}%) rotate(${rotation}deg) scale(${scale / 100})`,
                    opacity: opacity / 100,
                    cursor: activeAction === 'move' ? 'grabbing' : 'grab',
                    pointerEvents: 'auto',
                    mixBlendMode: color === 'white' ? 'multiply' : 'normal'
                  }}
                  onMouseDown={handleInteractionStart('move')}
                  onTouchStart={handleInteractionStart('move')}
                >
                  <img 
                    src={uploadedImage} 
                    alt="Custom design overlay" 
                    style={{ pointerEvents: 'none' }} 
                    onError={() => {
                      showError("Unable to load image. Please verify if the URL is a direct link to an image (ending in .png, .jpg, .svg) and allows external hotlinking.");
                      handleReset();
                    }}
                  />
                  
                  {isSelected && (
                    <>
                      {/* Delete Handle (Top-Left Corner) */}
                      <div 
                        className="transform-handle delete-handle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                        title="Delete design"
                      >
                        ✕
                      </div>
                      {/* Resize Handle (Bottom-Right Corner) */}
                      <div 
                        className="transform-handle resize-handle"
                        onMouseDown={handleInteractionStart('resize')}
                        onTouchStart={handleInteractionStart('resize')}
                        title="Drag to resize"
                      />
                      {/* Rotate Handle (Top-Center) */}
                      <div 
                        className="transform-handle rotate-handle"
                        onMouseDown={handleInteractionStart('rotate')}
                        onTouchStart={handleInteractionStart('rotate')}
                        title="Drag to rotate"
                      />
                    </>
                  )}
                </div>
              ) : (
                <div 
                  className="canvas-placeholder-text"
                  style={{ 
                    position: 'absolute', 
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.2rem',
                    width: '85%',
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    padding: '2.5rem 2rem',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Option A: File Uploader Card */}
                  <div 
                    className="clickable-uploader"
                    onClick={triggerUploadClick}
                    style={{ 
                      cursor: 'pointer',
                      border: '2px dashed var(--border-color)',
                      width: '100%',
                      padding: '1.5rem 1rem',
                      textAlign: 'center',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '0.5rem', opacity: 0.8, color: 'var(--accent-color)' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.25rem 0', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '1px' }}>UPLOAD IMAGE</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Click or drag & drop file here</p>
                  </div>

                  {/* Aesthetic OR Separator Line */}
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', letterSpacing: '1px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                  </div>

                  {/* Option B: Image URL Paste Field */}
                  <div style={{ width: '100%' }}>
                    <h3 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>PASTE IMAGE URL</h3>
                    <div 
                      className="url-paste-container"
                      style={{ width: '100%', display: 'flex', gap: '0.5rem' }} 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input 
                        type="url" 
                        placeholder="Paste direct link (ends in .png, .jpg)..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.8rem',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '2px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-primary)'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (urlInput.trim()) {
                              setUploadedImage(urlInput.trim());
                              setUploadFileName('web-image.png');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--accent-color)',
                          color: 'var(--white)',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                        onClick={() => {
                          if (urlInput.trim()) {
                            setUploadedImage(urlInput.trim());
                            setUploadFileName('web-image.png');
                          }
                        }}
                      >
                        APPLY
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="canvas-footer">
              <span className="aesthetic-grid-line"></span>
              <p className="canvas-hint">Drag sliders in the lab panel to adjust sizing, positioning and rotation.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Adjustments */}
        <div className="custom-studio-controls">
          <div className="lab-header">
            <h1 className="lab-title">HELLA-LAB</h1>
            <span className="lab-subtitle">MANIFEST YOUR BOLDNESS</span>
          </div>

          {/* Step 1: Fit Choice */}
          <div className="control-group">
            <h3 className="control-group-title">1. Fit Template</h3>
            <div className="selector-grid">
              <button 
                type="button" 
                className={`selector-btn ${gender === 'male' ? 'active' : ''}`}
                onClick={() => handleGenderChange('male')}
              >
                Male Fit
              </button>
              <button 
                type="button" 
                className={`selector-btn ${gender === 'female' ? 'active' : ''}`}
                onClick={() => handleGenderChange('female')}
              >
                Female Fit
              </button>
            </div>
          </div>

          {/* Step 2: Custom Print Side */}
          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="control-group-title" style={{ margin: 0 }}>2. Print Side</h3>
              {frontImage && backImage && (
                <span style={{ fontSize: '0.65rem', backgroundColor: '#38a169', color: '#fff', padding: '0.2rem 0.5rem', fontWeight: 'bold', letterSpacing: '0.5px', borderRadius: '2px' }}>
                  BOTH SIDES (+₹79)
                </span>
              )}
            </div>
            <div className="selector-grid">
              <button 
                type="button" 
                className={`selector-btn ${currentSide === 'front' ? 'active' : ''}`}
                onClick={() => setCurrentSide('front')}
                style={{ position: 'relative' }}
              >
                Front Side {frontImage && <span style={{ position: 'absolute', right: '12px', color: '#38a169', fontWeight: 'bold' }}>✓</span>}
              </button>
              <button 
                type="button" 
                className={`selector-btn ${currentSide === 'back' ? 'active' : ''}`}
                onClick={() => setCurrentSide('back')}
                style={{ position: 'relative' }}
              >
                Back Side {backImage && <span style={{ position: 'absolute', right: '12px', color: '#38a169', fontWeight: 'bold' }}>✓</span>}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.7, color: 'var(--text-secondary)' }}>
              Tip: Print on both sides for just ₹79 extra!
            </span>
          </div>

          {/* Step 3: Garment Color Base */}
          <div className="control-group">
            <h3 className="control-group-title">3. Garment Color Base</h3>
            <div className="selector-grid">
              <button 
                type="button" 
                className={`selector-btn ${color === 'black' ? 'active' : ''}`}
                onClick={() => setColor('black')}
              >
                hella-BLACK
              </button>
              <button 
                type="button" 
                className={`selector-btn ${color === 'white' ? 'active' : ''}`}
                onClick={() => setColor('white')}
              >
                hella-WHITE
              </button>
            </div>
          </div>

          {/* Step 4: Choose Size */}
          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="control-group-title" style={{ margin: 0 }}>4. Size Selection</h3>
              <button 
                type="button" 
                className="size-chart-link-btn" 
                onClick={() => {
                  setIsSizeChartOpen(true);
                }}
              >
                Size Chart
              </button>
            </div>
            <div className="sizes-selector-row">
              {['S', 'M', 'L', 'X', 'XL', 'XXL'].map(s => {
                const displaySize = s === 'X' ? 'L' : s; // adjust for layout mapping
                if (s === 'X') return null;
                return (
                  <button
                     key={s}
                     type="button"
                     className={`size-square-btn ${size === s ? 'active' : ''}`}
                     onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Adjust Graphic Alignment */}
          {uploadedImage && (
            <div className="control-group adjustment-panel">
              <div className="adjustment-header">
                <h3 className="control-group-title" style={{ margin: 0 }}>5. Placement Lab ({currentSide.toUpperCase()})</h3>
                <button type="button" className="reset-btn" onClick={handleReset}>Reset Design</button>
              </div>

              {/* Scale Slider */}
              <div className="slider-row">
                <div className="slider-label-row">
                  <label htmlFor="scale-slider">Scale</label>
                  <span>{scale}%</span>
                </div>
                <input 
                  id="scale-slider"
                  type="range" 
                  min="10" 
                  max="120" 
                  value={scale} 
                  onChange={e => setScale(parseInt(e.target.value, 10))}
                  className="lab-slider"
                />
              </div>

              {/* Position X Slider */}
              <div className="slider-row">
                <div className="slider-label-row">
                  <label htmlFor="x-slider">X Position</label>
                  <span>{positionX > 0 ? `+${positionX}` : positionX}%</span>
                </div>
                <input 
                  id="x-slider"
                  type="range" 
                  min="-50" 
                  max="50" 
                  value={positionX} 
                  onChange={e => setPositionX(parseInt(e.target.value, 10))}
                  className="lab-slider"
                />
              </div>

              {/* Position Y Slider */}
              <div className="slider-row">
                <div className="slider-label-row">
                  <label htmlFor="y-slider">Y Position</label>
                  <span>{positionY > 0 ? `+${positionY}` : positionY}%</span>
                </div>
                <input 
                  id="y-slider"
                  type="range" 
                  min="-60" 
                  max="20" 
                  value={positionY} 
                  onChange={e => setPositionY(parseInt(e.target.value, 10))}
                  className="lab-slider"
                />
              </div>

              {/* Rotation Slider */}
              <div className="slider-row">
                <div className="slider-label-row">
                  <label htmlFor="rotation-slider">Rotation</label>
                  <span>{rotation}°</span>
                </div>
                <input 
                  id="rotation-slider"
                  type="range" 
                  min="-180" 
                  max="180" 
                  value={rotation} 
                  onChange={e => setRotation(parseInt(e.target.value, 10))}
                  className="lab-slider"
                />
              </div>

              {/* Opacity Slider */}
              <div className="slider-row">
                <div className="slider-label-row">
                  <label htmlFor="opacity-slider">Opacity</label>
                  <span>{opacity}%</span>
                </div>
                <input 
                  id="opacity-slider"
                  type="range" 
                  min="10" 
                  max="100" 
                  value={opacity} 
                  onChange={e => setOpacity(parseInt(e.target.value, 10))}
                  className="lab-slider"
                />
              </div>
            </div>
          )}

          {/* Step 6: Bold Instructions */}
          <div className="control-group" style={{ marginTop: '0.5rem' }}>
            <h3 className="control-group-title">6. Bold Instructions (Optional)</h3>
            <textarea
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              placeholder={currentPlaceholder}
              style={{
                width: '100%',
                height: '85px',
                padding: '0.8rem 1rem',
                fontSize: '0.8rem',
                border: '1px solid var(--border-color)',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                backgroundColor: '#ffffff',
                color: 'var(--text-primary)',
                transition: 'border var(--transition-fast)'
              }}
            />
          </div>

          {/* Add to Cart Actions */}
          <div className="lab-action-group">
            <button 
              type="button" 
              className={`btn btn--primary lab-submit-btn ${!(frontImage || backImage) ? 'disabled' : ''}`}
              onClick={handleAddCustomToCart}
              disabled={!(frontImage || backImage)}
            >
              Add Custom Tee to Bag (₹{frontImage && backImage ? garmentPrices[garmentType] + 79 : garmentPrices[garmentType]})
            </button>
          </div>

        </div>

      </div>

      {isSizeChartOpen && (
        <div className="size-chart-modal-overlay" onClick={() => setIsSizeChartOpen(false)}>
          <div className="size-chart-modal-container" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="size-chart-close-btn" 
              onClick={() => setIsSizeChartOpen(false)}
            >
              ✕
            </button>
            <h2 className="size-chart-title">HELLA-LAB</h2>
            <span className="size-chart-subtitle">GARMENT SIZE GUIDE</span>
            
            <div className="size-chart-table-wrapper">
              <table className="size-chart-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest (inches)</th>
                    <th>Length (inches)</th>
                    <th>Shoulder (inches)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>S</td>
                    <td>40"</td>
                    <td>27.5"</td>
                    <td>19"</td>
                  </tr>
                  <tr>
                    <td>M</td>
                    <td>42"</td>
                    <td>28.5"</td>
                    <td>20"</td>
                  </tr>
                  <tr>
                    <td>L</td>
                    <td>44"</td>
                    <td>29.5"</td>
                    <td>21"</td>
                  </tr>
                  <tr>
                    <td>XL</td>
                    <td>46"</td>
                    <td>30.5"</td>
                    <td>22"</td>
                  </tr>
                  <tr>
                    <td>XXL</td>
                    <td>48"</td>
                    <td>31.5"</td>
                    <td>23"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="size-chart-note">
              <strong>FIT ADVICE:</strong> HELLA-LAB garments feature a modern, slightly oversized streetwear cut. 
              We recommend ordering your standard size for the intended relaxed aesthetic, or sizing down if you prefer a standard tailored fit.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomStudio;

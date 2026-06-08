import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { triggerConfettiBurst } from '../utils/confetti';
import { cloudinaryOptimize } from '../utils/cloudinary';

const HELLA_RESPONSES = {
  welcome: [
    "Yo! I'm Hella, the resident gatekeeper of style. I see you eyeballing that piece. It's premium thread, but... what's your offer? Let's talk numbers.",
    "Hey! You want the drip but don't want to pay retail? Let's play a game. Make me an offer I can't refuse, but keep it real.",
    "A custom negotiator enters the chat. Clean taste, respect. I want to see this piece on the streets, so what's your bid? Let's haggle.",
    "Bargaining mode: ON. Hella in the house. I know this tee looks fires, but what's your budget? Pitch me a number.",
    "I usually don't do discounts, but you look like you know your fashion. What's your offer? Let's make a deal.",
    "What's up! Ready to cop the finest fits? Let's negotiate. Give me a number that makes us both look good.",
    "Respect! Staring at the merchandise, are we? Let's talk business. Tell me what you're willing to pay."
  ],
  insultinglyLow: [
    "Whoa, whoa, whoa! Are you trying to put me out of business? I have a design team to feed. Give me a real number!",
    "₹{userOffer}? For this quality? That bid is weaker than cheap polyester. Try again before I kick you out of the lab!",
    "Is that a typo, or are you just testing my patience? That doesn't even cover the stitching costs. Be serious!",
    "Bruh. My servers cost more than that offer. Respect the drip. Give me a sensible offer.",
    "Haha, very funny. You want me to give it away for free? ₹{userOffer} is not happening. Hit me with a real price.",
    "Ouch. That hurt my threads. ₹{userOffer} is a total lowball. I'm bold, not running a charity!",
    "Are we reading the same price tag? ₹{userOffer} is way too low. Let's act like professional fashionistas.",
    "Man, that's not even enough for custom packaging! Boost your offer if you want to walk away with this design."
  ],
  normalCounter: [
    "Alright, you're driving a hard bargain. I can't do ₹{userOffer}, but I can meet you at ₹{hellaOffer}. Deal?",
    "Okay, let's compromise. I'll drop my price to ₹{hellaOffer} if you can match that energy.",
    "That's still a bit low, but I like your boldness. How about we split the difference at ₹{hellaOffer}?",
    "I'll meet you halfway. Let's do ₹{hellaOffer} and get this shipped to your wardrobe.",
    "Let's meet in the middle. I'll let it go for ₹{hellaOffer} right now. What do you think?",
    "I see you, trying to save every rupee! Fine, let's settle on ₹{hellaOffer}. Do we have a deal?",
    "You negotiate like a pro. How about ₹{hellaOffer} and we call it a day?",
    "Hmm, how about ₹{hellaOffer}? That's a premium discount on a premium design."
  ],
  veryClose: [
    "You know what? I respect the hustle. You've earned it. Let's lock it in at ₹{hellaOffer}!",
    "That is so close, I'm just going to give it to you. Deal accepted at ₹{hellaOffer}!",
    "Deal. ₹{hellaOffer} is yours. You just copped a steal. Wear it bold.",
    "Alright, you won. Let's close the deal at ₹{hellaOffer}. Great negotiating!",
    "Perfect match. ₹{hellaOffer} works for me. Adding it to the box!",
    "I like your style. Deal accepted at ₹{hellaOffer}. Welcome to the HELLABOLD club."
  ],
  finalWarning: [
    "Listen up, this is round 5. My absolute final, bottom-line offer is ₹{hellaOffer}. Take it, or it goes back on the rack.",
    "This is the last thread. Take the deal at ₹{hellaOffer} or we walk. What's it gonna be?",
    "Okay, no more games. This is as low as I can physically go: ₹{hellaOffer}. Click Accept or return to retail.",
    "End of the runway. ₹{hellaOffer} is my final offer. Take it or leave the shop, no hard feelings.",
    "Last call for this drop. I can lock it in at ₹{hellaOffer} but not a single rupee less. Deal?",
    "This is it. The ultimate boundary: ₹{hellaOffer}. Your move, fashion collector."
  ],
  closeToFloor: [
    "Ah, you're super close! Just a tiny bit more and we have a deal. Make it ₹{hellaOffer}?",
    "Come on, you're almost at my limit. Meet me at ₹{hellaOffer} and it's yours!",
    "So close! Let's do ₹{hellaOffer} - not yours, not mine. Deal?",
    "You're right on the edge of my bottom line. Can you push it to ₹{hellaOffer}?",
    "Just a tiny push! Add a small fraction more. Let's shake hands at ₹{hellaOffer}."
  ],
  moderateLow: [
    "I appreciate the offer, but ₹{userOffer} is a bit too low for this premium design. Can we do ₹{hellaOffer}?",
    "We're still a bit far apart. ₹{userOffer} won't cover the premium fabric. Let's compromise at ₹{hellaOffer}.",
    "I can't let it go for ₹{userOffer}, but I'm willing to meet you at ₹{hellaOffer}. How's that sound?",
    "A bit low, but I want to make this work. How about ₹{hellaOffer} instead?",
    "₹{userOffer} is a stretch for me. Can you push it to ₹{hellaOffer}?"
  ]
};

const BargainModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const originalPriceVal = product?.price ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : 0;
  const floorPrice = Math.round(originalPriceVal * 0.8); // 20% discount max

  const [rounds, setRounds] = useState(1);
  const [maxRounds] = useState(5);
  const [userOfferInput, setUserOfferInput] = useState('');
  const [hellaCurrentOffer, setHellaCurrentOffer] = useState(originalPriceVal);
  const [messages, setMessages] = useState([]);
  const [dealAccepted, setDealAccepted] = useState(false);
  const [dealClosed, setDealClosed] = useState(false);
  
  const chatEndRef = useRef(null);

  // Scroll lock background when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Initialize chat
  useEffect(() => {
    if (!isOpen || !product) return;
    const welcomeMsgs = HELLA_RESPONSES.welcome;
    const randomWelcome = welcomeMsgs[Math.floor(Math.random() * welcomeMsgs.length)];
    setMessages([
      {
        sender: 'hella',
        text: randomWelcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [isOpen, product]);

  // Scroll to bottom on messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, text) => {
    setMessages(prev => [
      ...prev,
      {
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleMakeOffer = (e) => {
    e.preventDefault();
    if (!userOfferInput) return;

    const userBid = parseFloat(userOfferInput);
    if (isNaN(userBid) || userBid <= 0) {
      alert("Please enter a valid amount to negotiate.");
      return;
    }

    setUserOfferInput('');
    addMessage('user', `How about ₹${userBid}?`);

    setTimeout(() => {
      processOffer(userBid);
    }, 600);
  };

  const processOffer = (userBid) => {
    // Check if user offered more than Hella's current active counter-offer
    if (userBid >= hellaCurrentOffer) {
      setHellaCurrentOffer(userBid);
      addMessage('hella', `Wait, you're offering ₹${userBid} which is even higher than my counter of ₹${hellaCurrentOffer}? That is extremely bold! Deal accepted! Easiest business I've done today.`);
      setDealAccepted(true);
      setDealClosed(true);
      triggerConfettiBurst(document.querySelector('.lab-submit-btn') || document.body);
      return;
    }

    // If it's the final round
    if (rounds >= maxRounds) {
      if (userBid >= floorPrice) {
        setHellaCurrentOffer(userBid);
        addMessage('hella', `Round 5—final stretch. You know what? You've got style and you don't back down. ₹${userBid} is a deal. Let's lock it in!`);
        setDealAccepted(true);
        setDealClosed(true);
        triggerConfettiBurst(document.querySelector('.lab-submit-btn') || document.body);
      } else {
        setDealClosed(true);
        setHellaCurrentOffer(floorPrice);
        const warnings = HELLA_RESPONSES.finalWarning;
        const response = warnings[Math.floor(Math.random() * warnings.length)].replace('{hellaOffer}', floorPrice);
        addMessage('hella', response);
      }
      return;
    }

    // Logic 1: Offer is close to or below floor price
    if (userBid < floorPrice) {
      // If the bid is close to the floor price (within 15% or within ₹100 of the floor)
      const isCloseToFloor = userBid >= floorPrice * 0.85 || (floorPrice - userBid) <= 100;
      if (isCloseToFloor) {
        // Set Hella's counter to slightly above the floor (halfway between user bid and a small floor buffer)
        let nextHellaOffer = Math.round(floorPrice + (floorPrice - userBid) * 0.5);
        if (nextHellaOffer <= floorPrice) {
          nextHellaOffer = floorPrice + 10;
        }
        setHellaCurrentOffer(nextHellaOffer);
        
        const closeFloorMsgs = HELLA_RESPONSES.closeToFloor;
        const response = closeFloorMsgs[Math.floor(Math.random() * closeFloorMsgs.length)].replace('{hellaOffer}', nextHellaOffer);
        addMessage('hella', response);
      } else if (userBid >= floorPrice * 0.60) {
        // Moderate low bid: firm but polite refusal
        let nextHellaOffer = Math.round((hellaCurrentOffer + floorPrice) / 2);
        if (nextHellaOffer < floorPrice) {
          nextHellaOffer = floorPrice;
        }
        setHellaCurrentOffer(nextHellaOffer);

        const modMsgs = HELLA_RESPONSES.moderateLow;
        const response = modMsgs[Math.floor(Math.random() * modMsgs.length)]
          .replace('{userOffer}', userBid)
          .replace('{hellaOffer}', nextHellaOffer);
        addMessage('hella', response);
      } else {
        // Extreme lowball: trigger sassy insult response
        const lowMsgs = HELLA_RESPONSES.insultinglyLow;
        const response = lowMsgs[Math.floor(Math.random() * lowMsgs.length)].replace('{userOffer}', userBid);
        
        const nextHellaOffer = Math.round(
          hellaCurrentOffer - (hellaCurrentOffer - floorPrice) * 0.3
        );
        setHellaCurrentOffer(nextHellaOffer);
        
        addMessage('hella', response);
        addMessage('hella', `I can't go that low. My counter is ₹${nextHellaOffer}.`);
      }
    } 

    // Logic 2: Offer is extremely close to current offer/floor (within 3% of floor or above)
    else if (userBid >= floorPrice && userBid >= hellaCurrentOffer * 0.97) {
      // Accept deal
      setHellaCurrentOffer(userBid);
      const closeMsgs = HELLA_RESPONSES.veryClose;
      const response = closeMsgs[Math.floor(Math.random() * closeMsgs.length)].replace('{hellaOffer}', userBid);
      addMessage('hella', response);
      setDealAccepted(true);
      setDealClosed(true);
      triggerConfettiBurst(document.querySelector('.lab-submit-btn') || document.body);
    } 
    // Logic 3: Standard counter offer
    else {
      // Meet halfway between userBid and Hella's current offer, ensuring it stays above floor
      let nextHellaOffer = Math.round((hellaCurrentOffer + userBid) / 2);
      if (nextHellaOffer < floorPrice) {
        nextHellaOffer = floorPrice;
      }
      setHellaCurrentOffer(nextHellaOffer);

      const counters = HELLA_RESPONSES.normalCounter;
      const response = counters[Math.floor(Math.random() * counters.length)].replace('{userOffer}', userBid).replace('{hellaOffer}', nextHellaOffer);
      addMessage('hella', response);
    }

    setRounds(prev => prev + 1);
  };

  const handleAcceptDeal = () => {
    // Add item to cart with special bargained price metadata
    const bargainedProduct = {
      ...product,
      id: `${product.id}-bargain-${Date.now()}`,
      price: `₹${hellaCurrentOffer}`, // override price
      title: `${product.title} (Hella Bargained Deal)`,
      customMeta: {
        ...product.customMeta,
        originalPrice: product.price,
        isBargained: true
      }
    };

    onAddToCart(bargainedProduct);
    triggerConfettiBurst(document.querySelector('.bargain-accept-btn') || document.body);
    
    // Close modal
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay auth-modal-overlay active" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-container"
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '500px', 
          height: '620px', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.2rem 1.5rem',
          backgroundColor: '#0c0002ea',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            backgroundColor: '#fff',
            border: '2px solid var(--accent-color)'
          }}>
            <img 
              src={cloudinaryOptimize('https://res.cloudinary.com/dtx3jvozs/image/upload/v1780506713/hellabold/products/hella_is_sad.png')} 
              alt="Hella Mascot" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.3) translateY(2px)' }} 
            />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' }}>AI Bargain with Hella</h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Round {Math.min(rounds, maxRounds)} of {maxRounds}</span>
          </div>
          <button 
            onClick={onClose} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: '1.8rem', cursor: 'pointer' }}
          >&times;</button>
        </div>

        {/* Product Tiny Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.8rem 1.5rem',
          backgroundColor: '#f7f7f7',
          borderBottom: '1px solid var(--border-color)',
          gap: '1rem'
        }}>
          <img src={cloudinaryOptimize(product.images?.[0])} alt={product.title} style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>{product.title}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Retail Price: <strong>{product.price}</strong></span>
          </div>
        </div>

        {/* Chat History Container */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          backgroundColor: '#fff'
        }}>
          {messages.map((msg, index) => (
            <div 
              key={index}
              style={{
                alignSelf: msg.sender === 'hella' ? 'flex-start' : 'flex-end',
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'hella' ? 'flex-start' : 'flex-end'
              }}
            >
              <div style={{
                backgroundColor: msg.sender === 'hella' ? '#f1f1f1' : 'var(--text-primary)',
                color: msg.sender === 'hella' ? 'var(--text-primary)' : '#fff',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                whiteSpace: 'pre-line'
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {msg.sender === 'hella' ? 'Hella' : 'You'} • {msg.timestamp}
              </span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Action Panel */}
        <div style={{
          padding: '1.2rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: '#fdfdfd',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Current pricing state strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span>Hella's Current Offer: <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', marginRight: '6px' }}>{product.price}</span> ➔ <strong style={{ color: 'var(--accent-color)', marginLeft: '6px' }}>₹{hellaCurrentOffer}</strong></span>
            <span>Rounds Left: <strong>{maxRounds - Math.min(rounds - 1, maxRounds)}</strong></span>
          </div>

          {dealAccepted ? (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <span style={{ color: '#38a169', fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
                🎉 DEAL ACCEPTED AT ₹{hellaCurrentOffer}!
              </span>
              <button 
                onClick={handleAcceptDeal}
                className="btn btn--primary bargain-accept-btn"
                style={{ width: '100%' }}
              >
                Add Bargained Tee to Bag
              </button>
            </div>
          ) : dealClosed ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={handleAcceptDeal}
                className="btn btn--primary bargain-accept-btn"
                style={{ flex: 1 }}
              >
                Accept Final Offer (₹{hellaCurrentOffer})
              </button>
              <button 
                onClick={onClose}
                className="btn btn--outline"
                style={{ flex: 1 }}
              >
                No Deal, Decline
              </button>
            </div>
          ) : (
            <form onSubmit={handleMakeOffer} style={{ display: 'flex', gap: '0.8rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>₹</span>
                <input 
                  type="number" 
                  placeholder="Enter your offer price..."
                  value={userOfferInput}
                  onChange={e => setUserOfferInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 1.8rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  min="1"
                  max={originalPriceVal}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn--primary" 
                style={{ whiteSpace: 'nowrap', padding: '0.8rem 1.5rem', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem' }}
              >
                Offer
              </button>
              <button 
                type="button"
                onClick={handleAcceptDeal}
                className="btn btn--outline"
                style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                Accept (₹{hellaCurrentOffer})
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BargainModal;

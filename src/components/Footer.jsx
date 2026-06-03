import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

const Footer = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('newsletter_subscribers')
          .upsert(
            { email: email.trim(), subscribed_at: new Date().toISOString() },
            { onConflict: 'email' }
          );
      }
    } catch (err) {
      // Silently fail — table may not exist yet. Subscription UI still succeeds.
      console.warn('[Newsletter] Could not store subscriber:', err);
    }

    setSubscribed(true);
    setEmail('');
  };

  const handleNavClick = (path) => (e) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    if (onNavigate) onNavigate(path);
  };

  return (
    <footer className="footer">
      {/* Top Strip */}
      <div className="footer__top-strip">
        <span>FREE SHIPPING ON ORDERS ABOVE ₹1999</span>
        <span className="footer__strip-dot">·</span>
        <span>AUTHENTIC STREETWEAR. NO COMPROMISES.</span>
        <span className="footer__strip-dot">·</span>
        <span>NEW DROPS EVERY FRIDAY</span>
      </div>

      {/* Main Footer Grid */}
      <div className="footer__main">

        {/* Brand Column */}
        <div className="footer__brand">
          <h2 className="footer__logo" onClick={handleNavClick('/')} style={{ cursor: 'pointer' }}>HELLABOLD</h2>
          <p className="footer__tagline">
            Unapologetically loud. Hella bold.<br />
            Premium streetwear built for those who refuse to blend in.
          </p>
          <div className="footer__social">
            <a href="https://www.instagram.com/hellaboldofficial/" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://www.facebook.com/people/Hellabold-Fashion/61590515552245/" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="https://x.com/wearhellabold" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="X / Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Shop Column */}
        <div className="footer__col">
          <h4 className="footer__col-title">Shop</h4>
          <ul className="footer__links">
            <li><a href="/" onClick={handleNavClick('/')} className="footer__link">New Arrivals</a></li>
            <li><a href="/?category=Tops" onClick={handleNavClick('/?category=Tops')} className="footer__link">Printed Tees</a></li>
            <li><a href="/collections" onClick={handleNavClick('/collections')} className="footer__link">Limited Drops</a></li>
            <li><a href="/collections" onClick={handleNavClick('/collections')} className="footer__link">Collections</a></li>
            <li><a href="/custom-studio" onClick={handleNavClick('/custom-studio')} className="footer__link">Custom Studio</a></li>
          </ul>
        </div>

        {/* Help Column */}
        <div className="footer__col">
          <h4 className="footer__col-title">Help</h4>
          <ul className="footer__links">
            <li><a href="/order-status" onClick={handleNavClick('/order-status')} className="footer__link">Track My Order</a></li>
            <li><a href="/shipping-policy" onClick={handleNavClick('/shipping-policy')} className="footer__link">Shipping Policy</a></li>
            <li><a href="/returns-exchanges" onClick={handleNavClick('/returns-exchanges')} className="footer__link">Returns &amp; Exchanges</a></li>
            <li><a href="/size-guide" onClick={handleNavClick('/size-guide')} className="footer__link">Size Guide</a></li>
            <li><a href="/faqs" onClick={handleNavClick('/faqs')} className="footer__link">FAQs</a></li>
            <li><a href="/contact" onClick={handleNavClick('/contact')} className="footer__link">Contact Us</a></li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="footer__col footer__newsletter">
          <h4 className="footer__col-title">Stay Bold</h4>
          <p className="footer__newsletter-desc">
            Get early access to new drops, exclusive promos and zero spam. Ever.
          </p>
          {subscribed ? (
            <p className="footer__subscribed-msg">✓ You're in. Stay bold.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="footer__newsletter-form">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="footer__newsletter-input"
              />
              <button type="submit" className="footer__newsletter-btn">
                Subscribe
              </button>
            </form>
          )}
          <div className="footer__payment-icons">
            <span className="footer__payment-badge">VISA</span>
            <span className="footer__payment-badge">MC</span>
            <span className="footer__payment-badge">UPI</span>
            <span className="footer__payment-badge">COD</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <span className="footer__copyright">© {new Date().getFullYear()} HELLABOLD. All rights reserved.</span>
        <div className="footer__legal">
          <a href="/about" onClick={handleNavClick('/about')} className="footer__legal-link">About Us</a>
          <a href="/privacy" onClick={handleNavClick('/privacy')} className="footer__legal-link">Privacy Policy</a>
          <a href="/terms" onClick={handleNavClick('/terms')} className="footer__legal-link">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

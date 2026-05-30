import React, { useState } from 'react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
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
          <h2 className="footer__logo">HELLABOLD</h2>
          <p className="footer__tagline">
            Unapologetically loud. Hella bold.<br />
            Premium streetwear built for those who refuse to blend in.
          </p>
          <div className="footer__social">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="X / Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Shop Column */}
        <div className="footer__col">
          <h4 className="footer__col-title">Shop</h4>
          <ul className="footer__links">
            <li><a href="/" className="footer__link">New Arrivals</a></li>
            <li><a href="/" className="footer__link">Hoodies</a></li>
            <li><a href="/" className="footer__link">T-Shirts</a></li>
            <li><a href="/" className="footer__link">Shorts</a></li>
            <li><a href="/" className="footer__link">Accessories</a></li>
            <li><a href="/" className="footer__link">Sale</a></li>
          </ul>
        </div>

        {/* Help Column */}
        <div className="footer__col">
          <h4 className="footer__col-title">Help</h4>
          <ul className="footer__links">
            <li><a href="/order-status" className="footer__link">Track My Order</a></li>
            <li><a href="/" className="footer__link">Shipping Policy</a></li>
            <li><a href="/" className="footer__link">Returns &amp; Exchanges</a></li>
            <li><a href="/" className="footer__link">Size Guide</a></li>
            <li><a href="/" className="footer__link">FAQs</a></li>
            <li><a href="mailto:support@hellabold.com" className="footer__link">Contact Us</a></li>
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
          <a href="/" className="footer__legal-link">Privacy Policy</a>
          <a href="/" className="footer__legal-link">Terms of Service</a>
          <a href="/" className="footer__legal-link">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

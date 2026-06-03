import React, { useState } from 'react';

const ContactUs = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;

    setSending(true);
    // Simulate API Request
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="contact-page">
      <div className="contact-page__container">
        
        {/* Header Section */}
        <div className="contact-page__header">
          <h1 className="contact-page__title">GET IN TOUCH</h1>
          <p className="contact-page__subtitle">
            HAVE A QUESTION ABOUT AN ORDER, DROP, OR COLLAB? WE'VE GOT YOU COVERED.
          </p>
        </div>

        <div className="contact-page__grid">
          {/* Info Card Column */}
          <div className="contact-page__info-panel">
            <div className="contact-info-card">
              <h3 className="contact-info-card__title">HELLABOLD HQ</h3>
              <p className="contact-info-card__desc">
                Unapologetically loud streetwear, built and shipped from the heart of the streetwear culture.
              </p>
              
              <div className="contact-details-list">
                <div className="contact-detail-item">
                  <div className="contact-detail-item__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="contact-detail-item__content">
                    <span className="contact-detail-item__label">EMAIL SUPPORT</span>
                    <a href="mailto:support@hellabold.com" className="contact-detail-item__link">support@hellabold.com</a>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-item__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div className="contact-detail-item__content">
                    <span className="contact-detail-item__label">CALL OR WHATSAPP</span>
                    <a href="tel:+919999988888" className="contact-detail-item__link">+91 99999 88888</a>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-item__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="contact-detail-item__content">
                    <span className="contact-detail-item__label">HEADQUARTERS</span>
                    <span className="contact-detail-item__value">Bandra West, Link Road, Mumbai, MH - 400050</span>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-detail-item__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="contact-detail-item__content">
                    <span className="contact-detail-item__label">BUSINESS HOURS</span>
                    <span className="contact-detail-item__value">Monday – Saturday: 11:00 AM – 8:00 PM IST</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="contact-page__form-panel">
            <form onSubmit={handleSubmit} className="contact-form">
              <h3 className="contact-form__title">SEND MESSAGE</h3>
              
              {sent && (
                <div className="contact-form__success">
                  <div className="success-checkmark">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="success-content">
                    <h4>MESSAGE SENT SUCCESSFULLY!</h4>
                    <p>We'll review your inquiry and get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              <div className="contact-form__field">
                <input 
                  type="text" 
                  id="contact-name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                  placeholder=" "
                  className="contact-form__input"
                />
                <label htmlFor="contact-name" className="contact-form__label">FULL NAME</label>
              </div>

              <div className="contact-form__field">
                <input 
                  type="email" 
                  id="contact-email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  placeholder=" "
                  className="contact-form__input"
                />
                <label htmlFor="contact-email" className="contact-form__label">EMAIL ADDRESS</label>
              </div>

              <div className="contact-form__field">
                <input 
                  type="text" 
                  id="contact-subject" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  required
                  placeholder=" "
                  className="contact-form__input"
                />
                <label htmlFor="contact-subject" className="contact-form__label">SUBJECT</label>
              </div>

              <div className="contact-form__field">
                <textarea 
                  id="contact-message" 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  required
                  rows="5"
                  placeholder=" "
                  className="contact-form__textarea"
                />
                <label htmlFor="contact-message" className="contact-form__label">YOUR MESSAGE</label>
              </div>

              <button 
                type="submit" 
                className={`contact-form__submit-btn ${sending ? 'sending' : ''}`}
                disabled={sending}
              >
                {sending ? (
                  <span className="btn-spinner"></span>
                ) : 'SUBMIT MESSAGE'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactUs;

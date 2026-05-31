import React, { useState } from 'react';

const FaqPage = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "When do new collection drops happen?",
      answer: "We release limited, signature streetwear drops every Friday. Follow our Instagram or sign up for our newsletter to get early access details. Once a collection sells out, it will not be restocked."
    },
    {
      question: "What are your shipping rates and timelines?",
      answer: "We offer Free Shipping on all online prepaid orders. For Cash on Delivery (COD) orders, a flat ₹50 shipping fee applies. Orders are dispatched within 24-48 hours and typically arrive within 3-5 business days."
    },
    {
      question: "How does Cash on Delivery (COD) phone verification work?",
      answer: "To secure COD orders and prevent failed deliveries, we require a quick mobile verification. Upon placing your order, a verification modal will prompt you to enter a 4-digit code sent to your phone number."
    },
    {
      question: "What is your return and exchange policy?",
      answer: "Due to the limited nature of our drops, we accept returns and exchanges within 7 days of delivery only if the product is unworn, unwashed, and has its original tag intact. Please reach out to support@hellabold.com to initiate the process."
    },
    {
      question: "How do I choose the correct size?",
      answer: "Our graphic t-shirts are designed with a modern, boxy, oversized streetwear fit. If you prefer a standard, closer fit, we recommend ordering one size down from your usual size. Check the details on the product details page for GSM and cut specifics."
    },
    {
      question: "Are your graphics print-durable?",
      answer: "Yes, all our graphics are printed using high-density premium screen printing inks and puff printing methods that resist cracking. We recommend washing your t-shirts inside out in cold water and hanging them to dry."
    }
  ];

  return (
    <div className="faq-page-container" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', borderBottom: '2px solid var(--text-primary)', paddingBottom: '1rem' }}>Frequently Asked Questions</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '3rem' }}>Find quick answers regarding our limited drops, shipping rules, COD options, and garment sizing specifications.</p>
      
      <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {faqs.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <div 
              key={index} 
              style={{ 
                borderBottom: '1px solid var(--border-color)', 
                paddingBottom: '1.2rem',
                cursor: 'pointer'
              }}
              onClick={() => setActiveIndex(isOpen ? null : index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                  {faq.question}
                </h3>
                <span style={{ fontSize: '1.5rem', fontWeight: '300', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }}>+</span>
              </div>
              
              <div 
                style={{ 
                  maxHeight: isOpen ? '200px' : '0', 
                  overflow: 'hidden', 
                  transition: 'max-height 0.3s cubic-bezier(0, 1, 0, 1), opacity 0.3s ease',
                  opacity: isOpen ? 1 : 0
                }}
              >
                <p style={{ marginTop: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '1rem 0 0 0' }}>
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FaqPage;

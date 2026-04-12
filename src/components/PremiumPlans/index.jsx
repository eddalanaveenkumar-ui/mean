import React from 'react';
import './PremiumPlans.css';

export default function PremiumPlans({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleCheckout = (planId, price) => {
    alert(`Checkout Gateway Data will be given later. Plan: ${planId}, Price: ₹${price}`);
  };

  return (
    <div className="premium-plans-overlay">
      <div className="premium-plans-modal">
        <header className="premium-plans-header">
          <div className="header-title">
            <i className="fas fa-crown" style={{ color: '#ec4899' }}/>
            <h2>Premium Plans</h2>
          </div>
          <button className="pp-close-btn" onClick={onClose}>&times;</button>
        </header>

        <div className="plans-content">
          <p className="plans-subtitle">Upgrade your experience and get premium tokens that never expire abruptly!</p>

          <div className="plans-grid">
            {/* Basic Plan */}
            <div className="plan-card">
              <div className="plan-tag">BASIC</div>
              <h3 className="plan-price">₹ 99</h3>
              <p className="plan-period">/ month</p>
              <ul className="plan-features">
                <li><i className="fas fa-check"/> 5 Premium Tokens</li>
                <li><i className="fas fa-check"/> Ad-free experience</li>
                <li><i className="fas fa-check"/> Basic Support</li>
              </ul>
              <button className="plan-btn" onClick={() => handleCheckout('basic', 99)}>
                Upgrade Now
              </button>
            </div>

            {/* Pro Plan */}
            <div className="plan-card pro">
              <div className="plan-tag popular">MOST POPULAR</div>
              <h3 className="plan-price">₹ 199</h3>
              <p className="plan-period">/ month</p>
              <ul className="plan-features">
                <li><i className="fas fa-check"/> 10 Premium Tokens</li>
                <li><i className="fas fa-check"/> Priority Generation</li>
                <li><i className="fas fa-check"/> Ad-free experience</li>
                <li><i className="fas fa-check"/> Standard Support</li>
              </ul>
              <button className="plan-btn pro-btn" onClick={() => handleCheckout('pro', 199)}>
                Upgrade to Pro
              </button>
            </div>

            {/* Max Plan */}
            <div className="plan-card master">
              <div className="plan-tag master-tag">MASTER</div>
              <h3 className="plan-price">₹ 399</h3>
              <p className="plan-period">/ month</p>
              <ul className="plan-features">
                <li><i className="fas fa-check"/> Unlimited Tokens*</li>
                <li><i className="fas fa-check"/> Fastest Generation</li>
                <li><i className="fas fa-check"/> Exclusive AI Models</li>
                <li><i className="fas fa-check"/> 24/7 Priority Support</li>
              </ul>
              <button className="plan-btn master-btn" onClick={() => handleCheckout('master', 399)}>
                Upgrade to Master
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

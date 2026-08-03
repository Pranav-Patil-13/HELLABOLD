import React, { useState, useEffect } from 'react';
import { signOutUser, updateProfile, getOrders, getHellaMoneyLedger, getPayoutRequests, createPayoutRequest } from '../utils/supabase';

const ProfileDrawer = ({ isOpen, onClose, userProfile, onProfileUpdate, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('settings'); // settings, addresses, orders
  const [fullName, setFullName] = useState('');
  const [userOrders, setUserOrders] = useState([]);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameUpdateSuccess, setNameUpdateSuccess] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Hella Money States
  const [hmTransactions, setHmTransactions] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [upiId, setUpiId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Add Address Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newZipCode, setNewZipCode] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressActionSuccess, setAddressActionSuccess] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
      fetchUserOrders();
      fetchHellaMoneyData();
    }
  }, [userProfile, isOpen]);

  const fetchHellaMoneyData = async () => {
    if (!userProfile) return;
    try {
      const creatorName = userProfile.fullName || 'Anonymous';
      const allLedger = await getHellaMoneyLedger();
      const filteredLedger = allLedger.filter(
        l => l.creator === creatorName || l.creator.toLowerCase() === userProfile.email?.split('@')[0].toLowerCase()
      );
      setHmTransactions(filteredLedger);

      const allPayouts = await getPayoutRequests();
      const filteredPayouts = allPayouts.filter(
        p => p.creator === creatorName || p.creator.toLowerCase() === userProfile.email?.split('@')[0].toLowerCase()
      );
      setPayoutRequests(filteredPayouts);
    } catch (e) {
      console.error('Failed to load Hella Money data:', e);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutError('');
    setPayoutSuccess('');
    
    const balance = userProfile.hellaMoney || 0;
    const amount = Number(payoutAmount);
    
    if (amount < 500) {
      setPayoutError('Minimum payout request is 500 Hella Money (HM).');
      return;
    }
    if (amount > balance) {
      setPayoutError(`Insufficient balance. You only have ${balance} Hella Money.`);
      return;
    }
    if (!upiId.trim()) {
      setPayoutError('Please enter a valid UPI ID.');
      return;
    }

    setIsRequestingPayout(true);
    try {
      const creatorName = userProfile.fullName || 'Anonymous';
      await createPayoutRequest(creatorName, upiId.trim(), amount);
      
      const updatedProfile = {
        ...userProfile,
        hellaMoney: Math.max(0, balance - amount)
      };
      onProfileUpdate(updatedProfile);

      setPayoutSuccess(`Successfully requested payout of ${amount} Hella Money!`);
      setPayoutAmount('');
      setUpiId('');
      fetchHellaMoneyData();
    } catch (err) {
      console.error(err);
      setPayoutError('Failed to submit payout request. Please try again.');
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const fetchUserOrders = async () => {
    if (!userProfile) return;
    setLoadingOrders(true);
    try {
      const orders = await getOrders();
      setUserOrders(orders);
    } catch (err) {
      console.error('Failed to load user order history:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setIsUpdatingName(true);
    setNameUpdateSuccess(false);

    try {
      const updated = await updateProfile({ fullName });
      onProfileUpdate({
        ...userProfile,
        fullName: updated.fullName || fullName
      });
      setNameUpdateSuccess(true);
      setTimeout(() => setNameUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating name:', err);
      alert('Failed to update display name.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newName || !newAddress || !newCity || !newZipCode) {
      alert('Please fill out all address fields.');
      return;
    }
    setIsAddingAddress(true);
    setAddressActionSuccess('');

    try {
      const newAddr = {
        id: Math.random().toString(36).substring(2, 9),
        label: newLabel.trim() || 'Address',
        fullName: newName.trim(),
        address: newAddress.trim(),
        city: newCity.trim(),
        zipCode: newZipCode.trim()
      };

      const currentAddresses = userProfile.addresses || [];
      const updatedAddresses = [...currentAddresses, newAddr];

      const updated = await updateProfile({ addresses: updatedAddresses });
      onProfileUpdate({
        ...userProfile,
        addresses: updated.addresses || updatedAddresses
      });

      setAddressActionSuccess('✓ Address added successfully');
      setNewLabel('');
      setNewName('');
      setNewAddress('');
      setNewCity('');
      setNewZipCode('');
      setShowAddForm(false);
      setTimeout(() => setAddressActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding address:', err);
      alert('Failed to add new address.');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    setAddressActionSuccess('');

    try {
      const currentAddresses = userProfile.addresses || [];
      const updatedAddresses = currentAddresses.filter(addr => addr.id !== addressId);

      const updated = await updateProfile({ addresses: updatedAddresses });
      onProfileUpdate({
        ...userProfile,
        addresses: updated.addresses || updatedAddresses
      });

      setAddressActionSuccess('✓ Address removed successfully');
      setTimeout(() => setAddressActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting address:', err);
      alert('Failed to delete address.');
    }
  };

  const handleSignOutClick = async () => {
    try {
      await signOutUser();
      onSignOut();
      onClose();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (!isOpen) return null;

  const savedAddresses = userProfile?.addresses || [];

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div 
        className="cart-drawer profile-drawer" 
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* Drawer Header */}
        <div className="cart-drawer__header">
          <h2>Your Profile</h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close profile drawer">×</button>
        </div>

        {/* User Card (Header Banner) */}
        <div className="profile-user-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderRadius: 0 }}>
          <div className="profile-avatar-large">
            {userProfile?.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="profile-user-card__info" style={{ flex: 1 }}>
            <h3>{userProfile?.fullName || 'User'}</h3>
            <p>{userProfile?.email}</p>
          </div>
        </div>

        {/* Tab Navigation strip */}
        <div className="profile-drawer__tabs">
          <button 
            className={`profile-drawer__tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button 
            className={`profile-drawer__tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            Addresses
          </button>
          <button 
            className={`profile-drawer__tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button 
            className={`profile-drawer__tab-btn ${activeTab === 'hellamoney' ? 'active' : ''}`}
            onClick={() => setActiveTab('hellamoney')}
          >
            Hella Money
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="drawer__content" style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
          
          {/* TAB 1: SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="profile-section">
                <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Account Settings
                </h3>
                {nameUpdateSuccess && (
                  <p style={{ color: '#38a169', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: 'bold' }}>✓ Display name saved</p>
                )}
                <form onSubmit={handleUpdateName}>
                  <div className="profile-form-group">
                    <label>Display Name</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        className="profile-input"
                      />
                      <button 
                        type="submit" 
                        className="btn btn--primary" 
                        disabled={isUpdatingName}
                        style={{ padding: '0.9rem 1.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}
                      >
                        {isUpdatingName ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button 
                  onClick={handleSignOutClick}
                  className="btn btn--outline"
                  style={{ width: '100%', padding: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}
                >
                  Sign Out Account
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="profile-section address-manager-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Saved Addresses
              </h3>

              {addressActionSuccess && (
                <p style={{ color: '#38a169', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5rem' }}>{addressActionSuccess}</p>
              )}

              {/* List of Saved Addresses */}
              <div className="profile-addresses-list" style={{ overflowY: 'visible', maxHeight: 'none' }}>
                {savedAddresses.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem 0', textAlign: 'center' }}>No saved addresses yet.</p>
                ) : (
                  savedAddresses.map(addr => (
                    <div key={addr.id} className="profile-address-card" style={{ borderRadius: 0 }}>
                      <div className="profile-address-card__content">
                        <span className="profile-address-card__label">{addr.label}</span>
                        <span className="profile-address-card__name">{addr.fullName}</span>
                        <span className="profile-address-card__details">
                          {addr.address}, {addr.city} - {addr.zipCode}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="profile-address-card__delete-btn"
                        title="Delete address"
                        aria-label={`Delete address ${addr.label}`}
                      >
                        🗑
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Expandable Add Address Form */}
              {!showAddForm ? (
                <button 
                  className="add-address-toggle-btn"
                  onClick={() => setShowAddForm(true)}
                  style={{ borderRadius: 0 }}
                >
                  + Add New Address
                </button>
              ) : (
                <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', border: '1px solid var(--border-color)', padding: '1.5rem', backgroundColor: '#fafafa' }}>
                  <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>New Address Details</h4>
                  
                  <div className="profile-form-group">
                    <label>Address Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Home, Office, Work"
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      required
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>Recipient Name</label>
                    <input 
                      type="text" 
                      placeholder="Full name of recipient"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      required
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>Street Address</label>
                    <input 
                      type="text" 
                      placeholder="Apartment, building, street name"
                      value={newAddress}
                      onChange={e => setNewAddress(e.target.value)}
                      required
                      className="profile-input"
                    />
                  </div>

                  <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="profile-form-group">
                      <label>City</label>
                      <input 
                        type="text" 
                        placeholder="City"
                        value={newCity}
                        onChange={e => setNewCity(e.target.value)}
                        required
                        className="profile-input"
                      />
                    </div>
                    <div className="profile-form-group">
                      <label>ZIP Code</label>
                      <input 
                        type="text" 
                        placeholder="Zip Code"
                        value={newZipCode}
                        onChange={e => setNewZipCode(e.target.value)}
                        required
                        className="profile-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn--primary" 
                      disabled={isAddingAddress}
                      style={{ flex: 1, padding: '0.9rem', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}
                    >
                      {isAddingAddress ? 'Adding...' : 'Add Address'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn--outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewLabel('');
                        setNewName('');
                        setNewAddress('');
                        setNewCity('');
                        setNewZipCode('');
                      }}
                      style={{ padding: '0.9rem', fontSize: '0.8rem', textTransform: 'uppercase' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="profile-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Your Orders
              </h3>
              
              <div className="profile-orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'visible', maxHeight: 'none' }}>
                {loadingOrders ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Loading historical orders...</p>
                ) : userOrders.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No orders placed yet.</p>
                ) : (
                  userOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="profile-order-card"
                      style={{ borderRadius: 0 }}
                    >
                      <div className="profile-order-card__header">
                        <span className="profile-order-card__id">Order #{order.id.slice(0, 8)}</span>
                        <span className={`profile-order-card__status ${
                          order.status === 'Delivered' ? 'delivered' : 'received'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.8rem', lineHeight: 1.4 }}>
                        <div>AWB: <strong>{order.awb || 'N/A'}</strong> ({order.courier || 'Express'})</div>
                        <div style={{ marginTop: '0.2rem' }}>Placed on: {order.date}</div>
                      </div>
                      <button 
                        className="btn btn--outline" 
                        onClick={() => window.open(`/order-status?id=${order.id}`, '_blank')}
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                      >
                        Track Status
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HELLA MONEY */}
          {activeTab === 'hellamoney' && (
            <div className="profile-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Balance Card Banner */}
              <div style={{
                background: '#000',
                color: '#fff',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.7, textTransform: 'uppercase' }}>YOUR HELLA MONEY BALANCE</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace' }}>{userProfile?.hellaMoney || 0} HM</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: '0.5px' }}>1 Hella Money (HM) = 1 Rupee (₹1)</span>
              </div>

              {/* Payout Request Section */}
              <div style={{ border: '1px solid var(--border-color)', padding: '1.5rem', backgroundColor: '#fafafa' }}>
                <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Request UPI Cashout
                </h3>

                {payoutError && (
                  <p style={{ color: '#e53e3e', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>{payoutError}</p>
                )}
                {payoutSuccess && (
                  <p style={{ color: '#38a169', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>{payoutSuccess}</p>
                )}

                {(userProfile?.hellaMoney || 0) < 500 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    Cashouts require a minimum balance of <strong>500 Hella Money</strong>. Keep sharing your custom creations to earn 5% on every purchase!
                  </p>
                ) : (
                  <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div className="profile-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>UPI ID</label>
                      <input 
                        type="text" 
                        placeholder="e.g. name@upi" 
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        required
                        className="profile-input"
                        style={{ fontSize: '0.8rem', padding: '0.6rem' }}
                      />
                    </div>
                    <div className="profile-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Amount (HM)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 500" 
                        value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        min={500}
                        max={userProfile?.hellaMoney || 0}
                        required
                        className="profile-input"
                        style={{ fontSize: '0.8rem', padding: '0.6rem' }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn--primary"
                      disabled={isRequestingPayout}
                      style={{ padding: '0.8rem', fontSize: '0.75rem', width: '100%', textTransform: 'uppercase', letterSpacing: '1px' }}
                    >
                      {isRequestingPayout ? 'Submitting...' : 'Submit Cashout Request'}
                    </button>
                  </form>
                )}
              </div>

              {/* Transactions Ledger Log */}
              <div>
                <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Hella Money Earnings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {hmTransactions.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>No royalty earnings recorded yet.</p>
                  ) : (
                    hmTransactions.map(tx => {
                      const isRedemption = tx.amount < 0;
                      return (
                        <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)', padding: '0.8rem 1rem', fontSize: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                              {isRedemption ? 'Redeemed Store Credit' : 'Royalty Reward'}
                            </div>
                            <div style={{ opacity: 0.6, fontSize: '0.65rem', marginTop: '0.2rem' }}>
                              {isRedemption ? `Applied on Order #${tx.orderId.slice(0, 8)}` : `${tx.itemTitle} (Order #${tx.orderId.slice(0, 8)})`}
                            </div>
                          </div>
                          <span style={{ color: isRedemption ? '#e53e3e' : '#38a169', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {isRedemption ? `${tx.amount} HM` : `+${tx.amount} HM`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Payout requests log */}
              {payoutRequests.length > 0 && (
                <div>
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    Cashout History
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {payoutRequests.map(req => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)', padding: '0.8rem 1rem', fontSize: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>UPI Transfer</div>
                          <div style={{ opacity: 0.6, fontSize: '0.65rem', marginTop: '0.2rem' }}>To: {req.upiId}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 'bold', fontFamily: 'monospace', display: 'block' }}>-{req.amount} HM</span>
                          <span style={{ 
                            fontSize: '0.6rem', 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '2px',
                            backgroundColor: req.status === 'Settled' ? '#e8f5e9' : '#fff3e0',
                            color: req.status === 'Settled' ? '#2e7d32' : '#e65100',
                            marginTop: '0.25rem',
                            display: 'inline-block'
                          }}>{req.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;

import React, { useState, useEffect } from 'react';
import { signOutUser, updateProfile, getOrders } from '../utils/supabase';

const ProfileDrawer = ({ isOpen, onClose, userProfile, onProfileUpdate, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('settings'); // settings, addresses, orders
  const [fullName, setFullName] = useState('');
  const [userOrders, setUserOrders] = useState([]);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameUpdateSuccess, setNameUpdateSuccess] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

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
    }
  }, [userProfile, isOpen]);

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
            Addresses ({savedAddresses.length})
          </button>
          <button 
            className={`profile-drawer__tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders ({userOrders.length})
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

        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;

import React, { useState, useEffect } from 'react';
import { signOutUser, updateProfile, getOrders } from '../utils/supabase';

const ProfileDrawer = ({ isOpen, onClose, userProfile, onProfileUpdate, onSignOut }) => {
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
          <h2>User Profile</h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close profile drawer">×</button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="drawer__content" style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* User Meta Card */}
          <div className="profile-user-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div className="profile-avatar-large" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {userProfile?.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase' }}>{userProfile?.fullName || 'User'}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{userProfile?.email}</span>
              </div>
            </div>
            <button 
              onClick={handleSignOutClick}
              className="btn btn--outline"
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Sign Out
            </button>
          </div>

          {/* Display Name / Basic Info Section */}
          <div className="profile-section">
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              Account Settings
            </h3>
            {nameUpdateSuccess && (
              <p style={{ color: '#38a169', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: 'bold' }}>✓ Display name saved</p>
            )}
            <form onSubmit={handleUpdateName} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>Display Name</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                  <button 
                    type="submit" 
                    className="btn btn--primary" 
                    disabled={isUpdatingName}
                    style={{ padding: '0.6rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase' }}
                  >
                    {isUpdatingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Address Manager Section */}
          <div className="profile-section address-manager-section">
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              Saved Addresses ({savedAddresses.length})
            </h3>

            {addressActionSuccess && (
              <p style={{ color: '#38a169', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5rem' }}>{addressActionSuccess}</p>
            )}

            {/* List of Saved Addresses */}
            <div className="profile-addresses-list">
              {savedAddresses.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem 0' }}>No saved addresses yet.</p>
              ) : (
                savedAddresses.map(addr => (
                  <div key={addr.id} className="profile-address-card">
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
              >
                + Add New Address
              </button>
            ) : (
              <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)', padding: '1.2rem', backgroundColor: '#fafafa' }}>
                <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>New Address Details</h4>
                
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>Address Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Home, Office, Work"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>Recipient Name</label>
                  <input 
                    type="text" 
                    placeholder="Full name of recipient"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>Street Address</label>
                  <input 
                    type="text" 
                    placeholder="Apartment, building, street name"
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  />
                </div>

                <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>City</label>
                    <input 
                      type="text" 
                      placeholder="City"
                      value={newCity}
                      onChange={e => setNewCity(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#fff' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>ZIP Code</label>
                    <input 
                      type="text" 
                      placeholder="Zip Code"
                      value={newZipCode}
                      onChange={e => setNewZipCode(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border-color)', fontSize: '0.85rem', backgroundColor: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button 
                    type="submit" 
                    className="btn btn--primary" 
                    disabled={isAddingAddress}
                    style={{ flex: 1, padding: '0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}
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
                    style={{ padding: '0.75rem', fontSize: '0.8rem', textTransform: 'uppercase' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* User Historic Orders */}
          <div className="profile-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              Your Orders ({userOrders.length})
            </h3>
            
            <div className="profile-orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
              {loadingOrders ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Loading historical orders...</p>
              ) : userOrders.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No orders placed yet.</p>
              ) : (
                userOrders.map(order => (
                  <div 
                    key={order.id} 
                    className="profile-order-card"
                    style={{ padding: '1rem', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontWeight: 'bold' }}>
                      <span>Order: {order.id}</span>
                      <span style={{ 
                        color: order.status === 'Delivered' ? '#2e7d32' : 
                                order.status === 'Order Received' ? '#d84315' : 'var(--accent-color)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                      AWB: <strong>{order.awb}</strong> ({order.courier})
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Placed on {order.date}</span>
                      <button 
                        className="btn btn--outline" 
                        onClick={() => window.open(`/order-status?id=${order.id}`, '_blank')}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', textTransform: 'uppercase' }}
                      >
                        Track Status
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;

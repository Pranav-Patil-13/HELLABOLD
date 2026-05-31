import React from 'react';

const Filters = ({ 
  selectedCategories = [], 
  selectedSizes = [], 
  priceRange = [0, 10000],
  onCategoryChange, 
  onSizeChange,
  onPriceChange,
  onReset 
}) => {
  const categoriesList = ['Outerwear', 'Accessories', 'Tops', 'Bottoms'];
  const sizesList = ['S', 'M', 'L', 'XL'];

  const hasActiveFilters = selectedCategories.length > 0 || selectedSizes.length > 0 || priceRange[1] < 10000 || priceRange[0] > 0;

  const handlePriceSliderChange = (e) => {
    onPriceChange([priceRange[0], parseInt(e.target.value, 10)]);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <aside className="shop__filters">
      <h2 className="filters__title">Filter By</h2>
      
      {/* Category Group */}
      <div className="filter-group">
        <h3 className="filter-group__title">Category</h3>
        <div className="filter-categories-list">
          {categoriesList.map(category => {
            const isChecked = selectedCategories.includes(category);
            return (
              <label key={category} className="filter-group__item custom-checkbox-container">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={() => onCategoryChange(category)}
                  className="hidden-checkbox"
                /> 
                <span className={`custom-checkbox-indicator ${isChecked ? 'checked' : ''}`}></span>
                <span className="checkbox-label-text">{category}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range Group */}
      <div className="filter-group">
        <h3 className="filter-group__title">Price Range</h3>
        <div className="filter-price-slider-wrapper" style={{ marginTop: '0.8rem' }}>
          <input 
            type="range" 
            min="0" 
            max="10000" 
            step="250"
            value={priceRange[1]} 
            onChange={handlePriceSliderChange}
            style={{ width: '100%', accentColor: 'var(--text-primary)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            <span>Up to {formatCurrency(priceRange[1])}</span>
            <span>Max {formatCurrency(10000)}</span>
          </div>
        </div>
      </div>

      {/* Size Group */}
      <div className="filter-group">
        <h3 className="filter-group__title">Size</h3>
        <div className="filter-size-grid">
          {sizesList.map(size => {
            const isActive = selectedSizes.includes(size);
            return (
              <button 
                type="button"
                key={size} 
                className={`filter-size-chip ${isActive ? 'active' : ''}`}
                onClick={() => onSizeChange(size)}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {hasActiveFilters && (
        <button type="button" className="btn btn--outline btn--reset-filters" onClick={onReset}>
          Reset Filters
        </button>
      )}
    </aside>
  );
};

export default Filters;

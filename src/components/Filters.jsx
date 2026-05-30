import React from 'react';

const Filters = ({ 
  selectedCategories = [], 
  selectedSizes = [], 
  onCategoryChange, 
  onSizeChange,
  onReset 
}) => {
  const categoriesList = ['Outerwear', 'Accessories', 'Tops', 'Bottoms'];
  const sizesList = ['S', 'M', 'L', 'XL'];

  const hasActiveFilters = selectedCategories.length > 0 || selectedSizes.length > 0;

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

"use client";
import React, { useReducer, useState, useEffect } from "react";

// Reducer function to manage quantity state
function quantityReducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return { quantity: state.quantity + action.payload };
    case "DECREMENT":
      return {
        quantity: Math.max(1, state.quantity - action.payload), // Ensure minimum value of 1
      };
    case "SET":
      return { quantity: action.payload >= 1 ? action.payload : 1 };
    default:
      return state;
  }
}

// Function to format price with currency symbol - using Math.floor for whole numbers
const formatPrice = (price) => {
  return `${Math.floor(Number(price)).toLocaleString()}`;
};

// Function to parse formatted price back to number - using Math.floor for whole numbers
const parseFormattedPrice = (formattedPrice) => {
  // Remove commas and parse as number
  const cleanValue = formattedPrice.replace(/,/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : Math.floor(parsed);
};

function HandleQuantity({ initialValue = 1, startingPrice = 0, placeholder = "" }) {
  // Parse the initial value - it might be a formatted string or a number
  const parseInitialValue = (value) => {
    if (typeof value === 'string') {
      return parseFormattedPrice(value);
    }
    return Number(value);
  };

  const initialNumericValue = parseInitialValue(initialValue);

  // Dynamic increment/decrement based on starting price
  const getIncrementValue = () => {
    const startPrice = Number(startingPrice) || 0;
    if (startPrice > 500000) {
      // If starting price > 500,000 DA, use 1% of starting price
      return Math.max(100, Math.floor(startPrice * 0.01));
    } else {
      // If starting price ≤ 500,000 DA, use 0.05% of starting price
      return Math.max(50, Math.floor(startPrice * 0.0005));
    }
  };

  // Initialize state with the parsed numeric value
  const [state1, dispatch1] = useReducer(quantityReducer, {
    quantity: initialNumericValue,
  });

  // State for the display value (formatted)
  const [displayValue, setDisplayValue] = useState(formatPrice(initialNumericValue));

  // Update display value when quantity changes
  useEffect(() => {
    setDisplayValue(formatPrice(state1.quantity));
  }, [state1.quantity]);

  const increment1 = () => {
    // Add dynamic increment based on starting price
    const incrementAmount = getIncrementValue();
    dispatch1({ type: "INCREMENT", payload: incrementAmount });
  };

  const decrement1 = () => {
    // Subtract dynamic increment from current value, but don't go below 1
    const incrementAmount = getIncrementValue();
    dispatch1({ type: "DECREMENT", payload: incrementAmount });
  };

  const handleInputChange1 = (e) => {
    const inputValue = e.target.value;
    
    // Extract only digits from the input
    const digitsOnly = inputValue.replace(/[^\d]/g, '');
    
    // Convert to number
    const numericValue = parseInt(digitsOnly) || 0;
    
    // Format with thousands separator (no ",00")
    const formattedValue = numericValue.toLocaleString();
    
    // Update display
    setDisplayValue(formattedValue);
    
    // Update state
    dispatch1({ type: "SET", payload: numericValue });
  };

  const handleInputBlur = () => {
    // Ensure the display value is properly formatted when user leaves the input
    setDisplayValue(formatPrice(state1.quantity));
  };

  const handleInputKeyDown = (e) => {
    // No special handling needed since we removed ",00" protection
    // Users can now freely edit the input
  };

  return (
    <div className="quantity-counter">
      <a
        className="quantity__minus"
        style={{ cursor: "pointer" }}
        onClick={decrement1}
        aria-label="Decrease quantity"
        title={`Diminuer de ${formatPrice(getIncrementValue())}`}
      >
        <svg 
          width="14" 
          height="2" 
          viewBox="0 0 14 2" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="14" height="2" rx="1" fill="white"/>
        </svg>
      </a>
      <input
        name="quantity"
        type="text"
        value={displayValue}
        onChange={handleInputChange1}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        className="quantity__input"
        placeholder={placeholder || formatPrice(initialNumericValue)}
      />
      <a
        className="quantity__plus"
        style={{ cursor: "pointer" }}
        onClick={increment1}
        aria-label="Increase quantity"
        title={`Augmenter de ${formatPrice(getIncrementValue())}`}
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 14 14" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7 0C7.55228 0 8 0.447715 8 1V6H13C13.5523 6 14 6.44772 14 7C14 7.55228 13.5523 8 13 8H8V13C8 13.5523 7.55228 14 7 14C6.44772 14 6 13.5523 6 13V8H1C0.447715 8 0 7.55228 0 7C0 6.44772 0.447715 6 1 6H6V1C6 0.447715 6.44772 0 7 0Z" fill="white"/>
        </svg>
      </a>
    </div>
  );
}

export default HandleQuantity;

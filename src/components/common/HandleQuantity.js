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
  return `${Math.floor(Number(price)).toLocaleString()},00 `;
};

// Function to parse formatted price back to number - using Math.floor for whole numbers
const parseFormattedPrice = (formattedPrice) => {
  // Remove ",00 " and commas, then parse as number
  const cleanValue = formattedPrice.replace(/,00\s*$/, '').replace(/,/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : Math.floor(parsed);
};

function HandleQuantity({ initialValue = 1, startingPrice = 0 }) {
  // Parse the initial value - it might be a formatted string or a number
  const parseInitialValue = (value) => {
    if (typeof value === 'string') {
      return parseFormattedPrice(value);
    }
    return Number(value);
  };

  const initialNumericValue = parseInitialValue(initialValue);

  // Calculate 5% of starting price for increment/decrement
  const fivePercentIncrement = Math.max(1, Math.round(startingPrice * 0.05));

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
    // Add 5% of starting price to current value
    dispatch1({ type: "INCREMENT", payload: fivePercentIncrement });
  };

  const decrement1 = () => {
    // Subtract 5% of starting price from current value, but don't go below 1
    dispatch1({ type: "DECREMENT", payload: fivePercentIncrement });
  };

  const handleInputChange1 = (e) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Parse the formatted value back to a number
    const numericValue = parseFormattedPrice(inputValue);
    
    if (!isNaN(numericValue) && numericValue >= 0) {
      dispatch1({ type: "SET", payload: numericValue });
    }
  };

  const handleInputBlur = () => {
    // Ensure the display value is properly formatted when user leaves the input
    setDisplayValue(formatPrice(state1.quantity));
  };

  return (
    <div className="quantity-counter">
      <a
        className="quantity__minus"
        style={{ cursor: "pointer" }}
        onClick={decrement1}
        aria-label="Decrease quantity"
        title={`Diminuer de ${formatPrice(fivePercentIncrement)} (5% du prix de départ)`}
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
        className="quantity__input"
        placeholder={formatPrice(initialNumericValue)}
      />
      <a
        className="quantity__plus"
        style={{ cursor: "pointer" }}
        onClick={increment1}
        aria-label="Increase quantity"
        title={`Augmenter de ${formatPrice(fivePercentIncrement)} (5% du prix de départ)`}
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

"use client";
import React, { useReducer, useState, useEffect } from "react";

// Reducer function to manage quantity state
function quantityReducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return { quantity: state.quantity + action.payload };
    case "DECREMENT":
      return {
        quantity: Math.max(0, state.quantity - action.payload), // Allow 0 for display purposes
      };
    case "SET":
      return { quantity: action.payload >= 0 ? action.payload : 0 }; // Allow 0 for display purposes
    default:
      return state;
  }
}

// Function to format price with currency symbol - supports both integers and decimals
const formatPrice = (price) => {
  const num = Number(price);
  if (isNaN(num)) return '0';
  
  // If it's a whole number, format without decimals
  if (num % 1 === 0) {
    return num.toLocaleString();
  } else {
    // If it has decimals, show up to 2 decimal places
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  }
};

// Function to parse formatted price back to number - supports both integers and decimals
const parseFormattedPrice = (formattedPrice) => {
  // Remove commas and parse as number
  const cleanValue = formattedPrice.replace(/,/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
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
    let increment;
    
    if (startPrice > 500000) {
      // If starting price > 500,000 DA, use 0.5% (half of 1%) of starting price
      increment = Math.floor(startPrice * 0.005);
    } else if (startPrice > 0) {
      // If starting price ≤ 500,000 DA, use 1% of starting price
      increment = Math.floor(startPrice * 0.01);
    } else {
      // If no starting price, use default increment
      increment = 100;
    }
    
    // Ensure minimum increment of 1 to make buttons functional
    return Math.max(1, increment);
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

  // Update when initialValue prop changes (for reactive updates)
  useEffect(() => {
    const newNumericValue = parseInitialValue(initialValue);
    if (newNumericValue !== state1.quantity && newNumericValue > 0) {
      dispatch1({ type: "SET", payload: newNumericValue });
      setDisplayValue(formatPrice(newNumericValue));
    }
  }, [initialValue]);

  // Debug log to show increment value
  useEffect(() => {
    console.log('🔧 HandleQuantity initialized:', {
      initialValue: initialValue,
      initialNumericValue: initialNumericValue,
      startingPrice: startingPrice,
      incrementValue: getIncrementValue()
    });
  }, []);

  const increment1 = () => {
    // Add dynamic increment based on starting price
    const incrementAmount = getIncrementValue();
    console.log('🔼 Increment clicked:', {
      currentValue: state1.quantity,
      incrementAmount: incrementAmount,
      newValue: state1.quantity + incrementAmount
    });
    dispatch1({ type: "INCREMENT", payload: incrementAmount });
  };

  const decrement1 = () => {
    // Subtract dynamic increment from current value, but don't go below 0
    const incrementAmount = getIncrementValue();
    const newValue = Math.max(0, state1.quantity - incrementAmount);
    console.log('🔽 Decrement clicked:', {
      currentValue: state1.quantity,
      incrementAmount: incrementAmount,
      newValue: newValue,
      canDecrement: state1.quantity > 0
    });
    dispatch1({ type: "DECREMENT", payload: incrementAmount });
  };

  const handleInputChange1 = (e) => {
    const inputValue = e.target.value;
    
    // Allow digits, dots, and commas (for thousands separator)
    // Remove everything except digits, dots, and commas
    const cleanValue = inputValue.replace(/[^\d.,]/g, '');
    
    // Handle multiple dots - only allow one dot
    const dotCount = (cleanValue.match(/\./g) || []).length;
    const processedValue = dotCount > 1 
      ? cleanValue.replace(/\./g, '').replace(/(\d+)(\d{3})/, '$1.$2')
      : cleanValue;
    
    // If the input is empty, allow it and set state to 0
    if (processedValue === '') {
      setDisplayValue('');
      dispatch1({ type: "SET", payload: 0 });
      return;
    }
    
    // Parse the value - support both integers and decimals
    const numericValue = parseFormattedPrice(processedValue);
    
    // Update display with the processed value (preserve user's typing)
    setDisplayValue(processedValue);
    
    // Update state with numeric value
    dispatch1({ type: "SET", payload: numericValue });
  };

  const handleInputBlur = () => {
    // If the input is empty or 0, keep it empty for better UX
    if (state1.quantity === 0) {
      setDisplayValue('');
    } else {
      // Ensure the display value is properly formatted when user leaves the input
      setDisplayValue(formatPrice(state1.quantity));
    }
  };

  const handleInputKeyDown = (e) => {
    // No special handling needed since we removed ",00" protection
    // Users can now freely edit the input
  };

  return (
    <div className="quantity-counter">
      <a
        className="quantity__minus"
        style={{ cursor: "pointer", position: "relative" }}
        onClick={(e) => {
          e.preventDefault();
          console.log('🔽 Minus button clicked!');
          decrement1();
        }}
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
        inputMode="decimal"
        value={displayValue}
        onChange={handleInputChange1}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        className="quantity__input"
        placeholder={placeholder || formatPrice(initialNumericValue)}
      />
      <a
        className="quantity__plus"
        style={{ cursor: "pointer", position: "relative" }}
        onClick={(e) => {
          e.preventDefault();
          console.log('🔼 Plus button clicked!');
          increment1();
        }}
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

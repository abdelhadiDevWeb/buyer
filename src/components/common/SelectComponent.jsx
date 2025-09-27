"use client"
import React, { useEffect, useRef } from "react";
import useCustomSelect from "../../customHooks/useCustomSelect";

const SelectComponent = ({ options, placeholder, open, customClass, onSelect }) => {
  const {
    isOpen,
    selectedOption,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    selectOption,
  } = useCustomSelect(options, open);

  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      // Click is outside the dropdown, close the dropdown
      closeDropdown();
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Add event listener when the component mounts
      document.addEventListener("click", handleClickOutside);
    }

    // Remove event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionSelect = (option) => {
    selectOption(option);
    openDropdown(); // Open the next dropdown
    if (onSelect) {
      onSelect(option);
    }
  };

  const dropdownClassName = `nice-select ${customClass || ""} ${isOpen ? "open" : ""}`;

  return (
    <div className={dropdownClassName} tabIndex="0" onClick={toggleDropdown} ref={dropdownRef}>
      <span className="current">{selectedOption || placeholder}</span>
      <ul className="list">
        {options.map((option, index) => (
          <li
            key={index}
            className={`option${selectedOption === option ? " selected focus" : ""}`}
            data-value={index}
            onClick={() => handleOptionSelect(option)}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SelectComponent;

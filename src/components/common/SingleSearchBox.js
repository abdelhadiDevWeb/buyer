"use client";
import useDropdown from "@/customHooks/useDropdown";
import React from "react";

const SingleSearchBox = ({ placeholder, options, label, style }) => {
  const { isDropdownOpen, selectedOption, toggleDropdown, handleOptionSelect } =
    useDropdown(placeholder, options);

  return (
    <div className="single-search-box">
      <div className="searchbox-input">
        <label>{label}</label>
        <div className="custom-select-dropdown">
          <div className="select-input" onClick={toggleDropdown}>
            <input type="text" readOnly value={selectedOption} />
            <i className="bi bi-chevron-down" />
          </div>
          <div
            className={`custom-select-wrap  ${style} ${
              isDropdownOpen ? "active" : ""
            }`}
          >
            <ul className="option-list">
              {options.map((option) => (
                <li
                  key={option}
                  className="single-item"
                  onClick={() => handleOptionSelect(option)}
                >
                  <h6>{option}</h6>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleSearchBox;

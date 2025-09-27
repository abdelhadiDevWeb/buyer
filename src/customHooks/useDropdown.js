import { useState } from "react";

function useDropdown(initialValue, options = []) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(initialValue);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setIsDropdownOpen(false);
  };

  return {
    isDropdownOpen,
    selectedOption,
    toggleDropdown,
    handleOptionSelect,
    options,
  };
}

export default useDropdown;

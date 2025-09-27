"use client";

/**
 * Combines multiple class names into a single string
 * Similar to the 'classnames' or 'clsx' libraries
 * @param {...string} classes - Class names to combine
 * @returns {string} - Combined class names
 */
export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Creates responsive image class based on size
 * @param {string} size - Size of the image (sm, md, lg, xl)
 * @returns {string} - Tailwind CSS classes for the image
 */
export const imageSize = (size) => {
  const sizes = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    full: 'w-full h-auto',
  };
  
  return sizes[size] || sizes.md;
};

/**
 * Creates CSS variable string with proper format
 * @param {string} variable - CSS variable name without '--'
 * @returns {string} - Formatted CSS variable
 */
export const cssVar = (variable) => {
  return `var(--${variable})`;
}; 
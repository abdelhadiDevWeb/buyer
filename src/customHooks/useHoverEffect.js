import { useEffect } from "react";

const useHoverEffect = (selector) => {
  useEffect(() => {
    const handleMouseEnter = (e) => {
      if (e.target && e.target.matches(selector)) {
        const target = e.target;
        const span = target.querySelector("span");
        const parentOffset = target.getBoundingClientRect();
        const relX = e.pageX - parentOffset.left;
        const relY = e.pageY - parentOffset.top;
        span.style.top = `${relY}px`;
        span.style.left = `${relX}px`;
      }
    };

    const handleMouseOut = (e) => {
      if (e.target && e.target.matches(selector)) {
        const target = e.target;
        const span = target.querySelector("span");
        const parentOffset = target.getBoundingClientRect();
        const relX = e.pageX - parentOffset.left;
        const relY = e.pageY - parentOffset.top;
        span.style.top = `${relY}px`;
        span.style.left = `${relX}px`;
      }
    };

    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseout", handleMouseOut);
    });

    return () => {
      elements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseout", handleMouseOut);
      });
    };
  }, [selector]);
};

export default useHoverEffect;

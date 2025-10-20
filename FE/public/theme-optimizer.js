// Theme Performance Optimization Script
// This script can be added to improve theme transition performance

(function() {
  'use strict';

  // Optimize CSS Custom Properties for faster theme switching
  const optimizeThemeTransitions = () => {
    const style = document.createElement('style');
    style.textContent = `
      /* Hardware acceleration for theme transitions */
      * {
        backface-visibility: hidden;
        perspective: 1000px;
      }
      
      /* Optimize theme variables for performance */
      :root, .dark {
        /* Use transform3d to enable hardware acceleration */
        transform: translate3d(0, 0, 0);
      }
      
      /* Optimized transition classes */
      .theme-optimized {
        transition: background-color 0.15s ease-out, 
                    border-color 0.15s ease-out, 
                    color 0.15s ease-out !important;
        will-change: background-color, border-color, color;
      }
      
      /* Prevent layout shifts during theme changes */
      .theme-stable {
        contain: layout style paint;
      }
    `;
    document.head.appendChild(style);
  };

  // Debounce theme changes to prevent rapid switching
  let themeChangeTimeout;
  const debounceThemeChange = (callback, delay = 100) => {
    clearTimeout(themeChangeTimeout);
    themeChangeTimeout = setTimeout(callback, delay);
  };

  // Initialize optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeThemeTransitions);
  } else {
    optimizeThemeTransitions();
  }

  // Add to window for external use
  window.ThemeOptimizer = {
    optimizeThemeTransitions,
    debounceThemeChange
  };
})();

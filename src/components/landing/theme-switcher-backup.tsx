"use client";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Sparkles } from "lucide-react";

interface LiquidGlassState {
  isActive: boolean;
  rippleX: number;
  rippleY: number;
  scale: number;
}

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [liquidGlass, setLiquidGlass] = useState<LiquidGlassState>({
    isActive: false,
    rippleX: 0,
    rippleY: 0,
    scale: 1
  });
  
  const { theme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pressTimerRef = useRef<NodeJS.Timeout>();
  const animationRef = useRef<number>();

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  const pressStartTime = useRef<number>(0);
  const isPressed = useRef(false);



  // Liquid glass entry animation
  const animateLiquidGlass = useCallback(() => {
    console.log('Starting liquid glass entry animation');
    const startTime = Date.now();
    const duration = 1500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setLiquidGlass(prev => ({
        ...prev,
        scale: 1 + (0.05 * Math.sin(progress * Math.PI * 2)) * (1 - easeOutQuart)
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        console.log('Liquid glass entry animation complete, setting theme to liquid-glass');
        setLiquidGlass(prev => ({ ...prev, isActive: false, scale: 1 }));
        setTheme("liquid-glass");
      }
    };

    animate();
  }, [setTheme]);

  // Liquid glass exit animation
  const animateLiquidGlassExit = useCallback(() => {
    console.log('Starting liquid glass exit animation'); // Debug log
    const startTime = Date.now();
    const duration = 1200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeInQuart = Math.pow(progress, 4);
      
      setLiquidGlass(prev => ({
        ...prev,
        scale: 1 + (0.03 * Math.sin(progress * Math.PI * 3)) * (1 - easeInQuart)
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        console.log('Exit animation complete, switching to light theme'); // Debug log
        setLiquidGlass(prev => ({ ...prev, isActive: false, scale: 1 }));
        setTheme("light");
      }
    };

    animate();
  }, [setTheme]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isPressed.current = true;
    pressStartTime.current = Date.now();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setLiquidGlass(prev => ({
        ...prev,
        rippleX: x,
        rippleY: y
      }));
    }

    startLongPress();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isPressed.current = true;
    pressStartTime.current = Date.now();
    
    if (buttonRef.current && e.touches[0]) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      
      setLiquidGlass(prev => ({
        ...prev,
        rippleX: x,
        rippleY: y
      }));
    }

    startLongPress();
  };

  const startLongPress = () => {
    // Clear any existing timer first
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    
    // Start long press timer
    pressTimerRef.current = setTimeout(() => {
      console.log('Long press timer triggered for theme:', theme); // Debug log
      setIsLongPress(true);
      
      // More realistic haptic feedback with CSS classes
      if (buttonRef.current) {
        buttonRef.current.classList.add('animate-press-feedback');
        setTimeout(() => {
          if (buttonRef.current) {
            buttonRef.current.classList.remove('animate-press-feedback');
          }
        }, 200);
      }
    }, 500); // Reduced from 600ms for better responsiveness
  };

  const handleMouseUp = () => {
    if (!isPressed.current) return;
    
    const pressDuration = Date.now() - pressStartTime.current;
    const wasLongPress = pressDuration >= 500; // Match with timer threshold
    
    console.log('Mouse up, press duration:', pressDuration, 'was long press:', wasLongPress, 'current theme:', theme); // Debug log
    
    // Clean up
    isPressed.current = false;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = undefined;
    }
    setIsLongPress(false);

    // Add small delay to ensure state is stable
    setTimeout(() => {
      // Decide action based on actual press duration
      if (wasLongPress) {
        console.log('Processing long press for theme:', theme); // Debug log
        handleLongPressThemeChange();
      } else {
        console.log('Processing regular click for theme:', theme); // Debug log
        handleThemeToggle();
      }
    }, 10); // Small delay to ensure stable state
  };

  const handleMouseLeave = () => {
    // Clean up everything
    isPressed.current = false;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = undefined;
    }
    setIsLongPress(false);
    
    // Reset liquid glass animation state if active
    if (liquidGlass.isActive && theme && !theme.includes("liquid")) {
      setLiquidGlass(prev => ({ ...prev, isActive: false, scale: 1 }));
    }
  };

  const handleThemeToggle = () => {
    // Regular click: normal toggle behavior for all themes
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("light");
    } else if (theme === "liquid-glass") {
      // From liquid glass, toggle to dark (so user can access both light/dark)
      setTheme("dark");
    }
  };

  const handleLongPressThemeChange = () => {
    console.log('Long press detected, current theme:', theme); // Debug log
    
    // Prevent multiple long press actions
    if (liquidGlass.isActive) {
      console.log('Animation already active, ignoring long press');
      return;
    }
    
    // Direct theme switching with simple animation trigger
    if (theme === "liquid-glass") {
      // From liquid glass, go back to light
      console.log('Direct switch from liquid-glass to light'); 
      setTheme("light");
    } else {
      // From any other theme, go to liquid glass with animation
      console.log('Activating liquid glass from:', theme); 
      setLiquidGlass(prev => ({ ...prev, isActive: true }));
      // Short animation then switch
      setTimeout(() => {
        setLiquidGlass(prev => ({ ...prev, isActive: false, scale: 1 }));
        setTheme("liquid-glass");
      }, 800);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="relative group">
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size="icon"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleMouseUp}
        className={`
          relative overflow-hidden select-none
          transition-all duration-300 ease-out
          hover:scale-105 active:scale-95
          ${liquidGlass.isActive ? 'liquid-glass-active' : ''}
          ${isLongPress ? 'ring-2 ring-blue-400/40 dark:ring-blue-300/40' : ''}
        `}
      >
        {/* Ripple effect */}
        {liquidGlass.isActive && (
          <div className="absolute inset-0 pointer-events-none animate-ripple-effect" />
        )}
        
        {/* Icon container */}
        <div className="relative w-4 h-4 flex items-center justify-center">
          {liquidGlass.isActive ? (
            <Sparkles className="h-4 w-4 animate-spin text-blue-400 transition-all duration-300" />
          ) : (
            <>
              {/* Sun icon for light theme */}
              <Sun className={`absolute h-4 w-4 transition-all duration-300 ease-out ${
                theme === "light"
                  ? "opacity-100 rotate-0 scale-100" 
                  : "opacity-0 rotate-90 scale-75"
              }`} />
              
              {/* Moon icon for dark theme */}
              <Moon className={`absolute h-4 w-4 transition-all duration-300 ease-out ${
                theme === "dark"
                  ? "opacity-100 rotate-0 scale-100" 
                  : "opacity-0 -rotate-90 scale-75"
              }`} />
              
              {/* Sparkles icon for liquid glass theme */}
              <Sparkles className={`absolute h-4 w-4 transition-all duration-300 ease-out ${
                theme === "liquid-glass"
                  ? "opacity-100 rotate-0 scale-100 text-blue-400" 
                  : "opacity-0 rotate-180 scale-75 text-blue-400"
              }`} />
            </>
          )}
        </div>

        {/* Liquid glass overlay - ultra subtle */}
        {liquidGlass.isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-blue-600/2 pointer-events-none rounded-md" />
        )}
      </Button>

      {/* Status indicator with dynamic messaging */}
      {liquidGlass.isActive && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 
                        px-2 py-1 rounded-md 
                        glass-surface
                        text-foreground/90
                        text-xs font-medium
                        animate-fade-in
                        shadow-lg
                        whitespace-nowrap
                        z-50">
          {theme === "liquid-glass" ? "Exiting..." : "Entering Liquid Glass"}
        </div>
      )}

      {/* Long press hint for theme cycling */}
      {isLongPress && !liquidGlass.isActive && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 
                        px-2 py-1 rounded-md
                        bg-blue-500/10 border border-blue-400/30
                        text-blue-600 dark:text-blue-400
                        text-xs font-medium
                        animate-fade-in
                        whitespace-nowrap
                        z-50">
          {theme === "liquid-glass" ? "Release for Light" : "Release for Liquid Glass"}
        </div>
      )}

      {/* Tooltip for usage instructions - only show when not in use */}
      {!liquidGlass.isActive && !isLongPress && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 
                        px-3 py-1.5 rounded-lg
                        glass-surface
                        text-foreground/70
                        text-xs font-medium
                        opacity-0 group-hover:opacity-100 group-hover:delay-500
                        transition-all duration-300
                        pointer-events-none
                        whitespace-nowrap
                        shadow-lg z-40">
          Click: Toggle • Hold: Liquid Glass
        </div>
      )}

    </div>
  );
}

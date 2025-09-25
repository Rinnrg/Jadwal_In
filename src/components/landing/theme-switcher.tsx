"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeSwitcher() {
  const [svg, setSvg] = useState(<Moon />);
  const { theme, setTheme } = useTheme();

  const handleClick = () => {
    if (theme === "light") {
      setTheme("dark");
      setSvg(<Moon />);
    } else {
      setTheme("light");
      setSvg(<Sun />);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleClick}>
      {svg}
    </Button>
  );
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';
export type FontSize = 'normal' | 'large' | 'xlarge';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  normal: 'hydra-font-normal',
  large: 'hydra-font-large',
  xlarge: 'hydra-font-xlarge',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('normal');

  useEffect(() => {
    const saved = localStorage.getItem('hydra-theme') as Theme;
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    }
    const savedFont = localStorage.getItem('hydra-font-size') as FontSize;
    if (savedFont && ['normal', 'large', 'xlarge'].includes(savedFont)) {
      setFontSize(savedFont);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hydra-theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('hydra-font-size', fontSize);
    const root = document.documentElement;
    // Remove all font size classes, then add the current one
    Object.values(FONT_SIZE_CLASSES).forEach(cls => root.classList.remove(cls));
    root.classList.add(FONT_SIZE_CLASSES[fontSize]);
  }, [fontSize]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

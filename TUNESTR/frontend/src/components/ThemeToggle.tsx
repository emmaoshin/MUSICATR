import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { GetTheme, SetTheme } from '../../wailsjs/go/main/App';

const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Load theme from backend
    const loadTheme = async () => {
      try {
        const theme = await GetTheme();
        setIsDarkMode(theme === 'dark');
        applyTheme(theme === 'dark');
      } catch (error) {
        console.error('Error loading theme:', error);
        // Default to system preference if backend fails
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
        applyTheme(systemPrefersDark);
      }
    };

    loadTheme();
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
    
    try {
      await SetTheme(newDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle; 
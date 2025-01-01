import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary/10 text-primary' : '';
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Images', href: '/files' },
    { name: 'Player', href: '/player' },
    { name: 'Settings', href: '/settings' },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="text-xl font-bold mr-6">TUNESTR</div>
        <div className="flex gap-4 items-center flex-1">
          <Link 
            to="/" 
            className={`px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive('/')}`}
          >
            Home
          </Link>
          <Link 
            to="/files" 
            className={`px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive('/files')}`}
          >
            Images
          </Link>
          <Link 
            to="/player" 
            className={`px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive('/player')}`}
          >
            Player
          </Link>
          <Link 
            to="/settings" 
            className={`px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${isActive('/settings')}`}
          >
            Settings
          </Link>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar; 
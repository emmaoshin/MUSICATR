import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <nav className="bg-blue-600 text-white p-4 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">TUNESTR</div>
        <div className="flex gap-4">
          <Link 
            to="/" 
            className={`px-4 py-2 rounded hover:bg-blue-700 transition-colors ${isActive('/')}`}
          >
            Home
          </Link>
          <Link 
            to="/files" 
            className={`px-4 py-2 rounded hover:bg-blue-700 transition-colors ${isActive('/files')}`}
          >
            Files
          </Link>
          <Link 
            to="/player" 
            className={`px-4 py-2 rounded hover:bg-blue-700 transition-colors ${isActive('/player')}`}
          >
            Player
          </Link>
          <Link 
            to="/settings" 
            className={`px-4 py-2 rounded hover:bg-blue-700 transition-colors ${isActive('/settings')}`}
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
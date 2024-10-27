import React, { useState } from 'react';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to toggle login state
  const handleAuthToggle = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo or Title */}
        <div className="text-2xl font-bold">
          Email Security Dashboard
        </div>

        {/* Navigation Links */}
        <ul className="flex gap-6 text-lg">
          <li>
            <a href="#overview" className="hover:text-blue-400">Overview</a>
          </li>
          <li>
            <a href="#security" className="hover:text-blue-400">Security</a>
          </li>
          <li>
            <a href="#patterns" className="hover:text-blue-400">Email Patterns</a>
          </li>
        </ul>

        {/* Sign In / Sign Out Button */}
        <button 
          onClick={handleAuthToggle}
          className="px-4 py-2 border rounded-lg bg-blue-500 hover:bg-blue-600"
        >
          {isLoggedIn ? 'Sign Out' : 'Sign In'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

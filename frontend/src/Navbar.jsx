import React, { useState } from 'react';
import './components/styles.css';



function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to toggle login state
  const handleAuthToggle = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 shadow-md relative overflow-hidden">
      {/* Matrix-like scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-pulse"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-24 h-0.5 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0"></div>
      <div className="absolute bottom-0 right-0 w-24 h-0.5 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0"></div>

      <div className="container mx-auto flex justify-between items-center relative z-10">
        {/* Cyberpunk Header with Glow Effect */}
        <div className="group relative">
          <div className="text-2xl font-mono font-bold relative">
            <span className="text-green-500 group-hover:text-green-400 transition-all duration-300">
              &lt;/&gt; Email_Security::Dashboard
            </span>
            <span className="absolute -inset-0.5 bg-green-500/20 blur opacity-0 group-hover:opacity-100 transition duration-300"></span>
          </div>
          <div className="text-xs text-green-500/50 font-mono">sys.monitoring.active</div>
        </div>

        {/* Rest of your original code */}
        <ul className="hidden md:flex gap-6 text-lg ml-auto">
          <li>
            <a href="#overview" className="hover:text-green-300 transition duration-300">Overview</a>
          </li>
          <li>
            <a href="#security" className="hover:text-green-300 transition duration-300">Security</a>
          </li>
          <li>
            <a href="#patterns" className="hover:text-green-300 transition duration-300">Email Patterns</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
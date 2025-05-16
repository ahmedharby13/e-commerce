// src/components/Navbar.tsx
import React, { useContext } from 'react';
import { shopContext } from '../context/shopContext';
import { assets } from '../assets/assets';

const Navbar: React.FC = () => {
  const { CartItem, token, logout } = useContext(shopContext)!;

  // Calculate total cart count
  const cartCount = Object.values(CartItem).reduce(
    (acc, sizes) => acc + Object.values(sizes).reduce((sum, qty) => sum + qty, 0),
    0
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <div className="flex items-center gap-4">
        <img src={assets.logo} alt="Logo" className="h-10" />
        <h1 className="text-xl font-bold">E-Commerce</h1>
      </div>
      <div className="flex gap-6 items-center">
        <a href="/collection">Collection</a>
        <a href="/cart" className="relative">
          <img src={assets.cart_icon} alt="Cart" className="h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2">
              {cartCount}
            </span>
          )}
        </a>
        {token ? (
          <button onClick={handleLogout} className="text-sm text-gray-600">
            Logout
          </button>
        ) : (
          <a href="/login" className="text-sm text-gray-600">
            Login
          </a>
        )}
      </div>
    </div>
  );
};

export default Navbar;
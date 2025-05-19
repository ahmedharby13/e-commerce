import React, { useContext, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { shopContext } from '../context/shopContext';
import { assets } from '../assets/assets';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Added to get current route
  const {
    CartItem,
    token,
    logout,
    ShowSearch,
    SetShowSearch,
    SetCartItem,
  } = useContext(shopContext)!;

  // Calculate total cart count
  const cartCount = Object.values(CartItem).reduce(
    (acc, sizes) => acc + Object.values(sizes).reduce((sum, qty) => sum + qty, 0),
    0
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    SetCartItem({});
    logout();
    navigate('/login');
  };

  // Check if current route is /collection or its subroutes
  const isCollectionRoute = location.pathname.includes('/collection');

  return (
    <div className="flex items-center justify-between font-medium py-5">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2">
        {/* <img src={assets.logo} alt="Logo" className="h-10" /> */}
        <h1 className="text-3xl logo font-bold">EVOQUE</h1>
      </NavLink>

      {/* Desktop Navigation */}
      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
          }
        >
          <p>HOME</p>
          <hr
            className={`w-2/4 border-none h-[1.5px] bg-gray-700 ${
              location.pathname === '/' ? 'block' : 'hidden'
            }`}
          />
        </NavLink>
        <NavLink
          to="/collection"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
          }
        >
          <p>COLLECTION</p>
          <hr
            className={`w-2/4 border-none h-[1.5px] bg-gray-700 ${
              location.pathname.includes('/collection') ? 'block' : 'hidden'
            }`} // Updated to handle subroutes
          />
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
          }
        >
          <p>ABOUT</p>
          <hr
            className={`w-2/4 border-none h-[1.5px] bg-gray-700 ${
              location.pathname === '/about' ? 'block' : 'hidden'
            }`}
          />
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 ${isActive ? 'text-black' : ''}`
          }
        >
          <p>CONTACT</p>
          <hr
            className={`w-2/4 border-none h-[1.5px] bg-gray-700 ${
              location.pathname === '/contact' ? 'block' : 'hidden'
            }`}
          />
        </NavLink>
        <a
          href="https://evoque-admin.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="border px-5 text-xs py-1 rounded-full -mt-2"
        >
          <p className="mt-1">Admin Panel</p>
        </a>
      </ul>

      {/* Icons and Profile */}
      <div className="flex items-center gap-6">
        {/* Search Icon - Only show on /collection routes */}
        {isCollectionRoute && (
          <img
            src={assets.search_icon}
            className="w-5 cursor-pointer"
            alt="search"
            onClick={() => SetShowSearch(!ShowSearch)}
          />
        )}

        {/* Profile Icon and Dropdown */}
        <div className="group relative">
          <img
            src={assets.profile_icon}
            className="w-5 cursor-pointer"
            alt="profile"
            onClick={() => (!token ? navigate('/login') : null)}
          />
          {token && (
            <div className="dropdown-menu hidden group-hover:block absolute right-0 pt-4">
              <div className="flex flex-col gap-2 w-max p-4 bg-slate-100 rounded-lg shadow-lg text-gray-500">
                <p className="cursor-pointer hover:text-black">My Profile</p>
                <p
                  onClick={() => navigate('/orders')}
                  className="cursor-pointer hover:text-black"
                >
                  Orders
                </p>
                <p
                  onClick={handleLogout}
                  className="cursor-pointer hover:text-black"
                >
                  Logout
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cart Icon */}
        <NavLink to="/cart" className="relative">
          <img src={assets.cart_icon} className="w-5 min-w-5" alt="cart" />
          {cartCount > 0 && (
            <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
              {cartCount}
            </p>
          )}
        </NavLink>

        {/* Mobile Menu Toggle */}
        <img
          onClick={() => setMenuOpen(true)}
          src={assets.menu_icon}
          alt="menu-open"
          className="w-5 cursor-pointer sm:hidden"
        />
      </div>

      {/* Mobile Menu */}
      <div
        className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${
          menuOpen ? 'w-full' : 'w-0'
        } shadow-lg`}
      >
        <div className="flex flex-col text-gray-600">
          <div
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-4 pt-5 p-3 cursor-pointer"
          >
            <img
              src={assets.dropdown_icon}
              alt="menu-close"
              className="h-4 rotate-180"
            />
            <p>Back</p>
          </div>
          <NavLink
            onClick={() => setMenuOpen(false)}
            className="pl-6 p-2 border"
            to="/"
          >
            HOME
          </NavLink>
          <NavLink
            onClick={() => setMenuOpen(false)}
            className="pl-6 p-2 border"
            to="/collection"
          >
            COLLECTION
          </NavLink>
          <NavLink
            onClick={() => setMenuOpen(false)}
            className="pl-6 p-2 border"
            to="/about"
          >
            ABOUT
          </NavLink>
          <NavLink
            onClick={() => setMenuOpen(false)}
            className="pl-6 p-2 border"
            to="/contact"
          >
            CONTACT
          </NavLink>
          <a
            href="https://evoque-admin.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="pl-6 p-2 border"
          >
            Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
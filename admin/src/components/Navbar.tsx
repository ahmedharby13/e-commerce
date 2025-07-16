import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  setToken: (token: null) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="flex items-center py-2 px-[4%] justify-between bg-white shadow-md">
      <h1 className="text-2xl logo font-bold text-gray-800">EVOQUE-Admin</h1>
      <button
        onClick={handleLogout}
        className="bg-blue-500 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm hover:bg-blue-600 transition-colors"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
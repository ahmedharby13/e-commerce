import React from 'react';

interface NavbarProps {
  SetToken: (token: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ SetToken }) => {
  return (
    <div className="flex items-center py-2 px-[4%] justify-between">
      <h1 className="text-2xl logo font-bold">EVOQUE-Admin</h1>
      <button
        onClick={() => SetToken('')}
        className="bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
import React from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';

const Sidebar: React.FC = () => {
  return (
    <div className="w-[18%] min-h-screen border-r-2 bg-white shadow-md">
      <div className="flex flex-col gap-6 pt-6 pl-[20%] text-[15px]">
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 px-3 py-2 rounded-l transition-colors ${
              isActive ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
          title="Products"
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="Products Icon" />
          <p className="hidden md:block">Products</p>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 px-3 py-2 rounded-l transition-colors ${
              isActive ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
          title="Orders"
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Orders Icon" />
          <p className="hidden md:block">Orders</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
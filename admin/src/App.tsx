/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
import Login from './pages/Login';

export const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
export const currency = '₹';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    localStorage.setItem('token', token || '');
  }, [token]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {token ? (
        <>
          <Navbar SetToken={setToken} />
          <hr />
          <div className="flex w-full">
            <Sidebar />
            <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/add" element={<Add token={token} />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/orders" element={<Orders token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      ) : (
        <Login SetToken={setToken} />
      )}
    </div>
  );
};

export default App;
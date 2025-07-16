import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products';
import ProductUpdate from './pages/ProductUpdate';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

interface Token {
  accessToken: string;
  refreshToken: string;
}

const App: React.FC = () => {
  const [token, setToken] = useState<Token | null>(() => {
    const storedToken = localStorage.getItem('adminToken');
    return storedToken ? JSON.parse(storedToken) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem('adminToken', JSON.stringify(token));
      navigate('/products');
    } else {
      localStorage.removeItem('adminToken');
      navigate('/');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      {token && <Navbar setToken={setToken} />}
      <div className="flex">
        {token && <Sidebar />}
        <div className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Login setToken={setToken} />} />
            <Route path="/products" element={<Products token={token?.accessToken || ''} />} />
            <Route path="/product/:productId" element={<ProductUpdate token={token?.accessToken || ''} />} />
            <Route path="/orders" element={<Orders token={token?.accessToken || ''} />} />
            <Route path="/order/:orderId" element={<OrderDetail token={token?.accessToken || ''} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
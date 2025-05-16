// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Collection from './pages/Collection';
import Product from './pages/Product';
import Cart from './pages/Cart';
import PlaceOrder from './pages/PlaceOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Navbar />
      <Routes>
        <Route path="/" element={<Collection />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/placeorder" element={<PlaceOrder />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default App;
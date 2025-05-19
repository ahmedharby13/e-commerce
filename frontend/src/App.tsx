//
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
//
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from "./pages/Home";
import About from "./pages/About";
import Cart from './pages/Cart';
import Collection from './pages/Collection';
import Contact from "./pages/Contact";
import Register from './pages/Register';
import Login from './pages/Login';
import Orders from "./pages/Orders";
import PlaceOrder from './pages/PlaceOrder';
import Product from './pages/Product';
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import Verify from './pages/Verify';

const App: React.FC = () => {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <ErrorBoundary>
      <ToastContainer />
      <Navbar />
      <SearchBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About/>} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/orders" element={<Orders/>} />
        <Route path="/placeorder" element={<PlaceOrder />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/verify" element={<Verify />} />
        <Route ></Route>
      </Routes>
      <Footer/>
    </ErrorBoundary>
    </div>

  );
};

export default App;
// src/context/shopContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subCategory: string;
  sizes: string[];
  stock: number;
  date: number;
  bestseller: boolean;
}

interface CartItem {
  [size: string]: number;
}

interface CartData {
  [productId: string]: CartItem;
}

interface ShopContextType {
  products: Product[];
  currency: string;
  delivery_fee: number;
  CartItem: CartData;
  AddCartItem: (productId: string, size: string, quantity?: number) => void;
  UpdateCartItem: (productId: string, size: string, quantity: number) => void;
  RemoveCartItem: (productId: string, size: string) => void;
  GetCartAmount: () => number;
  navigate: (path: string) => void;
  backendUrl: string;
  token: string | null;
  setToken: (token: string | null) => void;
  refreshToken: string | null;
  setRefreshToken: (token: string | null) => void;
  csrfToken: string | null;
  setCsrfToken: (token: string | null) => void;
  Search: string;
  SetSearch: (value: string) => void;
  ShowSearch: boolean;
  SetShowSearch: (value: boolean) => void;
  logout: () => void;
}

export const shopContext = createContext<ShopContextType | null>(null);

interface ShopContextProviderProps {
  children: ReactNode;
}

const ShopContextProvider: React.FC<ShopContextProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const currency = 'EGP';
  const delivery_fee = 50;

  const [products, setProducts] = useState<Product[]>([]);
  const [CartItem, setCartItem] = useState<CartData>({});
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [Search, SetSearch] = useState('');
  const [ShowSearch, SetShowSearch] = useState(false);

  // Fetch CSRF token
  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/csrf-token`, { withCredentials: true });
      setCsrfToken(response.data.csrfToken);
    } catch (error: any) {
      console.error('Error fetching CSRF token:', error.message);
      toast.error('Failed to fetch CSRF token. Some features may not work.');
      setCsrfToken(null);
    }
  };

  // Fetch products
  const getProductsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Fetch cart data
  const getCartData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/cart`, {
        headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
        withCredentials: true,
      });
      if (response.data.success) {
        const cartData: CartData = {};
        response.data.cartItems.forEach((item: any) => {
          if (!cartData[item.productId]) {
            cartData[item.productId] = {};
          }
          cartData[item.productId][item.size] = item.quantity;
        });
        setCartItem(cartData);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Add to cart
  const AddCartItem = async (productId: string, size: string, quantity: number = 1) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        { id: productId, size, quantity },
        {
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setCartItem(response.data.cartData);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Update cart item
  const UpdateCartItem = async (productId: string, size: string, quantity: number) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/update`,
        { id: productId, size, quantity },
        {
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setCartItem(response.data.cartData);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Remove from cart
  const RemoveCartItem = async (productId: string, size: string) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/remove`,
        { id: productId, size },
        {
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setCartItem((prev) => {
          const newCart = { ...prev };
          if (newCart[productId]) {
            delete newCart[productId][size];
            if (Object.keys(newCart[productId]).length === 0) {
              delete newCart[productId];
            }
          }
          return newCart;
        });
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Calculate cart amount
  const GetCartAmount = () => {
    let totalAmount = 0;
    for (const productId in CartItem) {
      const product = products.find((p) => p._id === productId);
      if (product) {
        for (const size in CartItem[productId]) {
          const quantity = CartItem[productId][size];
          totalAmount += product.price * quantity;
        }
      }
    }
    return totalAmount;
  };

  // Refresh token
  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/refresh-token`,
        { refreshToken },
        { withCredentials: true }
      );
      if (response.data.success) {
        setToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
      } else {
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
      }
    } catch (error) {
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/auth/logout`,
        { refreshToken },
        {
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      setToken(null);
      setRefreshToken(null);
      setCartItem({});
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      Cookies.remove('cartData');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Merge cart on login
  const mergeCart = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/merge`,
        {},
        {
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        getCartData();
        Cookies.remove('cartData');
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Initial setup
  useEffect(() => {
    fetchCsrfToken();
    getProductsData();
    if (token) {
      getCartData();
      mergeCart();
    }
  }, [token]);

  // Axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.response?.data?.message.includes('token')) {
          await refreshAccessToken();
          const config = error.config;
          config.headers['Authorization'] = `Bearer ${token}`;
          return axios(config);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [token, refreshToken]);

  // Define contextValue
  const contextValue: ShopContextType = {
    products,
    currency,
    delivery_fee,
    CartItem,
    AddCartItem,
    UpdateCartItem,
    RemoveCartItem,
    GetCartAmount,
    navigate: (path: string) => navigate(path),
    backendUrl,
    token,
    setToken,
    refreshToken,
    setRefreshToken,
    csrfToken,
    setCsrfToken,
    Search,
    SetSearch,
    ShowSearch,
    SetShowSearch,
    logout,
  };

  return <shopContext.Provider value={contextValue}>{children}</shopContext.Provider>;
};

export default ShopContextProvider;
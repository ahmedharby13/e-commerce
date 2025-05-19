import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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
  ratings: number;
  averageRating: number;
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
  SetCartItem: (cart: CartData) => void;
  AddCartItem: (productId: string, size: string, quantity?: number) => Promise<void>;
  UpdateCartItem: (productId: string, size: string, quantity: number) => Promise<void>;
  RemoveCartItem: (productId: string, size: string) => Promise<void>;
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
  logout: () => Promise<void>;
  isAuthenticated: boolean;
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
  const [CartItem, setCartItem] = useState<CartData>(() => {
    const guestCart = localStorage.getItem('guestCart');
    return guestCart ? JSON.parse(guestCart) : {};
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [Search, SetSearch] = useState('');
  const [ShowSearch, SetShowSearch] = useState(false);
  const isAuthenticated = !!token;

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
        toast.error(response.data.message || 'Failed to fetch products');
      }
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
      toast.error(error.message || 'Error fetching products');
    }
  };

  // Fetch cart data for authenticated users
  const getCartData = async () => {
    if (!token || !csrfToken) return;
    try {
      const response = await axios.get(`${backendUrl}/api/cart`, {
        headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
        withCredentials: true,
      });
      console.log('getCartData response:', JSON.stringify(response.data, null, 2)); // Detailed log
      if (response.data.success) {
        let cartData: CartData = {};
        if (Array.isArray(response.data.cartData)) {
          response.data.cartData.forEach((item: { productId: string; size: string; quantity: number }) => {
            if (!cartData[item.productId]) {
              cartData[item.productId] = {};
            }
            cartData[item.productId][item.size] = item.quantity;
          });
        } else {
          console.warn('cartData is not an array or undefined:', response.data.cartData);
          cartData = {}; // Fallback to empty cart
        }
        setCartItem(cartData);
        localStorage.setItem('guestCart', JSON.stringify(cartData));
      } else {
        console.error('getCartData failed:', response.data.message);
        toast.error(response.data.message || 'Failed to fetch cart');
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message || 'Error fetching cart');
    }
  };

  // Add to cart (guest or authenticated)
  const AddCartItem = async (productId: string, size: string, quantity: number = 1): Promise<void> => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    if (!product.sizes.includes(size)) {
      toast.error('Invalid size');
      return;
    }
    if (product.stock < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    if (isAuthenticated && token && csrfToken) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/add`,
          { id: productId, size, quantity },
          {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          }
        );
        console.log('AddCartItem response:', JSON.stringify(response.data, null, 2)); // Debug
        if (response.data.success && Array.isArray(response.data.cartData)) {
          const cartData: CartData = {};
          response.data.cartData.forEach((item: { productId: string; size: string; quantity: number }) => {
            if (!cartData[item.productId]) {
              cartData[item.productId] = {};
            }
            cartData[item.productId][item.size] = item.quantity;
          });
          setCartItem(cartData);
          localStorage.setItem('guestCart', JSON.stringify(cartData));
          toast.success(response.data.message || 'Added to cart');
        } else {
          console.error('AddCartItem failed:', response.data.message);
          toast.error(response.data.message || 'Failed to add to cart');
        }
      } catch (error: any) {
        console.error('Error adding to cart:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || error.message || 'Error adding to cart');
      }
    } else {
      setCartItem((prev) => {
        const newCart = { ...prev };
        if (!newCart[productId]) {
          newCart[productId] = {};
        }
        newCart[productId][size] = (newCart[productId][size] || 0) + quantity;
        localStorage.setItem('guestCart', JSON.stringify(newCart));
        return newCart;
      });
      toast.success('Added to cart', { toastId: `add-${productId}-${size}` }); // Prevent duplicate toasts
    }
  };

  // Update cart item (guest or authenticated)
  const UpdateCartItem = async (productId: string, size: string, quantity: number): Promise<void> => {
    const product = products.find((p) => p._id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }
    if (!product.sizes.includes(size)) {
      toast.error('Invalid size');
      return;
    }
    if (quantity > 0 && product.stock < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    if (isAuthenticated && token && csrfToken) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/update`,
          { id: productId, size, quantity },
          {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          }
        );
        console.log('UpdateCartItem response:', JSON.stringify(response.data, null, 2)); // Debug
        if (response.data.success && Array.isArray(response.data.cartData)) {
          const cartData: CartData = {};
          response.data.cartData.forEach((item: { productId: string; size: string; quantity: number }) => {
            if (!cartData[item.productId]) {
              cartData[item.productId] = {};
            }
            cartData[item.productId][item.size] = item.quantity;
          });
          setCartItem(cartData);
          localStorage.setItem('guestCart', JSON.stringify(cartData));
          toast.success(response.data.message || 'Cart updated');
        } else {
          console.error('UpdateCartItem failed:', response.data.message);
          toast.error(response.data.message || 'Failed to update cart');
        }
      } catch (error: any) {
        console.error('Error updating cart:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || error.message || 'Error updating cart');
      }
    } else {
      setCartItem((prev) => {
        const newCart = { ...prev };
        if (quantity <= 0) {
          if (newCart[productId]) {
            delete newCart[productId][size];
            if (Object.keys(newCart[productId]).length === 0) {
              delete newCart[productId];
            }
          }
        } else {
          if (!newCart[productId]) {
            newCart[productId] = {};
          }
          newCart[productId][size] = quantity;
        }
        localStorage.setItem('guestCart', JSON.stringify(newCart));
        return newCart;
      });
      toast.success('Cart updated');
    }
  };

  // Remove from cart (guest or authenticated)
  const RemoveCartItem = async (productId: string, size: string): Promise<void> => {
    if (isAuthenticated && token && csrfToken) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/cart/remove`,
          { id: productId, size },
          {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          }
        );
        console.log('RemoveCartItem response:', JSON.stringify(response.data, null, 2)); // Debug
        if (response.data.success && Array.isArray(response.data.cartData)) {
          const cartData: CartData = {};
          response.data.cartData.forEach((item: { productId: string; size: string; quantity: number }) => {
            if (!cartData[item.productId]) {
              cartData[item.productId] = {};
            }
            cartData[item.productId][item.size] = item.quantity;
          });
          setCartItem(cartData);
          localStorage.setItem('guestCart', JSON.stringify(cartData));
          toast.success(response.data.message || 'Removed from cart');
        } else {
          console.error('RemoveCartItem failed:', response.data.message);
          toast.error(response.data.message || 'Failed to remove from cart');
        }
      } catch (error: any) {
        console.error('Error removing from cart:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || error.message || 'Error removing from cart');
      }
    } else {
      setCartItem((prev) => {
        const newCart = { ...prev };
        if (newCart[productId]) {
          delete newCart[productId][size];
          if (Object.keys(newCart[productId]).length === 0) {
            delete newCart[productId];
          }
          localStorage.setItem('guestCart', JSON.stringify(newCart));
          return newCart;
        }
        return prev;
      });
      toast.success('Removed from cart');
    }
  };

  // Calculate cart amount
  const GetCartAmount = (): number => {
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
    if (!refreshToken) return;
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/refresh-token`,
        { refreshToken },
        { withCredentials: true, headers: { 'X-CSRF-Token': csrfToken } }
      );
      console.log('refreshAccessToken response:', JSON.stringify(response.data, null, 2)); // Debug
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
        localStorage.removeItem('userId');
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Error refreshing token:', error.response?.data || error.message);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      toast.error(error.response?.data?.message || 'Error refreshing token');
      navigate('/login');
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await axios.post(
        `${backendUrl}/api/user/logout`,
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
      localStorage.removeItem('userId');
      localStorage.removeItem('guestCart');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Error logging out:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message || 'Error logging out');
    }
  };

  // Merge cart on login
  const mergeCart = async () => {
    if (!token || !csrfToken) return;
    try {
      const guestCart = localStorage.getItem('guestCart');
      const cartData = guestCart ? JSON.parse(guestCart) : {};
      console.log('Merging cart:', JSON.stringify(cartData, null, 2)); // Detailed log
      const response = await axios.post(
        `${backendUrl}/api/cart/merge`,
        { cartData },
        {
          headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      console.log('Merge cart response:', JSON.stringify(response.data, null, 2)); // Detailed log
      if (response.data.success) {
        let cartData: CartData = {};
        if (Array.isArray(response.data.cartData)) {
          response.data.cartData.forEach((item: { productId: string; size: string; quantity: number }) => {
            if (!cartData[item.productId]) {
              cartData[item.productId] = {};
            }
            cartData[item.productId][item.size] = item.quantity;
          });
        } else {
          console.warn('mergeCart: cartData is not an array or undefined:', response.data.cartData);
          cartData = {}; // Fallback to empty cart
        }
        setCartItem(cartData);
        localStorage.setItem('guestCart', JSON.stringify(cartData));
        localStorage.removeItem('guestCart'); // Clear after merge
        toast.success(response.data.message || 'Cart merged successfully');
        await getCartData(); // Refresh cart after merge
      } else {
        console.error('mergeCart failed:', response.data.message);
        toast.error(response.data.message || 'Failed to merge cart');
      }
    } catch (error: any) {
      console.error('Error merging cart:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message || 'Error merging cart');
    }
  };

  // Initial setup
  useEffect(() => {
    fetchCsrfToken();
    getProductsData();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token && csrfToken) {
      mergeCart(); // Merge first, then fetch
      getCartData();
    } else {
      const guestCart = localStorage.getItem('guestCart');
      setCartItem(guestCart ? JSON.parse(guestCart) : {});
    }
  }, [token, csrfToken]);

  // Axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.response?.data?.message?.includes('token')) {
          await refreshAccessToken();
          if (token) {
            const config = error.config;
            config.headers['Authorization'] = `Bearer ${token}`;
            return axios(config);
          }
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
    SetCartItem: setCartItem,
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
    isAuthenticated,
  };

  return <shopContext.Provider value={contextValue}>{children}</shopContext.Provider>;
};

export default ShopContextProvider;
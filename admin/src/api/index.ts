import axios from 'axios';
import { backendUrl } from '../App';

const api = axios.create({
  baseURL: backendUrl,
});

// Interceptor to add CSRF token for POST requests
api.interceptors.request.use(async (config) => {
  if (config.method === 'post' && !config.url?.includes('/api/csrf-token')) {
    try {
      const response = await axios.get<{ csrfToken: string }>(`${backendUrl}/api/csrf-token`);
      config.headers['X-CSRF-Token'] = response.data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }
  return config;
});

export const loginAdmin = async (email: string, password: string) => {
  return api.post<{ success: boolean; message: string; token: string }>(
    '/api/user/admin',
    { email, password }
  );
};

export const addProduct = async (formData: FormData, token: string) => {
  return api.post<{ success: boolean; message: string }>(
    '/api/product/add',
    formData,
    { headers: { token } }
  );
};

export const listProducts = async () => {
  return api.get<{
    message: string;
    success: boolean;
    products: {
      _id: string;
      name: string;
      category: string;
      price: number;
      images: string[];
      stock: number;
      sizes: string[];
    }[];
  }>('/api/product/list');
};

export const removeProduct = async (id: string, token: string) => {
  return api.post<{ success: boolean; message: string }>(
    '/api/product/remove',
    { id },
    { headers: { token } }
  );
};

export const listOrders = async (token: string) => {
  return api.post<{
    success: boolean;
    orders: {
      _id: string;
      userId: { _id: string; name: string; email: string };
      items: { productId: { _id: string; name: string }; name: string; quantity: number; price: number; size: string }[];
      totalAmount: number;
      address: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      paymentMethod: 'COD' | 'Stripe';
      payment: boolean;
      status: 'Order Placed' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
      date: number;
    }[];
    message?: string;
  }>('/api/order/list', {}, { headers: { token } });
};

export const updateOrderStatus = async (orderId: string, status: string, token: string) => {
  return api.post<{ success: boolean; message: string }>(
    '/api/order/status',
    { orderId, status },
    { headers: { token } }
  );
};

export default api;
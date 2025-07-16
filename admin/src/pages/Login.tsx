import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../utils/constants';

interface LoginProps {
  setToken: (token: { accessToken: string; refreshToken: string }) => void;
}

interface FormData {
  email: string;
  password: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

const Login: React.FC<LoginProps> = ({ setToken }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Fetch CSRF token
  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/csrf-token`, {
        withCredentials: true, // Include credentials if needed
      });
      if (response.data.csrfToken) {
        setCsrfToken(response.data.csrfToken);
        return response.data.csrfToken;
      }
      toast.error('Failed to fetch CSRF token');
      return '';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to the server. Please check if the backend is running and CORS is configured.');
        } else {
          toast.error(error.response?.data.message || 'Error fetching CSRF token');
        }
      } else {
        toast.error('An unexpected error occurred while fetching CSRF token');
      }
      console.error('CSRF Token Error:', error);
      return '';
    }
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!csrfToken) {
      toast.error('CSRF token is missing. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post<ApiResponse>(
        `${backendUrl}/api/user/admin`,
        { email: formData.email, password: formData.password },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          withCredentials: true, // Include credentials if needed
        }
      );

      if (response.data.success && response.data.accessToken && response.data.refreshToken) {
        setFormData({ email: '', password: '' });
        toast.success('Admin login successful!');
        setToken({ accessToken: response.data.accessToken, refreshToken: response.data.refreshToken });
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to the server. Please check if the backend is running and CORS is configured.');
        } else {
          toast.error(error.response?.data.message || 'Invalid credentials');
        }
      } else {
        toast.error('An unexpected error occurred during login');
      }
      console.error('Login Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
      <div className="bg-white shadow-md rounded-lg px-8 py-6 max-w-md">
        <h1 className="logo text-center text-3xl mb-4 font-bold">EVOQUE Admin</h1>
        <h1 className="text-2xl font-bold mb-4 text-center">Admin Login</h1>
        <form onSubmit={onSubmitHandler} className="space-y-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none focus:border-blue-500"
              type="email"
              placeholder="Enter your email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                className="rounded-md w-full px-3 py-2 border border-gray-300 outline-none focus:border-blue-500"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            className={`w-full py-2 px-4 rounded-md text-white ${
              isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-black hover:bg-blue-600'
            } transition-colors`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
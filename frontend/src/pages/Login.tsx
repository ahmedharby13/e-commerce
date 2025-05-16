// src/pages/Login.tsx
import React, { useContext, useState } from 'react';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface LoginData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { backendUrl, setToken, setRefreshToken, csrfToken } = useContext(shopContext)!;
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginData>({ email: '', password: '' });

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/login`,
        formData,
        {
          headers: { 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userId', response.data.userId);
        toast.success(response.data.message);
        navigate('/');
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmitHandler} className="w-full max-w-md p-8 border rounded">
        <h2 className="text-2xl mb-6">Login</h2>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onChangeHandler}
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={onChangeHandler}
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-black text-white p-2 rounded">
          Login
        </button>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-blue-500 text-white p-2 rounded"
        >
          Login with Google
        </button>
      </form>
    </div>
  );
};

export default Login;
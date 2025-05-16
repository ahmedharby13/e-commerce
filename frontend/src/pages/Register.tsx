// src/pages/Register.tsx
import React, { useContext, useState } from 'react';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const { backendUrl, csrfToken } = useContext(shopContext)!;
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${backendUrl}/api/auth/register`,
        formData,
        {
          headers: { 'X-CSRF-Token': csrfToken },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/login');
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmitHandler} className="w-full max-w-md p-8 border rounded">
        <h2 className="text-2xl mb-6">Register</h2>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChangeHandler}
          placeholder="Name"
          className="w-full mb-4 p-2 border rounded"
          required
        />
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
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={onChangeHandler}
          placeholder="Confirm Password"
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-black text-white p-2 rounded">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
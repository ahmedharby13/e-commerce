// src/pages/Verify.tsx
import React, { useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Verify: React.FC = () => {
  const { backendUrl, token, navigate, csrfToken } = useContext(shopContext)!;
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const verifyStripe = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId || !orderId) {
          toast.error('Invalid order or user');
          navigate('/');
          return;
        }
        const response = await axios.post(
          `${backendUrl}/api/order/verifyStripe`,
          { orderId, success, userId },
          {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          }
        );
        if (response.data.success) {
          // Clear cart after successful payment
          await axios.post(
            `${backendUrl}/api/cart`,
            { cartData: {} },
            {
              headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
              withCredentials: true,
            }
          );
          toast.success(response.data.message);
          navigate('/orders');
        } else {
          toast.error(response.data.message);
          navigate('/');
        }
      } catch (error: any) {
        toast.error(error.message);
        navigate('/');
      }
    };

    if (success && orderId) {
      verifyStripe();
    }
  }, [success, orderId, backendUrl, token, navigate, csrfToken]);

  return <div>Processing...</div>;
};

export default Verify;
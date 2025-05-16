// src/pages/PlaceOrder.tsx
import React, { useContext, useState, FormEvent } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phone: string;
}

const PlaceOrder: React.FC = () => {
  const [PayMethod, SetPayMethod] = useState<'cod' | 'stripe'>('cod');
  const { navigate, backendUrl, token, CartItem, products, GetCartAmount, delivery_fee, csrfToken } = useContext(shopContext)!;

  const [formData, SetFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
  });

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    SetFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!token) {
        toast.error('Please login to proceed');
        navigate('/login');
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User ID not found');
        navigate('/login');
        return;
      }

      const items = [];
      for (const productId in CartItem) {
        const product = products.find((p) => p._id === productId);
        if (product) {
          for (const size in CartItem[productId]) {
            const quantity = CartItem[productId][size];
            items.push({
              name: product.name,
              price: product.price,
              quantity,
              size,
            });
          }
        }
      }

      const orderData = {
        userId,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zipcode,
          country: formData.country,
        },
        items,
        amount: GetCartAmount() + delivery_fee,
      };

      switch (PayMethod) {
        case 'cod': {
          const response = await axios.post(`${backendUrl}/api/order/place`, orderData, {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          });
          if (response.data.success) {
            toast.success(response.data.message);
            navigate('/orders');
          } else {
            toast.error(response.data.message);
          }
          break;
        }

        case 'stripe': {
          const toastId = toast.loading('Please wait...');
          const response = await axios.post(`${backendUrl}/api/order/stripe`, orderData, {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          });
          if (response.data.success) {
            toast.update(toastId, { render: 'Redirecting', type: 'success', isLoading: false, autoClose: 3000 });
            window.location.replace(response.data.session_url);
          } else {
            toast.update(toastId, { render: response.data.message, type: 'error', isLoading: false, autoClose: 3000 });
          }
          break;
        }

        default:
          break;
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh]">
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onChangeHandler}
            placeholder="First name"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            required
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onChangeHandler}
            placeholder="Last name"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            required
          />
        </div>
        <input
          type="email"
          placeholder="Email address"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          name="email"
          value={formData.email}
          onChange={onChangeHandler}
          required
        />
        <input
          type="text"
          placeholder="Street"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          name="street"
          value={formData.street}
          onChange={onChangeHandler}
          required
        />
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="City"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            name="city"
            value={formData.city}
            onChange={onChangeHandler}
            required
          />
          <input
            type="text"
            placeholder="State"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            name="state"
            value={formData.state}
            onChange={onChangeHandler}
            required
          />
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Zipcode"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            name="zipcode"
            value={formData.zipcode}
            onChange={onChangeHandler}
            required
          />
          <input
            type="text"
            placeholder="Country"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            name="country"
            value={formData.country}
            onChange={onChangeHandler}
            required
          />
        </div>
        <input
          type="number"
          placeholder="Phone"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          name="phone"
          value={formData.phone}
          onChange={onChangeHandler}
          required
        />
      </div>

      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={'PAYMENT'} text2={'METHOD'} />
        </div>

        <div className="flex gap-3 flex-col lg:flex-row">
          <div onClick={() => SetPayMethod('stripe')} className="flex items-center gap-3 border p-2 px-3 cursor-pointer">
            <p className={`min-w-3.5 h-3.5 border rounded-full ${PayMethod === 'stripe' ? 'bg-green-400' : ''}`}></p>
            <img className="h-5 mx-4" src={assets.stripe_logo} alt="Stripe" />
          </div>
          <div onClick={() => SetPayMethod('cod')} className="flex items-center gap-3 border p-2 px-3 cursor-pointer">
            <p className={`min-w-3.5 h-3.5 border rounded-full ${PayMethod === 'cod' ? 'bg-green-400' : ''}`}></p>
            <p className="text-gray-500 text-sm font-medium mx-4">CASH ON DELIVERY</p>
          </div>
        </div>

        <div className="w-full text-end mt-8">
          <button className="bg-black text-white px-16 py-3 text-sm" type="submit">
            PLACE ORDER
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
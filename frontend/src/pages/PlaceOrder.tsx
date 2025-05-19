import React, { useContext, useState, FormEvent } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

interface FormData {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size?: string;
}

const PlaceOrder: React.FC = () => {
  const [payMethod, setPayMethod] = useState<'cod' | 'stripe'>('cod');
  const { navigate, backendUrl, token, CartItem, SetCartItem, products, GetCartAmount, delivery_fee, csrfToken, isAuthenticated } = useContext(shopContext)!;

  const [formData, setFormData] = useState<FormData>({
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
  });

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const { street, city, state, zipcode, country} = formData;
    if (!street.trim() || !city.trim() || !state.trim() || !zipcode.trim() || !country.trim()) {
      toast.error('All fields are required');
      return false;
    }
    if (!/^\d{5}$/.test(zipcode)) {
      toast.error('Zipcode must be a 5-digit number');
      return false;
    }
    return true;
  };

  const onSubmitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!isAuthenticated || !token) {
        toast.error('Please login or register to place an order');
        navigate('/login');
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User ID not found. Please login again.');
        navigate('/login');
        return;
      }

      if (!csrfToken) {
        toast.error('Authentication error. Please try again.');
        navigate('/login');
        return;
      }

      if (!validateForm()) {
        return;
      }

      const items: OrderItem[] = [];
      for (const productId in CartItem) {
        const product = products.find((p) => p._id === productId);
        if (!product) {
          toast.error(`Product ${productId} not found`);
          continue;
        }
        for (const size in CartItem[productId]) {
          const quantity = CartItem[productId][size];
          if (quantity > 0) {
            items.push({
              name: product.name,
              price: product.price,
              quantity,
              size: size === 'undefined' ? undefined : size,
            });
          }
        }
      }

      if (items.length === 0) {
        toast.error('Cart is empty');
        return;
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

      switch (payMethod) {
        case 'cod': {
          const response = await axios.post(`${backendUrl}/api/order/place`, orderData, {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken },
            withCredentials: true,
          });
          if (response.data.success) {
            SetCartItem({});
            Cookies.remove('guestCart');
            toast.success(response.data.message);
            navigate('/orders');
          } else {
            toast.error(response.data.message || 'Failed to place order');
          }
          break;
        }

        case 'stripe': {
          const toastId = toast.loading('Please wait...');
          const response = await axios.post(`${backendUrl}/api/order/stripe`, orderData, {
            headers: { Authorization: `Bearer ${token}`, 'X-CSRF-Token': csrfToken, Origin: window.location.origin },
            withCredentials: true,
          });
          if (response.data.success) {
            toast.update(toastId, { render: 'Redirecting to Stripe', type: 'success', isLoading: false, autoClose: 3000 });
            window.location.replace(response.data.session_url);
          } else {
            toast.update(toastId, { render: response.data.message || 'Failed to initiate Stripe payment', type: 'error', isLoading: false, autoClose: 3000 });
          }
          break;
        }

        default:
          toast.error('Invalid payment method');
          break;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh]">
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <input
          type="text"
          placeholder="Street"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          name="street"
          value={formData.street}
          onChange={onChangeHandler}
          required
          aria-label="Street address"
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
            aria-label="City"
          />
          <input
            type="text"
            placeholder="State"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            name="state"
            value={formData.state}
            onChange={onChangeHandler}
            required
            aria-label="State"
          />
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Zipcode"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            name="zipcode"
            value={formData.zipcode}
            onChange={onChangeHandler}
            required
            pattern="\d{5}"
            aria-label="Zipcode"
          />
          <input
            type="text"
            placeholder="Country"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            name="country"
            value={formData.country}
            onChange={onChangeHandler}
            required
            aria-label="Country"
          />
        </div>
      </div>
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>
        <div className="mt-12">
          <Title text1={'PAYMENT'} text2={'METHOD'} />
        </div>
        <div className="flex gap-3 flex-col lg:flex-row">
          <div
            onClick={() => setPayMethod('stripe')}
            className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            role="button"
            aria-label="Select Stripe payment"
          >
            <p className={`min-w-3.5 h-3.5 border rounded-full ${payMethod === 'stripe' ? 'bg-green-400' : ''}`}></p>
            <img className="h-5 mx-4" src={assets.stripe_logo} alt="Stripe" />
          </div>
          <div
            onClick={() => setPayMethod('cod')}
            className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            role="button"
            aria-label="Select Cash on Delivery"
          >
            <p className={`min-w-3.5 h-3.5 border rounded-full ${payMethod === 'cod' ? 'bg-green-400' : ''}`}></p>
            <p className="text-gray-500 text-sm font-medium mx-4">CASH ON DELIVERY</p>
          </div>
        </div>
        <div className="w-full text-end mt-8">
          <button
            className="bg-black text-white px-16 py-3 text-sm disabled:bg-gray-500"
            type="submit"
            disabled={Object.keys(CartItem).length === 0}
            aria-label="Place order"
          >
            PLACE ORDER
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
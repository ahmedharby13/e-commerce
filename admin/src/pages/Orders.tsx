import React, { useEffect, useState } from 'react';
import { listOrders, updateOrderStatus } from '../api';
import { currency } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';

interface OrderItem {
  productId: { _id: string; name: string };
  name: string;
  quantity: number;
  price: number;
  size: string;
}

interface Order {
  _id: string;
  userId: { _id: string; name: string; email: string };
  items: OrderItem[];
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
}

interface OrdersProps {
  token: string;
}

const Orders: React.FC<OrdersProps> = ({ token }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = React.useCallback(async () => {
    if (!token) return;
    try {
      const response = await listOrders(token);
      if (response.data.success) {
        setOrders(response.data.orders.reverse());
      } else {
        toast.error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || error.message;
        toast.error(errorMessage);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  }, [token]);

  const statusHandler = async (e: React.ChangeEvent<HTMLSelectElement>, orderId: string) => {
    if (!token) return;
    try {
      const response = await updateOrderStatus(orderId, e.target.value, token);
      if (response.data.success) {
        await fetchOrders();
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || error.message;
        toast.error(errorMessage);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      <h3>Order Page</h3>
      <div>
        {orders.map((order) => (
          <div
            key={order._id}
            className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 text-sm text-gray-700"
          >
            <img src={assets.parcel_icon} alt="Parcel Icon" className="w-12" />
            <div>
              <div>
                {order.items.map((item, index) => (
                  <p className="py-0.5" key={index}>
                    {item.name} x {item.quantity} <span>({item.size})</span>
                    {index < order.items.length - 1 ? ',' : ''}
                  </p>
                ))}
              </div>
              <p className="mt-3 mb-2 font-medium">{order.userId.name}</p>
              <div>
                <p>{order.address.street},</p>
                <p>
                  {order.address.city}, {order.address.state}, {order.address.country},{' '}
                  {order.address.zip}
                </p>
              </div>
              <p>Email: {order.userId.email}</p>
            </div>
            <div>
              <p className="text-sm sm:text-[15px]">Items: {order.items.length}</p>
              <p className="mt-3">Payment Method: {order.paymentMethod}</p>
              <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
              <p>Date: {new Date(order.date).toLocaleDateString()}</p>
            </div>
            <p className="text-sm sm:text-[15px]">
              {currency.toString()} {order.totalAmount}
            </p>
            <select
              className="p-2 font-semibold"
              value={order.status}
              onChange={(e) => statusHandler(e, order._id)}
            >
              <option value="Order Placed">Order Placed</option>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
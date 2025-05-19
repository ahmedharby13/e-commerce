import React, { useContext, useEffect, useState } from 'react';
import { shopContext } from '../context/shopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  status: string;
  payment: boolean;
  paymentMethod: 'COD' | 'Stripe';
  date: number;
  images?: string[]; // Optional, as images come from product
}

const Orders: React.FC = () => {
  const { backendUrl, token, currency, products } = useContext(shopContext)!;
  const [orderData, setOrderData] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      if (!token) {
        toast.error('Please login to view orders');
        return;
      }
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User ID not found');
        return;
      }
      const response = await axios.post(
        `${backendUrl}/api/order/userorders`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        let allOrdersItem: OrderItem[] = [];
        response.data.orders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            const product = products.find((p) => p._id === item.productId);
            allOrdersItem.push({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              size: item.size,
              status: order.status,
              payment: order.payment,
              paymentMethod: order.paymentMethod,
              date: order.date,
              images: product?.images || [], // Get images from products
            });
          });
        });
        setOrderData(allOrdersItem.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, products]);

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>
      {loading ? (
        <p className="text-center text-gray-500">Loading orders...</p>
      ) : orderData.length === 0 ? (
        <p className="text-center text-gray-500">No orders found</p>
      ) : (
        <div>
          {orderData.map((item, index) => (
            <div
              key={`${item.productId}-${item.size}-${index}`}
              className="py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex items-start gap-6 text-sm">
                {item.images && item.images[0] ? (
                  <img className="w-16 sm:w-20" src={item.images[0]} alt={item.name} />
                ) : (
                  <p className="text-gray-500">No image</p>
                )}
                <div>
                  <p className="sm:text-base font-medium">{item.name}</p>
                  <div className="flex items-center gap-3 mt-2 text-base text-gray-700">
                    <p className="text-lg">
                      {currency}
                      {item.price}
                    </p>
                    <p>Quantity: {item.quantity}</p>
                    {item.size && <p>Size: {item.size}</p>}
                  </div>
                  <p className="mt-2">
                    Date: <span className="text-gray-400">{new Date(item.date).toDateString()}</span>
                  </p>
                  <p className="mt-2">
                    Payment: <span className="text-gray-400">{item.paymentMethod}</span>
                  </p>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-between">
                <div className="flex items-center gap-2">
                  <p className="min-w-2 h-2 rounded-full bg-green-500"></p>
                  <p className="text-sm md:text-base">{item.status}</p>
                </div>
                <button
                  onClick={fetchOrders}
                  className="border px-4 py-2 text-sm font-medium rounded-sm"
                >
                  Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
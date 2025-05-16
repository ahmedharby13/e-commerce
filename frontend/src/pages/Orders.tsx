// src/pages/Orders.tsx

import React, { useContext, useEffect, useState } from 'react';
import { shopContext } from '../context/shopContext';
import Title from '../components/Title';
import axios from 'axios';

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string[];
  status: string;
  payment: boolean;
  paymentMethod: string;
  date: number;
}

const Orders: React.FC = () => {
  const { backendUrl, token, currency } = useContext(shopContext)!;
  const [orderData, SetOrderData] = useState<OrderItem[]>([]);

  const fetchOrders = async () => {
    try {
      if (!token) {
        return;
      }
      const response = await axios.post(
        `${backendUrl}/api/order/userorders`,
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        let allOrdersItem: OrderItem[] = [];
        response.data.orders.forEach((order: any) => {
          order.items.forEach((item: any) => {
            item.status = order.status;
            item.payment = order.payment;
            item.paymentMethod = order.paymentMethod;
            item.date = order.date;
            allOrdersItem.push(item);
          });
        });
        SetOrderData(allOrdersItem.reverse());
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      <div>
        {orderData.map((item, index) => (
          <div
            key={index}
            className="py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex items-start gap-6 text-sm">
              <img className="w-16 sm:w-20" src={item.image[0]} alt="" />
              <div>
                <p className="sm:text-base font-medium">{item.name}</p>
                <div className="flex items-center gap-3 mt-2 text-base text-gray-700">
                  <p className="text-lg">
                    {currency}
                    {item.price}
                  </p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Size: {item.size}</p>
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
    </div>
  );
};

export default Orders;
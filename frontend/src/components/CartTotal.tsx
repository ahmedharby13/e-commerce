// src/components/CartTotal.tsx
import React, { useContext } from 'react';
import { shopContext } from '../context/shopContext';

const CartTotal: React.FC = () => {
  const { GetCartAmount, delivery_fee, currency } = useContext(shopContext)!;
  const subtotal = GetCartAmount();
  const total = subtotal + delivery_fee;

  return (
    <div className="text-gray-700">
      <h3 className="text-lg font-medium mb-4">Cart Total</h3>
      <div className="flex justify-between mb-2">
        <p>Subtotal</p>
        <p>
          {currency}
          {subtotal}
        </p>
      </div>
      <div className="flex justify-between mb-2">
        <p>Delivery Fee</p>
        <p>
          {currency}
          {delivery_fee}
        </p>
      </div>
      <hr className="my-2" />
      <div className="flex justify-between font-medium">
        <p>Total</p>
        <p>
          {currency}
          {total}
        </p>
      </div>
    </div>
  );
};

export default CartTotal;
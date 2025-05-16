// src/pages/Cart.tsx
import React, { useContext, useEffect, useState } from 'react';
import { shopContext } from '../context/shopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';

interface CartProduct {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  images: string[];
}

const Cart: React.FC = () => {
  const { products, CartItem, RemoveCartItem, UpdateCartItem, navigate } = useContext(shopContext)!;
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);

  // Fetch cart products
  useEffect(() => {
    const cartData: CartProduct[] = [];
    for (const productId in CartItem) {
      const product = products.find((p) => p._id === productId);
      if (product) {
        for (const size in CartItem[productId]) {
          const quantity = CartItem[productId][size];
          cartData.push({
            productId,
            name: product.name,
            price: product.price,
            size,
            quantity,
            images: product.images,
          });
        }
      }
    }
    setCartProducts(cartData);
  }, [CartItem, products]);

  return (
    <div className="border-t pt-14">
      <div className="text-2xl mb-3">
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      <div>
        {cartProducts.map((item, index) => (
          <div key={index} className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] gap-4">
            <div className="flex items-start gap-6">
              {item.images[0] ? (
                <img className="w-16 sm:w-20" src={item.images[0]} alt={item.name} />
              ) : (
                <p>No image</p>
              )}
              <div>
                <p className="text-sm sm:text-lg font-medium">{item.name}</p>
                <div className="flex items-center gap-5 mt-2">
                  <p>{item.price} EGP</p>
                  <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">Size: {item.size}</p>
                </div>
              </div>
            </div>
            <input
              className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => UpdateCartItem(item.productId, item.size, parseInt(e.target.value))}
            />
            <img
              onClick={() => RemoveCartItem(item.productId, item.size)}
              className="w-4 mr-4 sm:w-5 cursor-pointer"
              src={assets.bin_icon}
              alt="Remove"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end my-20">
        <div className="w-full sm:w-[450px]">
          <CartTotal />
          <div className="w-full text-end">
            <button
              onClick={() => navigate('/placeorder')}
              className="bg-black text-white text-sm my-8 px-8 py-3"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
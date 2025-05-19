import React, { useContext, useEffect, useState } from 'react';
import { shopContext } from '../context/shopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { useNavigate } from 'react-router-dom';

interface CartProduct {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  images: string[];
  stock: number;
}

const Cart: React.FC = () => {
  const { products, CartItem, UpdateCartItem, RemoveCartItem, currency, navigate } = useContext(shopContext)!;
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and process cart data
  useEffect(() => {
    if (!products.length) return;

    setLoading(true);
    setError(null);

    try {
      const cartData: CartProduct[] = [];
      for (const productId in CartItem) {
        const product = products.find((p) => p._id === productId);
        if (product) {
          for (const size in CartItem[productId]) {
            const quantity = CartItem[productId][size];
            if (quantity > 0) {
              cartData.push({
                productId,
                name: product.name,
                price: product.price,
                size,
                quantity,
                images: product.images,
                stock: product.stock,
              });
            }
          }
        }
      }
      setCartProducts(cartData);
    } catch (err) {
      setError('Failed to load cart items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [CartItem, products]);

  // Handle quantity update
  const handleQuantityChange = (productId: string, size: string, value: string) => {
    const newQuantity = parseInt(value);
    if (isNaN(newQuantity) || newQuantity < 0) return; // Prevent invalid inputs
    if (newQuantity === 0) {
      RemoveCartItem(productId, size); // Remove item if quantity is 0
    } else {
      UpdateCartItem(productId, size, newQuantity); // Update quantity
    }
  };

  return (
    <div className="border-t pt-14 min-h-screen">
      <div className="text-2xl mb-3">
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading cart...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : cartProducts.length === 0 ? (
        <p className="text-center text-gray-500">Your cart is empty</p>
      ) : (
        <>
          <div>
            {cartProducts.map((item, index) => (
              <div
                key={`${item.productId}-${item.size}-${index}`}
                className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
              >
                <div className="flex items-start gap-6">
                  {item.images[0] ? (
                    <img
                      className="w-16 sm:w-20 object-cover"
                      src={item.images[0]}
                      alt={item.name}
                    />
                  ) : (
                    <p className="text-sm text-gray-500">No image</p>
                  )}
                  <div>
                    <p className="text-sm sm:text-lg font-medium">{item.name}</p>
                    <div className="flex items-center gap-5 mt-2">
                      <p>
                        {currency}
                        {item.price}
                      </p>
                      <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">
                        Size: {item.size}
                      </p>
                    </div>
                    {item.quantity > item.stock && (
                      <p className="text-red-500 text-sm mt-1">
                        Only {item.stock} in stock
                      </p>
                    )}
                  </div>
                </div>
                <input
                  className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.productId, item.size, e.target.value)}
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
                  className="bg-black text-white text-sm my-8 px-8 py-3 disabled:bg-gray-400"
                  disabled={cartProducts.length === 0}
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
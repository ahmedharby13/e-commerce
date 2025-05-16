// src/pages/Product.tsx
import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shopContext } from '../context/shopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subCategory: string;
  sizes: string[];
  stock: number;
  date: number;
  bestseller: boolean;
}

const Product: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { currency, AddCartItem, backendUrl, token } = useContext(shopContext)!;
  const [productData, setProductData] = useState<Product | null>(null);
  const [image, setImage] = useState<string>('');
  const [size, setSize] = useState<string>('');

  const fetchProductData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setProductData(response.data.product);
        setImage(response.data.product.images[0]);
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const handleAddToCart = () => {
    if (!size) {
      toast.error('Please select a size');
      return;
    }
    if (productData) {
      AddCartItem(productData._id, size);
    }
  };

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      <div className="flex flex-col sm:flex-row gap-12">
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-auto justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.images.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt={productData.name} />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>
          <p className="mt-5 text-gray-500">{productData.description}</p>
          <p className="mt-5 text-3xl font-medium">
            {currency} {productData.price}
          </p>
          <div className="mt-5">
            <p className="mb-3 text-gray-600">Select Size</p>
            <div className="flex gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  key={index}
                  className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-orange-500' : ''}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="mt-8 bg-black text-white px-8 py-3 text-sm active:bg-gray-700"
          >
            ADD TO CART
          </button>
          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div>Loading...</div>
  );
};

export default Product;
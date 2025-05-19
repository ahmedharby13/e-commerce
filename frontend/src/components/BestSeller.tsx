import React, { useContext, useEffect, useState } from 'react';
import { shopContext, Product } from '../context/shopContext';
import Title from './Title';
import ProductItem from './ProductItem';

const BestSeller: React.FC = () => {
  const { products } = useContext(shopContext)!;
  const [bestSeller, setBestSeller] = useState<Product[]>([]);

  useEffect(() => {
    const bestProduct = products.filter((item: Product) => item.bestseller);
    setBestSeller(bestProduct.slice(0, 5));
  }, [products]);

  return (
    <div className="my-10">
      <div className="py-8 text-center text-3xl">
        <Title text1="BEST" text2="SELLERS" />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          "Discover our best-selling pieces—loved by many, designed for you. Elevate your style with fashion that never goes out of trend!"
        </p>
      </div>
      
        {/* Best seller products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4 gap-y-6">
        {bestSeller.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            name={item.name}
            images={item.images}
            price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default BestSeller;
// src/components/LatestCollection.tsx
import React, { useContext } from 'react';
import { shopContext } from '../context/shopContext';
import Title from './Title';
import ProductItem from './ProductItem';

const LatestCollection: React.FC = () => {
  const { products } = useContext(shopContext)!;
  const latestProducts = [...products]
    .sort((a, b) => b.date - a.date)
    .slice(0, 10);

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={'LATEST'} text2={'COLLECTIONS'} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {latestProducts.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            images={item.images}
            name={item.name}
            price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default LatestCollection;
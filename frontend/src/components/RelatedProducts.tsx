import React, { useContext } from 'react';
import { shopContext } from '../context/shopContext';
import ProductItem from './ProductItem';

interface RelatedProductsProps {
  category: string;
  subCategory: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ category, subCategory }) => {
  const { products } = useContext(shopContext)!;
  const relatedProducts = products
    .filter((item) => item.category === category && item.subCategory === subCategory)
    .slice(0, 4);

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <h2>RELATED PRODUCTS</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 gap-y-6">
        {relatedProducts.map((item) => (
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

export default RelatedProducts;
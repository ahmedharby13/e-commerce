import React, { useContext } from 'react';
import { shopContext } from '../context/shopContext';
import { Link } from 'react-router-dom';

interface ProductItemProps {
  id: string;
  images: string[] | undefined;
  name: string;
  price: number;
}

const ProductItem: React.FC<ProductItemProps> = ({ id, images, name, price }) => {
  const { currency } = useContext(shopContext)!;

  return (
    <Link className="text-gray-700 cursor-pointer" to={`/product/${id}`}>
      <div className="overflow-hidden">
        {images && Array.isArray(images) && images.length > 0 ? (
          <img
            className="hover:scale-110 transition ease-in-out w-full"
            src={images[0]}
            alt={name || 'product'}
          />
        ) : (
          <p>No image available</p>
        )}
      </div>
      <p className="pt-3 pb-1 text-sm">{name}</p>
      <p className="text-sm font-medium">
        {price}
        {currency}
      </p>
    </Link>
  );
};

export default ProductItem;
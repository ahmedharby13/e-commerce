import React, { useEffect, useState } from 'react';
import { listProducts, removeProduct } from '../api';
import { currency } from '../App';
import { toast } from 'react-toastify';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  images: string[];
  stock: number;
  sizes: string[];
}

interface ListProps {
  token: string;
}

const List: React.FC<ListProps> = ({ token }) => {
  const [list, setList] = useState<Product[]>([]);

  const fetchList = async () => {
    try {
      const response = await listProducts();
      if (response.data.success) {
        setList(response.data.products);
      } else {
        toast.error(response.data.message || 'Failed to fetch data');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred');
      }
    }
  };

  const removeProductHandler = async (id: string) => {
    try {
      const response = await removeProduct(id, token);
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message || 'Unable to remove product');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred');
      }
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <>
      <p className="mb-2">All Products List</p>
      <div className="flex flex-col gap-2">
        <div className="hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Stock</b>
          <b className="text-center">Action</b>
        </div>

        {list.map((item) => (
          <div
            key={item._id}
            className="grid grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm"
          >
            <img className="w-[50%]" src={item.images[0]} alt={item.name} />
            <p>{item.name}</p>
            <p>{item.category}</p>
            <p>{currency}{item.price}</p>
            <p>{item.stock}</p>
            <p
              onClick={() => removeProductHandler(item._id)}
              className="text-right md:text-center cursor-pointer text-lg"
            >
              X
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default List;
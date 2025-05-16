// src/pages/Collection.tsx
import React, { useContext, useEffect, useState } from 'react';
import { shopContext } from '../context/shopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subCategory: string;
  sizes: string[];
  date: number;
  bestseller: boolean;
}

const Collection: React.FC = () => {
  const { products, Search, ShowSearch } = useContext(shopContext)!;
  const [ShowFilters, SetShowFilters] = useState(false);
  const [FilterProducts, SetFilterProducts] = useState<Product[]>([]);
  const [Category, SetCategory] = useState<string[]>([]);
  const [SubCategory, SetSubCategory] = useState<string[]>([]);
  const [SortType, SetSortType] = useState<string>('relevant');

  useEffect(() => {
    SetFilterProducts(products);
  }, [products]);

  const toggleCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (Category.includes(value)) {
      SetCategory((prev) => prev.filter((item) => item !== value));
    } else {
      SetCategory((prev) => [...prev, value]);
    }
  };

  const toggleSubCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (SubCategory.includes(value)) {
      SetSubCategory((prev) => prev.filter((item) => item !== value));
    } else {
      SetSubCategory((prev) => [...prev, value]);
    }
  };

  const ApplyFilters = () => {
    let productsCopy = products.slice();
    if (ShowSearch && Search) {
      productsCopy = productsCopy.filter((item) =>
        item.name.toLowerCase().includes(Search.toLowerCase())
      );
    }
    if (Category.length > 0) {
      productsCopy = productsCopy.filter((item) => Category.includes(item.category));
    }
    if (SubCategory.length > 0) {
      productsCopy = productsCopy.filter((item) => SubCategory.includes(item.subCategory));
    }
    SetFilterProducts(productsCopy);
  };

  useEffect(() => {
    ApplyFilters();
  }, [Category, SubCategory, Search, ShowSearch, products]);

  const SortProduct = () => {
    let filterCopy = FilterProducts.slice();
    switch (SortType) {
      case 'low-high':
        SetFilterProducts(filterCopy.sort((a, b) => a.price - b.price));
        break;
      case 'high-low':
        SetFilterProducts(filterCopy.sort((a, b) => b.price - a.price));
        break;
      default:
        ApplyFilters();
        break;
    }
  };

  useEffect(() => {
    SortProduct();
  }, [SortType]);

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      <div className="min-w-60">
        <p
          onClick={() => SetShowFilters(!ShowFilters)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden ${ShowFilters ? 'rotate-90' : ''}`}
            src={assets.dropdown_icon}
            alt="dropdown"
          />
        </p>

        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${ShowFilters ? '' : 'hidden'} sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <p className="flex gap-2">
              <input value="Men" type="checkbox" onChange={toggleCategory} />
              Men
            </p>
            <p className="flex gap-2">
              <input value="Women" type="checkbox" onChange={toggleCategory} />
              Women
            </p>
            <p className="flex gap-2">
              <input value="Kids" type="checkbox" onChange={toggleCategory} />
              Kids
            </p>
          </div>
        </div>

        <div
          className={`border border-gray-300 pl-5 py-3 my-5 ${ShowFilters ? '' : 'hidden'} sm:block`}
        >
          <p className="mb-3 text-sm font-medium">TYPE</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <p className="flex gap-2">
              <input type="checkbox" value="Topwear" onChange={toggleSubCategory} />
              Topwear
            </p>
            <p className="flex gap-2">
              <input type="checkbox" value="Bottomwear" onChange={toggleSubCategory} />
              Bottomwear
            </p>
            <p className="flex gap-2">
              <input type="checkbox" value="Winterwear" onChange={toggleSubCategory} />
              Winterwear
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1="ALL" text2="COLLECTIONS" />
          <select
            onChange={(e) => SetSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {FilterProducts.map((item) => (
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
    </div>
  );
};

export default Collection;
// // src/pages/Collection.tsx
// import React, { useContext, useEffect, useState } from 'react';
// import { shopContext } from '../context/shopContext';
// import { assets } from '../assets/assets';
// import Title from '../components/Title';
// import ProductItem from '../components/ProductItem';

// interface Product {
//   _id: string;
//   name: string;
//   description: string;
//   price: number;
//   images: string[];
//   category: string;
//   subCategory: string;
//   sizes: string[];
//   date: number;
//   bestseller: boolean;
// }

// const Collection: React.FC = () => {
//   const { products, Search, ShowSearch } = useContext(shopContext)!;
//   const [ShowFilters, SetShowFilters] = useState(false);
//   const [FilterProducts, SetFilterProducts] = useState<Product[]>([]);
//   const [Category, SetCategory] = useState<string[]>([]);
//   const [SubCategory, SetSubCategory] = useState<string[]>([]);
//   const [SortType, SetSortType] = useState<string>('relevant');

//   useEffect(() => {
//     SetFilterProducts(products);
//   }, [products]);

//   const toggleCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     if (Category.includes(value)) {
//       SetCategory((prev) => prev.filter((item) => item !== value));
//     } else {
//       SetCategory((prev) => [...prev, value]);
//     }
//   };

//   const toggleSubCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     if (SubCategory.includes(value)) {
//       SetSubCategory((prev) => prev.filter((item) => item !== value));
//     } else {
//       SetSubCategory((prev) => [...prev, value]);
//     }
//   };

//   const ApplyFilters = () => {
//     let productsCopy = products.slice();
//     if (ShowSearch && Search) {
//       productsCopy = productsCopy.filter((item) =>
//         item.name.toLowerCase().includes(Search.toLowerCase())
//       );
//     }
//     if (Category.length > 0) {
//       productsCopy = productsCopy.filter((item) => Category.includes(item.category));
//     }
//     if (SubCategory.length > 0) {
//       productsCopy = productsCopy.filter((item) => SubCategory.includes(item.subCategory));
//     }
//     SetFilterProducts(productsCopy);
//   };

//   useEffect(() => {
//     ApplyFilters();
//   }, [Category, SubCategory, Search, ShowSearch, products]);

//   const SortProduct = () => {
//     let filterCopy = FilterProducts.slice();
//     switch (SortType) {
//       case 'low-high':
//         SetFilterProducts(filterCopy.sort((a, b) => a.price - b.price));
//         break;
//       case 'high-low':
//         SetFilterProducts(filterCopy.sort((a, b) => b.price - a.price));
//         break;
//       default:
//         ApplyFilters();
//         break;
//     }
//   };

//   useEffect(() => {
//     SortProduct();
//   }, [SortType]);

//   return (
//     <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
//       <div className="min-w-60">
//         <p
//           onClick={() => SetShowFilters(!ShowFilters)}
//           className="my-2 text-xl flex items-center cursor-pointer gap-2"
//         >
//           FILTERS
//           <img
//             className={`h-3 sm:hidden ${ShowFilters ? 'rotate-90' : ''}`}
//             src={assets.dropdown_icon}
//             alt="dropdown"
//           />
//         </p>

//         <div
//           className={`border border-gray-300 pl-5 py-3 mt-6 ${ShowFilters ? '' : 'hidden'} sm:block`}
//         >
//           <p className="mb-3 text-sm font-medium">CATEGORIES</p>
//           <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
//             <p className="flex gap-2">
//               <input value="Men" type="checkbox" onChange={toggleCategory} />
//               Men
//             </p>
//             <p className="flex gap-2">
//               <input value="Women" type="checkbox" onChange={toggleCategory} />
//               Women
//             </p>
//             <p className="flex gap-2">
//               <input value="Kids" type="checkbox" onChange={toggleCategory} />
//               Kids
//             </p>
//           </div>
//         </div>

//         <div
//           className={`border border-gray-300 pl-5 py-3 my-5 ${ShowFilters ? '' : 'hidden'} sm:block`}
//         >
//           <p className="mb-3 text-sm font-medium">TYPE</p>
//           <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
//             <p className="flex gap-2">
//               <input type="checkbox" value="Topwear" onChange={toggleSubCategory} />
//               Topwear
//             </p>
//             <p className="flex gap-2">
//               <input type="checkbox" value="Bottomwear" onChange={toggleSubCategory} />
//               Bottomwear
//             </p>
//             <p className="flex gap-2">
//               <input type="checkbox" value="Winterwear" onChange={toggleSubCategory} />
//               Winterwear
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="flex-1">
//         <div className="flex justify-between text-base sm:text-2xl mb-4">
//           <Title text1="ALL" text2="COLLECTIONS" />
//           <select
//             onChange={(e) => SetSortType(e.target.value)}
//             className="border-2 border-gray-300 text-sm px-2"
//           >
//             <option value="relevant">Sort by: Relevant</option>
//             <option value="low-high">Sort by: Low to High</option>
//             <option value="high-low">Sort by: High to Low</option>
//           </select>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
//           {FilterProducts.map((item) => (
//             <ProductItem
//               key={item._id}
//               id={item._id}
//               images={item.images}
//               name={item.name}
//               price={item.price}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Collection;
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
  stock: number;
  date: number;
  bestseller: boolean;
  ratings: number;
  averageRating: number;
}

const Collection: React.FC = () => {
  const { products, Search, ShowSearch } = useContext(shopContext)!;
  const [showFilters, setShowFilters] = useState(false);
  const [filterProducts, setFilterProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [sortType, setSortType] = useState<string>('relevant');
  const [loading, setLoading] = useState(true);

  // Extract unique categories and subcategories
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
      const uniqueSubCategories = Array.from(new Set(products.map((p) => p.subCategory)));
      setCategories(uniqueCategories);
      setSubCategories(uniqueSubCategories);
      setFilterProducts(products);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [products]);

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let filtered = products.slice();

    // Search filter
    if (ShowSearch && Search) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(Search.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) => selectedCategories.includes(item.category));
    }

    // Subcategory filter
    if (selectedSubCategories.length > 0) {
      filtered = filtered.filter((item) => selectedSubCategories.includes(item.subCategory));
    }

    // Sorting
    let sortedProducts = [...filtered];
    switch (sortType) {
      case 'low-high':
        sortedProducts = sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'high-low':
        sortedProducts = sortedProducts.sort((a, b) => b.price - b.price);
        break;
      default:
        break;
    }

    setFilterProducts(sortedProducts);
  };

  useEffect(() => {
    applyFiltersAndSort();
  }, [selectedCategories, selectedSubCategories, Search, ShowSearch, sortType, products]);

  const toggleCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleSubCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedSubCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      <div className="min-w-60">
        <p
          onClick={() => setShowFilters(!showFilters)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden ${showFilters ? 'rotate-90' : ''}`}
            src={assets.dropdown_icon}
            alt="dropdown"
          />
        </p>
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilters ? '' : 'hidden'} sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {categories.map((category) => (
              <p key={category} className="flex gap-2">
                <input
                  type="checkbox"
                  value={category}
                  checked={selectedCategories.includes(category)}
                  onChange={toggleCategory}
                />
                {category}
              </p>
            ))}
          </div>
        </div>
        <div
          className={`border border-gray-300 pl-5 py-3 my-5 ${showFilters ? '' : 'hidden'} sm:block`}
        >
          <p className="mb-3 text-sm font-medium">TYPE</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {subCategories.map((subCategory) => (
              <p key={subCategory} className="flex gap-2">
                <input
                  type="checkbox"
                  value={subCategory}
                  checked={selectedSubCategories.includes(subCategory)}
                  onChange={toggleSubCategory}
                />
                {subCategory}
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1="ALL" text2="COLLECTIONS" />
          <select
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2"
            value={sortType}
            aria-label="Sort products"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : filterProducts.length === 0 ? (
          <p className="text-center text-gray-500">No products found</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {filterProducts.map((item) => (
              <ProductItem
                key={item._id}
                id={item._id}
                images={item.images}
                name={item.name}
                price={item.price}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
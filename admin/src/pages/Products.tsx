import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl, currency } from '../utils/constants';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  sizes: string[];
  bestseller: boolean;
  stock: number;
  images: string[];
  averageRating: number;
  date: number;
}

interface ProductsProps {
  token: string;
}

const Products: React.FC<ProductsProps> = ({ token }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('relevant');
  const navigate = useNavigate();

  // Fetch CSRF token
  const getCsrfToken = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/csrf-token`, {
        withCredentials: true,
      });
      return response.data.csrfToken || '';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.code === 'ERR_NETWORK'
            ? 'Cannot connect to the server. Please check if the backend is running and CORS is configured.'
            : error.response?.data.message || 'Error fetching CSRF token'
        );
      } else {
        toast.error('An unexpected error occurred while fetching CSRF token');
      }
      return '';
    }
  }, []);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search,
          sort: sort === 'relevant' ? 'ratings:desc' : sort === 'newest' ? 'date:desc' : `price:${sort === 'low-high' ? 'asc' : 'desc'}`,
        },
        withCredentials: true,
      });
      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        toast.error(response.data.message || 'Failed to fetch products');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.code === 'ERR_NETWORK'
            ? 'Cannot connect to the server. Please check if the backend is running and CORS is configured.'
            : error.response?.data.message || 'Error fetching products'
        );
      } else {
        toast.error('An unexpected error occurred while fetching products');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, search, sort]);

  useEffect(() => {
    if (token) {
      fetchProducts();
    } else {
      toast.error('Please log in to view products');
    }
  }, [token, fetchProducts]);

  // Handle removing a product
  const handleRemoveProduct = async (productId: string) => {
    const csrfToken = await getCsrfToken();
    if (!csrfToken) return;

    try {
      const response = await axios.post(
        `${backendUrl}/api/product/remove`,
        { id: productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success('Product removed successfully');
        fetchProducts();
      } else {
        toast.error(response.data.message || 'Failed to remove product');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.code === 'ERR_NETWORK'
            ? 'Cannot connect to the server. Please check if the backend is running and CORS is configured.'
            : error.response?.data.message || 'Error removing product'
        );
      } else {
        toast.error('An unexpected error occurred while removing product');
      }
    }
  };

  // Handle editing a product
  const handleEditProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  // Handle adding a new product
  const handleAddProduct = () => {
    navigate('/product/new');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded focus:outline-none focus:border-blue-500"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border p-2 rounded focus:outline-none focus:border-blue-500"
            aria-label="Sort products"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Price Low to High</option>
            <option value="high-low">Sort by: Price High to Low</option>
            <option value="newest">Sort by: Newest</option>
          </select>
          <button
            onClick={handleAddProduct}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Product
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr
                  key={product._id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleEditProduct(product._id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/50')}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{currency}{product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProduct(product._id);
                      }}
                      className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveProduct(product._id);
                      }}
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Products;
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../utils/constants';

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  sizes: string[];
  bestseller: boolean;
  stock: number;
  images: string[];
}

interface FormData {
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  sizes: string[];
  bestseller: boolean;
  stock: number;
  image1?: File;
  image2?: File;
  image3?: File;
  image4?: File;
}

interface ProductUpdateProps {
  token: string;
}

const ProductUpdate: React.FC<ProductUpdateProps> = ({ token }) => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    subCategory: '',
    sizes: [],
    bestseller: false,
    stock: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sizeInput, setSizeInput] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);

  // Fetch CSRF token
  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/csrf-token`, {
        withCredentials: true,
      });
      if (response.data.csrfToken) {
        console.log('CSRF Token fetched:', response.data.csrfToken);
        setCsrfToken(response.data.csrfToken);
        return response.data.csrfToken;
      }
      toast.error('Failed to fetch CSRF token');
      console.error('CSRF Token missing in response');
      return '';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to the server. Please check if the backend is running and CORS is configured.');
        } else {
          toast.error(error.response?.data.message || 'Error fetching CSRF token');
          console.error('CSRF Token Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }
      } else {
        toast.error('An unexpected error occurred while fetching CSRF token');
        console.error('CSRF Token Error:', error);
      }
      return '';
    }
  }, []);

  // Fetch categories and subcategories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      console.log('Categories response:', response.data);
      if (response.data.success) {
        setCategories(response.data.categories || []);
        setSubCategories(response.data.subCategories || []);
      } else {
        toast.error(response.data.message || 'Failed to fetch categories');
        console.error('Categories fetch failed:', response.data.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to the server. Please check if the backend is running and CORS is configured.');
        } else {
          toast.error(error.response?.data.message || 'Error fetching categories');
          console.error('Fetch Categories Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }
      } else {
        toast.error('An unexpected error occurred while fetching categories');
        console.error('Fetch Categories Error:', error);
      }
    }
  }, [token]);

  // Fetch product data for editing
  const fetchProductData = useCallback(async () => {
    if (productId === 'new') return;
    setIsLoading(true);
    try {
      console.log('Fetching product:', productId);
      const response = await axios.get(`${backendUrl}/api/product/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      console.log('Product response:', response.data);
      if (response.data.success) {
        const product: Product = response.data.product;
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          subCategory: product.subCategory,
          sizes: product.sizes,
          bestseller: product.bestseller,
          stock: product.stock,
        });
      } else {
        toast.error(response.data.message || 'Product not found');
        console.error('Product fetch failed:', response.data.message);
        navigate('/products');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to the server. Please check if the backend is running and CORS is configured.');
        } else {
          toast.error(error.response?.data.message || 'Error fetching product');
          console.error('Fetch Product Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }
      } else {
        toast.error('An unexpected error occurred while fetching product');
        console.error('Fetch Product Error:', error);
      }
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  }, [productId, token, navigate]);

  useEffect(() => {
    const initialize = async () => {
      await fetchCsrfToken();
      await fetchCategories();
      if (productId !== 'new') {
        await fetchProductData();
      }
    };
    if (token) {
      initialize();
    } else {
      console.error('No token provided to ProductUpdate.tsx');
      toast.error('Please log in to edit products');
      navigate('/products');
    }
  }, [token, productId, fetchCsrfToken, fetchCategories, fetchProductData, navigate]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  // Handle size input
  const handleSizeAdd = () => {
    if (sizeInput && !formData.sizes.includes(sizeInput)) {
      setFormData((prev) => ({ ...prev, sizes: [...prev.sizes, sizeInput] }));
      setSizeInput('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!csrfToken) {
      toast.error('CSRF token is missing. Please try again.');
      console.error('Submit aborted: No CSRF token');
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price.toString());
    data.append('category', formData.category);
    data.append('subCategory', formData.subCategory);
    data.append('sizes', JSON.stringify(formData.sizes));
    data.append('bestseller', formData.bestseller.toString());
    data.append('stock', formData.stock.toString());
    if (formData.image1) data.append('image1', formData.image1);
    if (formData.image2) data.append('image2', formData.image2);
    if (formData.image3) data.append('image3', formData.image3);
    if (formData.image4) data.append('image4', formData.image4);

    try {
      console.log('Submitting product:', { productId, formData });
      const url = productId === 'new' ? `${backendUrl}/api/product/add` : `${backendUrl}/api/product/${productId}`;
      const method = productId === 'new' ? axios.post : axios.put;
      const response = await method(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });
      console.log('Submit response:', response.data);
      if (response.data.success) {
        toast.success(productId === 'new' ? 'Product added successfully' : 'Product updated successfully');
        navigate('/products');
      } else {
        toast.error(response.data.message || 'Failed to save product');
        console.error('Submit failed:', response.data.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          toast.error('Cannot connect to the server. Please check if the backend is running and CORS is configured.');
        } else {
          toast.error(error.response?.data.message || 'Error saving product');
          console.error('Save Product Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
        }
      } else {
        toast.error('An unexpected error occurred while saving product');
        console.error('Save Product Error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{productId === 'new' ? 'Add Product' : 'Update Product'}</h1>
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <input
                id="price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                required
                min="0"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                required
                aria-label="Product category"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
              <select
                id="subCategory"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                required
                aria-label="Product subcategory"
              >
                <option value="">Select Subcategory</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory} value={subCategory}>{subCategory}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
              <input
                id="stock"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                required
                min="0"
              />
            </div>
            <div>
              <label htmlFor="sizeInput" className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
              <div className="flex gap-2">
                <input
                  id="sizeInput"
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter size (e.g., S, M, L)"
                />
                <button
                  type="button"
                  onClick={handleSizeAdd}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              <div className="mt-2">
                {formData.sizes.map((size, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="image1" className="block text-sm font-medium text-gray-700 mb-2">Image 1</label>
              <input
                id="image1"
                type="file"
                name="image1"
                onChange={handleFileChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="image2" className="block text-sm font-medium text-gray-700 mb-2">Image 2</label>
              <input
                id="image2"
                type="file"
                name="image2"
                onChange={handleFileChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="image3" className="block text-sm font-medium text-gray-700 mb-2">Image 3</label>
              <input
                id="image3"
                type="file"
                name="image3"
                onChange={handleFileChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="image4" className="block text-sm font-medium text-gray-700 mb-2">Image 4</label>
              <input
                id="image4"
                type="file"
                name="image4"
                onChange={handleFileChange}
                className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-2 flex items-center">
              <input
                id="bestseller"
                type="checkbox"
                name="bestseller"
                checked={formData.bestseller}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="bestseller" className="text-sm font-medium text-gray-700">Bestseller</label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-4 bg-black text-white p-2 rounded ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            } transition-colors`}
          >
            {isLoading ? 'Saving...' : productId === 'new' ? 'Add Product' : 'Update Product'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProductUpdate;
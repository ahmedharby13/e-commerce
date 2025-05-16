import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { addProduct } from '../api';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';


interface AddProps {
  token: string;
}


const Add: React.FC<AddProps> = ({ token }) => {
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image3, setImage3] = useState<File | null>(null);
  const [image4, setImage4] = useState<File | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<string>('Men');
  const [subCategory, setSubCategory] = useState<string>('Topwear');
  const [bestseller, setBestseller] = useState<boolean>(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [stock, setStock] = useState<string>('');

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('subCategory', subCategory);
      formData.append('bestseller', String(bestseller));
      formData.append('sizes', JSON.stringify(sizes));
      formData.append('stock', stock);
      if (image1) formData.append('image1', image1);
      if (image2) formData.append('image2', image2);
      if (image3) formData.append('image3', image3);
      if (image4) formData.append('image4', image4);

      const toastId = toast.loading('Please wait...');

      const response = await addProduct(formData, token);

      if (response.data.success) {
        toast.update(toastId, {
          render: response.data.message,
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
        setName('');
        setDescription('');
        setPrice('');
        setStock('');
        setCategory('Men');
        setSubCategory('Topwear');
        setSizes([]);
        setImage1(null);
        setImage2(null);
        setImage3(null);
        setImage4(null);
      } else {
        toast.update(toastId, {
          render: response.data.message,
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
      <div>
        <p className="mb-2">Upload Images</p>
        <div className="flex gap-2">
          <label htmlFor="image1">
            <img
              className="w-20"
              src={image1 ? URL.createObjectURL(image1) : assets.upload_area}
              alt="Upload Area"
            />
            <input
              onChange={(e) => setImage1(e.target.files?.[0] || null)}
              type="file"
              id="image1"
              hidden
              accept="image/*"
            />
          </label>
          <label htmlFor="image2">
            <img
              className="w-20"
              src={image2 ? URL.createObjectURL(image2) : assets.upload_area}
              alt="Upload Area"
            />
            <input
              onChange={(e) => setImage2(e.target.files?.[0] || null)}
              type="file"
              id="image2"
              hidden
              accept="image/*"
            />
          </label>
          <label htmlFor="image3">
            <img
              className="w-20"
              src={image3 ? URL.createObjectURL(image3) : assets.upload_area}
              alt="Upload Area"
            />
            <input
              onChange={(e) => setImage3(e.target.files?.[0] || null)}
              type="file"
              id="image3"
              hidden
              accept="image/*"
            />
          </label>
          <label htmlFor="image4">
            <img
              className="w-20"
              src={image4 ? URL.createObjectURL(image4) : assets.upload_area}
              alt="Upload Area"
            />
            <input
              onChange={(e) => setImage4(e.target.files?.[0] || null)}
              type="file"
              id="image4"
              hidden
              accept="image/*"
            />
          </label>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Product name</p>
        <input
          className="w-full max-w-[500px] px-3 py-2 border border-solid border-[#c2c2c2] rounded-[4px]"
          type="text"
          placeholder="Type here"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="w-full">
        <p className="mb-2">Product description</p>
        <textarea
          className="w-full max-w-[500px] px-3 py-2 border border-solid border-[#c2c2c2] rounded-[4px]"
          placeholder="Type here"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
        <div>
          <p className="mb-2">Product category</p>
          <select
            className="w-full px-3 py-2 border border-solid border-[#c2c2c2]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Sub category</p>
          <select
            className="w-full px-3 py-2 border border-solid border-[#c2c2c2]"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            required
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Price</p>
          <input
            className="w-full px-3 py-2 sm:w-[120px] border border-solid border-[#c2c2c2] rounded-[4px]"
            type="number"
            placeholder="Type here"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <p className="mb-2">Stock</p>
          <input
            className="w-full px-3 py-2 sm:w-[120px] border border-solid border-[#c2c2c2] rounded-[4px]"
            type="number"
            placeholder="Type here"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            min="0"
          />
        </div>
      </div>

      <div>
        <p className="mb-2">Product Sizes</p>
        <div className="flex gap-3">
          {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <div
              key={size}
              onClick={() =>
                setSizes((prev) =>
                  prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]
                )
              }
            >
              <p
                className={`${
                  sizes.includes(size) ? 'bg-black text-white' : 'bg-slate-200'
                } px-3 py-1 cursor-pointer`}
              >
                {size}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="checkbox"
          id="bestseller"
          checked={bestseller}
          onChange={() => setBestseller(!bestseller)}
        />
        <label className="cursor-pointer" htmlFor="bestseller">
          Add to bestseller
        </label>
      </div>

      <button type="submit" className="w-28 py-3 mt-4 bg-black text-white">
        ADD
      </button>
    </form>
  );
};

export default Add;
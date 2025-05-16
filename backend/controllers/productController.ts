import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import productModel, { Product } from '../models/productModel';
import userModel from '../models/userModel';
import logger from '../utils/logger';

interface ProductFiles {
  image1?: Express.Multer.File[];
  image2?: Express.Multer.File[];
  image3?: Express.Multer.File[];
  image4?: Express.Multer.File[];
}

interface ProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  sizes: string[];
  bestseller: boolean;
  images: string[];
  date: Date;
  stock: number;
}

interface ProductRequestBody {
  name: string;
  description: string;
  price: string;
  category: string;
  subCategory: string;
  sizes: string;
  bestseller: string;
  stock: string;
}

export const addProduct = async (
  req: Request<{}, {}, ProductRequestBody> & { files?: ProductFiles },
  res: Response
): Promise<void> => {
  try {
    const { name, description, price, category, subCategory, sizes, bestseller, stock } = req.body;
    logger.debug('Processing addProduct', { name, category, subCategory });

    if (!name || !description || !price || !category || !subCategory || !sizes || !stock) {
      logger.warn('Missing required fields', { body: req.body });
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      logger.warn('Invalid price provided', { price });
      res.status(400).json({ success: false, message: 'Invalid price' });
      return;
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      logger.warn('Invalid stock value provided', { stock });
      res.status(400).json({ success: false, message: 'Invalid stock value' });
      return;
    }

    let parsedSizes: string[];
    try {
      parsedSizes = JSON.parse(sizes);
      if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
        throw new Error('Sizes must be a non-empty array');
      }
    } catch (error) {
      logger.warn('Invalid sizes format', { sizes });
      res.status(400).json({ success: false, message: 'Invalid sizes format' });
      return;
    }

    const image1 = req.files?.image1 ? req.files.image1[0] : undefined;
    const image2 = req.files?.image2 ? req.files.image2[0] : undefined;
    const image3 = req.files?.image3 ? req.files.image3[0] : undefined;
    const image4 = req.files?.image4 ? req.files.image4[0] : undefined;

    const images = [image1, image2, image3, image4].filter((item) => item !== undefined);
    if (images.length === 0) {
      logger.warn('No images provided');
      res.status(400).json({ success: false, message: 'At least one image is required' });
      return;
    }

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item!.path, { resource_type: 'image' });
        logger.debug('Uploaded image to Cloudinary', { publicId: result.public_id });
        return result.secure_url;
      })
    );

    const productData: ProductData = {
      name,
      description,
      price: parsedPrice,
      category,
      subCategory,
      sizes: parsedSizes,
      bestseller: bestseller === 'true',
      images: imagesUrl,
      date: new Date(),
      stock: parsedStock,
    };

    const product = new productModel(productData);
    await product.save();
    logger.info('Product added successfully', { productId: product._id, name });

    res.status(201).json({ success: true, message: 'Product added successfully', product });
  } catch (error: any) {
    logger.error('Error in addProduct', { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    } else {
      res.status(500).json({ success: false, message: 'Server error while adding product' });
    }
  }
};

export const listProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, subCategory, minPrice, maxPrice, minRating, maxRating, search, sort, page = 1, limit = 10 } = req.query;
    logger.debug('Processing listProduct', { query: req.query });

    const query: any = {};
    if (category) query.category = String(category);
    if (subCategory) query.subCategory = String(subCategory);
    if (minPrice || maxPrice) {
      query.price = {};
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (minPrice && !isNaN(min)) query.price.$gte = min;
      if (maxPrice && !isNaN(max)) query.price.$lte = max;
    }
    if (minRating || maxRating) {
      query.ratings = {};
      const minR = Number(minRating);
      const maxR = Number(maxRating);
      if (minRating && !isNaN(minR)) query.ratings.$gte = minR;
      if (maxRating && !isNaN(maxR)) query.ratings.$lte = maxR;
    }
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
      ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      logger.warn('Invalid page or limit', { page, limit });
      res.status(400).json({ success: false, message: 'Invalid page or limit' });
      return;
    }

    const skip = (pageNum - 1) * limitNum;

    const sortOptions: { [key: string]: 1 | -1 } = {};
    if (sort) {
      const [field, order] = String(sort).split(':');
      if (['price', 'ratings', 'date'].includes(field)) {
        sortOptions[field] = order === 'desc' ? -1 : 1;
      }
    }

    const products = await productModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await productModel.countDocuments(query);
    logger.info('Fetched products', { productCount: products.length, total, page: pageNum });

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Error in listProduct', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: `Server error while fetching products: ${error.message}` });
  }
};

export const removeProduct = async (req: Request<{}, {}, { id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    logger.debug('Processing removeProduct', { productId: id });

    const product = await productModel.findById(id);
    if (!product) {
      logger.warn('Product not found', { productId: id });
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await Promise.all(
      product.images.map(async (url) => {
        const publicId = url.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          logger.debug('Deleted image from Cloudinary', { publicId });
        }
      })
    );

    await productModel.findByIdAndDelete(id);
    logger.info('Product removed successfully', { productId: id });

    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error: any) {
    logger.error('Error in removeProduct', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error while removing product' });
  }
};

export const singleProduct = async (req: Request<{ productId: string }>, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    logger.debug('Processing singleProduct', { productId });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      logger.warn('Invalid product ID', { productId });
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    const product: Product | null = await productModel.findById(productId).lean();
    if (!product) {
      logger.warn('Product not found', { productId });
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    logger.info('Fetched single product', { productId });
    res.json({ success: true, product });
  } catch (error: any) {
    logger.error('Error in singleProduct', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: `Server error while fetching product: ${error.message}` });
  }
};

export const getProductRatings = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    logger.debug('Processing getProductRatings', { productId: id });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn('Invalid productId', { productId: id });
      res.status(400).json({ success: false, message: 'Invalid productId' });
      return;
    }

    const product = await productModel.findById(id).populate('reviews.userId', 'name');
    if (!product) {
      logger.warn('Product not found', { productId: id });
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const averageRating = product.reviews.length
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;
    await productModel.findByIdAndUpdate(id, { averageRating });
    logger.info('Fetched product ratings', { productId: id, averageRating, reviewCount: product.reviews.length });

    res.json({ success: true, averageRating, reviews: product.reviews });
  } catch (error: any) {
    logger.error('Error in getProductRatings', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addProductReview = async (
  req: Request<{}, {}, { productId: string; userId: string; rating: number; comment?: string }>,
  res: Response
): Promise<void> => {
  try {
    const { productId, userId, rating, comment } = req.body;
    logger.debug('Processing addProductReview', { productId, userId, rating });

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('Invalid productId or userId', { productId, userId });
      res.status(400).json({ success: false, message: 'Invalid productId or userId' });
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      logger.warn('Invalid rating provided', { rating });
      res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
      return;
    }

    const product = await productModel.findById(productId);
    if (!product) {
      logger.warn('Product not found', { productId });
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    const user = await userModel.findById(userId);
    if (!user) {
      logger.warn('User not found', { userId });
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find((r) => r.userId.toString() === userId);
    if (existingReview) {
      logger.warn('User already reviewed product', { userId, productId });
      res.status(400).json({ success: false, message: 'User has already reviewed this product' });
      return;
    }

    product.reviews.push({
      userId: new mongoose.Types.ObjectId(userId),
      rating,
      comment: comment || '',
      createdAt: new Date(),
    });
    product.ratings = product.reviews.length;
    const averageRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.ratings;

    await productModel.findByIdAndUpdate(productId, {
      reviews: product.reviews,
      ratings: product.ratings,
      averageRating,
    });
    logger.info('Review added successfully', { productId, userId, rating });

    res.json({ success: true, message: 'Review added successfully' });
  } catch (error: any) {
    logger.error('Error in addProductReview', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (
  req: Request<{ productId: string }, {}, ProductRequestBody> & { files?: ProductFiles },
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { name, description, price, category, subCategory, sizes, bestseller, stock } = req.body;
    logger.debug('Processing updateProduct', { productId });

    const product = await productModel.findById(productId);
    if (!product) {
      logger.warn('Product not found', { productId });
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) {
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        logger.warn('Invalid price provided', { price });
        res.status(400).json({ success: false, message: 'Invalid price' });
        return;
      }
      product.price = parsedPrice;
    }
    if (category) product.category = category;
    if (subCategory) product.subCategory = subCategory;
    if (stock) {
      const parsedStock = Number(stock);
      if (isNaN(parsedStock) || parsedStock < 0) {
        logger.warn('Invalid stock value provided', { stock });
        res.status(400).json({ success: false, message: 'Invalid stock value' });
        return;
      }
      product.stock = parsedStock;
    }
    if (sizes) {
      let parsedSizes: string[];
      try {
        parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
          throw new Error('Sizes must be a non-empty array');
        }
        product.sizes = parsedSizes;
      } catch (error) {
        logger.warn('Invalid sizes format', { sizes });
        res.status(400).json({ success: false, message: 'Invalid sizes format' });
        return;
      }
    }
    if (bestseller) product.bestseller = bestseller === 'true';

    const image1 = req.files?.image1 ? req.files.image1[0] : undefined;
    const image2 = req.files?.image2 ? req.files.image2[0] : undefined;
    const image3 = req.files?.image3 ? req.files.image3[0] : undefined;
    const image4 = req.files?.image4 ? req.files.image4[0] : undefined;

    const newImages = [image1, image2, image3, image4].filter((item) => item !== undefined);
    if (newImages.length > 0) {
      await Promise.all(
        product.images.map(async (url) => {
          const publicId = url.split('/').pop()?.split('.')[0];
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            logger.debug('Deleted old image from Cloudinary', { publicId });
          }
        })
      );

      const imagesUrl = await Promise.all(
        newImages.map(async (item) => {
          const result = await cloudinary.uploader.upload(item!.path, { resource_type: 'image' });
          logger.debug('Uploaded new image to Cloudinary', { publicId: result.public_id });
          return result.secure_url;
        })
      );
      product.images = imagesUrl;
    }

    await product.save();
    logger.info('Product updated successfully', { productId });

    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error: any) {
    logger.error('Error in updateProduct', { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    } else {
      res.status(500).json({ success: false, message: 'Server error while updating product' });
    }
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug('Processing getCategories');
    const categories = await productModel.distinct('category').lean();
    const subCategories = await productModel.distinct('subCategory').lean();
    logger.info('Fetched categories and subCategories', { categoryCount: categories.length, subCategoryCount: subCategories.length });

    res.json({ success: true, categories, subCategories });
  } catch (error: any) {
    logger.error('Error in getCategories', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: `Server error while fetching categories: ${error.message}` });
  }
};
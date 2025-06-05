import axios from 'axios';

const API_URL = 'http://localhost:5000';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discount: number;
  discount_validity: string;
  final_price: number;
  category: string;
  brand: string;
  stock: number;
  deliverycharge_inside: number;
  deliverycharge_outside: number;
  sold: string;
  rating: string;
  total_rating: string;
  reviews: string;
  shopname: string;
  shopdetails: string;
  tags: string;
  image: string;
  seller_id: number;
}

export interface Seller {
  id: number;
  name: string;
  email: string;
  shopName: string;
  shopDetails: string;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/products`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getProductsByTag = async (tag: string): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    return allProducts.filter(product => product.tags.includes(tag));
  } catch (error) {
    console.error(`Error fetching products with tag ${tag}:`, error);
    return [];
  }
};

export const getTopRatedProducts = async (limit: number = 5): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    return allProducts
      .sort((a, b) => {
        const ratingA = JSON.parse(a.rating || '{}');
        const ratingB = JSON.parse(b.rating || '{}');
        const avgA = Object.values(ratingA).reduce((sum: number, val: any) => sum + Number(val), 0) / 
                    (Object.values(ratingA).length || 1);
        const avgB = Object.values(ratingB).reduce((sum: number, val: any) => sum + Number(val), 0) / 
                    (Object.values(ratingB).length || 1);
        return avgB - avgA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top rated products:', error);
    return [];
  }
};

export const getNewestProducts = async (limit: number = 16): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    return allProducts
      .sort((a, b) => b.id - a.id) // Assuming newer products have higher IDs
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching newest products:', error);
    return [];
  }
};

export const getSellers = async (): Promise<Seller[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/sellers`);
    console.log('Sellers API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return [];
  }
};

export const getTopRatedSellers = async (limit: number = 5): Promise<Seller[]> => {
  try {
    // Since we don't have rating info for sellers in the API,
    // we'll just return random sellers for now
    const allSellers = await getSellers();
    
    // Check if allSellers is an array before trying to spread it
    if (!Array.isArray(allSellers)) {
      console.error('Expected sellers to be an array, but got:', typeof allSellers);
      return [];
    }
    
    const shuffled = [...allSellers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top rated sellers:', error);
    return [];
  }
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const allProducts = await getProducts();
    return allProducts.filter(
      product => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.shopname.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};
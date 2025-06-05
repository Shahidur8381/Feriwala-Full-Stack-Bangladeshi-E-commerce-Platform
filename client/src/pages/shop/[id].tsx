import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProductCard from '../../components/ProductCard';
import { getProducts, Product, getSellers, Seller } from '../../services/api';
import { FaFilter, FaSort } from 'react-icons/fa';

const ShopPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
  const [sortOption, setSortOption] = useState<string>('default');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchShopData = async () => {
        try {
          setLoading(true);
          // Fetch all products
          const allProducts = await getProducts();
          // Filter products by seller_id
          const shopProducts = allProducts.filter(product => product.seller_id === Number(id));
          setProducts(shopProducts);
          setFilteredProducts(shopProducts);
          
          // Extract unique categories and brands
          const uniqueCategories = [...new Set(shopProducts.map(p => p.category))];
          const uniqueBrands = [...new Set(shopProducts.map(p => p.brand))];
          setCategories(uniqueCategories);
          setBrands(uniqueBrands);
          
          // Find max price for range
          const maxPrice = Math.max(...shopProducts.map(p => p.price), 1000);
          setPriceRange({min: 0, max: maxPrice});
          
          // Fetch seller information
          const sellers = await getSellers();
          const shopInfo = sellers.find(s => s.id === Number(id));
          if (shopInfo) {
            setSeller(shopInfo);
          }
        } catch (error) {
          console.error('Error fetching shop data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchShopData();
    }
  }, [id]);

  // Apply filters and sorting
  useEffect(() => {
    if (products.length === 0) return;
    
    let result = [...products];
    
    // Apply category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // Apply brand filter
    if (selectedBrand) {
      result = result.filter(p => p.brand === selectedBrand);
    }
    
    // Apply price range filter
    result = result.filter(p => {
      const price = p.discount > 0 ? p.final_price : p.price;
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    // Apply sorting
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => {
          const priceA = a.discount > 0 ? a.final_price : a.price;
          const priceB = b.discount > 0 ? b.final_price : b.price;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        result.sort((a, b) => {
          const priceA = a.discount > 0 ? a.final_price : a.price;
          const priceB = b.discount > 0 ? b.final_price : b.price;
          return priceB - priceA;
        });
        break;
      case 'newest':
        result.sort((a, b) => b.id - a.id);
        break;
      default:
        // Default sorting (no specific order)
        break;
    }
    
    setFilteredProducts(result);
  }, [products, selectedCategory, selectedBrand, priceRange, sortOption]);

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange({min: 0, max: Math.max(...products.map(p => p.price), 1000)});
    setSortOption('default');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {seller ? (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{seller.shopName}</h1>
            <p className="text-gray-600 mb-4">{seller.shopDetails}</p>
            <p className="text-sm text-gray-500">Owner: {seller.name}</p>
          </div>
        ) : !loading && (
          <h1 className="text-3xl font-bold mb-8">Shop Details</h1>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Shop Products</h2>
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <FaFilter />
              <span>Filters</span>
            </button>
            
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Sort By</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ${priceRange.min} - ${priceRange.max}
                </label>
                <div className="flex space-x-4">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(...products.map(p => p.price), 1000)}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
                    className="w-full"
                  />
                  <input
                    type="range"
                    min="0"
                    max={Math.max(...products.map(p => p.price), 1000)}
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={resetFilters}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">No products found</h2>
            <p className="text-gray-600">This shop doesn't have any products yet</p>
            <button 
              onClick={() => router.push('/products')} 
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse All Products
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShopPage;
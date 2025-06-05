import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import BannerSlider from '../components/BannerSlider';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { 
  getTopRatedProducts, 
  getNewestProducts, 
  getTopRatedSellers,
  Product,
  Seller 
} from '../services/api';

const HomePage: React.FC = () => {
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topRated, newest, sellers] = await Promise.all([
          getTopRatedProducts(5),
          getNewestProducts(16),
          getTopRatedSellers(5)
        ]);

        setTopProducts(topRated);
        setNewProducts(newest);
        setTopSellers(sellers);
      } catch (error) {
        console.error('Error fetching home page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Banner Section */}
        <section className="mb-12">
          <BannerSlider />
        </section>

        {/* Search Bar Section */}
        {/* <section className="mb-12">
          <SearchBar />
        </section> */}

        {/* Top Rated Products Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Top Rated Products</h2>
            <Link href="/products" className="text-blue-600 hover:underline">
              Show More
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {topProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Newest Products Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Newest Products</h2>
            <Link href="/products" className="text-blue-600 hover:underline">
              Show More
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newProducts.slice(0, 8).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              [...Array(8)].map((_, index) => (
                <div key={index} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
              ))
            ) : (
              newProducts.slice(8, 16).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </section>

        {/* Top Rated Shops Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Top Rated Shops</h2>
            <Link href="/sellers" className="text-blue-600 hover:underline">
              Show More
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-40 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {topSellers.map(seller => (
                <ShopCard key={seller.id} seller={seller} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
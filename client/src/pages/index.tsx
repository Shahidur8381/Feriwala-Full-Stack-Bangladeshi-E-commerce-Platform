import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import BannerSlider from '../components/BannerSlider';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { FaTruck, FaShieldAlt, FaHeadset, FaTag, FaMobileAlt, FaLaptop, FaTshirt, FaHome, FaHeart, FaFootballBall } from 'react-icons/fa';
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

  const categories = [
    { name: 'Electronics', icon: <FaLaptop />, query: 'electronics', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
    { name: 'Mobile', icon: <FaMobileAlt />, query: 'mobile', color: 'bg-green-50 text-green-600 hover:bg-green-100' },
    { name: 'Fashion', icon: <FaTshirt />, query: 'fashion', color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
    { name: 'Home & Living', icon: <FaHome />, query: 'home', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
    { name: 'Beauty', icon: <FaHeart />, query: 'beauty', color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
    { name: 'Sports', icon: <FaFootballBall />, query: 'sports', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="fw-gradient-hero text-white py-12 md:py-20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-10 right-20 w-24 h-24 border-2 border-white rounded-full" style={{ animation: 'float 4s ease-in-out infinite 1s' }} />
          <div className="absolute top-20 right-40 w-16 h-16 border border-white rounded-full" style={{ animation: 'float 5s ease-in-out infinite 0.5s' }} />
        </div>
        
        {/* Desktop Logo - Floating */}
        <img 
          src="/feriwala-logo.png" 
          alt="FeriWala Logo" 
          className="hidden md:block absolute top-10 right-10 w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl z-20"
          style={{ animation: 'float 6s ease-in-out infinite' }} 
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl animate-fade-in-up">
            {/* Mobile Logo - Static at Top */}
            <div className="md:hidden flex justify-center mb-6">
              <img 
                src="/feriwala-logo.png" 
                alt="FeriWala Logo" 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
            
            <div className="flex items-center gap-2 mb-4 bg-white/20 backdrop-blur-sm w-fit px-4 py-1.5 rounded-full text-white/90 shadow-sm border border-white/10 animate-fade-in-up mx-auto md:mx-0">
              🇧🇩 Bangladesh's #1 Online Shop
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-center md:text-left">
              Shop Smart, <br />
              <span className="text-yellow-300">Save Big</span> with FeriWala
            </h2>
            <p className="text-green-100 text-lg mb-8 leading-relaxed text-center md:text-left">
              Discover thousands of products from trusted Bangladeshi sellers. 
              From electronics to fashion — everything you need, delivered to your door.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link href="/products" className="fw-btn bg-white text-green-800 hover:bg-green-50 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
                🛍️ Shop Now
              </Link>
              <Link href="/sellers" className="fw-btn bg-white/15 text-white hover:bg-white/25 px-6 py-3 rounded-xl backdrop-blur-sm transition-all">
                🏪 Browse Shops
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Category Quick Links */}
        <section className="mb-12 animate-fade-in-up">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/search?q=${cat.query}`}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:shadow-md ${cat.color} group`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-semibold text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Banner Section */}
        <section className="mb-12">
          <BannerSlider />
        </section>

        {/* Top Rated Products */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="fw-section-title">🔥 Top Rated Products</h2>
            <Link href="/products" className="text-green-600 hover:text-green-700 font-semibold text-sm transition">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-64 animate-shimmer rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {topProducts.map((product, i) => (
                <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Newest Products */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="fw-section-title">🆕 Newest Products</h2>
            <Link href="/products" className="text-green-600 hover:text-green-700 font-semibold text-sm transition">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 animate-shimmer rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {newProducts.slice(0, 8).map((product, i) => (
                  <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              {newProducts.length > 8 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {newProducts.slice(8, 16).map((product, i) => (
                    <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Trust Section */}
        <section className="mb-12 bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-center fw-section-title mb-8 after:mx-auto after:left-0 after:right-0">Why Shop With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 animate-fade-in-up">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FaTruck className="text-2xl text-green-600" />
              </div>
              <h3 className="font-semibold mb-1">Fast Delivery</h3>
              <p className="text-sm text-gray-500">Delivery across Bangladesh within 2-5 business days</p>
            </div>
            <div className="text-center p-4 animate-fade-in-up delay-1">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FaShieldAlt className="text-2xl text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-500">Pay safely via bKash, Nagad, Rocket, or SSLCommerz</p>
            </div>
            <div className="text-center p-4 animate-fade-in-up delay-2">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FaHeadset className="text-2xl text-amber-600" />
              </div>
              <h3 className="font-semibold mb-1">24/7 Support</h3>
              <p className="text-sm text-gray-500">Our team is here to help you anytime, anywhere</p>
            </div>
          </div>
        </section>

        {/* Top Rated Shops */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="fw-section-title">🏪 Top Rated Shops</h2>
            <Link href="/sellers" className="text-green-600 hover:text-green-700 font-semibold text-sm transition">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-40 animate-shimmer rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {topSellers.map((seller, i) => (
                <div key={seller.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <ShopCard seller={seller} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
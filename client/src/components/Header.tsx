import React, { useState } from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import SearchBar from './SearchBar';
import { useUser } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface HeaderProps {
  searchQuery?: string;
}

const Header: React.FC<HeaderProps> = ({ searchQuery = '' }) => {
  const { isSignedIn, user } = useUser();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { name: 'Electronics', href: '/search?q=electronics' },
    { name: 'Fashion', href: '/search?q=fashion' },
    { name: 'Home & Living', href: '/search?q=home' },
    { name: 'Beauty', href: '/search?q=beauty' },
    { name: 'Sports', href: '/search?q=sports' },
    { name: 'All Products', href: '/products' },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-900 text-gray-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <span>🇧🇩 বাংলাদেশের সেরা অনলাইন শপ</span>
          <div className="flex gap-4">
            <Link href="/sellers" className="hover:text-white transition">All Shops</Link>
            <span>📞 +880 1735 838381</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="fw-gradient-header shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-xl">🛒</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white font-bold text-xl leading-tight tracking-tight">FeriWala</h1>
                <p className="text-green-200 text-[10px] leading-tight font-medium">ফেরিওয়ালা</p>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <SearchBar initialQuery={searchQuery} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-white hover:bg-white/10 rounded-lg transition group">
                <FaShoppingCart className="text-xl group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {isSignedIn ? (
                <div className="flex items-center gap-2">
                  <Link href="/profile" className="p-2 text-white hover:bg-white/10 rounded-lg transition" title="Profile">
                    <FaUser className="text-lg" />
                  </Link>
                  <button
                    onClick={async () => {
                      const { createClient } = await import('../utils/supabase/client');
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      window.location.reload();
                    }}
                    className="hidden sm:block text-xs bg-white/15 text-white px-3 py-1.5 rounded-lg hover:bg-white/25 transition font-medium"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link href="/sign-in" className="flex items-center gap-1.5 bg-white text-green-800 px-4 py-2 rounded-lg hover:bg-green-50 transition font-semibold text-sm shadow-sm">
                  <FaUser className="text-xs" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
              >
                {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-3">
            <SearchBar initialQuery={searchQuery} />
          </div>
        </div>
      </div>

      {/* Category Nav Bar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-1 py-0 overflow-x-auto">
            {categories.map((cat) => (
              <li key={cat.name}>
                <Link
                  href={cat.href}
                  className="block px-4 py-2.5 text-sm text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors font-medium whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg animate-fade-in">
          <div className="container mx-auto px-4 py-3">
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
import React from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import SearchBar from './SearchBar';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-2xl font-bold text-blue-600 mb-4 md:mb-0">
          <Link href="/">
            FeriWala
          </Link>
        </div>
        
        <div className="w-full md:w-1/2 mb-4 md:mb-0">
          <SearchBar />
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/cart" className="relative">
            <FaShoppingCart className="text-xl" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              0
            </span>
          </Link>
          
          <Link href="/profile">
            <FaUser className="text-xl" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import Link from 'next/link';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import SearchBar from './SearchBar';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useCart } from '../contexts/CartContext';

interface HeaderProps {
  searchQuery?: string;
}

const Header: React.FC<HeaderProps> = ({ searchQuery = '' }) => {
  const { isSignedIn, user } = useUser();
  const { cartCount } = useCart();

  return (
    <header className="bg-white shadow-md py-4 px-6 sticky top-0 z-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-2xl font-bold text-blue-600 mb-4 md:mb-0">
          <Link href="/">
            FeriWala
          </Link>
        </div>
        
        <div className="w-full md:w-1/2 mb-4 md:mb-0">
          <SearchBar initialQuery={searchQuery} />
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/cart" className="relative">
            <FaShoppingCart className="text-xl" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {cartCount}
            </span>
          </Link>          {isSignedIn ? (
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-gray-600 hover:text-blue-600" title="Profile">
                <FaUser className="text-xl" />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <FaUser className="text-sm" />
                <span>Sign In</span>
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
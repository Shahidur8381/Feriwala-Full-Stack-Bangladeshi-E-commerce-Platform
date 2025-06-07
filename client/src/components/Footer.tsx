import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import TimeDisplay from '@/components/TimeDisplay';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">FeriWala</h3>
            <p className="mb-4">Your one-stop shop for all your needs.</p>
            <div className="flex space-x-4">
              <a href="https://facebook.com/SHAHIDUR8381" target="_blank" rel="noopener noreferrer">
                <FaFacebook className="text-xl hover:text-blue-400" />
              </a>
              <a href="https://x.com/SHAHIDUR8381" target="_blank" rel="noopener noreferrer">
                <FaTwitter className="text-xl hover:text-blue-400" />
              </a>
              <a href="https://instagram.com/SHAWON8381" target="_blank" rel="noopener noreferrer">
                <FaInstagram className="text-xl hover:text-blue-400" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <p>403E, BSMRH, KUET</p>
            <p>Khulna, Bangladesh</p>
            <p>Email: info@feriwala.com</p>
            <p>Phone: +880 1735 838381</p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {/* <li><a href="/about" className="hover:text-blue-400">About Us</a></li> */}
              <li><a href="/products" className="hover:text-blue-400">All Products</a></li>
              <li><a href="/sellers" className="hover:text-blue-400">All Shops</a></li>
              {/* <li><a href="/contact" className="hover:text-blue-400">Contact</a></li> */}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          {/* Add TimeDisplay component here */}
          <div className="mb-4">
            <TimeDisplay />
          </div>
          <p>Author: Shawon</p>
          <p>&copy; {new Date().getFullYear()} FeriWala. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
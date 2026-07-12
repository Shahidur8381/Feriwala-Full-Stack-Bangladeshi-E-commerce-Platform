import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import TimeDisplay from '@/components/TimeDisplay';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">🛒</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">FeriWala</h3>
                <p className="text-green-400 text-xs">ফেরিওয়ালা</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              বাংলাদেশের সেরা অনলাইন শপিং প্ল্যাটফর্ম। Your trusted destination for quality products at the best prices.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com/SHAHIDUR8381" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <FaFacebook className="text-sm" />
              </a>
              <a href="https://x.com/SHAHIDUR8381" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-colors">
                <FaTwitter className="text-sm" />
              </a>
              <a href="https://instagram.com/SHAWON8381" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors">
                <FaInstagram className="text-sm" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fade-in-up delay-1">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">
              <li><Link href="/products" className="text-sm hover:text-green-400 transition-colors">All Products</Link></li>
              <li><Link href="/sellers" className="text-sm hover:text-green-400 transition-colors">All Shops</Link></li>
              <li><Link href="/search?q=electronics" className="text-sm hover:text-green-400 transition-colors">Electronics</Link></li>
              <li><Link href="/search?q=fashion" className="text-sm hover:text-green-400 transition-colors">Fashion</Link></li>
              <li><Link href="/profile" className="text-sm hover:text-green-400 transition-colors">My Account</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="animate-fade-in-up delay-2">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <FaMapMarkerAlt className="text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">403E, BSMRH, KUET, Khulna, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FaEnvelope className="text-green-400 flex-shrink-0" />
                <span className="text-sm">info@feriwala.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FaPhoneAlt className="text-green-400 flex-shrink-0" />
                <span className="text-sm">+880 1735 838381</span>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div className="animate-fade-in-up delay-3">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">We Accept</h4>
            <div className="grid grid-cols-3 gap-2">
              {/* bKash */}
              <div className="bg-gray-800 rounded-lg p-2 flex items-center justify-center hover:bg-gray-700 transition-colors" title="bKash">
                <div className="text-center">
                  <span className="text-pink-500 font-bold text-xs">bKash</span>
                </div>
              </div>
              {/* Nagad */}
              <div className="bg-gray-800 rounded-lg p-2 flex items-center justify-center hover:bg-gray-700 transition-colors" title="Nagad">
                <div className="text-center">
                  <span className="text-orange-400 font-bold text-xs">Nagad</span>
                </div>
              </div>
              {/* Rocket */}
              <div className="bg-gray-800 rounded-lg p-2 flex items-center justify-center hover:bg-gray-700 transition-colors" title="Rocket">
                <div className="text-center">
                  <span className="text-purple-400 font-bold text-xs">Rocket</span>
                </div>
              </div>
              {/* Visa */}
              <div className="bg-gray-800 rounded-lg p-2 flex items-center justify-center hover:bg-gray-700 transition-colors" title="Visa">
                <div className="text-center">
                  <span className="text-blue-400 font-bold text-xs">VISA</span>
                </div>
              </div>
              {/* Mastercard */}
              <div className="bg-gray-800 rounded-lg p-2 flex items-center justify-center hover:bg-gray-700 transition-colors" title="Mastercard">
                <div className="text-center">
                  <span className="text-red-400 font-bold text-xs">MC</span>
                </div>
              </div>
              {/* SSLCommerz */}
              <div className="bg-gray-800 rounded-lg p-2 flex items-center justify-center hover:bg-gray-700 transition-colors" title="SSLCommerz">
                <div className="text-center">
                  <span className="text-green-400 font-bold text-xs">SSL</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Secure payments powered by SSLCommerz</p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-center md:text-left">
              <TimeDisplay />
            </div>
            <div className="text-center text-sm">
              <p>Made with ❤️ by <span className="text-green-400 font-medium">Shawon</span></p>
              <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} FeriWala. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
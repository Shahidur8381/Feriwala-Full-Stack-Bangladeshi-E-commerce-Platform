import React from 'react';
import Layout from '../components/Layout';
import { useCart } from '../contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-xl mb-4">Your cart is empty</p>
            <Link href="/products">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cartItems.map(item => {
                    const itemPrice = item.discount > 0 && new Date(item.discount_validity) > new Date() 
                      ? item.final_price 
                      : item.price;
                    const itemTotal = itemPrice * item.quantity;
                    
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-16 w-16 relative flex-shrink-0">
                              <Image 
                                src={item.image 
                                  ? `http://localhost:5000${item.image}` 
                                  : '/imageWhenNoImage/NoImage.jpg'} 
                                alt={item.title}
                                fill={true}
                                sizes="64px"
                                style={{ objectFit: 'cover' }}
                                className="rounded-md"
                              />
                            </div>
                            <div className="ml-4">
                              <Link href={`/product/${item.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                {item.title}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.discount > 0 && new Date(item.discount_validity) > new Date() ? (
                            <div>
                              <span className="text-gray-500 line-through text-xs">${item.price}</span>
                              <span className="text-blue-600 ml-1">${item.final_price}</span>
                            </div>
                          ) : (
                            <span className="text-blue-600">${item.price}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="bg-gray-200 p-1 rounded"
                            >
                              <FaMinus className="text-xs" />
                            </button>
                            <input 
                              type="number" 
                              min="1" 
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-12 text-center border border-gray-300 mx-2 py-1"
                            />
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="bg-gray-200 p-1 rounded"
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">
                          ${itemTotal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="px-6 py-4 bg-gray-50">
                <button 
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-blue-600">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                Proceed to Checkout
              </button>
              
              <div className="mt-4 text-center">
                <Link href="/products" className="text-blue-600 hover:underline text-sm">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
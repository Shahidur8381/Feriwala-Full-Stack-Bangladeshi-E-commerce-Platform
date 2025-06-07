import React from 'react';
import Layout from '../components/Layout';
import { useCart } from '../contexts/CartContext';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, validateCartStock } = useCart();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);
  // Validate cart stock when component mounts
  React.useEffect(() => {
    if (isLoaded && isSignedIn && cartItems.length > 0) {
      validateCartStock();
    }
  }, [isLoaded, isSignedIn, validateCartStock]);

  // Helper function to handle quantity updates with better UX
  const handleQuantityUpdate = (itemId: number, newQuantity: number, itemStock: number) => {
    if (newQuantity <= 0) {
      updateQuantity(itemId, 1);
      return;
    }
    
    if (newQuantity > itemStock) {
      alert(`Sorry, only ${itemStock} items are available in stock.`);
      return;
    }
    
    updateQuantity(itemId, newQuantity);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }
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

  // Check for out-of-stock items
  const outOfStockItems = cartItems.filter(item => item.stock === 0);
  const hasStockIssues = cartItems.some(item => item.quantity > item.stock || item.stock === 0);

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
                    
                    return (                      <tr key={item.id} className={`${
                        item.stock === 0 ? 'bg-red-50' : 
                        item.quantity >= item.stock ? 'bg-orange-50' : ''
                      }`}>
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
                              {item.stock === 0 && (
                                <div className="text-xs text-red-600 font-medium mt-1">
                                  ❌ Out of stock
                                </div>
                              )}
                              {item.stock > 0 && item.quantity >= item.stock && (
                                <div className="text-xs text-orange-600 font-medium mt-1">
                                  ⚠️ Maximum quantity reached
                                </div>
                              )}
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
                        </td>                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.stock === 0 ? (
                            <div className="text-center">
                              <div className="text-red-600 font-medium text-sm">Out of Stock</div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-600 text-xs hover:underline mt-1"
                              >
                                Remove from cart
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <button 
                                onClick={() => handleQuantityUpdate(item.id, item.quantity - 1, item.stock)}
                                className="bg-gray-200 p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1}
                                title={item.quantity <= 1 ? "Minimum quantity is 1" : "Decrease quantity"}
                              >
                                <FaMinus className="text-xs" />
                              </button>
                              <input 
                                type="number" 
                                min="1" 
                                max={item.stock}
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value) || 1;
                                  handleQuantityUpdate(item.id, newQuantity, item.stock);
                                }}
                                className="w-16 text-center border border-gray-300 mx-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title={`Maximum available: ${item.stock}`}
                              />
                              <button 
                                onClick={() => handleQuantityUpdate(item.id, item.quantity + 1, item.stock)}
                                className="bg-gray-200 p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity >= item.stock}
                                title={item.quantity >= item.stock ? `Only ${item.stock} available in stock` : "Increase quantity"}
                              >
                                <FaPlus className="text-xs" />
                              </button>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {item.stock === 0 && (
                              <span className="text-red-600 font-medium">
                                This item is currently unavailable
                              </span>
                            )}
                            {item.stock > 0 && item.stock <= 5 && (
                              <span className="text-orange-600 font-medium">
                                ⚠️ Only {item.stock} left in stock
                              </span>
                            )}
                            {item.stock > 5 && (
                              <span>Stock: {item.stock} available</span>
                            )}
                            {item.stock > 0 && item.quantity >= item.stock && (
                              <div className="text-red-600 font-medium">
                                Max quantity reached
                              </div>
                            )}
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
                </div>              </div>
              
              {hasStockIssues && (
                <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                  <p className="text-orange-800 text-sm font-medium">
                    ⚠️ Some items in your cart have stock limitations
                  </p>
                  {outOfStockItems.length > 0 && (
                    <p className="text-orange-700 text-xs mt-1">
                      {outOfStockItems.length} item(s) are out of stock and need to be removed
                    </p>
                  )}
                </div>
              )}
              
              <Link href="/checkout">
                <button 
                  className={`w-full py-2 px-4 rounded-lg ${
                    hasStockIssues 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={hasStockIssues}
                  title={hasStockIssues ? 'Please resolve stock issues before checkout' : 'Proceed to checkout'}
                >
                  {hasStockIssues ? 'Resolve Stock Issues' : 'Proceed to Checkout'}
                </button>
              </Link>
              
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
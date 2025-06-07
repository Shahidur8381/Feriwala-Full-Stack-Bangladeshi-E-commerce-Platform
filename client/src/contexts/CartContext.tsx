import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { Product } from '../services/api';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  validateCartStock: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { isSignedIn } = useUser();
  const router = useRouter();
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);
  const addToCart = (product: Product, quantity: number) => {
    // Check if user is signed in before adding to cart
    if (!isSignedIn) {
      // Show alert and redirect to sign in
      if (confirm('You need to sign in to add items to cart. Would you like to sign in now?')) {
        router.push('/sign-in');
      }
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Check if adding quantity would exceed stock
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          alert(`Only ${product.stock} items available in stock. You currently have ${existingItem.quantity} in your cart.`);
          return prevItems;
        }
        
        // Update quantity if item already exists
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Check if requested quantity exceeds stock for new item
        if (quantity > product.stock) {
          alert(`Only ${product.stock} items available in stock.`);
          return prevItems;
        }
        
        // Add new item
        return [...prevItems, { ...product, quantity }];
      }
    });
  };
  
  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };
    const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => {
        if (item.id === productId) {
          // Check if new quantity exceeds stock
          if (quantity > item.stock) {
            alert(`Only ${item.stock} items available in stock.`);
            return item; // Return unchanged item
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };
    const clearCart = () => {
    setCartItems([]);
  };

  const validateCartStock = async () => {
    if (cartItems.length === 0) return;

    try {
      // Fetch current product data to check stock
      const productIds = cartItems.map(item => item.id);
      const response = await fetch('http://localhost:5000/api/products');
      const products: Product[] = await response.json();
      
      let hasStockIssues = false;
      const updatedItems = cartItems.map(cartItem => {
        const currentProduct = products.find(p => p.id === cartItem.id);
        if (currentProduct && cartItem.quantity > currentProduct.stock) {
          hasStockIssues = true;
          // Update cart item with current stock and product data
          return { 
            ...currentProduct, 
            quantity: Math.min(cartItem.quantity, currentProduct.stock) 
          };
        }
        return cartItem;
      });

      if (hasStockIssues) {
        setCartItems(updatedItems);
        alert('Some items in your cart had their quantities adjusted due to stock changes.');
      }
    } catch (error) {
      console.error('Error validating cart stock:', error);
    }
  };
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => {
    const itemPrice = item.discount > 0 && new Date(item.discount_validity) > new Date() 
      ? item.final_price 
      : item.price;
    return total + (itemPrice * item.quantity);
  }, 0);
  
  // Calculate cart count (total number of items)
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      validateCartStock
    }}>
      {children}
    </CartContext.Provider>
  );
};
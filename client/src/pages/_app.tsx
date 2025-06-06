import React from 'react';
import { AppProps } from 'next/app';
import { ClerkProvider } from '@clerk/nextjs';
import { CartProvider } from '../contexts/CartContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
      {...pageProps}
    >
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </ClerkProvider>
  );
}

export default MyApp;
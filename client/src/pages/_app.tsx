import React from 'react';
import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/globals.css';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>FeriWala - Bangladeshi E-commerce</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthProvider>
        <CartProvider>
          <Component {...pageProps} />
        </CartProvider>
      </AuthProvider>
    </>
  );
}

export default MyApp;
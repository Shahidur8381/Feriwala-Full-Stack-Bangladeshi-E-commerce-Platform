import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  searchQuery?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, searchQuery = '' }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header searchQuery={searchQuery} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
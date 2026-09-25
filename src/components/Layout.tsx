import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const Layout = () => {
  useEffect(() => {
    document.title = '税智盾 TaxShield AI · AI财税健康管理与融资准备';
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 w-full">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

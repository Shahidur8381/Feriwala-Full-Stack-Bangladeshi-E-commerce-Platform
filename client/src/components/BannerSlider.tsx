import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Slider from 'react-slick';
import { getProductsByTag, Product } from '../services/api';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const bannerProducts = await getProductsByTag('bannersecret');
        setBanners(bannerProducts);
      } catch (error) {
        console.error('Error fetching banner products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    fade: true,
    cssEase: 'ease-in-out',
  };

  if (loading) {
    return <div className="h-48 md:h-80 animate-shimmer rounded-2xl" />;
  }

  // Fallback hero banner when no banner products exist
  if (banners.length === 0) {
    return (
      <div className="relative h-48 md:h-80 rounded-2xl overflow-hidden fw-gradient-hero">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-8 animate-fade-in-up">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">🎉 Mega Sale is Live!</h2>
            <p className="text-green-100 mb-5 text-sm md:text-base">Up to 50% off on selected items. Limited time offer!</p>
            <Link href="/products" className="inline-block bg-yellow-400 text-gray-900 px-6 py-2.5 rounded-xl font-bold hover:bg-yellow-300 transition-colors shadow-lg">
              Shop Now →
            </Link>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-4 right-8 w-20 h-20 border-2 border-white/20 rounded-full" style={{ animation: 'float 5s ease-in-out infinite' }} />
        <div className="absolute bottom-6 left-12 w-14 h-14 border border-white/15 rounded-full" style={{ animation: 'float 4s ease-in-out infinite 1s' }} />
      </div>
    );
  }

  return (
    <div className="banner-slider rounded-2xl overflow-hidden shadow-lg">
      <Slider {...settings}>
        {banners.map((banner) => {
          const imageUrl = banner.image 
            ? (banner.image.startsWith('http') ? banner.image : `${process.env.NEXT_PUBLIC_API_URL}${banner.image}`)
            : '/imageWhenNoImage/NoImage.jpg';
          
          return (
            <div key={banner.id} className="relative h-48 md:h-80">
              <Link href={`/product/${banner.id}`}>
                <div className="relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={banner.title}
                    fill={true}
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                    className="rounded-2xl"
                    priority={true}
                  />
                  {/* Gradient overlay with text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-lg md:text-2xl font-bold drop-shadow-lg">{banner.title}</h3>
                    {banner.final_price && (
                      <p className="text-yellow-300 font-semibold text-sm md:text-base">৳{Number(banner.final_price).toFixed(0)}</p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default BannerSlider;
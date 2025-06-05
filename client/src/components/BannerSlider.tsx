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
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  if (loading) {
    return <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>;
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="banner-slider">
      <Slider {...settings}>
        {banners.map((banner) => {
          // Create a valid image URL or use a fallback
          const imageUrl = banner.image 
            ? `http://localhost:5000${banner.image}` 
            : '/imageWhenNoImage/NoImage.jpg';
          
          return (
            <div key={banner.id} className="relative h-64 md:h-96">
              <Link href={`/product/${banner.id}`}>
                <div className="relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={banner.title}
                    fill={true}
                    sizes="100vw"
                    style={{ objectFit: 'cover' }}
                    className="rounded-lg"
                    priority={true}
                  />
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
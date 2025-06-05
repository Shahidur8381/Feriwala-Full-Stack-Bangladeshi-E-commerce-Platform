/**
 * Creates a valid image URL from a product image path
 * @param imagePath The image path from the product object
 * @param fallbackSize Optional size for the fallback image (format: '300x200')
 * @returns A valid image URL
 */
export const getImageUrl = (imagePath: string | null | undefined, fallbackSize: string = '300x200'): string => {
  if (!imagePath) {
    return `https://via.placeholder.com/${fallbackSize}?text=No+Image`;
  }
  
  // Check if the image path already includes the domain
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Ensure the path starts with a slash
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `http://localhost:5000${path}`;
};
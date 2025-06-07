// Quick test to verify API data in browser console
import { getTopRatedProducts, getTopRatedSellers } from '../services/api';

export default function TestHomepage() {
  const testData = async () => {
    try {
      console.log('=== Testing Top Rated Products ===');
      const topProducts = await getTopRatedProducts(5);
      console.log('Top rated products:', topProducts);
      
      console.log('\\n=== Testing Top Rated Sellers ===');
      const topSellers = await getTopRatedSellers(5);
      console.log('Top rated sellers:', topSellers);
      
    } catch (error) {
      console.error('Error testing data:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Homepage Sorting Test</h1>
      <button 
        onClick={testData} 
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test API Data (Check Console)
      </button>
      <div className="mt-4 text-gray-600">
        <p>Click the button above and check the browser console for sorted data.</p>
        <p>This page is for testing only and can be removed.</p>
      </div>
    </div>
  );
}

// Simple test for formatSold function
// Copy the function here for testing

function formatSold(sold) {
  // Convert sold to a number, handling various edge cases
  let soldCount;
  
  if (sold === null || sold === undefined) {
    soldCount = 0;
  } else if (typeof sold === 'object' && sold !== null) {
    // Handle case where sold is an object (e.g., {})
    soldCount = 0;
  } else if (typeof sold === 'string') {
    const parsed = parseInt(sold, 10);
    soldCount = isNaN(parsed) ? 0 : parsed;
  } else if (typeof sold === 'number') {
    soldCount = sold;
  } else {
    soldCount = 0;
  }
  
  // Ensure soldCount is not negative
  soldCount = Math.max(0, soldCount);
  
  // Format based on count
  if (soldCount === 0) {
    return 'sold: 0 unit';
  } else if (soldCount === 1) {
    return 'sold: 1 unit';
  } else {
    return `sold: ${soldCount} units`;
  }
}

// Test cases for formatSold function
console.log('Testing formatSold function:');
console.log('formatSold(0):', formatSold(0));           // should be "sold: 0 unit"
console.log('formatSold(1):', formatSold(1));           // should be "sold: 1 unit"
console.log('formatSold(5):', formatSold(5));           // should be "sold: 5 units"
console.log('formatSold(null):', formatSold(null));     // should be "sold: 0 unit"
console.log('formatSold(undefined):', formatSold(undefined)); // should be "sold: 0 unit"
console.log('formatSold({}):', formatSold({}));         // should be "sold: 0 unit"
console.log('formatSold("0"):', formatSold("0"));       // should be "sold: 0 unit"
console.log('formatSold("1"):', formatSold("1"));       // should be "sold: 1 unit"
console.log('formatSold("5"):', formatSold("5"));       // should be "sold: 5 units"
console.log('formatSold("abc"):', formatSold("abc"));   // should be "sold: 0 unit"
console.log('formatSold(-5):', formatSold(-5));         // should be "sold: 0 unit"

console.log('\nAll tests completed!');

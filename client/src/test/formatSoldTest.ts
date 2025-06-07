import { formatSold } from '../utils/formatSold';

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

import { formatSold } from '../utils/formatSold';

// Test cases for formatSold function
:', formatSold(0));           // should be "sold: 0 unit"
:', formatSold(1));           // should be "sold: 1 unit"
:', formatSold(5));           // should be "sold: 5 units"
:', formatSold(null));     // should be "sold: 0 unit"
:', formatSold(undefined)); // should be "sold: 0 unit"
:', formatSold({}));         // should be "sold: 0 unit"
:', formatSold("0"));       // should be "sold: 0 unit"
:', formatSold("1"));       // should be "sold: 1 unit"
:', formatSold("5"));       // should be "sold: 5 units"
:', formatSold("abc"));   // should be "sold: 0 unit"
:', formatSold(-5));         // should be "sold: 0 unit"


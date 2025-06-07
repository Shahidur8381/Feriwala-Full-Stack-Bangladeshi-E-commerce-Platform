/**
 * Formats the sold value for display
 * @param sold - The sold value from the product, could be number, string, object, null, or undefined
 * @returns Formatted string for display
 */
export const formatSold = (sold: any): string => {
  // Convert sold to a number, handling various edge cases
  let soldCount: number;
  
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
};

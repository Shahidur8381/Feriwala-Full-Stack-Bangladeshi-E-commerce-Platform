/**
 * Formats shop details that might be stored as a JSON string
 * into a human-readable string.
 * @param details The shop details string (could be JSON or plain text)
 * @returns Formatted human-readable string
 */
export const formatShopDetails = (details: string | undefined | null): string => {
  if (!details) return '';
  
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details);
      if (typeof parsed === 'object' && parsed !== null) {
        const parts = [];
        if (parsed.address) parts.push(parsed.address);
        if (parsed.phone) parts.push(parsed.phone);
        if (parsed.email) parts.push(parsed.email);
        return parts.length > 0 ? parts.join(' • ') : details;
      }
    } catch {
      // Not a valid JSON string, return as is
      return details;
    }
  }
  
  return String(details);
};

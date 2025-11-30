/**
 * Natural sorting utility for strings containing numbers
 */

/**
 * Natural compare function for sorting strings with numbers
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {number} - Comparison result (-1, 0, 1)
 */
export function naturalCompare(a, b) {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  
  // Handle special case for "All" - it should always come first
  if (a === 'All') return -1;
  if (b === 'All') return 1;
  
  const regex = /(\d+)|(\D+)/g;
  const aParts = a.match(regex) || [];
  const bParts = b.match(regex) || [];
  
  const len = Math.min(aParts.length, bParts.length);
  
  for (let i = 0; i < len; i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];
    
    // If both parts are numbers, compare numerically
    if (/^\d+$/.test(aPart) && /^\d+$/.test(bPart)) {
      const aNum = parseInt(aPart, 10);
      const bNum = parseInt(bPart, 10);
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    } else {
      // Otherwise compare as strings (case insensitive)
      const aLower = aPart.toLowerCase();
      const bLower = bPart.toLowerCase();
      if (aLower !== bLower) {
        return aLower < bLower ? -1 : 1;
      }
    }
  }
  
  // If all compared parts are equal, compare by length
  return aParts.length - bParts.length;
}

/**
 * Sort an array using natural sort with "All" as first item
 * @param {Array} array - Array to sort
 * @returns {Array} - Sorted array
 */
export function naturalSort(array) {
  return [...array].sort(naturalCompare);
}

/**
 * Get sorted filter options with "All" as first item and natural sorting for the rest
 * @param {Array} items - Array of items to create filter options from
 * @param {string} allLabel - Label for "All" option (default: "All")
 * @returns {Array} - Array of filter options with proper sorting
 */
export function getSortedFilterOptions(items, allLabel = 'All') {
  if (!items || items.length === 0) {
    return [allLabel];
  }
  
  // Create unique set and convert to array
  const uniqueItems = [...new Set(items)];
  
  // Sort naturally
  const sortedItems = naturalSort(uniqueItems);
  
  // Add "All" at the beginning
  return [allLabel, ...sortedItems];
}

/**
 * Create filter options for numeric codes (like room numbers)
 * @param {Array} items - Array of items
 * @param {string} allLabel - Label for "All" option
 * @returns {Array} - Array of filter options with proper sorting
 */
export function getNumericFilterOptions(items, allLabel = 'All') {
  if (!items || items.length === 0) {
    return [allLabel];
  }
  
  // Filter for items that look like numeric codes (contain numbers)
  const numericItems = items.filter(item => /\d/.test(item));
  const nonNumericItems = items.filter(item => !/\d/.test(item));
  
  // Sort numeric items naturally
  const sortedNumeric = naturalSort(numericItems);
  
  // Sort non-numeric items alphabetically
  const sortedNonNumeric = nonNumericItems.sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  
  // Combine with "All" at the beginning
  return [allLabel, ...sortedNumeric, ...sortedNonNumeric];
}
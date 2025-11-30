/**
 * Centralized error handling utility for API responses
 */

import Swal from 'sweetalert2';

/**
 * Extract error message from API response
 * @param {Error|Object} error - The error object from API call
 * @returns {string} - The error message to display
 */
export const getErrorMessage = (error) => {
  // Check if error.response exists (axios error)
  if (error.response && error.response.data) {
    const responseData = error.response.data;
    
    // If response has a message field, use it
    if (responseData.message) {
      return responseData.message;
    }
    
    // If response has errors object, try to extract first error
    if (responseData.errors && typeof responseData.errors === 'object') {
      // Get the first error message from the errors object
      const errorKeys = Object.keys(responseData.errors);
      if (errorKeys.length > 0) {
        const firstErrorKey = errorKeys[0];
        const firstErrorArray = responseData.errors[firstErrorKey];
        if (Array.isArray(firstErrorArray) && firstErrorArray.length > 0) {
          return firstErrorArray[0];
        }
      }
    }
    
    // Fallback to generic message if status is false
    if (responseData.status === false) {
      return 'Operation failed. Please try again.';
    }
  }
  
  // If error has a message property
  if (error.message) {
    return error.message;
  }
  
  // Generic fallback message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Show error toast using Swal
 * @param {Error|Object} error - The error object
 * @param {string} customMessage - Optional custom message to override
 */
export const showErrorToast = (error, customMessage = null) => {
  const message = customMessage || getErrorMessage(error);
  
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'error',
    title: message,
    showConfirmButton: false,
    timer: 3000
  });
};

/**
 * Show success toast using Swal
 * @param {string} message - Success message to display
 */
export const showSuccessToast = (message) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 3000
  });
};
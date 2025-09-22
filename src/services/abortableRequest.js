/**
 * Abortable Request Service
 * Prevents race conditions by cancelling in-flight requests
 */

import React from 'react';

class AbortableRequestManager {
  constructor() {
    // Store abort controllers by key
    this.controllers = new Map();
  }

  /**
   * Create an abortable request
   * @param {string} key - Unique identifier for this request type
   * @param {Function} asyncFn - Async function to execute
   * @returns {Promise} Result of the async function
   */
  async request(key, asyncFn) {
    // Cancel any existing request with the same key
    this.abort(key);

    // Create new abort controller
    const controller = new AbortController();
    this.controllers.set(key, controller);

    try {
      // Execute the async function with the abort signal
      const result = await asyncFn(controller.signal);
      
      // Clean up on success
      this.controllers.delete(key);
      return result;
    } catch (error) {
      // Check if it was aborted
      if (error.name === 'AbortError') {
        // Silently handle abort - this is expected behavior
        return null;
      }
      
      // Clean up on error
      this.controllers.delete(key);
      throw error;
    }
  }

  /**
   * Abort a specific request
   * @param {string} key - Request key to abort
   */
  abort(key) {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
    }
  }

  /**
   * Abort all pending requests
   */
  abortAll() {
    for (const controller of this.controllers.values()) {
      controller.abort();
    }
    this.controllers.clear();
  }

  /**
   * Check if a request is currently in progress
   * @param {string} key - Request key to check
   * @returns {boolean} True if request is in progress
   */
  isInProgress(key) {
    return this.controllers.has(key);
  }
}

// Create singleton instance
const requestManager = new AbortableRequestManager();

/**
 * React hook for abortable requests
 */
export function useAbortableRequest() {
  const managerRef = React.useRef(new AbortableRequestManager());
  
  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      managerRef.current.abortAll();
    };
  }, []);
  
  return managerRef.current;
}

/**
 * Higher-order function to make any async function abortable
 */
export function makeAbortable(asyncFn, checkSignal = true) {
  return async (signal, ...args) => {
    // Check if already aborted
    if (checkSignal && signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    
    // Add periodic abort checks for long-running operations
    const checkAbort = () => {
      if (checkSignal && signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
    };
    
    // Execute the function with abort checking
    try {
      // Pass signal as first argument if the function expects it
      const result = await asyncFn(...args);
      checkAbort(); // Final check before returning
      return result;
    } catch (error) {
      // Re-throw abort errors
      if (error.name === 'AbortError') {
        throw error;
      }
      // Handle other errors normally
      throw error;
    }
  };
}

/**
 * Utility to add abort support to fetch requests
 */
export function abortableFetch(url, options = {}) {
  return (signal) => {
    return fetch(url, {
      ...options,
      signal
    });
  };
}

/**
 * Debounced abortable request
 */
export function debounceAbortable(fn, delay = 300) {
  let timeoutId;
  let abortController;
  
  return async (...args) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Abort existing request
    if (abortController) {
      abortController.abort();
    }
    
    // Create new abort controller
    abortController = new AbortController();
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(abortController.signal, ...args);
          resolve(result);
        } catch (error) {
          if (error.name !== 'AbortError') {
            reject(error);
          }
        }
      }, delay);
    });
  };
}

export default requestManager;
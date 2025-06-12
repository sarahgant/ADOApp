/**
 * Local Storage Service
 * Provides a wrapper around browser localStorage
 */
class StorageService {
  /**
   * Retrieves an item from localStorage and parses it as JSON.
   * @param {string} key The key of the item to retrieve.
   * @returns {any | null} The retrieved item, or null if not found or parsing fails.
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error getting item from localStorage for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Stores an item in localStorage after serializing it to JSON.
   * @param {string} key The key under which to store the item.
   * @param {any} value The value to store.
   */
  setItem(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting item in localStorage for key "${key}":`, error);
    }
  }

  /**
   * Removes an item from localStorage.
   * @param {string} key The key of the item to remove.
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage for key "${key}":`, error);
    }
  }
}

export const storageService = new StorageService();
export default storageService; 
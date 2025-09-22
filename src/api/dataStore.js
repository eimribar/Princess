/**
 * Princess Data Store - Local Storage Implementation
 * Provides CRUD operations with localStorage persistence
 * Can be easily replaced with Supabase or custom API later
 */

import { generateUUID } from '@/utils/uuid';

class DataStore {
  constructor() {
    this.storageKey = 'princess_data';
    this.data = this.loadFromStorage();
  }

  // Initialize default data structure
  getDefaultData() {
    return {
      projects: [],
      stages: [],
      deliverables: [],
      teamMembers: [],
      comments: [],
      notifications: [],
      outOfScopeRequests: [],
      users: [],
      lastUpdate: new Date().toISOString()
    };
  }

  // Load data from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Filter out any demo data (Deutsch & Co. Princess)
        if (data.projects && data.projects.length > 0) {
          const hasDemo = data.projects.some(p => 
            p.name && p.name.includes('Deutsch') || 
            p.client_name && p.client_name.includes('Deutsch')
          );
          if (hasDemo) {
            console.warn('Demo data detected, clearing...');
            localStorage.removeItem(this.storageKey);
            return this.getDefaultData();
          }
        }
        return data;
      }
    } catch (error) {
      console.warn('Failed to load data from localStorage:', error);
    }
    return this.getDefaultData();
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      this.data.lastUpdate = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Failed to save data to localStorage:', error);
    }
  }

  // Generate unique ID
  generateId() {
    // Use proper UUID generation to prevent collisions
    return generateUUID();
  }

  // Generic CRUD operations
  getAll(entityType, orderBy = null) {
    const items = this.data[entityType] || [];
    if (orderBy) {
      return [...items].sort((a, b) => {
        if (orderBy.startsWith('-')) {
          const field = orderBy.substring(1);
          return b[field] > a[field] ? 1 : -1;
        } else {
          return a[orderBy] > b[orderBy] ? 1 : -1;
        }
      });
    }
    return [...items];
  }

  getById(entityType, id) {
    const items = this.data[entityType] || [];
    return items.find(item => item.id === id);
  }

  create(entityType, data) {
    if (!this.data[entityType]) {
      this.data[entityType] = [];
    }
    
    const newItem = {
      id: this.generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      ...data
    };
    
    this.data[entityType].push(newItem);
    this.saveToStorage();
    return newItem;
  }

  update(entityType, id, updates) {
    const items = this.data[entityType] || [];
    const index = items.findIndex(item => item.id === id);
    
    if (index >= 0) {
      const updatedItem = {
        ...items[index],
        ...updates,
        updated_date: new Date().toISOString()
      };
      items[index] = updatedItem;
      this.saveToStorage();
      return updatedItem;
    }
    
    throw new Error(`${entityType} with id ${id} not found`);
  }

  delete(entityType, id) {
    const items = this.data[entityType] || [];
    const index = items.findIndex(item => item.id === id);
    
    if (index >= 0) {
      const deletedItem = items.splice(index, 1)[0];
      this.saveToStorage();
      return deletedItem;
    }
    
    throw new Error(`${entityType} with id ${id} not found`);
  }

  filter(entityType, criteria = {}) {
    const items = this.data[entityType] || [];
    return items.filter(item => {
      return Object.keys(criteria).every(key => {
        if (criteria[key] === null || criteria[key] === undefined) {
          return true;
        }
        if (typeof criteria[key] === 'object' && criteria[key].in) {
          return criteria[key].in.includes(item[key]);
        }
        return item[key] === criteria[key];
      });
    });
  }

  // Clear all data (for testing/reset)
  clear() {
    this.data = this.getDefaultData();
    this.saveToStorage();
  }

  // Import data (for seeding)
  importData(newData) {
    this.data = { ...this.getDefaultData(), ...newData };
    this.saveToStorage();
  }

  // Export data (for backup)
  exportData() {
    return JSON.parse(JSON.stringify(this.data));
  }
}

// Create singleton instance
const dataStore = new DataStore();

export default dataStore;
/**
 * Princess Entity Classes
 * Provides API-compatible interfaces for all data entities
 * Uses local dataStore but maintains same API as Base44 SDK
 */

import dataStore from './dataStore';

// Base Entity class with common functionality
class BaseEntity {
  constructor(entityType) {
    this.entityType = entityType;
  }

  async list(orderBy = null) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(dataStore.getAll(this.entityType, orderBy));
      }, 50); // Simulate async operation
    });
  }

  async get(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const item = dataStore.getById(this.entityType, id);
        if (item) {
          resolve(item);
        } else {
          reject(new Error(`${this.entityType} with id ${id} not found`));
        }
      }, 50);
    });
  }

  async create(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(dataStore.create(this.entityType, data));
      }, 100);
    });
  }

  async update(id, updates) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(dataStore.update(this.entityType, id, updates));
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(dataStore.delete(this.entityType, id));
        } catch (error) {
          reject(error);
        }
      }, 50);
    });
  }

  async filter(criteria = {}, orderBy = null) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = dataStore.filter(this.entityType, criteria);
        if (orderBy) {
          results = results.sort((a, b) => {
            if (orderBy.startsWith('-')) {
              const field = orderBy.substring(1);
              return b[field] > a[field] ? 1 : -1;
            } else {
              return a[orderBy] > b[orderBy] ? 1 : -1;
            }
          });
        }
        resolve(results);
      }, 75);
    });
  }

  async bulkCreate(items) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const createdItems = [];
        for (const item of items) {
          const created = dataStore.create(this.entityType, item);
          createdItems.push(created);
        }
        resolve(createdItems);
      }, 100);
    });
  }
}

// Project Entity
class ProjectEntity extends BaseEntity {
  constructor() {
    super('projects');
  }
}

// Stage Entity
class StageEntity extends BaseEntity {
  constructor() {
    super('stages');
  }
}

// Deliverable Entity
class DeliverableEntity extends BaseEntity {
  constructor() {
    super('deliverables');
  }
}

// TeamMember Entity
class TeamMemberEntity extends BaseEntity {
  constructor() {
    super('teamMembers');
  }
}

// Comment Entity
class CommentEntity extends BaseEntity {
  constructor() {
    super('comments');
  }
}

// Notification Entity
class NotificationEntity extends BaseEntity {
  constructor() {
    super('notifications');
  }
}

// OutOfScopeRequest Entity
class OutOfScopeRequestEntity extends BaseEntity {
  constructor() {
    super('outOfScopeRequests');
  }
}

// User Entity (for authentication)
class UserEntity extends BaseEntity {
  constructor() {
    super('users');
  }

  // Simple authentication methods
  async login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = dataStore.getAll('users');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          // Store current user in sessionStorage
          sessionStorage.setItem('current_user', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }));
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 200);
    });
  }

  async getCurrentUser() {
    return new Promise((resolve) => {
      const stored = sessionStorage.getItem('current_user');
      if (stored) {
        resolve(JSON.parse(stored));
      } else {
        resolve(null);
      }
    });
  }

  async logout() {
    return new Promise((resolve) => {
      sessionStorage.removeItem('current_user');
      resolve();
    });
  }
}

// Create instances and export
export const Project = new ProjectEntity();
export const Stage = new StageEntity();
export const Deliverable = new DeliverableEntity();
export const TeamMember = new TeamMemberEntity();
export const Comment = new CommentEntity();
export const Notification = new NotificationEntity();
export const OutOfScopeRequest = new OutOfScopeRequestEntity();
export const User = new UserEntity();

// Export dataStore for direct access if needed
export { dataStore };
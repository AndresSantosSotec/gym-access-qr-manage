const STORAGE_KEYS = {
  AUTH: 'gym_auth',
  CLIENTS: 'gym_clients',
  PAYMENTS: 'gym_payments',
  ACCESS_LOGS: 'gym_access_logs',
  MEMBERSHIP_PLANS: 'gym_membership_plans',
  SITE_CONFIG: 'gym_site_config',
  BLOG_POSTS: 'gym_blog_posts',
  LEADS: 'gym_leads',
  STRIPE_SESSIONS: 'gym_stripe_sessions',
  ROLES: 'gym_roles',
  SEED_INITIALIZED: 'gym_seed_initialized',
} as const;

export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export { STORAGE_KEYS };

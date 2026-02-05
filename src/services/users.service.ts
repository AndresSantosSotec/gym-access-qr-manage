import type { User } from '@/types/models';

const USERS_KEY = 'gymflow_users';

export const usersService = {
  getAllUsers: async (): Promise<User[]> => {
    return await window.spark.kv.get<User[]>(USERS_KEY) || [];
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    const users = await usersService.getAllUsers();
    return users.find(u => u.id === id);
  },

  getUserByUsername: async (username: string): Promise<User | undefined> => {
    const users = await usersService.getAllUsers();
    return users.find(u => u.username === username);
  },

  createUser: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const users = await usersService.getAllUsers();
    
    const newUser: User = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    await window.spark.kv.set(USERS_KEY, updated);
    
    return newUser;
  },

  updateUser: async (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
    const users = await usersService.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) return null;

    const updated = users.map(u => 
      u.id === id ? { ...u, ...data } : u
    );
    
    await window.spark.kv.set(USERS_KEY, updated);
    return updated[index];
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const users = await usersService.getAllUsers();
    const filtered = users.filter(u => u.id !== id);
    
    if (filtered.length === users.length) return false;
    
    await window.spark.kv.set(USERS_KEY, filtered);
    return true;
  },
};

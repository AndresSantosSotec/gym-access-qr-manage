import { storage } from '@/utils/storage';
import type { User } from '@/types/models';

const USERS_KEY = 'gymflow_users';

export const usersService = {
  getAllUsers: (): User[] => {
    return storage.get<User[]>(USERS_KEY) || [];
  },

  getUserById: (id: string): User | undefined => {
    const users = usersService.getAllUsers();
    return users.find(u => u.id === id);
  },

  getUserByUsername: (username: string): User | undefined => {
    const users = usersService.getAllUsers();
    return users.find(u => u.username === username);
  },

  createUser: (data: Omit<User, 'id' | 'createdAt'>): User => {
    const users = usersService.getAllUsers();
    
    const newUser: User = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    storage.set(USERS_KEY, updated);
    
    return newUser;
  },

  updateUser: (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): User | null => {
    const users = usersService.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) return null;

    const updated = users.map(u => 
      u.id === id ? { ...u, ...data } : u
    );
    
    storage.set(USERS_KEY, updated);
    return updated[index];
  },

  deleteUser: (id: string): boolean => {
    const users = usersService.getAllUsers();
    const filtered = users.filter(u => u.id !== id);
    
    if (filtered.length === users.length) return false;
    
    storage.set(USERS_KEY, filtered);
    return true;
  },
};

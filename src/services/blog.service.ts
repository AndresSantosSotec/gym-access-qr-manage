import { storage, STORAGE_KEYS } from '@/utils/storage';
import type { BlogPost } from '@/types/models';

export const blogService = {
  getAllPosts: (): BlogPost[] => {
    return storage.get<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS) || [];
  },

  getPublishedPosts: (): BlogPost[] => {
    const posts = blogService.getAllPosts();
    return posts.filter((p) => p.published).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getPostById: (id: string): BlogPost | null => {
    const posts = blogService.getAllPosts();
    return posts.find((p) => p.id === id) || null;
  },

  getPostBySlug: (slug: string): BlogPost | null => {
    const posts = blogService.getAllPosts();
    return posts.find((p) => p.slug === slug) || null;
  },

  createPost: (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): BlogPost => {
    const now = new Date().toISOString();
    const newPost: BlogPost = {
      ...post,
      id: `POST-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    const posts = blogService.getAllPosts();
    storage.set(STORAGE_KEYS.BLOG_POSTS, [...posts, newPost]);
    return newPost;
  },

  updatePost: (id: string, updates: Partial<BlogPost>): BlogPost | null => {
    const posts = blogService.getAllPosts();
    const index = posts.findIndex((p) => p.id === id);
    
    if (index === -1) return null;

    const updatedPost = {
      ...posts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    posts[index] = updatedPost;
    storage.set(STORAGE_KEYS.BLOG_POSTS, posts);
    return updatedPost;
  },

  deletePost: (id: string): boolean => {
    const posts = blogService.getAllPosts();
    const filtered = posts.filter((p) => p.id !== id);
    
    if (filtered.length === posts.length) return false;

    storage.set(STORAGE_KEYS.BLOG_POSTS, filtered);
    return true;
  },

  togglePublished: (id: string): BlogPost | null => {
    const post = blogService.getPostById(id);
    if (!post) return null;

    return blogService.updatePost(id, { published: !post.published });
  },
};

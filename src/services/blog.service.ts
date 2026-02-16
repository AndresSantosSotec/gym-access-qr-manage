import { api } from '@/services/api.service';
import type { BlogPost, CreateBlogPostHelper, UpdateBlogPostHelper } from '@/types/blog';

const BASE_URL = '/blog-posts';

export const blogService = {
  getAllPosts: async (page = 1): Promise<any> => {
    const response = await api.get(`${BASE_URL}?page=${page}`);
    return response.data;
  },

  getPostById: async (id: number): Promise<BlogPost> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createPost: async (post: CreateBlogPostHelper): Promise<BlogPost> => {
    const formData = new FormData();
    formData.append('title', post.title);
    formData.append('content', post.content);
    formData.append('status', post.status);
    if (post.excerpt) formData.append('excerpt', post.excerpt);
    if (post.featured_image) formData.append('featured_image', post.featured_image);
    if (post.gallery_images) {
      post.gallery_images.forEach((file) => {
        formData.append('gallery_images[]', file);
      });
    }

    const response = await api.post(BASE_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updatePost: async (id: number, post: UpdateBlogPostHelper): Promise<BlogPost> => {
    const formData = new FormData();
    if (post.title) formData.append('title', post.title);
    if (post.content) formData.append('content', post.content);
    if (post.status) formData.append('status', post.status);
    if (post.excerpt !== undefined) formData.append('excerpt', post.excerpt || '');
    if (post.featured_image) formData.append('featured_image', post.featured_image);
    if (post.gallery_images) {
      post.gallery_images.forEach((file) => {
        formData.append('gallery_images[]', file);
      });
    }
    if (post.remove_image_ids) {
      post.remove_image_ids.forEach((id) => {
        formData.append('remove_image_ids[]', id.toString());
      });
    }

    // For Laravel PUT/PATCH with file uploads, we need to use POST with _method field
    formData.append('_method', 'PUT');

    const response = await api.post(`${BASE_URL}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

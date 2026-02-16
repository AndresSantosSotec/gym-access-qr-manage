export interface BlogImage {
    id: number;
    blog_post_id: number;
    image_path: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface BlogPost {
    id: number;
    user_id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featured_image: string | null;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author?: {
        id: number;
        name: string;
        email: string;
    };
    images?: BlogImage[];
}

export interface CreateBlogPostHelper {
    title: string;
    content: string;
    excerpt?: string;
    status: 'draft' | 'published';
    featured_image?: File;
    gallery_images?: File[];
}

export interface UpdateBlogPostHelper extends Partial<Omit<CreateBlogPostHelper, 'gallery_images'>> {
    _method?: string;
    gallery_images?: File[];
    remove_image_ids?: number[];
}

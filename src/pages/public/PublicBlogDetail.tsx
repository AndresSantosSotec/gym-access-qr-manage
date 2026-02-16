import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { blogService } from '@/services/blog.service';
import { ArrowLeft, Calendar } from '@phosphor-icons/react';
import { formatDate } from '@/utils/date';
import type { BlogPost } from '@/types/blog';

export function PublicBlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;
      try {
        const response = await blogService.getAllPosts(); // Ideally backend should support slug lookup
        const posts = response.data || response;
        const found = Array.isArray(posts) ? posts.find((p: BlogPost) => p.slug === slug) : null;
        setPost(found || null);
      } catch (error) {
        console.error("Error loading post", error);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!post || post.status !== 'published') {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Artículo no encontrado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                El artículo que buscas no está disponible o no existe.
              </p>
              <Button asChild>
                <Link to="/p/blog">Ver Todos los Artículos</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // Combine featured image and gallery images for the carousel
  const allImages = [
    ...(post.featured_image ? [{ id: 'featured', image_path: post.featured_image, isFeatured: true }] : []),
    ...(post.images || []).map(img => ({ ...img, isFeatured: false }))
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-4xl">
            <Button
              variant="ghost"
              onClick={() => navigate('/p/blog')}
              className="gap-2 mb-6"
            >
              <ArrowLeft size={18} />
              Volver al Blog
            </Button>
          </div>
        </section>

        <article className="px-4 pb-16">
          <div className="container mx-auto max-w-4xl">
            {allImages.length > 0 && (
              <div className="mb-8">
                <Carousel className="w-full">
                  <CarouselContent>
                    {allImages.map((img) => (
                      <CarouselItem key={img.id}>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                          <img
                            src={img.isFeatured && /^http/.test(img.image_path) ? img.image_path : `/storage/${img.image_path}`}
                            alt={post.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {allImages.length > 1 && (
                    <>
                      <CarouselPrevious />
                      <CarouselNext />
                    </>
                  )}
                </Carousel>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar size={16} weight="fill" />
              {formatDate(post.created_at)}
            </div>

            <h1 className="text-5xl font-bold mb-6">{post.title}</h1>

            <p className="text-xl text-muted-foreground mb-8">
              {post.excerpt}
            </p>

            <div className="prose prose-lg max-w-none">
              {post.content.split('\n').map((paragraph, idx) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-3xl font-bold mt-8 mb-4">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-2xl font-bold mt-6 mb-3">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.trim() === '') {
                  return null;
                }
                return (
                  <p key={idx} className="text-base leading-relaxed mb-4">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            <div className="mt-12 pt-8 border-t">
              <Button asChild variant="outline">
                <Link to="/p/blog">← Ver Más Artículos</Link>
              </Button>
            </div>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  );
}

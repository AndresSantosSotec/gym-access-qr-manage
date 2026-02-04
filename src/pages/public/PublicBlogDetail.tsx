import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { blogService } from '@/services/blog.service';
import { ArrowLeft, Calendar } from '@phosphor-icons/react';
import { formatDate } from '@/utils/date';

export function PublicBlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? blogService.getPostBySlug(slug) : null;

  if (!post || !post.published) {
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
            {post.coverImageUrl && (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-96 object-cover rounded-lg mb-8"
              />
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar size={16} weight="fill" />
              {formatDate(post.createdAt)}
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

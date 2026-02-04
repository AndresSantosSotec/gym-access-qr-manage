import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { blogService } from '@/services/blog.service';
import { Article, Calendar } from '@phosphor-icons/react';
import { formatDate } from '@/utils/date';

export function PublicBlog() {
  const posts = blogService.getPublishedPosts();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="py-16 px-4 bg-gradient-to-br from-primary/10 to-accent/5">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4 tracking-tight">Blog</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Artículos, consejos y noticias sobre fitness y bienestar
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            {posts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Article size={64} className="mx-auto text-muted-foreground mb-4" weight="duotone" />
                  <p className="text-xl text-muted-foreground">
                    No hay publicaciones disponibles en este momento
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow flex flex-col">
                    {post.coverImageUrl && (
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardHeader className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar size={16} weight="fill" />
                        {formatDate(post.createdAt)}
                      </div>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="w-full gap-2">
                        <Link to={`/p/blog/${post.slug}`}>
                          <Article size={18} />
                          Leer Artículo
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

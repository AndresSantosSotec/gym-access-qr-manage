import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { siteService } from '@/services/site.service';
import { blogService } from '@/services/blog.service';
import { membershipsService } from '@/services/memberships.service';
import { CheckCircle, ArrowRight, Article } from '@phosphor-icons/react';
import { formatCurrency } from '@/utils/date';

export function PublicHome() {
  const config = siteService.getConfig();
  const publishedPlans = membershipsService.getPublishedPlans().slice(0, 3);
  const recentPosts = blogService.getPublishedPosts().slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <section
        className="py-20 px-4 bg-gradient-to-br from-primary/10 via-accent/5 to-background"
        style={{
          backgroundImage: config.heroImageUrl ? `url(${config.heroImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            {config.gymName}
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-8">
            {config.slogan}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/p/planes">
                Ver Planes
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/p/contacto">Contacto</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Sobre Nosotros</h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
            {config.aboutText}
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Nuestros Planes</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {publishedPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-4xl font-bold text-primary">
                      {formatCurrency(plan.price)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.durationDays} días
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-600" weight="fill" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild className="w-full">
                    <Link to={`/p/planes/${plan.slug}`}>Ver Detalles</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link to="/p/planes">Ver Todos los Planes</Link>
            </Button>
          </div>
        </div>
      </section>

      {recentPosts.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">Últimas Publicaciones</h2>
            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
              {recentPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  {post.coverImageUrl && (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full gap-2">
                      <Link to={`/p/blog/${post.slug}`}>
                        <Article size={18} />
                        Leer Más
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button asChild variant="outline" size="lg">
                <Link to="/p/blog">Ver Todo el Blog</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}

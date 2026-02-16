import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { HeroCarousel } from '@/components/HeroCarousel';
import { siteService } from '@/services/site.service';
import { blogService } from '@/services/blog.service';
import { membershipsService } from '@/services/memberships.service';
import { api } from '@/services/api.service';
import { HomePlansGridSkeleton } from '@/components/skeletons';
import { CheckCircle, ArrowRight, Article, ShoppingCart, WhatsappLogo } from '@phosphor-icons/react';
import { formatCurrency } from '@/utils/date';
import type { SiteConfig, MembershipPlan, SiteSection } from '@/types/models';
import { motion } from 'framer-motion';

const animations = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.8 } },
  slide: { initial: { y: 50, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.6 } },
  zoom: { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.5 } },
  none: { initial: {}, animate: {}, transition: {} },
};

// Componente para Sección de Texto
function TextSection({ section, anim }: { section: SiteSection; anim: any }) {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto text-center max-w-4xl">
        <motion.div {...anim}>
          <h2 className="text-4xl font-bold mb-6">{section.title}</h2>
          {section.subtitle && <p className="text-xl text-muted-foreground mb-4">{section.subtitle}</p>}
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="whitespace-pre-wrap">{section.content}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Componente para Sección de Productos
function ProductSection({ section, anim, whatsapp }: { section: SiteSection; anim: any; whatsapp: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/products')
      .then(res => {
        setProducts(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const limit = section.settings?.limit || 4;
  const showPrice = section.settings?.showPrice !== false;
  const displayProducts = products.slice(0, limit);

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <motion.div {...anim} className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{section.title}</h2>
          {section.subtitle && <p className="text-lg text-muted-foreground">{section.subtitle}</p>}
        </motion.div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-4 max-w-7xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay productos destacados.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {displayProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                {...anim}
                transition={{ ...anim.transition, delay: idx * 0.1 }}
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-all">
                  <div className="h-48 bg-secondary/50 flex items-center justify-center rounded-t-lg">
                    {/* Placeholder image since we don't have real images yet */}
                    <ShoppingCart size={48} className="text-muted-foreground opacity-50" />
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{product.nombre}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {showPrice && (
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(product.precio_venta)}
                      </p>
                    )}
                    {product.presentacion && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.presentacion.nombre}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full gap-2 bg-green-600 hover:bg-green-700">
                      <a
                        href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=Hola, me interesa el producto: ${product.nombre}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <WhatsappLogo size={20} weight="fill" />
                        Consultar
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Componente para Sección de Planes
function PlansSection({ section, anim }: { section?: SiteSection; anim: any }) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    membershipsService.getPublishedPlans()
      .then(data => setPlans(data.slice(0, 3)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const title = section?.title || 'Nuestros Planes';
  const subtitle = section?.subtitle;

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <motion.div {...anim} className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </motion.div>

        {loading ? (
          <HomePlansGridSkeleton />
        ) : plans.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay planes disponibles</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                {...anim}
                transition={{ ...anim.transition, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <div className="text-4xl font-bold text-primary">
                        {formatCurrency(plan.price)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.durationDays} días
                      </p>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle size={20} className="text-green-600" weight="fill" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full mt-auto">
                      <Link to={`/p/planes/${plan.slug}`}>Ver Detalles</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg">
            <Link to="/p/planes">Ver Todos los Planes</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Componente para Sección de Blog
function BlogSection({ section, anim }: { section?: SiteSection; anim: any }) {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    blogService.getAllPosts()
      .then(response => {
        const data = response.data || response;
        if (Array.isArray(data)) {
          setPosts(
            data.filter((p: any) => p.status === 'published')
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 3)
          );
        }
      })
      .catch(err => console.error(err));
  }, []);

  if (posts.length === 0) return null;

  const title = section?.title || 'Últimas Publicaciones';
  const subtitle = section?.subtitle;

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <motion.div {...anim} className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              {...anim}
              transition={{ ...anim.transition, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                {post.coverImageUrl && (
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3 post-excerpt">
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
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg">
            <Link to="/p/blog">Ver Todo el Blog</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PublicHome() {
  const [config, setConfig] = useState<SiteConfig>(siteService.getDefaultConfig());
  const [publishedPlans, setPublishedPlans] = useState<MembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Load Config
      try {
        const loadedConfig = await siteService.getConfig();
        setConfig(loadedConfig);
      } catch (e) {
        console.error(e);
      }

      // Load Posts
      try {
        const response = await blogService.getAllPosts();
        const posts = response.data || response;
        const published = Array.isArray(posts)
          ? posts.filter((p: any) => p.status === 'published')
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
          : [];
        setRecentPosts(published);
      } catch (e) {
        console.error(e);
      }

      // Load Plans
      try {
        const plans = await membershipsService.getPublishedPlans();
        setPublishedPlans(plans.slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadData();
  }, []);

  const heroAnim = config.animationSettings?.enabled
    ? animations[config.animationSettings.heroAnimation as keyof typeof animations || 'fade']
    : animations.none;

  const cardAnim = config.animationSettings?.enabled
    ? animations[config.animationSettings.cardAnimation as keyof typeof animations || 'fade']
    : animations.none;

  const hasCustomSections = config.sections && config.sections.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      {/* Hero Section (Always fixed for now) */}
      <section className="relative">
        <HeroCarousel images={config.heroImages} autoPlayInterval={5000} />
        <div className="absolute inset-0 flex items-center justify-center">
          {/* ... Hero Content ... */}
          <div className="container mx-auto px-4 text-center">
            <motion.h1
              className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
              {...heroAnim}
            >
              {config.gymName}
            </motion.h1>
            <motion.p
              className="text-2xl md:text-4xl font-semibold mb-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              {...heroAnim}
              transition={{ ...heroAnim.transition, delay: 0.2 }}
            >
              {config.slogan}
            </motion.p>
            <motion.div
              className="flex flex-wrap gap-4 justify-center"
              {...heroAnim}
              transition={{ ...heroAnim.transition, delay: 0.4 }}
            >
              <Button asChild size="lg" className="gap-2 shadow-2xl">
                <Link to="/p/planes">
                  Ver Planes
                  <ArrowRight size={20} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/95 hover:bg-white shadow-2xl backdrop-blur-sm">
                <Link to="/p/contacto">Contacto</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Custom Sections Render Logic */}
      {hasCustomSections ? (
        <div className="flex flex-col">
          {config.sections!.map((section) => {
            if (section.type === 'text') {
              return <TextSection key={section.id} section={section} anim={cardAnim} />;
            }
            if (section.type === 'products') {
              return <ProductSection key={section.id} section={section} anim={cardAnim} whatsapp={config.whatsapp} />;
            }
            if (section.type === 'plans') {
              return <PlansSection key={section.id} section={section} anim={cardAnim} />;
            }
            if (section.type === 'blog_featured') {
              return <BlogSection key={section.id} section={section} anim={cardAnim} />;
            }
            if (section.type === 'testimonials') {
              return <TextSection key={section.id} section={section} anim={cardAnim} />;
            }
            // Fallback for others or unimplemented
            return null;
          })}
        </div>
      ) : (
        /* Default Layout Fallback */
        <>
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
              {loadingPlans ? (
                <HomePlansGridSkeleton />
              ) : publishedPlans.length === 0 ? (
                <p className="text-center text-muted-foreground">No hay planes disponibles</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                  {publishedPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      {...cardAnim}
                      transition={{ ...cardAnim.transition, delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                        <CardHeader>
                          <CardTitle className="text-2xl">{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-1 flex flex-col">
                          <div>
                            <div className="text-4xl font-bold text-primary">
                              {formatCurrency(plan.price)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {plan.durationDays} días
                            </p>
                          </div>

                          <ul className="space-y-3 flex-1">
                            {plan.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-600" weight="fill" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Button asChild className="w-full mt-auto">
                            <Link to={`/p/planes/${plan.slug}`}>Ver Detalles</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
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
                  {recentPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      {...cardAnim}
                      transition={{ ...cardAnim.transition, delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow h-full">
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
                    </motion.div>
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
        </>
      )}

      <PublicFooter />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { siteService } from '@/services/site.service';
import { Phone, WhatsappLogo, InstagramLogo, MapPin } from '@phosphor-icons/react';

export function PublicContact() {
  const config = siteService.getConfig();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        <section className="py-16 px-4 bg-gradient-to-br from-primary/10 to-accent/5">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Contáctanos</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Estamos aquí para ayudarte. ¡Escríbenos o visítanos!
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone size={24} className="text-primary" weight="fill" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Teléfono</h3>
                        <p className="text-muted-foreground">{config.phone}</p>
                        <Button asChild variant="link" className="p-0 h-auto">
                          <a href={`tel:${config.phone.replace(/\D/g, '')}`}>
                            Llamar ahora
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <WhatsappLogo size={24} className="text-green-600" weight="fill" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">WhatsApp</h3>
                        <p className="text-muted-foreground">{config.whatsapp}</p>
                        <Button asChild variant="link" className="p-0 h-auto">
                          <a
                            href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Enviar mensaje
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <InstagramLogo size={24} className="text-pink-600" weight="fill" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Instagram</h3>
                        <p className="text-muted-foreground">{config.instagram}</p>
                        <Button asChild variant="link" className="p-0 h-auto">
                          <a
                            href={`https://instagram.com/${config.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visitar perfil
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin size={24} className="text-blue-600" weight="fill" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Ubicación</h3>
                        <p className="text-muted-foreground">
                          Ciudad de Guatemala, Guatemala
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Horario: Lunes a Viernes 5:00 AM - 10:00 PM<br />
                          Sábados y Domingos 6:00 AM - 8:00 PM
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/10 to-accent/5">
                  <CardHeader>
                    <CardTitle>¿Prefieres escribirnos?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      La forma más rápida de contactarnos es por WhatsApp. Te responderemos en minutos.
                    </p>
                    <Button asChild className="w-full" size="lg">
                      <a
                        href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=Hola, me gustaría obtener más información sobre ${config.gymName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        <WhatsappLogo size={20} weight="fill" />
                        Chatear por WhatsApp
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre {config.gymName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{config.aboutText}</p>
                    
                    <div className="pt-4 space-y-3">
                      <h3 className="font-bold">Servicios</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Área de pesas y máquinas</li>
                        <li>• Clases grupales (Spinning, Zumba, Yoga)</li>
                        <li>• Entrenamientos personalizados</li>
                        <li>• Asesoría nutricional</li>
                        <li>• Vestuarios y duchas</li>
                        <li>• WiFi gratuito</li>
                        <li>• Estacionamiento</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preguntas Frecuentes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-bold mb-1">¿Necesito experiencia previa?</h4>
                      <p className="text-sm text-muted-foreground">
                        No, tenemos programas para todos los niveles, desde principiantes hasta avanzados.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">¿Puedo probar antes de inscribirme?</h4>
                      <p className="text-sm text-muted-foreground">
                        Sí, ofrecemos una clase de prueba gratuita. Contáctanos para agendar.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">¿Qué debo llevar?</h4>
                      <p className="text-sm text-muted-foreground">
                        Ropa deportiva cómoda, zapatos deportivos, toalla y botella de agua.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

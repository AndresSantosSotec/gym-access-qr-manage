import { useState, useEffect, useCallback } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

interface HeroCarouselProps {
  images: string[];
  autoPlayInterval?: number; // en milisegundos
  className?: string;
}

export function HeroCarousel({ images, autoPlayInterval = 5000, className = '' }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (isTransitioning || !images?.length) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [images?.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning || !images?.length) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [images?.length, isTransitioning]);

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Auto-play
  useEffect(() => {
    if (isPaused || !images || images.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused, images?.length, autoPlayInterval, goToNext]);

  // Si no hay imágenes, no renderizar nada
  if (!images || images.length === 0) {
    return (
      <div className={`relative w-full h-[500px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <p className="text-xl font-semibold">¡Bienvenido a GymFlow!</p>
          <p className="text-sm mt-2">Configura imágenes hero desde el panel de administración</p>
        </div>
      </div>
    );
  }

  // Si solo hay una imagen, mostrarla estática
  if (images.length === 1) {
    return (
      <div className={`relative w-full h-[500px] overflow-hidden ${className}`}>
        <img
          src={images[0]}
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-[500px] overflow-hidden group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Imágenes */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentIndex
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
              }`}
            style={{
              transitionProperty: 'opacity, transform',
            }}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ))}
      </div>

      {/* Controles de navegación */}
      <button
        onClick={goToPrevious}
        disabled={isTransitioning}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Imagen anterior"
      >
        <CaretLeft size={24} weight="bold" />
      </button>

      <button
        onClick={goToNext}
        disabled={isTransitioning}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Siguiente imagen"
      >
        <CaretRight size={24} weight="bold" />
      </button>

      {/* Indicadores (dots) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className={`transition-all duration-300 rounded-full disabled:cursor-not-allowed ${index === currentIndex
                ? 'w-10 h-3 bg-white'
                : 'w-3 h-3 bg-white/50 hover:bg-white/70'
              }`}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>

      {/* Indicador de pausa */}
      {isPaused && images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
          Pausado
        </div>
      )}

      {/* Contador */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full font-medium">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

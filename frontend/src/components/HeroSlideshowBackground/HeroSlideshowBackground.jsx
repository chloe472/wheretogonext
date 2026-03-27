import { useEffect, useState } from 'react';
import './HeroSlideshowBackground.css';

export default function HeroSlideshowBackground({
  images,
  intervalMs = 5000,
  fadeMs = 900,
  className = '',
  overlayClassName = '',
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!Array.isArray(images) || images.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [images, intervalMs]);

  if (!Array.isArray(images) || images.length === 0) return null;

  return (
    <div className={`hero-slideshow ${className}`.trim()} aria-hidden="true">
      {images.map((image, idx) => (
        <div
          key={image}
          className={`hero-slideshow__image ${idx === activeImageIndex ? 'hero-slideshow__image--active' : ''}`}
          style={{ backgroundImage: `url(${image})`, transitionDuration: `${fadeMs}ms` }}
        />
      ))}
      <div className={`hero-slideshow__overlay ${overlayClassName}`.trim()} />
    </div>
  );
}

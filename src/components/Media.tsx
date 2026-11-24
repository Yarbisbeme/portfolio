"use client";

import { useEffect, useRef, useState } from "react";

const WIDTHS = [640, 1024, 1600];

type Props = {
  name: string;
  alt: string;
  loop?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** false = mostrar solo la imagen (p. ej. cuando está oculta tras un crossfade). */
  play?: boolean;
};

/**
 * Imagen fija responsiva (AVIF → WebP). Si hay `loop`, monta un <video> silencioso
 * solo cuando entra en pantalla y solo si el usuario no pidió reducir el movimiento.
 */
export function Media({ name, alt, loop, sizes = "(min-width: 1024px) 33vw, 100vw", priority, className = "", play = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [playVideo, setPlayVideo] = useState(false);

  useEffect(() => {
    if (!loop || !ref.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlayVideo(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [loop]);

  const srcset = (ext: string) => WIDTHS.map((w) => `/media/${name}-${w}.${ext} ${w}w`).join(", ");

  return (
    <div ref={ref} className={`relative overflow-hidden bg-panel ${className}`}>
      <picture>
        <source type="image/avif" srcSet={srcset("avif")} sizes={sizes} />
        <source type="image/webp" srcSet={srcset("webp")} sizes={sizes} />
        <img
          src={`/media/${name}-1024.webp`}
          alt={alt}
          width={1600}
          height={1200}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className="block h-full w-full object-cover"
        />
      </picture>
      {playVideo && play && loop ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={loop}
          poster={`/media/${name}-1024.webp`}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

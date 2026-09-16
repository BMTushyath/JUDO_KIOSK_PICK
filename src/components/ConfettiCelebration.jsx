import React, { useEffect, useRef } from 'react';

/**
 * Lightweight, continuous 60fps canvas confetti & party-popper celebration.
 * Loops indefinitely until unmounted, automatically cleaning up all resources.
 */
export default function ConfettiCelebration() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Vibrant celebratory color palette (Cyan, Gold, Emerald, Coral, Magenta, White)
    const colors = [
      '#00b4d8', '#38bdf8', '#fbbf24', '#f59e0b',
      '#10b981', '#34d399', '#f43f5e', '#ec4899',
      '#a855f7', '#ffffff'
    ];

    const PARTICLE_COUNT = 85;
    const particles = [];

    const createParticle = (initial = false) => ({
      x: Math.random() * width,
      y: initial ? Math.random() * height : -20 - Math.random() * 50,
      size: 7 + Math.random() * 9,
      aspect: 0.4 + Math.random() * 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2.2 + Math.random() * 3.8,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 7,
      flutter: Math.random() * Math.PI * 2,
      vFlutter: 0.04 + Math.random() * 0.06
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(true));
    }

    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 16.66, 2.0); // normalize frame rate
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx * dt + Math.sin(p.flutter) * 0.8;
        p.y += p.vy * dt;
        p.flutter += p.vFlutter * dt;
        p.rotation += p.vRot * dt;

        // Draw individual confetti piece
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        const w = p.size;
        const h = p.size * p.aspect * Math.cos(p.flutter);

        ctx.fillRect(-w / 2, -h / 2, w, Math.abs(h));
        ctx.restore();

        // Recycle particle when it moves out of viewport so animation continues indefinitely
        if (p.y > height + 20 || p.x < -30 || p.x > width + 30) {
          particles[i] = createParticle(false);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999
      }}
      aria-hidden="true"
    />
  );
}

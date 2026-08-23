/**
 * PrincessCycle - Dreamy Lilac Fairy Sparkles & Petals Engine
 * Pure Canvas interactive floating stardust, petals and sparkle bursts for artistic flair
 */

export class FairySparkles {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationFrame = null;
    this.enabled = true;
  }

  init() {
    this.canvas = document.getElementById('sparkles-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'sparkles-canvas';
      this.canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0.65;';
      document.body.prepend(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Respect user reduced-motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Spawn initial gentle floating particles
    for (let i = 0; i < 20; i++) {
      this.spawnParticle();
    }

    this.animate();

    // Click sparkle burst
    document.addEventListener('pointerdown', (e) => {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.burst(e.clientX, e.clientY, 8);
    }, { passive: true });
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawnParticle() {
    const colors = ['#C4B5FD', '#DDD6FE', '#FBCFE8', '#FDE68A', '#A78BFA'];
    this.particles.push({
      x: Math.random() * (this.canvas ? this.canvas.width : 800),
      y: Math.random() * (this.canvas ? this.canvas.height : 600),
      size: Math.random() * 3.5 + 1.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -(Math.random() * 0.5 + 0.2),
      opacity: Math.random() * 0.6 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      angle: Math.random() * Math.PI * 2
    });
  }

  burst(x, y, count = 10) {
    const colors = ['#C4B5FD', '#EC4899', '#FDE047', '#7C3AED', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      const speed = Math.random() * 3 + 1;
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x,
        y,
        size: Math.random() * 4 + 2,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        opacity: 1,
        fadeSpeed: Math.random() * 0.03 + 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        isBurst: true
      });
    }
  }

  animate() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.isBurst) {
        p.opacity -= p.fadeSpeed;
        p.speedX *= 0.94;
        p.speedY *= 0.94;
        if (p.opacity <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
      } else {
        p.angle += p.twinkleSpeed;
        if (p.y < -10) {
          p.y = this.canvas.height + 10;
          p.x = Math.random() * this.canvas.width;
        }
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
      this.ctx.fillStyle = p.color;

      // Draw 4-point sparkle star
      this.ctx.translate(p.x, p.y);
      this.ctx.beginPath();
      const s = p.size;
      this.ctx.moveTo(0, -s);
      this.ctx.quadraticCurveTo(0, 0, s, 0);
      this.ctx.quadraticCurveTo(0, 0, 0, s);
      this.ctx.quadraticCurveTo(0, 0, -s, 0);
      this.ctx.quadraticCurveTo(0, 0, 0, -s);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
}

export const fairySparkles = new FairySparkles();

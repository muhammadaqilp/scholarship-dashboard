// Ported as-is from the original scholarship-quest.html canvas confetti burst.
export function burstConfetti(canvas: HTMLCanvasElement): void {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.scale(dpr, dpr);

  const colors = ["#3E8FD9", "#E8453A", "#E85C9E", "#43A047"];
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rot: number;
    vrot: number;
    life: number;
  }
  const particles: Particle[] = [];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 140,
      y: window.innerHeight * 0.28,
      vx: (Math.random() - 0.5) * 9,
      vy: -6 - Math.random() * 6,
      size: 4 + Math.random() * 5,
      color: colors[i % colors.length],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      life: 0,
    });
  }
  let frame = 0;
  function tick() {
    frame++;
    ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = false;
    particles.forEach((p) => {
      p.vy += 0.28;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life++;
      if (p.y < window.innerHeight + 20) alive = true;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.globalAlpha = Math.max(0, 1 - p.life / 90);
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    });
    if (alive && frame < 110) {
      requestAnimationFrame(tick);
    } else {
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }
  requestAnimationFrame(tick);
}

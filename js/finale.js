(() => {
  const finale = document.getElementById('finale');
  const canvas = document.getElementById('finale-canvas');
  if (!finale || !canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = ['232, 216, 205', '214, 134, 123', '190, 43, 50', '244, 237, 230'];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let visible = false;
  let running = false;
  let rafId = null;
  let lastTime = 0;
  let progress = reducedMotion ? 1 : 0;
  let targetProgress = reducedMotion ? 1 : 0;

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function createParticles() {
    const count = width < 700 ? 64 : Math.min(170, Math.floor(width / 8));
    const centerX = width * 0.5;
    const centerY = height * 0.43;
    const radiusX = Math.min(width * 0.3, 520);
    const radiusY = Math.min(height * 0.12, 120);

    particles = Array.from({ length: count }, (_, index) => {
      const startAngle = Math.random() * Math.PI * 2;
      const startRadius = Math.max(width, height) * (0.36 + Math.random() * 0.44);
      const targetAngle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.24;
      const scatter = Math.random();
      const ellipseScale = 0.55 + scatter * 0.7;

      return {
        startX: centerX + Math.cos(startAngle) * startRadius,
        startY: centerY + Math.sin(startAngle) * startRadius * 0.72,
        targetX: centerX + Math.cos(targetAngle) * radiusX * ellipseScale,
        targetY: centerY + Math.sin(targetAngle) * radiusY * ellipseScale + (Math.random() - 0.5) * 36,
        size: Math.random() * 1.25 + 0.35,
        phase: Math.random() * Math.PI * 2,
        speed: 0.00025 + Math.random() * 0.00045,
        delay: Math.random() * 0.28,
        alpha: 0.2 + Math.random() * 0.48,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });
  }

  function resizeCanvas() {
    const rect = finale.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
    if (!running) draw(performance.now());
  }

  function draw(time) {
    if (!visible && !reducedMotion) {
      running = false;
      rafId = null;
      return;
    }

    if (!lastTime) lastTime = time;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    progress += (targetProgress - progress) * (reducedMotion ? 1 : 0.055);

    context.clearRect(0, 0, width, height);

    const centerX = width * 0.5;
    const centerY = height * 0.43;
    const ambientGlow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width * 0.3, 220));
    ambientGlow.addColorStop(0, `rgba(146, 16, 26, ${0.055 * progress})`);
    ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = ambientGlow;
    context.fillRect(0, 0, width, height);

    particles.forEach((particle) => {
      const local = Math.min(1, Math.max(0, (progress - particle.delay) / (1 - particle.delay)));
      const eased = easeOutCubic(local);
      const float = reducedMotion ? 0 : (1 - eased) * 7 + 2;
      const driftX = Math.sin(time * particle.speed + particle.phase) * float;
      const driftY = Math.cos(time * particle.speed * 0.8 + particle.phase) * float;
      const x = particle.startX + (particle.targetX - particle.startX) * eased + driftX;
      const y = particle.startY + (particle.targetY - particle.startY) * eased + driftY;
      const alpha = particle.alpha * (0.35 + eased * 0.65);

      context.beginPath();
      context.arc(x, y, particle.size * (0.7 + eased * 0.6), 0, Math.PI * 2);
      context.fillStyle = `rgba(${particle.color}, ${alpha})`;
      context.fill();

      if (eased > 0.7 && particle.size > 1.1) {
        context.beginPath();
        context.arc(x, y, particle.size * 3.5, 0, Math.PI * 2);
        context.fillStyle = `rgba(${particle.color}, ${alpha * 0.045})`;
        context.fill();
      }
    });

    if (!reducedMotion) {
      rafId = requestAnimationFrame(draw);
    } else {
      running = false;
      rafId = null;
    }
  }

  function start() {
    if (running || reducedMotion) return;
    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(draw);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) start();
    }, { threshold: 0.01 });
    observer.observe(finale);
  } else {
    visible = true;
    start();
  }

  if (window.gsap && window.ScrollTrigger && !reducedMotion) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.create({
      trigger: finale,
      start: 'top 88%',
      end: 'center 54%',
      onUpdate: (self) => {
        targetProgress = self.progress;
      }
    });
  } else {
    targetProgress = 1;
    progress = 1;
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) start();
  });

  resizeCanvas();
  if (reducedMotion) draw(0);
})();

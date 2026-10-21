(() => {
  const journey = document.getElementById('journey');
  const chapters = [...document.querySelectorAll('.chapter')];
  const scenes = [...document.querySelectorAll('.stage-scene')];
  const progressBar = document.getElementById('stage-progress');
  const currentLabel = document.getElementById('stage-current');
  const sceneLabel = document.getElementById('stage-scene-label');
  const statusLabel = document.getElementById('stage-status-label');

  if (!journey || !chapters.length || !scenes.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const statusNames = ['CURIOSITY', 'ATTEMPTS', 'BREAKTHROUGH', 'EXPERIENCE', 'ONGOING'];
  const attempts = [...document.querySelectorAll('.jarvis-attempt')];
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
  let activeIndex = -1;
  let jarvisPlayed = false;

  function setJarvisFinalState() {
    if (!attempts.length) return;
    attempts[0]?.classList.add('is-failed');
    attempts[1]?.classList.add('is-failed');
    attempts[2]?.classList.add('is-active');
  }

  function playJarvisSequence() {
    if (!attempts.length) return;
    if (jarvisPlayed) return;
    jarvisPlayed = true;

    if (reducedMotion || !hasGsap) {
      setJarvisFinalState();
      return;
    }

    attempts.forEach((attempt) => attempt.classList.remove('is-failed', 'is-active'));
    window.gsap.timeline({ delay: 0.3 })
      .add(() => attempts[0].classList.add('is-failed'))
      .add(() => attempts[1].classList.add('is-failed'), '+=0.9')
      .add(() => attempts[2].classList.add('is-active'), '+=0.9');
  }

  function setActive(index) {
    if (index < 0 || index === activeIndex) return;
    activeIndex = index;

    chapters.forEach((chapter, chapterIndex) => {
      chapter.classList.toggle('is-active', chapterIndex === index);
    });

    scenes.forEach((scene, sceneIndex) => {
      const isActive = sceneIndex === index;
      scene.classList.toggle('is-active', isActive);
      scene.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    if (currentLabel) currentLabel.textContent = String(index + 1).padStart(2, '0');
    if (sceneLabel) sceneLabel.textContent = statusNames[index] || '';
    if (statusLabel) statusLabel.textContent = statusNames[index] || 'ARCHIVE';

    if (index === 2) playJarvisSequence();
  }

  function updateProgress(value) {
    if (!progressBar) return;
    const clamped = Math.min(1, Math.max(0, value));
    progressBar.style.transform = `scaleX(${0.2 + clamped * 0.8})`;
  }

  function syncInitialChapter() {
    const midpoint = window.innerHeight * 0.5;
    let nearest = 0;
    let nearestDistance = Infinity;

    chapters.forEach((chapter, index) => {
      const rect = chapter.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height * 0.5 - midpoint);
      if (rect.bottom > window.innerHeight * 0.2 && rect.top < window.innerHeight * 0.8 && distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });

    setActive(nearest);
  }

  if (hasGsap && !reducedMotion) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    chapters.forEach((chapter, index) => {
      ScrollTrigger.create({
        trigger: chapter,
        start: 'top 64%',
        end: 'bottom 36%',
        onEnter: () => setActive(index),
        onEnterBack: () => setActive(index)
      });
    });

    ScrollTrigger.create({
      trigger: '.journey-experience',
      start: 'top 45%',
      end: 'bottom 60%',
      onUpdate: (self) => updateProgress(self.progress)
    });

    syncInitialChapter();

    const refresh = () => {
      ScrollTrigger.refresh();
      syncInitialChapter();
    };

    document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });
  } else {
    setJarvisFinalState();
    syncInitialChapter();

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = chapters.indexOf(entry.target);
            setActive(index);
            updateProgress((index + 1) / chapters.length);
          }
        });
      }, { rootMargin: '-30% 0px -45% 0px', threshold: 0.01 });

      chapters.forEach((chapter) => observer.observe(chapter));
    }
  }

  const stage = document.getElementById('journey-stage');
  const stageCanvas = document.getElementById('journey-canvas');
  if (!stage || !stageCanvas) return;

  const context = stageCanvas.getContext('2d');
  if (!context) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let dust = [];
  let stageVisible = false;
  let running = false;
  let rafId = null;
  let lastTime = 0;

  function createDust() {
    const count = width < 700 ? 28 : 52;
    dust = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.1 + 0.25,
      speed: Math.random() * 0.12 + 0.025,
      drift: Math.random() * 0.08 - 0.04,
      alpha: Math.random() * 0.3 + 0.08,
      phase: Math.random() * Math.PI * 2
    }));
  }

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    stageCanvas.width = Math.floor(width * dpr);
    stageCanvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createDust();
    if (!running) draw(performance.now());
  }

  function draw(time) {
    if (!stageVisible && !reducedMotion) {
      running = false;
      rafId = null;
      return;
    }

    if (!lastTime) lastTime = time;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    context.clearRect(0, 0, width, height);

    dust.forEach((particle) => {
      if (!reducedMotion) {
        particle.y -= particle.speed * 60 * delta;
        particle.x += particle.drift * 60 * delta;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
      }

      const pulse = reducedMotion ? 0.7 : 0.65 + Math.sin(time * 0.001 + particle.phase) * 0.35;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(214, 138, 125, ${particle.alpha * pulse})`;
      context.fill();
    });

    if (!reducedMotion) {
      rafId = requestAnimationFrame(draw);
    } else {
      running = false;
      rafId = null;
    }
  }

  function startDust() {
    if (running || reducedMotion) return;
    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(draw);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      stageVisible = entries[0]?.isIntersecting ?? false;
      if (stageVisible) startDust();
    }, { threshold: 0.01 });
    observer.observe(stage);
  } else {
    stageVisible = true;
    startDust();
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && stageVisible) startDust();
  });

  resizeCanvas();
  if (reducedMotion) draw(0);
  else startDust();

  window.addEventListener('load', () => {
    if (hasGsap && !reducedMotion) window.ScrollTrigger.refresh();
  }, { once: true });
})();

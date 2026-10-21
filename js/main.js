(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const header = document.getElementById('site-header');
  const progress = document.getElementById('scroll-progress');
  const navLinks = [...document.querySelectorAll('.desktop-nav .nav-link')];
  const navSections = navLinks
    .map((link) => {
      const target = document.querySelector(link.getAttribute('href'));
      return target ? { link, section: target } : null;
    })
    .filter(Boolean);

  function initHeroAnimation() {
    if (reducedMotion || !window.gsap) return;

    const { gsap, ScrollTrigger } = window;
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('.hero-title-line',
        { yPercent: 115, rotate: 2.5 },
        { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.14 },
        0.15
      )
      .fromTo('[data-hero]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 },
        0.55
      )
      .fromTo('.scroll-cue',
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8 },
        1.1
      );

    if (ScrollTrigger) {
      gsap.to('.hero-content', {
        y: -60,
        opacity: 0.18,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6
        }
      });

      gsap.to('.hero-foot, .hero-hud', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: '55% top',
          scrub: true
        }
      });
    }
  }

  function initReveals() {
    const elements = [...document.querySelectorAll('.reveal')];
    if (!elements.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-revealed'));
      return;
    }

    elements.forEach((element) => {
      const siblings = [...(element.parentElement?.children || [])].filter((child) => child.classList.contains('reveal'));
      const index = Math.max(0, siblings.indexOf(element));
      element.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 80}ms`);
      element.classList.add('reveal-pending');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        element.classList.remove('reveal-pending');
        element.classList.add('is-revealed');
        observer.unobserve(element);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -8% 0px'
    });

    elements.forEach((element) => observer.observe(element));
  }

  function initMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.getElementById('mobile-menu');
    const main = document.getElementById('main');
    const links = [...document.querySelectorAll('.mobile-link')];
    if (!toggle || !menu) return;

    let isOpen = false;
    let lastFocused = null;

    const focusableSelector = 'a[href], button:not([disabled])';

    function getFocusable() {
      return [toggle, ...menu.querySelectorAll(focusableSelector)].filter((element) => element.offsetParent !== null);
    }

    function openMenu() {
      if (isOpen) return;
      isOpen = true;
      lastFocused = document.activeElement;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.add('is-open');
      document.body.classList.add('menu-open');
      if (main) main.inert = true;
      window.setTimeout(() => links[0]?.focus(), 180);
    }

    function closeMenu(returnFocus = true) {
      if (!isOpen) return;
      isOpen = false;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      menu.setAttribute('aria-hidden', 'true');
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      if (main) main.inert = false;
      if (returnFocus) {
        (lastFocused instanceof HTMLElement ? lastFocused : toggle).focus();
      }
    }

    toggle.addEventListener('click', () => {
      if (isOpen) closeMenu();
      else openMenu();
    });

    links.forEach((link) => {
      link.addEventListener('click', () => closeMenu(false));
    });

    menu.querySelectorAll('a[href^="http"]').forEach((link) => {
      link.addEventListener('click', () => closeMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960 && isOpen) closeMenu(false);
    }, { passive: true });
  }

  function initScrollState() {
    let ticking = false;

    function update() {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;

      if (progress) progress.style.transform = `scaleX(${ratio})`;
      header?.classList.toggle('is-scrolled', scrollY > 24);

      const marker = scrollY + window.innerHeight * 0.36;
      let activeEntry = null;
      navSections.forEach((entry) => {
        const top = entry.section.getBoundingClientRect().top + scrollY;
        if (top <= marker) activeEntry = entry;
      });

      if (scrollY < 80) activeEntry = null;

      navLinks.forEach((link) => {
        if (activeEntry && link === activeEntry.link) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });

      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  function initTilt() {
    if (!finePointer || reducedMotion) return;

    document.querySelectorAll('[data-tilt]').forEach((element) => {
      const max = Number(element.dataset.tiltMax) || 4;
      let rafId = null;
      let latestEvent = null;

      function applyTilt() {
        if (!latestEvent) return;
        if (element.classList.contains('reveal-pending')) {
          rafId = null;
          return;
        }
        const rect = element.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (latestEvent.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (latestEvent.clientY - rect.top) / rect.height));
        const rotateX = (0.5 - y) * max * 2;
        const rotateY = (x - 0.5) * max * 2;

        element.style.setProperty('--tilt-x', `${x * 100}%`);
        element.style.setProperty('--tilt-y', `${y * 100}%`);
        element.style.transform = `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        rafId = null;
      }

      element.addEventListener('pointerenter', () => {
        element.classList.add('is-tilting');
      });

      element.addEventListener('pointermove', (event) => {
        latestEvent = event;
        if (!rafId) rafId = requestAnimationFrame(applyTilt);
      }, { passive: true });

      element.addEventListener('pointerleave', () => {
        latestEvent = null;
        element.classList.remove('is-tilting');
        element.style.transform = '';
        element.style.removeProperty('--tilt-x');
        element.style.removeProperty('--tilt-y');
      });
    });
  }

  function initPointerLight() {
    if (!finePointer || reducedMotion) return;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let rafId = null;

    window.addEventListener('pointermove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${pointerX}px`);
        document.documentElement.style.setProperty('--pointer-y', `${pointerY}px`);
        document.body.classList.add('has-pointer');
        rafId = null;
      });
    }, { passive: true });
  }

  function initCopyButton() {
    const button = document.getElementById('copy-github');
    const status = document.getElementById('copy-status');
    const label = button?.querySelector('.copy-label');
    if (!button || !status || !label) return;

    let resetTimer = null;

    async function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (!copied) throw new Error('Copy failed');
    }

    button.addEventListener('click', async () => {
      try {
        await copyText(button.dataset.copy || '');
        label.textContent = 'Copied';
        status.textContent = 'GitHub URL copied to your clipboard.';
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          label.textContent = 'Copy GitHub URL';
          status.textContent = '';
        }, 2800);
      } catch {
        status.textContent = 'Clipboard unavailable — use the GitHub link above.';
      }
    });
  }

  function initScenes() {
    if (reducedMotion) return;

    const start = () => {
      import('./scenes.js')
        .then((module) => module.initScenes())
        .catch(() => {
          document.body.classList.remove('webgl-ready', 'about-webgl-ready');
        });
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: 900 });
    } else {
      window.setTimeout(start, 200);
    }
  }

  initHeroAnimation();
  initReveals();
  initMenu();
  initScrollState();
  initTilt();
  initPointerLight();
  initCopyButton();
  initScenes();

  if (window.ScrollTrigger) {
    window.addEventListener('load', () => {
      window.ScrollTrigger.refresh();
    }, { once: true });
  }

  document.fonts?.ready.then(() => {
    window.ScrollTrigger?.refresh();
  });
})();

/* ============================================================
   Infinity Women's Fitness — premium motion layer
   Preloader, Lenis smooth scroll, GSAP ScrollTrigger reveals,
   counters, parallax and custom cursor.
   ============================================================ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var preloader = document.getElementById('preloader');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function killPreloader() {
    if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
    docEl.classList.remove('is-loading');
  }

  /* If GSAP failed to load (offline / blocked CDN) the site must
     still be fully usable: drop the overlay and bail out. */
  if (!window.gsap || !window.ScrollTrigger || reduce) {
    killPreloader();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Smooth scrolling (Lenis) ---------------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Anchor links glide with an offset for the fixed nav */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------------- Hero intro (paused, played after preloader) ---------------- */
  var intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  intro
    .from(['.hero-line', '.hero-line2'], { scaleY: 0, transformOrigin: 'top', duration: 1.4, ease: 'power2.out' }, 0)
    .from('.hero-eyebrow', { opacity: 0, y: 26, duration: 0.8 }, 0.15)
    .from('.hero-title .line', { yPercent: 115, duration: 1.15, ease: 'power4.out', stagger: 0.14 }, 0.3)
    .from('.hero-sub', { opacity: 0, y: 24, duration: 0.9 }, 0.85)
    .from('.hero-btns > *', { opacity: 0, y: 24, duration: 0.8, stagger: 0.1 }, 1.0)
    .from('.hero-scroll', { opacity: 0, duration: 1 }, 1.4);

  /* ---------------- Preloader ---------------- */
  docEl.classList.add('is-loading');
  if (lenis) lenis.stop();

  function releasePage() {
    docEl.classList.remove('is-loading');
    if (lenis) lenis.start();
  }

  if (preloader) {
    var logo = document.getElementById('preloaderLogo');
    if (logo) {
      var letters = logo.textContent.split('');
      logo.textContent = '';
      letters.forEach(function (ch) {
        var s = document.createElement('span');
        s.textContent = ch;
        logo.appendChild(s);
      });
    }
    gsap.timeline()
      .to('.preloader-logo span', { y: 0, opacity: 1, duration: 0.7, stagger: 0.055, ease: 'power3.out' }, 0.15)
      .to('.preloader-bar span', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, 0.4)
      .to(preloader, { yPercent: -100, duration: 0.95, ease: 'power4.inOut' }, 1.55)
      .add(function () { releasePage(); intro.play(); }, 1.75)
      .set(preloader, { display: 'none' });
  } else {
    releasePage();
    intro.play();
  }

  /* Safety net: never leave the overlay stuck */
  setTimeout(function () {
    if (preloader && preloader.style.display !== 'none') {
      gsap.to(preloader, { autoAlpha: 0, duration: 0.4, onComplete: killPreloader });
      releasePage();
      if (intro.progress() === 0) intro.play();
    }
  }, 6000);

  /* ---------------- Section header reveals ---------------- */
  ['.tag', '.section-title', '.section-body'].forEach(function (sel, idx) {
    document.querySelectorAll(sel).forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 34 + idx * 6,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  });

  /* ---------------- Staggered card / list entrances ---------------- */
  [
    { sel: '.stat', y: 40, stagger: 0.12 },
    { sel: '.pill', y: 20, stagger: 0.06 },
    { sel: '.service-card', y: 60, stagger: 0.09 },
    { sel: '.plan-card', y: 60, stagger: 0.1 },
    { sel: '.why-item', y: 40, stagger: 0.12 },
    { sel: '.contact-row', y: 30, stagger: 0.12 },
    { sel: '.form > div, .form .form-submit', y: 30, stagger: 0.1 }
  ].forEach(function (cfg) {
    var items = gsap.utils.toArray(cfg.sel);
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: cfg.y });
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: cfg.stagger, ease: 'power3.out', overwrite: true });
      }
    });
  });

  /* Banners in the pricing section */
  ['.launch-banner', '.reg-banner'].forEach(function (sel) {
    var el = document.querySelector(sel);
    if (!el) return;
    gsap.from(el, {
      opacity: 0, y: 60, scale: 0.97, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  /* Footer */
  gsap.from('footer > *', {
    opacity: 0, y: 26, duration: 0.9, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: 'footer', start: 'top 95%', once: true }
  });

  /* ---------------- Image reveals + parallax ---------------- */
  ['.about-img', '.why-img'].forEach(function (sel) {
    var wrap = document.querySelector(sel);
    if (!wrap) return;
    var img = wrap.querySelector('img');
    gsap.set(wrap, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.to(wrap, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.25,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: wrap, start: 'top 82%', once: true }
    });
    if (img) {
      gsap.set(img, { scale: 1.25 });
      gsap.to(img, {
        scale: 1.12, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: wrap, start: 'top 82%', once: true }
      });
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  });

  /* ---------------- Hero parallax out ---------------- */
  gsap.to('.hero-content', {
    yPercent: -20, opacity: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true }
  });

  /* ---------------- Animated stat counters ---------------- */
  document.querySelectorAll('.stat-num').forEach(function (el) {
    var m = el.textContent.trim().match(/^(\d+)(.*)$/);
    if (!m) {
      /* the infinity symbol spins in */
      gsap.from(el, {
        scale: 0, rotation: -180, duration: 1.1, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
      return;
    }
    var end = parseInt(m[1], 10), suffix = m[2], obj = { v: 0 };
    el.textContent = '0' + suffix;
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
    });
  });

  /* ---------------- Nav: hide on scroll down, show on scroll up ---------------- */
  var nav = document.getElementById('navbar');
  var lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY || 0;
    if (nav) nav.classList.toggle('nav-hidden', y > lastY && y > 420);
    lastY = y;
  }, { passive: true });

  /* ---------------- Custom cursor (fine pointers only) ---------------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    docEl.classList.add('has-cursor');
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });
    var dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2' });
    var dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2' });
    window.addEventListener('mousemove', function (e) {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });
    var HOVER = 'a, button, input, textarea, .pill, .service-card, .plan-card, .why-item';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(HOVER)) docEl.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(HOVER)) docEl.classList.remove('cursor-hover');
    });
  }

  /* Recalculate trigger positions once images/fonts have loaded */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

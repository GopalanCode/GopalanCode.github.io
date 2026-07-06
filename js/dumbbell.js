/* ============================================================
   Infinity Women's Fitness — the golden dumbbell
   A solid-gold 3D dumbbell rotating like a jewellery showcase.
   Grab it and throw it into a spin — it keeps the momentum and
   settles back to a slow turntable. Uses the site's Three.js.
   ============================================================ */
(function () {
  'use strict';

  var container = document.querySelector('.dumbbell-divider');
  if (!container) return;
  var canvas = container.querySelector('canvas');
  var hint = container.querySelector('.spin-hint');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fallback() { container.classList.add('no3d'); }
  if (!window.THREE || !canvas) { fallback(); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) { fallback(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(33, 2, 0.1, 50);
  camera.position.set(0, 0.4, 7.3);
  camera.lookAt(0, -0.14, 0);

  /* --- a tiny fake photo studio so the gold has something to reflect --- */
  function softbox(x, cx, w, top, hgt, alpha) {
    var g = x.createLinearGradient(cx - w, 0, cx + w, 0);
    g.addColorStop(0, 'rgba(255,235,190,0)');
    g.addColorStop(0.5, 'rgba(255,235,190,' + alpha + ')');
    g.addColorStop(1, 'rgba(255,235,190,0)');
    x.fillStyle = g;
    x.fillRect(cx - w, top, w * 2, hgt);
  }
  function makeEnv() {
    var faces = [];
    for (var i = 0; i < 6; i++) {
      var c = document.createElement('canvas');
      c.width = c.height = 128;
      var x = c.getContext('2d');
      var g = x.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, '#8a7136');
      g.addColorStop(0.5, '#2b2110');
      g.addColorStop(1, '#0a0805');
      x.fillStyle = g;
      x.fillRect(0, 0, 128, 128);
      if (i !== 3) {                       /* every face but the floor */
        softbox(x, 30 + i * 9, 16, 10, 90, 1);
        softbox(x, 92 - i * 6, 11, 22, 70, 0.85);
      }
      if (i === 2) {                       /* bright overhead light */
        var rg = x.createRadialGradient(64, 64, 4, 64, 64, 62);
        rg.addColorStop(0, 'rgba(255,246,220,1)');
        rg.addColorStop(1, 'rgba(255,246,220,0)');
        x.fillStyle = rg;
        x.fillRect(0, 0, 128, 128);
      }
      faces.push(c);
    }
    var tex = new THREE.CubeTexture(faces);
    tex.needsUpdate = true;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  scene.environment = makeEnv();

  var key = new THREE.DirectionalLight(0xfff1d6, 1.5);
  key.position.set(5, 7, 5);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0xC9A84C, 0.65);
  rim.position.set(-6, 2, -5);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xfff6e0, 0.3));

  var gold = new THREE.MeshStandardMaterial({
    color: 0xe3bd68, metalness: 1, roughness: 0.17, envMapIntensity: 1.6
  });
  var goldGrip = new THREE.MeshStandardMaterial({
    color: 0x94793a, metalness: 0.95, roughness: 0.45, envMapIntensity: 1
  });

  /* --- build the dumbbell along the X axis --- */
  var tilt = new THREE.Group();
  var spin = new THREE.Group();
  tilt.add(spin);
  scene.add(tilt);
  tilt.rotation.x = 0.3;
  spin.scale.setScalar(0.95);

  function cyl(r, len, mat, x, segments) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, segments || 48), mat);
    m.rotation.z = Math.PI / 2;
    m.position.x = x;
    spin.add(m);
    return m;
  }
  cyl(0.085, 6.9, gold, 0);                 /* bar */
  cyl(0.105, 1.7, goldGrip, 0);             /* knurled grip */
  cyl(0.115, 0.05, gold, -0.88); cyl(0.115, 0.05, gold, 0.88);   /* grip rings */
  [-1, 1].forEach(function (s) {
    cyl(0.19, 0.22, gold, s * 2.05);        /* collar */
    cyl(1.02, 0.34, gold, s * 2.38, 64);    /* big plate */
    cyl(0.83, 0.28, gold, s * 2.74, 64);    /* medium plate */
    cyl(0.63, 0.24, gold, s * 3.04, 64);    /* small plate */
    cyl(0.15, 0.2, gold, s * 3.28);         /* end nut */
  });

  /* --- interaction: turntable with throwable momentum --- */
  var BASE = 0.005;
  var velY = BASE, dragging = false, lastX = 0, lastY = 0, tiltTarget = 0.3;
  var visible = false, rafId = null, lastT = 0;

  canvas.addEventListener('pointerdown', function (e) {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    if (hint && !hint.dataset.gone) { hint.dataset.gone = '1'; hint.style.opacity = '0'; }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    spin.rotation.y += dx * 0.012;
    velY = dx * 0.012;
    tiltTarget = Math.max(0.05, Math.min(0.65, tiltTarget + dy * 0.004));
    lastX = e.clientX; lastY = e.clientY;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    canvas.addEventListener(ev, function () { dragging = false; });
  });

  function resize() {
    var r = container.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  function frame(t) {
    rafId = null;
    if (!visible) return;
    var dt = Math.min(3, (t - lastT) / 16.7 || 1);
    lastT = t;
    if (!dragging) {
      spin.rotation.y += velY * dt;
      velY = velY * 0.985 + BASE * 0.015;   /* momentum decays to slow showcase */
      tiltTarget += (0.3 - tiltTarget) * 0.02;
    }
    tilt.rotation.x += (tiltTarget - tilt.rotation.x) * 0.12;
    tilt.position.y = Math.sin(t * 0.0008) * 0.08;   /* gentle float */
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }
  function wake() { if (visible && rafId === null) rafId = requestAnimationFrame(frame); }

  if (reduce) {
    spin.rotation.y = 0.7;
    renderer.render(scene, camera);
    if (hint) hint.style.display = 'none';
    return;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      wake();
    }, { rootMargin: '80px' }).observe(container);
  } else {
    visible = true;
    wake();
  }
})();

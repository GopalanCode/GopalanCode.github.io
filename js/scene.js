/* ============================================================
   Infinity Women's Fitness — immersive 3D background
   A particle "infinity" symbol (lemniscate) that flows, breathes,
   follows the mouse and rotates/dives with scroll, plus ambient
   gold dust drifting behind the whole page.
   ============================================================ */
(function () {
  'use strict';

  if (!window.THREE) return;
  var canvas = document.getElementById('webgl');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 9;

  /* Soft round glow sprite so particles look like light, not squares */
  function makeSprite() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,235,190,0.8)');
    g.addColorStop(0.7, 'rgba(201,168,76,0.25)');
    g.addColorStop(1, 'rgba(201,168,76,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.CanvasTexture(c);
    return tex;
  }
  var sprite = makeSprite();

  var GOLD = new THREE.Color('#C9A84C');
  var GOLD_LIGHT = new THREE.Color('#E8C96A');
  var GOLD_DEEP = new THREE.Color('#8a6d2f');
  var CREAM = new THREE.Color('#F5F0E8');

  /* ---------- Infinity symbol (lemniscate of Bernoulli) ---------- */
  var COUNT = isMobile ? 1600 : 3200;
  var A = 3.4;               // symbol width
  var TUBE = 0.42;           // particle scatter radius around the curve

  var infGeo = new THREE.BufferGeometry();
  var infPos = new Float32Array(COUNT * 3);
  var infCol = new Float32Array(COUNT * 3);
  // per-particle: t on curve, flow speed, scatter offsets, wobble phase
  var pT = new Float32Array(COUNT);
  var pSpeed = new Float32Array(COUNT);
  var pOffX = new Float32Array(COUNT);
  var pOffY = new Float32Array(COUNT);
  var pOffZ = new Float32Array(COUNT);
  var pPhase = new Float32Array(COUNT);

  for (var i = 0; i < COUNT; i++) {
    pT[i] = Math.random() * Math.PI * 2;
    pSpeed[i] = 0.05 + Math.random() * 0.12;
    var r = Math.pow(Math.random(), 2.2) * TUBE; // denser near the curve
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.random() * Math.PI;
    pOffX[i] = r * Math.sin(phi) * Math.cos(theta);
    pOffY[i] = r * Math.sin(phi) * Math.sin(theta);
    pOffZ[i] = r * Math.cos(phi);
    pPhase[i] = Math.random() * Math.PI * 2;

    var c = Math.random();
    var col = c < 0.55 ? GOLD : (c < 0.85 ? GOLD_LIGHT : (c < 0.95 ? GOLD_DEEP : CREAM));
    infCol[i * 3] = col.r; infCol[i * 3 + 1] = col.g; infCol[i * 3 + 2] = col.b;
  }
  infGeo.setAttribute('position', new THREE.BufferAttribute(infPos, 3));
  infGeo.setAttribute('color', new THREE.BufferAttribute(infCol, 3));

  var infMat = new THREE.PointsMaterial({
    size: isMobile ? 0.075 : 0.06,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  var infinity = new THREE.Points(infGeo, infMat);
  var group = new THREE.Group();
  group.add(infinity);
  group.rotation.x = -0.3;
  scene.add(group);

  /* ---------- Ambient gold dust across the whole page ---------- */
  var DUST = isMobile ? 220 : 550;
  var dustGeo = new THREE.BufferGeometry();
  var dustPos = new Float32Array(DUST * 3);
  var dustSeed = new Float32Array(DUST);
  for (var d = 0; d < DUST; d++) {
    dustPos[d * 3] = (Math.random() - 0.5) * 26;
    dustPos[d * 3 + 1] = (Math.random() - 0.5) * 16;
    dustPos[d * 3 + 2] = -2 - Math.random() * 8;
    dustSeed[d] = Math.random() * Math.PI * 2;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  var dustMat = new THREE.PointsMaterial({
    size: 0.05,
    map: sprite,
    color: GOLD,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  var dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ---------- Interaction state ---------- */
  var mouseX = 0, mouseY = 0, curX = 0, curY = 0;
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  var docHeight = 1;
  function measure() {
    docHeight = Math.max(1, document.body.scrollHeight - window.innerHeight);
  }
  measure();
  window.addEventListener('load', measure);

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    measure();
  });

  /* Lemniscate point for parameter t */
  function curve(t, out) {
    var denom = 1 + Math.sin(t) * Math.sin(t);
    out.x = (A * Math.cos(t)) / denom;
    out.y = (A * Math.sin(t) * Math.cos(t)) / denom;
  }

  var pt = { x: 0, y: 0 };
  var clock = new THREE.Clock();

  function tick() {
    var time = clock.getElapsedTime();
    var scroll = Math.min(1, Math.max(0, (window.scrollY || 0) / docHeight));

    /* flow particles along the infinity curve */
    var positions = infGeo.attributes.position.array;
    for (var i = 0; i < COUNT; i++) {
      var t = pT[i] + time * pSpeed[i];
      curve(t, pt);
      var wob = 1 + Math.sin(time * 0.8 + pPhase[i]) * 0.35;
      positions[i * 3] = pt.x + pOffX[i] * wob;
      positions[i * 3 + 1] = pt.y + pOffY[i] * wob;
      positions[i * 3 + 2] = pOffZ[i] * wob;
    }
    infGeo.attributes.position.needsUpdate = true;

    /* mouse parallax (eased) */
    curX += (mouseX - curX) * 0.04;
    curY += (mouseY - curY) * 0.04;

    /* breathe, spin gently, and respond to scroll */
    group.rotation.y = time * 0.1 + scroll * Math.PI * 1.6 + curX * 0.22;
    group.rotation.x = -0.3 + scroll * 0.7 + curY * 0.14;
    group.position.y = scroll * -2.2;
    var breathe = 1 + Math.sin(time * 0.6) * 0.03;
    group.scale.set(breathe, breathe, breathe);

    camera.position.z = 9 - scroll * 2.2;
    camera.position.x = curX * 0.4;
    camera.position.y = -curY * 0.3;
    camera.lookAt(0, group.position.y * 0.4, 0);

    /* symbol glows in the hero, softens deeper in the page */
    infMat.opacity = 0.9 - scroll * 0.45;

    /* dust drifts slowly */
    dust.rotation.y = time * 0.015;
    dust.position.y = Math.sin(time * 0.1) * 0.4 + scroll * 1.5;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ============================================================
   Infinity Women's Fitness — the golden thread
   A single shimmering gold string stretched across the page.
   Drag it and it bends like a harp string; release and it snaps
   back, vibrating and throwing off sparks. Vanilla canvas 2D.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var sprite = (function () {
    var c = document.createElement('canvas');
    c.width = c.height = 32;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,246,220,1)');
    g.addColorStop(0.4, 'rgba(232,201,106,0.85)');
    g.addColorStop(1, 'rgba(201,168,76,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
    return c;
  })();

  function init(container) {
    var canvas = container.querySelector('canvas');
    var hint = container.querySelector('.string-hint');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = 1, Y0 = 0;
    var ctrlX = 0, ctrlY = 0, velY = 0, velX = 0;
    var hooked = false, lastHook = 0;
    var px = -9999, py = -9999;
    var sparks = [];
    var visible = false, rafId = null;

    function resize() {
      var r = canvas.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      Y0 = H * 0.52;
      ctrlX = W / 2; ctrlY = Y0; velX = 0; velY = 0;
    }

    function spawnSparks(x, y, n, power) {
      for (var i = 0; i < n; i++) {
        sparks.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * power,
          vy: (Math.random() - 0.8) * power,
          life: 1,
          s: 2 + Math.random() * 4
        });
      }
      if (sparks.length > 260) sparks.splice(0, sparks.length - 260);
    }

    function stringYat(x) {
      /* y on the quadratic at horizontal position x (approx by t=x/W) */
      var t = Math.max(0, Math.min(1, x / W));
      var mt = 1 - t;
      return mt * mt * Y0 + 2 * mt * t * ctrlY + t * t * Y0;
    }

    function frame(now) {
      rafId = null;
      if (!visible) return;
      var time = now * 0.001;

      /* --- physics --- */
      var wave = Math.sin(time * 0.7) * 3.5 + Math.sin(time * 0.23 + 1.7) * 2.5;
      if (hooked) {
        /* the control point that makes the curve pass through the pointer */
        var tx = 2 * px - W / 2;
        var ty = 2 * py - Y0;
        var maxPull = H * 0.88;
        ty = Math.max(Y0 - maxPull, Math.min(Y0 + maxPull, ty));
        velX = (tx - ctrlX) * 0.4;
        velY = (ty - ctrlY) * 0.4;
        ctrlX += velX;
        ctrlY += velY;
        if (Math.random() < 0.25) spawnSparks(px, stringYat(px), 1, 1.6);
      } else {
        velY = (velY + (Y0 + wave - ctrlY) * 0.03) * 0.955;
        velX = (velX + (W / 2 - ctrlX) * 0.02) * 0.9;
        ctrlY += velY;
        ctrlX += velX;
        /* sparks fly off the string while it rings */
        if (Math.abs(velY) > 5 && Math.random() < 0.3) {
          spawnSparks(ctrlX / 2 + W / 4 + (Math.random() - 0.5) * W * 0.3, stringYat(ctrlX / 2 + W / 4), 1, 2.2);
        }
      }

      /* --- draw --- */
      ctx.clearRect(0, 0, W, H);

      /* soft glow pass */
      ctx.beginPath();
      ctx.moveTo(0, Y0);
      ctx.quadraticCurveTo(ctrlX, ctrlY, W, Y0);
      ctx.strokeStyle = 'rgba(201,168,76,0.12)';
      ctx.lineWidth = 7;
      ctx.stroke();

      /* main thread with a travelling shimmer highlight */
      var grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'rgba(201,168,76,0.65)');
      grad.addColorStop(1, 'rgba(201,168,76,0.65)');
      var hl = (time * 0.11) % 1.3 - 0.15;
      [[hl - 0.13, 'rgba(201,168,76,0.65)'], [hl, 'rgba(255,236,180,1)'], [hl + 0.13, 'rgba(201,168,76,0.65)']].forEach(function (s) {
        if (s[0] > 0 && s[0] < 1) grad.addColorStop(s[0], s[1]);
      });
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.7;
      ctx.stroke();

      /* endpoint studs */
      ctx.fillStyle = 'rgba(232,201,106,0.9)';
      ctx.beginPath(); ctx.arc(0, Y0, 2.4, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(W, Y0, 2.4, 0, 7); ctx.fill();

      /* sparks */
      ctx.globalCompositeOperation = 'lighter';
      for (var i = sparks.length - 1; i >= 0; i--) {
        var p = sparks[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.02;               /* gentle float */
        p.vx *= 0.985; p.vy *= 0.985;
        p.life -= 0.016;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        var s = p.s * (0.5 + p.life * 0.8);
        ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      rafId = requestAnimationFrame(frame);
    }

    function wake() {
      if (visible && rafId === null) rafId = requestAnimationFrame(frame);
    }

    resize();

    if (reduce) {
      ctx.beginPath();
      ctx.moveTo(0, Y0);
      ctx.lineTo(W, Y0);
      ctx.strokeStyle = 'rgba(201,168,76,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (hint) hint.style.display = 'none';
      return;
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    function release() {
      hooked = false;
      /* the pluck: snap back with a burst sized by how far it was pulled */
      var pull = Math.abs(ctrlY - Y0);
      var n = Math.min(30, Math.round(8 + pull * 0.14));
      var power = 3 + Math.min(5.5, pull * 0.035);
      spawnSparks(Math.max(20, Math.min(W - 20, px)), stringYat(px), n, power);
    }

    function onMove(cx, cy) {
      var r = canvas.getBoundingClientRect();
      px = cx - r.left; py = cy - r.top;
      var inX = px > 4 && px < W - 4;
      if (!hooked) {
        /* grab only when the pointer is close to the thread itself */
        if (inX && Math.abs(py - stringYat(px)) < H * 0.14) {
          hooked = true;
          lastHook = performance.now();
          if (hint && !hint.dataset.gone) {
            hint.dataset.gone = '1';
            hint.style.opacity = '0';
          }
        }
      } else if (!inX || Math.abs(py - Y0) > H * 0.44) {
        release();
      }
    }
    window.addEventListener('pointermove', function (e) { onMove(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (e.touches.length) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', function () {
      if (hooked) release();
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        wake();
      }, { rootMargin: '60px' }).observe(container);
    } else {
      visible = true;
      wake();
    }
  }

  document.querySelectorAll('.string-divider').forEach(init);
})();

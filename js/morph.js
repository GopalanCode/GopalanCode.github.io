/* ============================================================
   Infinity Women's Fitness — interactive morphing particle strip
   Gold particles form shapes (infinity, dumbbell, heart, the word
   INFINITY) and continuously morph between them. Run a finger or
   cursor through them and they splash away, then swirl back.
   Vanilla canvas 2D — no libraries needed.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Pre-tinted glow sprites so we never pay for shadowBlur */
  function makeSprite(inner, mid) {
    var c = document.createElement('canvas');
    c.width = c.height = 32;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, inner);
    g.addColorStop(0.4, mid);
    g.addColorStop(1, 'rgba(201,168,76,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 32, 32);
    return c;
  }
  var SPRITES = [
    makeSprite('rgba(255,244,214,1)', 'rgba(201,168,76,0.85)'),   // gold
    makeSprite('rgba(255,250,230,1)', 'rgba(232,201,106,0.9)'),   // light gold
    makeSprite('rgba(255,255,250,1)', 'rgba(245,240,232,0.55)')   // cream sparkle
  ];

  /* ---------------- shape painters (white on transparent) ---------------- */
  function drawInfinity(o, w, h) {
    var a = Math.min(w * 0.33, h * 1.15);
    o.strokeStyle = '#fff';
    o.lineWidth = h * 0.16;
    o.lineCap = 'round';
    o.beginPath();
    for (var t = 0; t <= Math.PI * 2 + 0.05; t += 0.05) {
      var d = 1 + Math.sin(t) * Math.sin(t);
      var x = w / 2 + (a * Math.cos(t)) / d;
      var y = h / 2 + (a * Math.sin(t) * Math.cos(t)) / d;
      if (t === 0) o.moveTo(x, y); else o.lineTo(x, y);
    }
    o.stroke();
  }

  function drawDumbbell(o, w, h) {
    o.save();
    o.translate(w / 2, h / 2);
    o.rotate(-0.16);
    o.fillStyle = '#fff';
    var L = Math.min(w * 0.44, h * 2.9);
    var bt = h * 0.06;
    o.fillRect(-L / 2, -bt / 2, L, bt);
    var big = h * 0.64, small = h * 0.44, pw = h * 0.12;
    var x0 = L / 2 - pw * 2.8;
    [-1, 1].forEach(function (s) {
      o.fillRect(s * x0 - pw / 2, -big / 2, pw, big);
      o.fillRect(s * (x0 + pw * 1.5) - pw / 2, -small / 2, pw, small);
    });
    o.restore();
  }

  function drawHeart(o, w, h) {
    var s = h * 0.92, cx = w / 2, cy = h / 2 + h * 0.06;
    o.fillStyle = '#fff';
    o.beginPath();
    o.moveTo(cx, cy + s * 0.32);
    o.bezierCurveTo(cx - s * 0.62, cy - s * 0.08, cx - s * 0.32, cy - s * 0.46, cx, cy - s * 0.16);
    o.bezierCurveTo(cx + s * 0.32, cy - s * 0.46, cx + s * 0.62, cy - s * 0.08, cx, cy + s * 0.32);
    o.fill();
  }

  function drawWord(o, w, h) {
    var size = h * 0.62;
    o.font = '700 ' + size + "px 'Playfair Display', serif";
    var tw = o.measureText('INFINITY').width;
    if (tw > w * 0.92) {
      size = size * (w * 0.92) / tw;
      o.font = '700 ' + size + "px 'Playfair Display', serif";
    }
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.fillStyle = '#fff';
    o.fillText('INFINITY', w / 2, h / 2 + h * 0.03);
  }

  var PAINTERS = [drawInfinity, drawDumbbell, drawHeart, drawWord];
  var HOLD_MS = 4300;

  function initMorph(container) {
    var canvas = container.querySelector('canvas');
    var hint = container.querySelector('.morph-hint');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = 1;
    var parts = [], shapes = [], shapeIdx = 0, lastSwitch = performance.now();
    var px = -9999, py = -9999, lastPlay = 0;
    var visible = false, rafId = null;

    function samplePoints(painter) {
      var off = document.createElement('canvas');
      off.width = Math.max(2, Math.round(W));
      off.height = Math.max(2, Math.round(H));
      var o = off.getContext('2d');
      painter(o, off.width, off.height);
      var data = o.getImageData(0, 0, off.width, off.height).data;
      var pts = [], step = 3;
      for (var y = 0; y < off.height; y += step) {
        for (var x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3] > 128) pts.push([x, y]);
        }
      }
      for (var i = pts.length - 1; i > 0; i--) {
        var j = (Math.random() * (i + 1)) | 0;
        var t = pts[i]; pts[i] = pts[j]; pts[j] = t;
      }
      return pts;
    }

    function buildShapes() {
      shapes = PAINTERS.map(samplePoints);
      assignTargets(false);
    }

    function assignTargets(burst) {
      var pts = shapes[shapeIdx];
      if (!pts || !pts.length) return;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], t = pts[i % pts.length];
        p.tx = t[0]; p.ty = t[1];
        if (burst) {
          p.vx += (Math.random() - 0.5) * 9;
          p.vy += (Math.random() - 0.5) * 9;
        }
      }
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var N = Math.max(500, Math.min(1500, Math.round((W * H) / 1000)));
      parts = [];
      for (var i = 0; i < N; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: 0, vy: 0, tx: 0, ty: 0,
          s: 1.1 + Math.random() * 1.9,
          a: 0.5 + Math.random() * 0.5,
          ph: Math.random() * Math.PI * 2,
          sp: SPRITES[Math.random() < 0.7 ? 0 : (Math.random() < 0.75 ? 1 : 2)]
        });
      }
      buildShapes();
    }

    function frame(now) {
      rafId = null;
      if (!visible) return;
      /* hold the shape while someone is playing with it */
      if (now - lastSwitch > HOLD_MS && now - lastPlay > 1400) {
        shapeIdx = (shapeIdx + 1) % shapes.length;
        lastSwitch = now;
        assignTargets(true);
      }
      var rect = canvas.getBoundingClientRect();
      var mx = px - rect.left, my = py - rect.top;
      var R = Math.max(70, H * 0.42), R2 = R * R;
      var time = now * 0.001;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.vx += (p.tx - p.x) * 0.02;
        p.vy += (p.ty - p.y) * 0.02;
        var dx = p.x - mx, dy = p.y - my;
        var d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          var d = Math.sqrt(d2), f = ((R - d) / R) * 2.6;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.86; p.vy *= 0.86;
        p.x += p.vx; p.y += p.vy;
        var tw = p.a * (0.65 + 0.35 * Math.sin(time * 2.2 + p.ph));
        ctx.globalAlpha = tw;
        var s = p.s * 3.2;
        ctx.drawImage(p.sp, p.x - s / 2, p.y - s / 2, s, s);
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
      /* static infinity, no animation */
      var pts = shapes[0];
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i += 2) {
        ctx.globalAlpha = 0.7;
        ctx.drawImage(SPRITES[0], pts[i][0] - 3, pts[i][1] - 3, 6, 6);
      }
      if (hint) hint.style.display = 'none';
      return;
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    /* re-sample the INFINITY word once the real font is in */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { buildShapes(); });
    }

    function onMove(x, y) {
      px = x; py = y;
      var r = canvas.getBoundingClientRect();
      if (y > r.top && y < r.bottom && x > r.left && x < r.right) {
        lastPlay = performance.now();
        if (hint && !hint.dataset.gone) {
          hint.dataset.gone = '1';
          hint.style.opacity = '0';
        }
      }
    }
    window.addEventListener('pointermove', function (e) { onMove(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (e.touches.length) onMove(e.touches[0].clientX, e.touches[0].clientY);
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

  document.querySelectorAll('.morph-divider').forEach(initMorph);
})();

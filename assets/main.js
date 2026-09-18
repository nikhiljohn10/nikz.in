/* nikz.in — no dependencies, and no network requests of any kind.
   Everything here is progressive enhancement: the page reads fine with
   JavaScript switched off, and nothing on it can fail to load.

   1. scene()   a round brilliant drawn as a constellation, in raw WebGL.
                Scrolling a little way triggers its stars to wind round the
                stone's centre and fling outward into open sky — the inner ones
                turning most, the way a galaxy rotates. The journey then plays on
                the clock, not the scrollbar, so it is smooth at any scroll speed.
                Reaching FOLLOW triggers the same journey in reverse.
   2. stage()   scroll choreography for the DOM: parallax on the hero and
                banner, sections that swing into place in 3D.
   3. svgStone()  the old 2D facet light; used only when WebGL is missing.

   prefers-reduced-motion switches all of it off. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ease = function (t) { return t * t * (3 - 2 * t); };

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Shared, smoothed pointer in the range -1…1 */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduceMotion) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════════════════════
     1. The scene
     ════════════════════════════════════════════════════════════════ */
  function brilliantEdges() {
    // Proportions of a well-made round brilliant, girdle radius = 1.
    var T = 0.56, S = 0.735, L = 0.23;            // table, star tip, lower-half radii
    var yT = 0.30, yS = 0.17, yL = -0.66, yC = -0.86;
    var P = function (r, deg, y) { var a = deg * Math.PI / 180; return [r * Math.cos(a), y, r * Math.sin(a)]; };
    var edges = [], k;
    for (k = 0; k < 8; k++) {
      var a = k * 45;
      var t0 = P(T, a, yT), t1 = P(T, a + 45, yT);
      var s = P(S, a + 22.5, yS);
      var g0 = P(1, a, 0), g1 = P(1, a + 45, 0), m = P(1, a + 22.5, 0);
      var l = P(L, a + 22.5, yL);
      edges.push([t0, t1], [t0, s], [s, t1], [s, g0], [s, g1], [s, m]);   // crown
      edges.push([[0, yC, 0], l], [l, g0], [l, g1], [l, m]);               // pavilion
    }
    for (k = 0; k < 64; k++) edges.push([P(1, k * 5.625, 0), P(1, (k + 1) * 5.625, 0)]); // girdle
    return edges;
  }

  function scene() {
    var canvas = document.createElement('canvas');
    canvas.className = 'scene';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) return null;

    var small = window.innerWidth < 700;
    var density = small ? 38 : 58, starCount = small ? 1400 : 2800;
    var rnd = Math.random, TAU = 6.28318530718;

    /* ── every star's place on the stone ──
       magnitude: 0 faint … 1 brilliant, on a steep power law (a sky is mostly pinpoints). */
    var parts = [];                                    // { h:[x,y,z], mag }
    var seen = {};
    brilliantEdges().forEach(function (e) {
      var a = e[0], b = e[1];
      var len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      var n = Math.max(2, Math.ceil(len * density));
      for (var i = 1; i < n; i++) {                    // facet edges: fine, faint, crisp
        var t = i / n, j = 0.004;
        parts.push({ h: [a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * j,
                         a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * j,
                         a[2] + (b[2] - a[2]) * t + (rnd() - 0.5) * j], mag: 0.34 + rnd() * 0.12 });
      }
      if (len > 0.2) [a, b].forEach(function (v) {     // facet junctions: one brilliant star each
        var key = v[0].toFixed(3) + v[1].toFixed(3) + v[2].toFixed(3);
        if (!seen[key]) { seen[key] = 1; parts.push({ h: v, mag: 0.9 + rnd() * 0.1 }); }
      });
    });
    for (var d = 0; d < starCount; d++) {              // the sky around the stone
      var r0 = 1.6 + Math.pow(rnd(), 1.5) * 4.5, t0 = rnd() * TAU, p0 = Math.acos(rnd() * 2 - 1);
      parts.push({ h: [r0 * Math.sin(p0) * Math.cos(t0), r0 * Math.cos(p0) * 0.75, r0 * Math.sin(p0) * Math.sin(t0)],
                   mag: Math.pow(rnd(), 7) * 0.95 + rnd() * 0.12 });
    }

    /* ── where each star ends up in the open sky ──
       Stars nearest the stone's axis stay nearest the centre of the sky, and the outermost go
       furthest, so no two paths cross. Each star also gets a winding: how far it turns about the
       centre on its way out. The inner stars turn the most, the outer the least — the way a
       galaxy rotates — and that difference alone is what draws the stone out into spiral arms. */
    var SKY = 10.7, TURNS_INNER = 1.5, TURNS_OUTER = 0.5;
    var radii = parts.map(function () { return 0.7 + Math.sqrt(rnd()) * (SKY - 0.7); }).sort(function (A, B) { return A - B; });
    var order = parts.map(function (P, i) { return i; }).sort(function (A, B) {
      return Math.hypot(parts[A].h[0], parts[A].h[2]) - Math.hypot(parts[B].h[0], parts[B].h[2]);
    });
    order.forEach(function (pi, rank) { parts[pi].sky = radii[rank]; });

    var home = [], field = [], misc = [];              // home is cylindrical about the stone's axis: radius, azimuth, height
    parts.forEach(function (P) {
      home.push(Math.hypot(P.h[0], P.h[2]), Math.atan2(P.h[2], P.h[0]), P.h[1]);
      field.push(P.sky, TAU * (TURNS_INNER - (TURNS_INNER - TURNS_OUTER) * P.sky / SKY), rnd() * 26);   // sky radius, winding, depth
      misc.push(rnd(), P.mag, rnd());
    });
    var count = misc.length / 3;

    /* ── shaders ── */
    var VS = [
      'attribute vec3 aHome, aField, aMisc;',
      'uniform float uTime, uM, uLag, uGhost, uTravel, uScale, uAspect, uPx, uDim, uGain;',
      'uniform vec2 uRot, uPointer;',
      'uniform vec3 uCenter, uInk, uAccent;',
      'varying float vAlpha, vStar;',
      'varying vec3 vColor;',
      'float ss(float t) { t = clamp(t, 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }',
      'void main() {',
      '  float seed = aMisc.x, mag = aMisc.y;',
      // How far along its journey this star is. The rim lets go first and the heart of the stone last;
      // and two opposite sides of the stone let go a little before the rest, so the stars leave in
      // two streams that the winding then draws out into trailing arms.
      '  float e = ss((uM - uLag) * 1.5 - (1.0 - aField.x / 10.7) * 0.26 - 0.24 * (0.5 + 0.5 * cos(2.0 * aHome.y)));',
      // The spiral is made in the stone's own frame, about its own axis — the line from culet to the
      // centre of the table. The star's azimuth about that axis winds on, its distance from the axis
      // grows (lagging the turn, so it swings round before it flies out), and it settles toward the
      // girdle plane. Only then is the whole figure turned and tilted with the stone, so the vortex
      // is seen at the stone's angle, not flat-on to the screen.
      '  float th = aHome.y + aField.y * e;',
      '  float outw = pow(e, 1.5);',
      '  float rl = mix(aHome.x, 0.8 + aField.x * 0.42, outw);',
      '  vec3 l = vec3(rl * cos(th), aHome.z * (1.0 - 0.7 * outw), rl * sin(th));',
      '  float cy = cos(uRot.y), sy = sin(uRot.y), cx = cos(uRot.x), sx = sin(uRot.x);',
      '  l = vec3(l.x * cy + l.z * sy, l.y, -l.x * sy + l.z * cy);',
      '  l = vec3(l.x, l.y * cx - l.z * sx, l.y * sx + l.z * cx);',
      '  vec3 G = l * uScale + uCenter;',
      // Late in the journey the tilted disc opens out to fill the whole sky. Each star keeps the same
      // bearing about the axis that it already has, so this last leg is a widening, not a new direction.
      '  float e2 = ss((e - 0.4) / 0.6);',
      '  float fz = mod(aField.z + uTravel * (0.6 + seed * 0.8), 26.0);',
      '  vec3 F = vec3(vec2(cos(th - uRot.y), -sin(th - uRot.y)) * aField.x * vec2(1.3, 0.8)',
      '              + vec2(-uPointer.x * (0.25 + fz * 0.02), uPointer.y * 0.2), -26.0 + fz - 0.3);',
      '  vec3 p = mix(G, F, e2);',
      '  float w = -p.z;',
      '  gl_Position = vec4(p.x * 2.1445 / uAspect, p.y * 2.1445, p.z * 0.02, w);',
      '  float depth = clamp(6.0 / w, 0.7, 1.6);',
      '  float size = uPx / 900.0 * (2.0 + mag * mag * mag * 50.0) * depth;',
      '  gl_PointSize = clamp(mix(size, min(size, uPx / 900.0 * (2.2 + mag * 2.5)), step(0.001, uGhost)), 1.5, 64.0);',   // a streak is thin, however bright the star
      '  vStar = smoothstep(0.5, 0.95, mag) * (1.0 - step(0.001, uGhost));',
      '  float tw = 0.72 + 0.28 * sin(uTime * (2.0 + seed * 5.0) + seed * 47.0) * sin(uTime * (0.9 + seed * 1.7) + seed * 13.0);',
      '  float flash = pow(max(0.0, sin(uTime * (0.6 + seed * 0.9) + seed * 91.0)), 40.0);',
      '  float near = smoothstep(0.6, 5.0, w) * (1.0 - smoothstep(20.0, 26.0, w) * e2);',
      '  vAlpha = (tw + flash * (0.6 + vStar)) * (0.55 + mag * 0.9) * near * mix(uGain, uDim, e2);',
      // a ghost is where this star was a moment ago: drawn fainter, and only while it is in flight,
      // so a moving star leaves a short streak along its spiral and a resting one leaves nothing
      '  vAlpha *= mix(1.0, uGhost * smoothstep(0.0, 0.06, e) * smoothstep(1.0, 0.94, e), step(0.001, uGhost));',
      '  float c = aMisc.z;',
      '  vec3 temp = mix(vec3(0.70, 0.82, 1.0), vec3(1.0, 0.84, 0.68), smoothstep(0.06, 1.0, c));',
      '  vec3 col = mix(uInk, temp, 0.55);',
      '  col = mix(col, uAccent, step(c, 0.06));',
      '  vec3 fire = 0.5 + 0.5 * cos(6.2832 * (seed * 3.0 + uTime * 0.15 + vec3(0.0, 0.33, 0.67)));',
      '  vColor = mix(col, mix(vec3(1.0), fire, 0.45), flash * 0.6);',
      '}'
    ].join('\n');
    var FS = [
      'precision mediump float;',
      'varying float vAlpha, vStar;',
      'varying vec3 vColor;',
      'void main() {',
      '  vec2 p = gl_PointCoord - 0.5;',
      '  float d = length(p);',
      '  float core = exp(-d * d * mix(40.0, 1500.0, vStar));',                       // a hard pinpoint
      '  float halo = exp(-d * 11.0) * 0.22 * vStar;',                                // a breath of glow
      '  vec2 q = abs(p);',
      '  float spikes = (exp(-q.y * 90.0 - q.x * 7.5) + exp(-q.x * 90.0 - q.y * 7.5)) * 0.55 * vStar;',
      '  vec2 r = abs(vec2(p.x + p.y, p.x - p.y)) * 0.7071;',                         // fainter diagonal pair
      '  spikes += (exp(-r.y * 120.0 - r.x * 13.0) + exp(-r.x * 120.0 - r.y * 13.0)) * 0.16 * vStar;',
      '  float a = (core + halo + spikes) * smoothstep(0.5, 0.32, d);',
      '  gl_FragColor = vec4(vColor * a * vAlpha, 1.0);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    [['aHome', home], ['aField', field], ['aMisc', misc]].forEach(function (pair) {
      var buf = gl.createBuffer(), loc = gl.getAttribLocation(prog, pair[0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pair[1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    });
    var U = {};
    ['uTime', 'uM', 'uLag', 'uGhost', 'uTravel', 'uScale', 'uAspect', 'uPx', 'uDim', 'uGain', 'uRot', 'uPointer', 'uCenter', 'uInk', 'uAccent']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    /* ── colours follow the stylesheet, so a palette change needs no edit here ── */
    var paper = [0.06, 0.06, 0.05];
    function rgb(str, fallback) {
      var m = /^#?([0-9a-f]{6})$/i.exec((str || '').trim());
      if (!m) return fallback;
      var n = parseInt(m[1], 16);
      return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }
    function palette() {
      var cs = getComputedStyle(doc);
      paper = rgb(cs.getPropertyValue('--paper'), paper);
      var ink = rgb(cs.getPropertyValue('--ink'), [0.93, 0.91, 0.86]);
      var acc = rgb(cs.getPropertyValue('--accent'), [0.83, 0.44, 0.54]);
      gl.uniform3f(U.uInk, ink[0], ink[1], ink[2]);
      gl.uniform3f(U.uAccent, acc[0] * 1.25, acc[1] * 1.25, acc[2] * 1.25);
    }
    palette();
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    if (mq.addEventListener) mq.addEventListener('change', palette);

    /* ── sizing ── */
    var W = 1, H = 1, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      W = canvas.clientWidth || window.innerWidth; H = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    document.body.insertBefore(canvas, document.body.firstChild);
    doc.classList.add('webgl');
    resize();
    window.addEventListener('resize', resize);

    var anchor = document.querySelector('.hero-stone .stone');
    var caption = document.querySelector('.hero-stone figcaption');
    if (caption) caption.textContent = 'Fig. 1 — Round brilliant. 57 facets, drawn as a constellation.';

    var GHOSTS = small ? 7 : 12;
    var F = 2.1445, DIST = 6;                       // focal length for a 50° field of view
    var alive = true, spin = 0, lastTime = 0;

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); alive = false; doc.classList.remove('webgl'); canvas.remove();
    });

    /* Scrolling pulls the trigger; the clock plays the effect.
       mode   what the page position asks for: the stone in the hero, open sky, or the stone at the end.
       anchor where the stone currently lives. It may only move house while everything is sky (M = 1),
              so a jump from the top of the page to the bottom plays out-then-in, never a teleport.
       M      0 = stone, 1 = sky. It moves toward its target at its own pace, whatever the scroll does. */
    var START = 120, RETURN = 24;                     // px from the top: disperse beyond START, re-form only above RETURN
    var PLAY = 2.4;                                   // seconds for the whole journey, either way
    var mode = null, anchorAt = 'hero', M = 0, vel = 0;

    return {
      draw: function (time, scrollY, maxScroll) {
        if (!alive) return;
        var dt = lastTime ? Math.min(0.1, time - lastTime) : 0; lastTime = time;
        var toBottom = maxScroll - scrollY;

        if (mode === null) {                          // first frame: a page opened part-way down starts as sky, nothing to play
          mode = toBottom < H * 0.55 && maxScroll > H ? 'end' : scrollY > START ? 'sky' : 'hero';
          anchorAt = mode === 'end' ? 'end' : 'hero';
          M = mode === 'sky' ? 1 : 0;
        }
        // the two trigger lines of each pair sit apart, so hovering near one cannot flip the effect back and forth
        if (mode === 'hero') { if (scrollY > START) mode = 'sky'; }
        else if (mode === 'sky') { if (scrollY < RETURN) mode = 'hero'; else if (toBottom < H * 0.55 && maxScroll > H) mode = 'end'; }
        else if (toBottom > H * 0.8) mode = 'sky';

        if (mode !== 'sky' && anchorAt !== mode && M >= 0.985) anchorAt = mode;
        var target = mode === 'sky' || anchorAt !== mode ? 1 : 0;

        // ease the speed, not the position, so a change of mind mid-flight turns round smoothly
        var want = (target > M ? 1 : target < M ? -1 : 0) / PLAY;
        vel += (want - vel) * Math.min(1, dt * 9);
        M += vel * dt;
        if (M <= 0) { M = 0; if (target === 0) vel = 0; }
        if (M >= 1) { M = 1; if (target === 1) vel = 0; }

        var cx, cy, half;
        if (anchorAt === 'end' || !anchor) {                                             // the closing stone, behind FOLLOW
          cx = W > 900 ? 0.34 : 0; cy = -0.1;
          half = Math.min(W * 0.24, H * 0.34) / (H / 2);
        } else {                                                                         // on the hero figure, wherever the page has carried it
          var rc = anchor.getBoundingClientRect();
          cx = (rc.left + rc.width / 2) / W * 2 - 1;
          cy = 1 - (rc.top + rc.height / 2) / H * 2;
          half = (rc.width / 2) / (H / 2) * 0.9;
        }
        spin += dt * (0.16 - 0.15 * M);               // brisk for the stone, almost still for the open sky
        var aspect = W / H;
        gl.uniform3f(U.uCenter, cx * aspect * DIST / F, cy * DIST / F, -DIST);
        gl.uniform1f(U.uScale, half * DIST / F);
        gl.uniform1f(U.uAspect, aspect);
        gl.uniform1f(U.uPx, H * dpr);
        gl.uniform1f(U.uTime, time);
        gl.uniform1f(U.uM, M);
        gl.uniform1f(U.uDim, 0.4);
        gl.uniform1f(U.uGain, anchorAt === 'end' ? 0.42 : 1);
        gl.uniform1f(U.uTravel, scrollY * 0.0045 + time * 0.04);
        gl.uniform2f(U.uRot, 0.42 + pointer.y * 0.35 * (1 - M), spin + pointer.x * 0.9 * (1 - M) + scrollY * 0.0004);
        gl.uniform2f(U.uPointer, pointer.x, pointer.y);

        gl.clearColor(paper[0], paper[1], paper[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U.uLag, 0); gl.uniform1f(U.uGhost, 0);
        gl.drawArrays(gl.POINTS, 0, count);

        // streaks: each star in flight trails where it was a moment ago. They follow the effect's own
        // speed, not the scroll's, so they are there at any scrolling pace and gone once it rests.
        var trail = clamp(vel * 0.075, -0.055, 0.055);
        if (Math.abs(trail) > 0.004 && M > 0 && M < 1) {
          for (var g = 1; g <= GHOSTS; g++) {
            gl.uniform1f(U.uLag, trail * g / GHOSTS);
            gl.uniform1f(U.uGhost, 0.5 * Math.pow(1 - g / (GHOSTS + 1), 1.5));
            gl.drawArrays(gl.POINTS, 0, count);
          }
        }
      }
    };
  }

  /* ════════════════════════════════════════════════════════════════
     2. The stage — scroll choreography for the page itself
     ════════════════════════════════════════════════════════════════ */
  function stage() {
    // how each kind of element enters: [selector, fn(style, 1 - progress)]
    var ENTRANCES = [
      ['.prose > p',     function (q) { return 'translate3d(0,' + q * 60 + 'px,' + q * -140 + 'px) rotateX(' + q * 9 + 'deg)'; }],
      ['.card',          function (q) { return window.innerWidth < 900
                                          ? 'translate3d(0,' + q * 60 + 'px,' + q * -200 + 'px) rotateX(' + q * 10 + 'deg)'
                                          : 'translate3d(' + q * 50 + 'px,' + q * 40 + 'px,' + q * -260 + 'px) rotateY(' + q * -16 + 'deg)'; }],
      ['.facets > li',   function (q) { return 'translate3d(0,' + q * 70 + 'px,' + q * -200 + 'px) rotateX(' + q * 12 + 'deg)'; }],
      ['.frames > figure', function (q) { return 'translate3d(0,' + q * 70 + 'px,' + q * -200 + 'px) rotateX(' + q * 12 + 'deg)'; }],
      ['.repos > li',    function (q) { return 'translate3d(0,' + q * 34 + 'px,' + q * -110 + 'px) rotateX(' + q * -14 + 'deg)'; }],
      ['.more, .aside-note, .now .big, .now .big + .label',
                         function (q) { return 'translate3d(0,' + q * 50 + 'px,' + q * -120 + 'px) rotateX(' + q * 8 + 'deg)'; }],
      ['.links > li',    function (q) { return 'translate3d(' + q * -70 + 'px,0,' + q * -160 + 'px) rotateY(' + q * 14 + 'deg)'; }]
    ];
    var items = [];
    ENTRANCES.forEach(function (pair) {
      Array.prototype.forEach.call(document.querySelectorAll(pair[0]), function (el) {
        el.classList.add('enter');
        items.push({ el: el, fn: pair[1], top: 0, h: 0, done: false, last: -1 });
      });
    });

    var heroText = document.querySelector('.hero-text');
    var banner = document.querySelector('.banner');
    var bannerImg = banner && banner.querySelector('img');
    var bar = document.querySelector('.progress');
    var bannerTop = 0, bannerH = 0, vh = window.innerHeight;

    // Positions are measured with transforms cleared, so the animation can never chase itself.
    function measure() {
      vh = window.innerHeight;
      var y = window.pageYOffset;
      items.forEach(function (it) {
        var t = it.el.style.transform; it.el.style.transform = 'none';
        var r = it.el.getBoundingClientRect();
        it.top = r.top + y; it.h = r.height; it.left = r.left;
        it.el.style.transform = t;
        it.last = -1;
      });
      if (banner) { var b = banner.getBoundingClientRect(); bannerTop = b.top + y; bannerH = b.height; }
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    return function (scrollY, maxScroll) {
      // hero: drifts slower than the page and fades as it goes
      if (heroText && scrollY < vh * 1.2) {
        var p = clamp(scrollY / vh, 0, 1);
        heroText.style.transform = 'translate3d(0,' + (scrollY * 0.28).toFixed(1) + 'px,0) scale(' + (1 + p * (window.innerWidth < 900 ? 0 : 0.1)).toFixed(4) + ')';
        heroText.style.opacity = (1 - p * 1.5).toFixed(3);
      }
      // banner: the photograph slides inside its frame
      if (bannerImg && scrollY + vh > bannerTop && scrollY < bannerTop + bannerH) {
        var bp = (scrollY + vh - bannerTop) / (vh + bannerH);
        bannerImg.style.transform = 'translate3d(0,' + ((bp - 0.5) * -16).toFixed(2) + '%,0) scale(1.22)';
      }
      // sections: each piece swings in on its own, as it arrives
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var stagger = (it.left / Math.max(1, window.innerWidth)) * vh * 0.12;    // left-to-right ripple on a row
        var start = Math.min(it.top + stagger - vh * 0.94, maxScroll - vh * 0.5);   // the last rows still get to finish
        var t = clamp((scrollY - start) / (vh * 0.42), 0, 1);
        if (t === it.last) continue;
        it.last = t;
        if (t >= 1) {                                    // settled: hand the element back untouched, so text stays crisp
          it.el.style.transform = ''; it.el.style.opacity = ''; it.el.style.willChange = '';
          it.el.classList.add('entered');
        } else {
          var q = 1 - ease(t);
          it.el.classList.remove('entered');
          it.el.style.willChange = 'transform, opacity';
          it.el.style.transform = 'perspective(1100px) ' + it.fn(q);
          it.el.style.opacity = ease(clamp(t * 1.4, 0, 1)).toFixed(3);
        }
      }
      if (bar) bar.style.transform = 'scaleX(' + clamp(scrollY / Math.max(1, maxScroll), 0, 1).toFixed(4) + ')';
    };
  }

  /* ════════════════════════════════════════════════════════════════
     3. Fallback: the flat facet diagram catches the light instead
     ════════════════════════════════════════════════════════════════ */
  function svgStone() {
    var stone = document.querySelector('.stone');
    if (!stone) return;
    var spin = stone.querySelector('.stone-spin');
    var facets = Array.prototype.map.call(stone.querySelectorAll('.f'), function (el) {
      return { el: el, kind: el.getAttribute('data-k'), az: parseFloat(el.getAttribute('data-az')) * Math.PI / 180 };
    });
    var weight = { star: 0.55, bezel: 0.8, girdle: 1 };
    function paint(angle, dist, rot) {
      facets.forEach(function (f) {
        var b;
        if (f.kind === 'table') b = Math.pow(1 - Math.min(1, dist), 2) * 0.9;
        else {
          var c = Math.cos(f.az + rot - angle);
          b = ((c > 0 ? Math.pow(c, 3) : 0) + (c < 0 ? Math.pow(-c, 10) * 0.4 : 0)) * weight[f.kind] * Math.min(1, 0.25 + dist) * 0.92;
        }
        f.el.style.setProperty('--l', b.toFixed(3));
      });
    }
    if (reduceMotion) { paint(-2.2, 0.85, 0); return; }
    (function frame(now) {
      var t = now / 1000, rot = t * 0.026;
      var r = stone.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var dx = (pointer.x + 1) / 2 * window.innerWidth - (r.left + r.width / 2);
        var dy = (pointer.y + 1) / 2 * window.innerHeight - (r.top + r.height / 2);
        var moved = pointer.tx !== 0 || pointer.ty !== 0;
        paint(moved ? Math.atan2(dy, dx) : t * 0.22 - 2.2, moved ? Math.min(1.4, Math.hypot(dx, dy) / (r.width / 2)) : 0.85, rot);
        spin.setAttribute('transform', 'rotate(' + (rot * 57.2958).toFixed(3) + ')');
      }
      requestAnimationFrame(frame);
    })(0);
  }

  /* ════════════════════════════════════════════════════════════════
     Run
     ════════════════════════════════════════════════════════════════ */
  var world = reduceMotion ? null : scene();
  if (!world) svgStone();

  if (!reduceMotion) {
    var choreograph = stage();
    var visible = true;
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; });
    (function loop(now) {
      if (visible) {
        pointer.x += (pointer.tx - pointer.x) * 0.06;
        pointer.y += (pointer.ty - pointer.y) * 0.06;
        var y = window.pageYOffset;
        var max = Math.max(1, doc.scrollHeight - window.innerHeight);
        choreograph(y, max);
        if (world) world.draw(now / 1000, y, max);
      }
      requestAnimationFrame(loop);
    })(0);
  }

  /* Mark the current section in the nav */
  var navLinks = document.querySelectorAll('.top nav a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Array.prototype.forEach.call(navLinks, function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.block'), function (b) { spy.observe(b); });
  }
})();

/* nikz.in — no dependencies. Everything here is progressive enhancement:
   the page reads fine with JavaScript switched off. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Year in the footer ─────────────────────────────── */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ── The stone: facets catch a light that follows the pointer ── */
  var stone = document.querySelector('.stone');
  if (stone) {
    var spin = stone.querySelector('.stone-spin');
    var facets = Array.prototype.map.call(stone.querySelectorAll('.f'), function (el) {
      return { el: el, kind: el.getAttribute('data-k'), az: parseFloat(el.getAttribute('data-az')) * Math.PI / 180 };
    });
    var weight = { star: 0.55, bezel: 0.8, girdle: 1 };
    var light = { a: -2.2, d: 0.85 };      // where the light is
    var target = { a: -2.2, d: 0.85 };     // where it is heading
    var pointerActive = false, visible = true, rot = 0, last = 0;

    function paint() {
      for (var i = 0; i < facets.length; i++) {
        var f = facets[i], b;
        if (f.kind === 'table') {
          b = Math.pow(1 - Math.min(1, light.d), 2) * 0.9;
        } else {
          var c = Math.cos(f.az + rot - light.a);
          var direct = c > 0 ? Math.pow(c, 3) : 0;
          var bounce = c < 0 ? Math.pow(-c, 10) * 0.4 : 0;
          b = (direct + bounce) * weight[f.kind] * Math.min(1, 0.25 + light.d) * 0.92;
        }
        f.el.style.setProperty('--l', b.toFixed(3));
      }
    }

    function frame(now) {
      var dt = last ? Math.min(64, now - last) : 16; last = now;
      if (!pointerActive) target.a += dt * 0.00022;            // idle: the light orbits slowly
      rot += dt * 0.000026;                                    // the stone turns, one rev in ~4 min
      var da = Math.atan2(Math.sin(target.a - light.a), Math.cos(target.a - light.a));
      light.a += da * 0.08;
      light.d += (target.d - light.d) * 0.08;
      spin.setAttribute('transform', 'rotate(' + (rot * 180 / Math.PI).toFixed(3) + ')');
      paint();
      if (visible) requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      paint();                                                 // one still, well-lit frame
    } else {
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = stone.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        target.a = Math.atan2(dy, dx);
        target.d = Math.min(1.4, Math.sqrt(dx * dx + dy * dy) / (r.width / 2));
        pointerActive = true;
      }, { passive: true });
      doc.addEventListener('pointerleave', function () { pointerActive = false; target.d = 0.85; });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          var was = visible; visible = entries[0].isIntersecting;
          if (visible && !was) { last = 0; requestAnimationFrame(frame); }
        }).observe(stone);
      }
      requestAnimationFrame(frame);
    }
  }

  /* ── Reveal blocks as they scroll in; mark the current nav item ── */
  var blocks = document.querySelectorAll('.block');
  var navLinks = document.querySelectorAll('.top nav a');
  if ('IntersectionObserver' in window) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); reveal.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    blocks.forEach(function (b) {
      Array.prototype.forEach.call(b.children, function (child) {
        if (!child.classList.contains('block-head')) { child.classList.add('reveal'); reveal.observe(child); }
      });
      spy.observe(b);
    });
  }

  /* ── Live star counts from GitHub (silently skipped if it fails) ── */
  var starEls = document.querySelectorAll('.stars[data-repo]');
  if (starEls.length && window.fetch) {
    var KEY = 'nikz:stars:v1', DAY = 864e5, cached = null;
    try { cached = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* storage unavailable */ }

    var show = function (map) {
      starEls.forEach(function (el) {
        var n = map[el.getAttribute('data-repo')];
        if (typeof n === 'number' && n > 0) el.textContent = n;
      });
    };

    if (cached && Date.now() - cached.t < DAY) {
      show(cached.map);
    } else {
      fetch('https://api.github.com/users/nikhiljohn10/repos?per_page=100')
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (repos) {
          var map = {};
          repos.forEach(function (r) { map[r.name] = r.stargazers_count; });
          show(map);
          try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), map: map })); } catch (e) { /* ignore */ }
        })
        .catch(function () { if (cached) show(cached.map); });
    }
  }
})();

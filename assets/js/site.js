(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* hero line reveal */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.body.classList.add('ready'); });
  });

  /* mobile menu */
  var menuBtn = $('.menu-btn');
  if (menuBtn) {
    var setMenu = function (open) {
      doc.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
    $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });
  }

  /* local time in Kosovo */
  var clock = $('#clock');
  if (clock) {
    var tick = function () {
      try {
        clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' }).format(new Date());
      } catch (e) { clock.parentNode.style.display = 'none'; }
    };
    tick();
    setInterval(tick, 15000);
  }

  /* scroll progress + marquee drift */
  var bar = $('.progress');
  var track = $('.marquee-track');
  var half = 0, x = 0, lastY = window.scrollY, vel = 0;
  if (track) {
    track.innerHTML += track.innerHTML;
    var measure = function () { half = track.scrollWidth / 2; };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
  }
  var frame = function () {
    var y = window.scrollY;
    if (bar) {
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
    if (track && half && !reduce) {
      vel += ((y - lastY) - vel) * 0.12;
      x -= 0.6 + Math.abs(vel) * 0.55;
      if (x <= -half) x += half;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
    }
    lastY = y;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  /* word ticker */
  var tt = $('.ticker-track');
  if (tt && !reduce) {
    var count = tt.children.length, idx = 0;
    tt.appendChild(tt.children[0].cloneNode(true));
    setInterval(function () {
      idx++;
      tt.style.transition = '';
      tt.style.transform = 'translateY(' + (-idx * 1.16) + 'em)';
      if (idx === count) {
        setTimeout(function () {
          tt.style.transition = 'none';
          tt.style.transform = 'translateY(0)';
          idx = 0;
        }, 950);
      }
    }, 2300);
  }

  /* reveal on scroll */
  $$('[data-stagger]').forEach(function (g) {
    $$('[data-up]', g).forEach(function (el, i) { el.style.setProperty('--i', i); });
  });
  var countUp = function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10), t0 = null, dur = 1400;
    if (reduce) { el.textContent = end; return; }
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var targets = $$('[data-up], .sec-head, .portrait, [data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-count')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  /* project preview that follows the cursor */
  var peek = $('.peek');
  var rows = $$('.row[data-name]');
  if (peek && rows.length && window.matchMedia('(hover: hover) and (min-width: 901px)').matches) {
    var label = $('.peek-name', peek);
    var imgs = {};
    rows.forEach(function (r) {
      var src = r.getAttribute('data-shot');
      if (src && !imgs[src]) {
        var im = new Image();
        im.alt = '';
        im.decoding = 'async';
        im.src = src;
        peek.insertBefore(im, label);
        imgs[src] = im;
      }
    });
    var px = 0, py = 0, tx = 0, ty = 0, active = false;
    var place = function () {
      px += (tx - px) * 0.14;
      py += (ty - py) * 0.14;
      peek.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
      if (active || Math.abs(tx - px) > 0.5 || Math.abs(ty - py) > 0.5) requestAnimationFrame(place);
    };
    var aim = function (e) {
      var w = peek.offsetWidth, h = peek.offsetHeight;
      tx = Math.min(window.innerWidth - w - 16, e.clientX + 28);
      ty = Math.max(80, Math.min(window.innerHeight - h - 16, e.clientY - h / 2));
    };
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function (e) {
        var src = r.getAttribute('data-shot');
        Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle('on', k === src); });
        label.textContent = r.getAttribute('data-name');
        label.classList.toggle('on', !src);
        aim(e);
        if (!active) { px = tx; py = ty; }
        active = true;
        peek.classList.add('on');
        requestAnimationFrame(place);
      });
      r.addEventListener('mousemove', aim);
      r.addEventListener('mouseleave', function () { active = false; peek.classList.remove('on'); });
    });
  }

  /* faq */
  $$('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.parentNode, open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* contact headline: per-letter hover */
  var talk = $('.talk');
  if (talk) {
    var text = talk.textContent.trim();
    talk.setAttribute('aria-label', text);
    talk.innerHTML = text.split('').map(function (ch, i) {
      return ch === ' ' ? ' ' : '<span aria-hidden="true" style="--c:' + i + '">' + ch + '</span>';
    }).join('');
  }
})();

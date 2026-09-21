(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  doc.documentElement.classList.add('js');

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;

  function hideLoader(el) {
    if (!el) return;
    el.classList.add('done');
    body.classList.add('is-loaded');
    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 900);
  }

  var loader = doc.getElementById('loader');
  window.addEventListener('load', function () {
    window.setTimeout(function () { hideLoader(loader); }, 350);
  });
  window.setTimeout(function () { hideLoader(loader); }, 2000);

  var todayLine = doc.getElementById('today-line');
  if (todayLine) {
    var days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var now = new Date();
    var dayName = days[now.getDay()];
    var dateText = dayName.charAt(0).toUpperCase() + dayName.slice(1) + ', ' + now.getDate() + ' de ' + months[now.getMonth()] + ' de ' + now.getFullYear();
    todayLine.textContent = now.getDay() === 1
      ? 'Hoy es lunes 💘 · ' + dateText
      : 'Feliz día, mi amor 💘 · ' + dateText;
  }

  /* ---------- Background canvas: floating hearts + sparkles ---------- */

  var canvas = doc.getElementById('bg-canvas');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var heartEmojis = ['💘'];
  var particles = { hearts: [], sparkles: [] };

  function sizeCanvas() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedParticles();
  }

  function seedParticles() {
    if (!canvas) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var heartCount = reducedMotion ? 0 : (w < 640 ? 14 : w < 1200 ? 20 : 28);
    var sparkleCount = reducedMotion ? 0 : (w < 640 ? 12 : w < 1200 ? 18 : 26);

    particles.hearts = [];
    for (var i = 0; i < heartCount; i++) {
      particles.hearts.push({
        x: Math.random() * w,
        y: Math.random() * (h + 160) - 80,
        size: 12 + Math.random() * 16,
        speed: 14 + Math.random() * 26,
        phase: Math.random() * Math.PI * 2,
        sway: 14 + Math.random() * 18,
        emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
        opacity: 0.3 + Math.random() * 0.5
      });
    }

    particles.sparkles = [];
    for (var j = 0; j < sparkleCount; j++) {
      particles.sparkles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 1.8,
        tw: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? '255,174,205' : '200,164,240'
      });
    }
  }

  var lastT = 0;
  var paused = false;

  function drawFrame(t) {
    if (paused) return;
    if (!ctx) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;

    ctx.clearRect(0, 0, w, h);

    for (var s = 0; s < particles.sparkles.length; s++) {
      var sp = particles.sparkles[s];
      var alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.001 * sp.tw + sp.phase));
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + sp.color + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < particles.hearts.length; i++) {
      var hp = particles.hearts[i];
      var y = ((hp.y - t * 0.001 * hp.speed) % (h + 160) + (h + 160)) % (h + 160) - 80;
      var x = hp.x + Math.sin(t * 0.001 * 0.9 + hp.phase) * hp.sway;
      ctx.globalAlpha = hp.opacity;
      ctx.font = hp.size + 'px sans-serif';
      ctx.fillText(hp.emoji, x, y);
    }
    ctx.globalAlpha = 1;

    window.requestAnimationFrame(drawFrame);
  }

  if (canvas && ctx) {
    if (!reducedMotion) {
      sizeCanvas();
      if (window.IntersectionObserver) {
        var frameId;
        var io = new IntersectionObserver(function (entries) {
          if (entries.some(function (en) { return en.isIntersecting; })) {
            window.cancelAnimationFrame(frameId);
            frameId = window.requestAnimationFrame(drawFrame);
          }
        });
        io.observe(canvas);
      } else {
        window.requestAnimationFrame(drawFrame);
      }
    } else {
      sizeCanvas();
      drawFrame(0);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeCanvas, 180);
    });

    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) {
        paused = true;
      } else {
        paused = false;
        lastT = 0;
        window.requestAnimationFrame(drawFrame);
      }
    });
  }

  /* ---------- Parallax blobs ---------- */

  var blobs = Array.prototype.slice.call(doc.querySelectorAll('.parallax'));
  var ticking = false;

  window.addEventListener('scroll', function () {
    if (reducedMotion || blobs.length === 0) return;
    if (!ticking) {
      window.requestAnimationFrame(function () {
        var y = window.pageYOffset;
        for (var i = 0; i < blobs.length; i++) {
          var speed = parseFloat(blobs[i].getAttribute('data-parallax')) || 0;
          blobs[i].style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ---------- Reveal on scroll ---------- */

  var revealEls = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));
  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealIo.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Music ---------- */

  var audio = doc.getElementById('bg-music');
  var audioFailed = false;

  function tryPlayMusic() {
    if (!audio || audioFailed || !audio.paused) return;
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () {});
    }
  }

  if (audio) {
    audio.volume = 0.5;
    audio.addEventListener('error', function () {
      audioFailed = true;
      removeUnlock();
    });

    tryPlayMusic();

    var unlockEvents = ['pointerdown', 'click', 'touchstart', 'touchend', 'keydown', 'scroll'];
    var unlock = function () {
      tryPlayMusic();
      if (audioFailed || !audio.paused) removeUnlock();
    };
    function removeUnlock() {
      unlockEvents.forEach(function (ev) {
        window.removeEventListener(ev, unlock);
      });
    }
    unlockEvents.forEach(function (ev) {
      window.addEventListener(ev, unlock, { passive: true });
    });
  }

  /* ---------- Heart explosion ---------- */

  var burstEmojis = ['💘', '💘', '💘', '🌸', '✨'];

  function explode(x, y, count) {
    if (reducedMotion) {
      count = Math.min(count, 8);
    }
    var burst = doc.createElement('div');
    burst.className = 'burst';
    doc.body.appendChild(burst);

    var mobile = isMobile;
    var total = mobile ? Math.min(count, 16) : count;
    for (var i = 0; i < total; i++) {
      var span = doc.createElement('span');
      span.textContent = burstEmojis[Math.floor(Math.random() * burstEmojis.length)];
      var angle = Math.random() * Math.PI * 2;
      var dist = mobile
        ? 60 + Math.random() * Math.min(window.innerWidth, 320)
        : 90 + Math.random() * Math.min(window.innerWidth * 0.55, 460);
      span.style.left = x + 'px';
      span.style.top = y + 'px';
      span.style.setProperty('--tx', (Math.cos(angle) * dist).toFixed(0) + 'px');
      span.style.setProperty('--ty', (Math.sin(angle) * dist - (mobile ? 30 : 60)).toFixed(0) + 'px');
      span.style.setProperty('--dur', (0.8 + Math.random() * 0.7).toFixed(2) + 's');
      span.style.setProperty('--ts', (16 + Math.random() * 20).toFixed(0) + 'px');
      burst.appendChild(span);
    }

    window.setTimeout(function () {
      if (burst.parentNode) burst.parentNode.removeChild(burst);
    }, 1800);
  }

  var surpriseBtn = doc.getElementById('surprise-btn');
  var againBtn = doc.getElementById('again-btn');
  var secret = doc.getElementById('secret');

  function revealSecret(origin) {
    var rect = origin.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    explode(x, y, 34);
    if (secret) secret.classList.add('show');
    if (surpriseBtn) surpriseBtn.style.opacity = '0';
  }

  if (surpriseBtn) {
    surpriseBtn.addEventListener('click', function () {
      revealSecret(surpriseBtn);
      window.setTimeout(function () {
        if (surpriseBtn) surpriseBtn.style.display = 'none';
      }, 600);
    });
  }

  if (againBtn) {
    againBtn.addEventListener('click', function () {
      againBtn.blur();
      revealSecret(againBtn);
    });
  }

  /* ---------- Back to top ---------- */

  var toTop = doc.getElementById('to-top');
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }
})();
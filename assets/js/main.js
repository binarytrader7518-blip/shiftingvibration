/* Shifting Vibrations — site interactions (no dependencies) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* Mobile navigation */
  var btn = d.querySelector('.menu-btn'), links = d.getElementById('nav-links');
  if (btn && links) {
    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  }

  /* FAQ accordion */
  d.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var a = d.getElementById(q.getAttribute('aria-controls'));
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (a) a.hidden = open;
    });
  });

  /* Scroll reveal */
  var rev = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  /* Pointer-driven 3D tilt on hero product */
  var tilt = d.querySelector('[data-tilt]');
  if (tilt && !reduce && window.matchMedia('(pointer:fine)').matches) {
    var host = tilt.parentElement;
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = 'rotateY(' + (x * 12).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg)';
    });
    host.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
  }

  /* Sticky buy bar */
  var bar = d.querySelector('.sticky-buy');
  if (bar && !sstore('sv_bar_closed')) {
    var onScroll = function () { bar.classList.toggle('show', window.scrollY > 700); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var cb = bar.querySelector('.close-bar');
    if (cb) cb.addEventListener('click', function () { bar.classList.remove('show'); sstore('sv_bar_closed', '1'); window.removeEventListener('scroll', onScroll); });
  }

  /* Centered promotional modal: ~6s after load, 24h cooldown after dismissal */
  var modal = d.getElementById('sv-modal'), lastFocus = null, modalOpen = false, modalPending = false;
  function focusables() { return modal.querySelectorAll('a[href],button:not([disabled])'); }
  function openModal() {
    if (!modal || modalOpen) return;
    lastFocus = d.activeElement; modalOpen = true;
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add('open'); });
    d.body.classList.add('modal-open');
    var f = focusables(); if (f.length) f[0].focus();
  }
  function closeModal() {
    if (!modalOpen) return; modalOpen = false;
    modal.classList.remove('open'); d.body.classList.remove('modal-open');
    store('sv_modal_until', String(Date.now() + 24 * 3600 * 1000));
    setTimeout(function () { modal.hidden = true; }, reduce ? 0 : 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
    modal.querySelectorAll('.btn').forEach(function (b) { b.addEventListener('click', function () { store('sv_modal_until', String(Date.now() + 24 * 3600 * 1000)); }); });
    d.addEventListener('keydown', function (e) {
      if (!modalOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
      if (e.key === 'Tab') {
        var f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var until = parseInt(store('sv_modal_until') || '0', 10);
    if (!(until > Date.now()) && !modal.hasAttribute('data-disabled')) {
      modalPending = true;
      var start = function () { setTimeout(openModal, 6000); };
      if (d.readyState === 'complete') start(); else window.addEventListener('load', start);
    }
  }

  /* Bottom-left informational notification (no fabricated purchase activity) */
  var toast = d.getElementById('sv-toast');
  if (toast && !sstore('sv_toast_closed')) {
    var msgs = [
      ['Shifting Vibrations includes 6 core tracks', 'Plus bonus soundscapes and a PDF guide.'],
      ['A 60-day money-back guarantee is offered by the seller', 'Refunds are handled through the seller and ClickBank.'],
      ['Instant digital download after checkout', 'Nothing ships, so there are no shipping costs.'],
      ['Designed for about 5 minutes of listening a day', 'Start with the Golden Ratio track, as the guide suggests.'],
      ['Compare what is included before you order', 'See the full track list and current price.']
    ];
    var i = 0, timer = null, hideT = null, stopped = false;
    var tt = toast.querySelector('[data-title]'), ts = toast.querySelector('[data-sub]');
    var show = function () {
      if (stopped || modalOpen) { schedule(); return; }
      tt.textContent = msgs[i % msgs.length][0]; ts.textContent = msgs[i % msgs.length][1]; i++;
      toast.hidden = false;
      requestAnimationFrame(function () { toast.classList.add('show'); });
      hideT = setTimeout(hide, 6000);
    };
    var hide = function () { toast.classList.remove('show'); schedule(); };
    var schedule = function () { if (stopped) return; clearTimeout(timer); timer = setTimeout(show, 18000 + Math.random() * 8000); };
    toast.querySelector('.x').addEventListener('click', function () { stopped = true; clearTimeout(timer); clearTimeout(hideT); toast.classList.remove('show'); sstore('sv_toast_closed', '1'); });
    setTimeout(show, modalPending ? 14000 : 5000);
  }
})();

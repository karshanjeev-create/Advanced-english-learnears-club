/* AELC — shared site behaviour */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Loader ---------- */
  const loader = document.querySelector('.loader-aelc');
  window.addEventListener('load', () => {
    setTimeout(() => loader && loader.classList.add('hide'), 400);
  });
  // fallback in case load event already fired
  setTimeout(() => loader && loader.classList.add('hide'), 2200);

  /* ---------- AOS ---------- */
  if (window.AOS) {
    AOS.init({ duration: 800, once: true, offset: 60, easing: 'ease-out-cubic' });
  }

  /* ---------- Navbar scroll state ---------- */
  const nav = document.querySelector('.aelc-nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');

    // scroll progress bar
    const bar = document.querySelector('.scroll-progress');
    if (bar) {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = scrolled + '%';
    }
    // back to top
    const btt = document.querySelector('.back-to-top');
    if (btt) {
      if (window.scrollY > 500) btt.classList.add('show');
      else btt.classList.remove('show');
    }
  };
  document.addEventListener('scroll', onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const panel = document.querySelector('.mobile-panel');
  const overlay = document.querySelector('.mobile-overlay');
  const closeBtn = document.querySelector('.mobile-panel-close');
  const openMenu = () => { panel && panel.classList.add('open'); overlay && overlay.classList.add('open'); };
  const closeMenu = () => { panel && panel.classList.remove('open'); overlay && overlay.classList.remove('open'); };
  toggle && toggle.addEventListener('click', openMenu);
  closeBtn && closeBtn.addEventListener('click', closeMenu);
  overlay && overlay.addEventListener('click', closeMenu);
  document.querySelectorAll('.mobile-panel a').forEach(a => a.addEventListener('click', closeMenu));

  /* ---------- Dark mode ---------- */
  const themeBtns = document.querySelectorAll('.theme-toggle');
  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('aelc-theme', t);
    themeBtns.forEach(b => {
      const icon = b.querySelector('i');
      if (icon) icon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
  };
  const saved = localStorage.getItem('aelc-theme') || 'light';
  applyTheme(saved);

  const fireRipple = (x, y) => {
    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    document.body.appendChild(ripple);
    requestAnimationFrame(() => ripple.classList.add('animate'));
    setTimeout(() => ripple.remove(), 750);
  };

  themeBtns.forEach(b => b.addEventListener('click', (e) => {
    const cur = document.documentElement.getAttribute('data-theme');
    const rect = b.getBoundingClientRect();
    fireRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }));

  /* ---------- Back to top click ---------- */
  document.querySelectorAll('.back-to-top').forEach(b => {
    b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  });

  /* ---------- Hero particles ---------- */
  const particleWrap = document.querySelector('.hero-particles');
  if (particleWrap) {
    const count = window.innerWidth < 768 ? 18 : 36;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      const size = Math.random() * 3 + 2;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = Math.random() * 100 + '%';
      s.style.bottom = (Math.random() * -20) + '%';
      s.style.animationDuration = (Math.random() * 10 + 10) + 's';
      s.style.animationDelay = (Math.random() * 10) + 's';
      particleWrap.appendChild(s);
    }
  }

  /* ---------- Hero cycling words ---------- */
  const cycleEl = document.querySelector('.cycle-word');
  if (cycleEl) {
    const words = JSON.parse(cycleEl.dataset.words || '["Learn","Communicate","Lead"]');
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % words.length;
      if (window.gsap) {
        gsap.to(cycleEl, { opacity: 0, y: -10, duration: .3, onComplete: () => {
          cycleEl.textContent = words[idx];
          gsap.to(cycleEl, { opacity: 1, y: 0, duration: .3 });
        }});
      } else {
        cycleEl.textContent = words[idx];
      }
    }, 2200);
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('.stat-num[data-count]');
  const runCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const tick = () => {
      cur += step;
      if (cur >= target) { el.textContent = target + suffix; return; }
      el.textContent = cur + suffix;
      requestAnimationFrame(tick);
    };
    tick();
  };
  if ('IntersectionObserver' in window && counters.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { runCounter(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
  }

  /* ---------- Title underline draw on view ---------- */
  if ('IntersectionObserver' in window) {
    const titles = document.querySelectorAll('.title-stroke');
    const obs2 = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
    }, { threshold: 0.6 });
    titles.forEach(t => obs2.observe(t));
  }

  /* ---------- Set active nav link ---------- */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.aelc-links a, .mobile-panel a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });

  /* ---------- Star rating (feedback page) ---------- */
  document.querySelectorAll('.star-rating').forEach(group => {
    const stars = group.querySelectorAll('i');
    stars.forEach((star, i) => {
      star.addEventListener('click', () => {
        stars.forEach((s, j) => s.classList.toggle('active', j <= i));
        group.dataset.value = i + 1;
      });
    });
  });

  /* ---------- Search modal (simple) ---------- */
  const searchBtn = document.querySelector('.search-toggle');
  const searchModal = document.querySelector('.search-modal');
  if (searchBtn && searchModal) {
    searchBtn.addEventListener('click', () => searchModal.classList.add('open'));
    searchModal.addEventListener('click', (e) => { if (e.target === searchModal) searchModal.classList.remove('open'); });
    const closeS = searchModal.querySelector('.search-close');
    closeS && closeS.addEventListener('click', () => searchModal.classList.remove('open'));
  }

  /* ---------- GSAP hero entrance ---------- */
  if (window.gsap) {
    gsap.from('.hero-badge', { opacity: 0, y: 20, duration: .8, delay: .2 });
    gsap.from('.hero-title', { opacity: 0, y: 30, duration: .9, delay: .35 });
    gsap.from('.hero-tagline', { opacity: 0, y: 20, duration: .8, delay: .55 });
    gsap.from('.hero-desc', { opacity: 0, y: 20, duration: .8, delay: .7 });
    gsap.from('.hero-actions', { opacity: 0, y: 20, duration: .8, delay: .85 });
    gsap.from('.hero-glass-card', { opacity: 0, x: 30, duration: 1, delay: .5 });
  }

});

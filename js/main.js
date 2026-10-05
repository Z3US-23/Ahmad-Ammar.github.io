const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Chapter headers reveal on scroll
document.querySelectorAll('.chapter-num, .chapter-title, .chapter-deck').forEach(el => el.classList.add('reveal'));

// Count-up for values like "650", "71.6%", ">4×"; add data-static to opt out (years, etc.)
function animateCount(el) {
  if (el.dataset.static !== undefined) return;
  const raw = el.textContent;
  const m = raw.match(/^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)([\s\S]*)$/);
  if (!m) return;
  const [, prefix, numRaw, suffix] = m;
  const numStr = numRaw.replace(/,/g, '');
  const target = parseFloat(numStr);
  if (!isFinite(target) || target === 0) return;
  const decimals = (numStr.split('.')[1] || '').length;
  const useCommas = numRaw.includes(',');
  const fmt = v => {
    let s = v.toFixed(decimals);
    if (useCommas) {
      const p = s.split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      s = p.join('.');
    }
    return s;
  };
  if (reducedMotion) { el.textContent = prefix + fmt(target) + suffix; return; }
  const dur = 1300, t0 = performance.now();
  let done = false;
  const tick = () => {
    if (done) return;
    const p = Math.min(1, (performance.now() - t0) / dur);
    el.textContent = prefix + fmt(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(tick); else done = true;
  };
  requestAnimationFrame(tick);
  // Make sure the final value lands even if rAF is throttled in a background tab
  setTimeout(() => { if (!done) { done = true; el.textContent = prefix + fmt(target) + suffix; } }, dur + 200);
}

// Values with nested markup (<em>, <small>) keep it; only the leading text node counts up
function animateLeading(el) {
  if (el.dataset.static !== undefined) return;
  if (!el.children.length) { animateCount(el); return; }
  const holder = document.createElement('span');
  holder.textContent = el.firstChild.textContent;
  el.replaceChild(holder, el.firstChild);
  animateCount(holder);
}

function reveal(el) {
  el.classList.add('visible');
  el.querySelectorAll('.stat-value').forEach(animateLeading);
  if (el.classList.contains('bignum')) animateLeading(el.querySelector('.n'));
  if (el.classList.contains('quad-wrap')) el.querySelectorAll('.quad-dot').forEach(d => d.classList.add('visible'));
}

const revealTargets = document.querySelectorAll('.project, .reveal, .bignum');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      reveal(e.target);
      observer.unobserve(e.target);
    });
  }, { threshold: 0.08 });
  revealTargets.forEach(el => observer.observe(el));
} else {
  // Old browsers: just show everything
  revealTargets.forEach(reveal);
}

// Hero counters run right after the load animation
setTimeout(() => document.querySelectorAll('.hero-meta .value').forEach(animateLeading), reducedMotion ? 0 : 500);

document.getElementById('year').textContent = new Date().getFullYear();

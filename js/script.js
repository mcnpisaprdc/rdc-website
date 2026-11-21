// Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', false);
  }));

  // Scroll reveal
  const revealEls = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));

  // Repository search filter
  function filterRepo() {
    const q = document.getElementById('repoSearch').value.trim().toLowerCase();
    const rows = document.querySelectorAll('#repoTable tbody tr');
    let visibleCount = 0;
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const match = text.includes(q);
      row.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });
    document.getElementById('noResults').style.display = visibleCount === 0 ? 'block' : 'none';
  }
  document.getElementById('repoSearchBtn').addEventListener('click', filterRepo);
  document.getElementById('repoSearch').addEventListener('input', filterRepo);
  document.getElementById('repoSearch').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); filterRepo(); }
  });

  // Contact form (no backend — just acknowledges input)
  function handleContactSubmit(e) {
    e.preventDefault();
    document.getElementById('formNote').style.display = 'block';
    e.target.reset();
    return false;
  }
    // Title Click Accordion Logic
    document.querySelectorAll('.doc-title-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.doc-item');
        const isOpen = item.classList.contains('open');
        
        if (isOpen) {
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Course & Category Filtering Logic
    let currentCourseFilter = 'all';
    let currentCategoryFilter = 'all';

    function applyResourceFilters() {
      const items = document.querySelectorAll('.doc-item');
      let visibleCount = 0;
      let downloadCount = 0;
      const mcnpCourses = ['pharmacy', 'nursing', 'mls', 'radtech', 'pt'];
      const isapCourses = ['criminology', 'it', 'computer-eng', 'tourism', 'hospitality', 'social-work', 'psychology', 'bsed', 'bped', 'accountancy', 'customs', 'business'];

      const isMcnpCourse = mcnpCourses.includes(currentCourseFilter);
      const isIsapCourse = isapCourses.includes(currentCourseFilter);

      const showMcnp = (currentCategoryFilter === 'mcnp' || currentCategoryFilter === 'all') && !isIsapCourse;
      const showIsap = (currentCategoryFilter === 'isap' || currentCategoryFilter === 'all') && !isMcnpCourse;
      let forthcomingCount = 0;
      document.querySelectorAll('.course-pill').forEach(pill => {
        const selected = pill.dataset.course === currentCourseFilter;
        pill.classList.toggle('active', selected);
        pill.setAttribute('aria-pressed', String(selected));
      });
      document.querySelectorAll('.doc-filter-btn').forEach(btn => {
        const selected = btn.dataset.filter === currentCategoryFilter;
        btn.classList.toggle('active', selected);
        btn.setAttribute('aria-pressed', String(selected));
      });

      const mcnpNotice = document.getElementById('mcnpNoticeBanner');
      const isapNotice = document.getElementById('isapNoticeBanner');

      if (mcnpNotice) {
        mcnpNotice.style.display = showMcnp ? 'block' : 'none';
      }
      if (isapNotice) {
        isapNotice.style.display = showIsap ? 'block' : 'none';
      }

      items.forEach(item => {
        const rawCourses = item.getAttribute('data-courses') || '';
        const courseList = rawCourses.trim().split(/\s+/);
        const itemCat = item.getAttribute('data-category') || 'all';

        const matchesCourse = (currentCourseFilter === 'all') || 
                              courseList.includes(currentCourseFilter) || 
                              courseList.includes('all');
        const matchesCat = (currentCategoryFilter === 'all') || 
                            (itemCat === currentCategoryFilter);

        const matchesInstitution = !(itemCat === 'isap' && isMcnpCourse) && !(itemCat === 'mcnp' && isIsapCourse);
        if (matchesCourse && matchesCat && matchesInstitution) {
          item.style.display = 'block';
          if (item.dataset.available === 'false') forthcomingCount++;
          else {
            visibleCount++;
            downloadCount += item.querySelectorAll('a[download]').length;
          }
        } else {
          item.style.display = 'none';
          item.classList.remove('open');
          const trigger = item.querySelector('.doc-title-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      });

      const countEl = document.getElementById('visibleDocCount');
      if (countEl) {
        countEl.textContent = visibleCount + ' available resource group' + (visibleCount === 1 ? '' : 's') +
          (downloadCount ? ' (' + downloadCount + ' form downloads)' : '') +
          (forthcomingCount ? ' • ' + forthcomingCount + ' video preview — not yet available' : '') +
          (showMcnp || showIsap ? ' • Course media archives not yet available' : '');
      }

      const emptyMsg = document.getElementById('docEmptyState');
      if (emptyMsg) {
        emptyMsg.style.display = (visibleCount === 0 && forthcomingCount === 0 && !showMcnp && !showIsap) ? 'block' : 'none';
      }
    }

    // Course Filter Pills
    document.querySelectorAll('.course-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.course-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCourseFilter = pill.getAttribute('data-course');
        applyResourceFilters();
      });
    });

    // Institutional / Category Filter Buttons (Unified Portal)
    document.querySelectorAll('.doc-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.doc-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategoryFilter = btn.getAttribute('data-filter');
        applyResourceFilters();
      });
    });

    // Global Reset Filter function
    window.resetDocFilters = function() {
      currentCourseFilter = 'all';
      currentCategoryFilter = 'all';
      document.querySelectorAll('.course-pill').forEach(p => {
        if (p.getAttribute('data-course') === 'all') p.classList.add('active');
        else p.classList.remove('active');
      });
      document.querySelectorAll('.doc-filter-btn').forEach(b => {
        if (b.getAttribute('data-filter') === 'all') b.classList.add('active');
        else b.classList.remove('active');
      });
      applyResourceFilters();
    };

    // Lightbox Logic
    const lightbox = document.getElementById('docLightbox');
    const lightboxImg = document.getElementById('docLightboxImg');
    const lightboxCaption = document.getElementById('docLightboxCaption');
    const lightboxClose = document.getElementById('docLightboxClose');

    if (lightbox) {
      document.querySelectorAll('.doc-gallery-thumb').forEach(thumb => {
        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          const img = thumb.querySelector('img');
          if (img) {
            lightboxImg.src = img.src;
            lightboxCaption.textContent = img.alt || 'Institutional Research Documentation';
            lightbox.classList.add('active');
          }
        });
      });

      lightboxClose?.addEventListener('click', () => lightbox.classList.remove('active'));
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') lightbox.classList.remove('active');
      });
    }

    // Run initial filter count
    applyResourceFilters();

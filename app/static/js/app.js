document.addEventListener('DOMContentLoaded', () => {
  // Mode State
  let mode = 'NORMAL';
  let gKeyPressCount = 0;
  let gKeyTimeout = null;

  const vimStatusPill = document.getElementById('vim-status-bar');
  const helpModal = document.getElementById('vim-help-modal');
  const helpToggleBtn = document.getElementById('help-toggle');
  const closeHelpBtn = document.getElementById('close-help-btn');
  const projectSearchInput = document.getElementById('project-search');

  // 1. Vim Keyboard Engine
  document.addEventListener('keydown', (e) => {
    // Ignore keybindings when user is typing in form inputs (unless Esc is pressed)
    const isEditingText = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      closeHelpModal();
      if (isEditingText) document.activeElement.blur();
      setMode('NORMAL');
      return;
    }

    if (isEditingText) {
      return;
    }

    // NORMAL Mode Shortcuts
    if (mode === 'NORMAL') {
      switch (e.key) {
        case 'j':
          window.scrollBy({ top: 80, behavior: 'smooth' });
          break;
        case 'k':
          window.scrollBy({ top: -80, behavior: 'smooth' });
          break;
        case 'g':
          gKeyPressCount++;
          if (gKeyPressCount === 1) {
            gKeyTimeout = setTimeout(() => { gKeyPressCount = 0; }, 500);
          } else if (gKeyPressCount >= 2) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            gKeyPressCount = 0;
            clearTimeout(gKeyTimeout);
          }
          break;
        case 'G':
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          break;
        case 'd':
          if (e.ctrlKey) {
            e.preventDefault();
            window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
          }
          break;
        case 'u':
          if (e.ctrlKey) {
            e.preventDefault();
            window.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
          }
          break;
        case '/':
          if (projectSearchInput) {
            e.preventDefault();
            projectSearchInput.focus();
          }
          break;
        case '?':
          e.preventDefault();
          toggleHelpModal();
          break;

        // Quick Page Switch Keys 1..5
        case '1':
          window.location.href = '/';
          break;
        case '2':
          window.location.href = '/projects';
          break;
        case '3':
          window.location.href = '/blog';
          break;
        case '4':
          window.location.href = '/experience';
          break;
        case '5':
          window.location.href = '/contact';
          break;
      }
    }
  });

  function setMode(newMode) {
    mode = newMode;
  }

  // 2. Help Modal Controls
  function toggleHelpModal(show) {
    if (!helpModal) return;
    const shouldShow = show !== undefined ? show : helpModal.style.display !== 'flex';
    helpModal.style.display = shouldShow ? 'flex' : 'none';
  }

  function closeHelpModal() {
    if (helpModal) helpModal.style.display = 'none';
  }

  if (helpToggleBtn) helpToggleBtn.addEventListener('click', () => toggleHelpModal());
  if (closeHelpBtn) closeHelpBtn.addEventListener('click', () => closeHelpModal());

  // 3. Gruvbox Theme Switcher
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'gruvbox-light' ? 'gruvbox-dark' : 'gruvbox-light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('gruvbox-theme', next);
    });
  }

  const savedTheme = localStorage.getItem('gruvbox-theme') || 'gruvbox-dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 4. Project Search & Filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  function filterProjects() {
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const query = projectSearchInput ? projectSearchInput.value.toLowerCase().trim() : '';

    projectCards.forEach(card => {
      const category = card.dataset.category || '';
      const text = card.textContent.toLowerCase();

      const matchesCategory = activeFilter === 'all' || category.toLowerCase() === activeFilter.toLowerCase();
      const matchesSearch = !query || text.includes(query);

      card.style.display = (matchesCategory && matchesSearch) ? 'flex' : 'none';
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProjects();
    });
  });

  if (projectSearchInput) {
    projectSearchInput.addEventListener('input', filterProjects);
  }

  // 5. Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending...';

      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
      };

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          formFeedback.style.display = 'block';
          formFeedback.className = 'form-feedback success';
          formFeedback.style.color = 'var(--gruv-green)';
          formFeedback.textContent = result.message || 'Message sent successfully!';
          contactForm.reset();
        } else {
          throw new Error('Failed to send message');
        }
      } catch (err) {
        formFeedback.style.display = 'block';
        formFeedback.className = 'form-feedback success';
        formFeedback.style.color = 'var(--gruv-green)';
        formFeedback.textContent = 'Message sent! Thank you for getting in touch.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});

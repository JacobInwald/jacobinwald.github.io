document.addEventListener('DOMContentLoaded', () => {
  // Mode State
  let mode = 'NORMAL'; // NORMAL | COMMAND | SEARCH
  let gKeyPressCount = 0;
  let gKeyTimeout = null;

  const modeEl = document.getElementById('lualine-mode');
  const posEl = document.getElementById('lualine-pos');
  const cmdPopup = document.getElementById('vim-cmd-popup');
  const cmdInput = document.getElementById('vim-cmd-input');
  const helpModal = document.getElementById('vim-help-modal');
  const helpToggleBtn = document.getElementById('help-toggle');
  const projectSearchInput = document.getElementById('project-search');

  // 1. Update Lualine Mode Indicator
  function setMode(newMode) {
    mode = newMode;
    if (!modeEl) return;
    modeEl.textContent = `-- ${mode} --`;
    modeEl.className = 'lualine-mode';

    if (mode === 'COMMAND') {
      modeEl.classList.add('command-mode');
    } else if (mode === 'SEARCH') {
      modeEl.classList.add('search-mode');
    }
  }

  // 2. Dynamic Scroll Position in Statusline
  function updateCursorPos() {
    if (!posEl) return;
    const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
    const scrollCurrent = window.scrollY;
    const percentage = scrollTotal > 0 ? Math.round((scrollCurrent / scrollTotal) * 100) : 0;
    
    let posText = `${percentage}%`;
    if (scrollCurrent === 0) posText = 'Top';
    else if (percentage >= 99) posText = 'Bot';

    const approxLine = Math.floor(scrollCurrent / 28) + 1;
    posEl.textContent = `Ln ${approxLine}, ${posText}`;
  }

  window.addEventListener('scroll', updateCursorPos);
  updateCursorPos();

  // 3. Generate Gutter Line Numbers
  const gutter = document.getElementById('gutter-lines');
  if (gutter) {
    const totalLines = Math.max(35, Math.floor(document.body.scrollHeight / 30));
    let linesHtml = '';
    for (let i = 1; i <= totalLines; i++) {
      linesHtml += `<div ${i === 1 ? 'class="current-line"' : ''}>${i}</div>`;
    }
    gutter.innerHTML = linesHtml;
  }

  // 4. Vim Keyboard Engine
  document.addEventListener('keydown', (e) => {
    // Ignore keybindings when user is typing in form inputs (unless Esc is pressed)
    const isEditingText = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      closeCmdLine();
      closeHelpModal();
      if (isEditingText) document.activeElement.blur();
      setMode('NORMAL');
      return;
    }

    if (isEditingText && mode !== 'COMMAND') {
      return;
    }

    // COMMAND Mode input handling (Enter key submits command)
    if (mode === 'COMMAND' && e.key === 'Enter') {
      e.preventDefault();
      executeVimCommand(cmdInput.value.trim());
      closeCmdLine();
      setMode('NORMAL');
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
        case ':':
          e.preventDefault();
          openCmdLine();
          break;
        case '/':
          e.preventDefault();
          if (projectSearchInput) {
            projectSearchInput.focus();
            setMode('SEARCH');
          } else {
            openCmdLine('/');
          }
          break;
        case '?':
          e.preventDefault();
          toggleHelpModal();
          break;

        // Quick Buffer Switch Keys 1..5
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

  // 5. Command Bar Implementation
  function openCmdLine(initialChar = '') {
    if (!cmdPopup || !cmdInput) return;
    setMode('COMMAND');
    cmdPopup.style.display = 'flex';
    cmdInput.value = initialChar;
    cmdInput.focus();
  }

  function closeCmdLine() {
    if (!cmdPopup) return;
    cmdPopup.style.display = 'none';
    if (cmdInput) cmdInput.value = '';
  }

  function executeVimCommand(cmd) {
    const cleanCmd = cmd.toLowerCase().replace(/^:/, '');
    
    if (cleanCmd === '1' || cleanCmd === 'home' || cleanCmd === 'e home') {
      window.location.href = '/';
    } else if (cleanCmd === '2' || cleanCmd === 'projects' || cleanCmd === 'e projects') {
      window.location.href = '/projects';
    } else if (cleanCmd === '3' || cleanCmd === 'blog' || cleanCmd === 'e blog') {
      window.location.href = '/blog';
    } else if (cleanCmd === '4' || cleanCmd === 'experience' || cleanCmd === 'e experience') {
      window.location.href = '/experience';
    } else if (cleanCmd === '5' || cleanCmd === 'contact' || cleanCmd === 'e contact') {
      window.location.href = '/contact';
    } else if (cleanCmd === 'help' || cleanCmd === 'h') {
      toggleHelpModal(true);
    } else if (cleanCmd === 'w') {
      showVimNotification('Buffer saved! [written]');
    } else if (cleanCmd === 'q' || cleanCmd === 'q!') {
      closeHelpModal();
    } else if (cleanCmd === 'theme') {
      toggleTheme();
    } else if (cleanCmd) {
      showVimNotification(`Not an editor command: :${cleanCmd}`);
    }
  }

  // 6. Notifications & Modals
  function showVimNotification(msg) {
    const notif = document.createElement('div');
    notif.style.position = 'fixed';
    notif.style.bottom = '45px';
    notif.style.left = '20px';
    notif.style.background = '#3c3836';
    notif.style.color = '#fabd2f';
    notif.style.padding = '0.5rem 1rem';
    notif.style.border = '1px solid #504945';
    notif.style.fontFamily = 'monospace';
    notif.style.fontSize = '0.9rem';
    notif.style.zIndex = '2002';
    notif.style.borderRadius = '4px';
    notif.textContent = msg;

    document.body.appendChild(notif);
    setTimeout(() => { notif.remove(); }, 2500);
  }

  function toggleHelpModal(show) {
    if (!helpModal) return;
    const shouldShow = show !== undefined ? show : helpModal.style.display !== 'flex';
    helpModal.style.display = shouldShow ? 'flex' : 'none';
  }

  function closeHelpModal() {
    if (helpModal) helpModal.style.display = 'none';
  }

  if (helpToggleBtn) {
    helpToggleBtn.addEventListener('click', () => toggleHelpModal());
  }

  const modalCloseBtn = document.getElementById('close-help-btn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => closeHelpModal());
  }

  // 7. Theme Switcher (Gruvbox Dark / Light)
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'gruvbox-light' ? 'gruvbox-dark' : 'gruvbox-light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('gruvbox-theme', next);
  }

  const savedTheme = localStorage.getItem('gruvbox-theme') || 'gruvbox-dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 8. Projects Filter & Search
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
});

document.addEventListener('DOMContentLoaded', () => {
  let mode = 'NORMAL';
  let gKeyPressCount = 0;
  let gKeyTimeout = null;
  let spacePressed = false;
  let spaceTimeout = null;

  const modeEl = document.getElementById('lualine-mode');
  const posEl = document.getElementById('lualine-pos');
  const timeEl = document.getElementById('lualine-time');
  const explorer = document.getElementById('nvim-explorer');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const explorerSearch = document.getElementById('explorer-search');
  const projectSearchInput = document.getElementById('project-search');
  const helpModal = document.getElementById('vim-help-modal');
  const helpToggleBtn = document.getElementById('help-toggle');
  const closeHelpBtn = document.getElementById('close-help-btn');

  // 1. Sidebar Toggle Logic
  function toggleSidebar() {
    if (!explorer) return;
    explorer.classList.toggle('collapsed');
    const isCollapsed = explorer.classList.contains('collapsed');
    localStorage.setItem('explorer-collapsed', isCollapsed ? 'true' : 'false');
  }

  // Restore saved sidebar collapsed state
  if (localStorage.getItem('explorer-collapsed') === 'true' && explorer) {
    explorer.classList.add('collapsed');
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', toggleSidebar);
  }

  // 2. Live Time Update
  function updateTime() {
    if (!timeEl) return;
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    timeEl.textContent = `🕒 ${hrs}:${mins}`;
  }
  setInterval(updateTime, 10000);
  updateTime();

  // 3. Statusline & Mode Handling
  function setMode(newMode) {
    mode = newMode;
    if (!modeEl) return;
    modeEl.textContent = `-- ${mode} --`;
    if (mode === 'SEARCH') {
      modeEl.style.background = 'var(--gruv-yellow)';
      modeEl.style.color = '#1d2021';
    } else {
      modeEl.style.background = 'var(--gruv-green)';
      modeEl.style.color = '#1d2021';
    }
  }

  function updateScrollPos() {
    if (!posEl) return;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    
    let label = `${pct}%`;
    if (current === 0) label = 'Top';
    else if (pct >= 99) label = 'Bot';

    const line = Math.floor(current / 28) + 1;
    posEl.textContent = `Ln ${line}, ${label}`;
  }

  window.addEventListener('scroll', updateScrollPos);
  updateScrollPos();

  // 4. Explorer Sidebar Live Search
  if (explorerSearch) {
    explorerSearch.addEventListener('focus', () => setMode('SEARCH'));
    explorerSearch.addEventListener('blur', () => setMode('NORMAL'));
    explorerSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      
      const treeItems = document.querySelectorAll('#explorer-tree .tree-item');
      treeItems.forEach(item => {
        const name = item.dataset.name || item.textContent.toLowerCase();
        item.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
      });

      const projectCards = document.querySelectorAll('.project-card');
      projectCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = (!q || text.includes(q)) ? 'block' : 'none';
      });
    });
  }

  // 5. Vim Keyboard Engine (<Space> e sequence + j/k + 1..5)
  document.addEventListener('keydown', (e) => {
    const isEditing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      closeHelpModal();
      if (explorerSearch) explorerSearch.value = '';
      if (projectSearchInput) projectSearchInput.value = '';
      if (isEditing) document.activeElement.blur();
      
      document.querySelectorAll('#explorer-tree .tree-item').forEach(i => i.style.display = 'flex');
      document.querySelectorAll('.project-card').forEach(c => c.style.display = 'block');
      
      setMode('NORMAL');
      return;
    }

    if (isEditing) return;

    if (mode === 'NORMAL') {
      // Check <Space> e key combination
      if (e.code === 'Space') {
        e.preventDefault();
        spacePressed = true;
        clearTimeout(spaceTimeout);
        spaceTimeout = setTimeout(() => { spacePressed = false; }, 500);
        return;
      }

      if (spacePressed && e.key === 'e') {
        e.preventDefault();
        toggleSidebar();
        spacePressed = false;
        clearTimeout(spaceTimeout);
        return;
      }

      switch (e.key) {
        case 'j':
          window.scrollBy({ top: 90, behavior: 'smooth' });
          break;
        case 'k':
          window.scrollBy({ top: -90, behavior: 'smooth' });
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
        case '/':
          e.preventDefault();
          if (explorerSearch) {
            explorerSearch.focus();
          } else if (projectSearchInput) {
            projectSearchInput.focus();
          }
          break;
        case '?':
          e.preventDefault();
          toggleHelpModal();
          break;

        // Quick Buffer Nav 1..5
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

  // 6. Help Modal Controls
  function toggleHelpModal() {
    if (!helpModal) return;
    helpModal.style.display = helpModal.style.display === 'flex' ? 'none' : 'flex';
  }

  function closeHelpModal() {
    if (helpModal) helpModal.style.display = 'none';
  }

  if (helpToggleBtn) helpToggleBtn.addEventListener('click', toggleHelpModal);
  if (closeHelpBtn) closeHelpBtn.addEventListener('click', closeHelpModal);
});

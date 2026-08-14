document.addEventListener('DOMContentLoaded', () => {
  let mode = 'NORMAL';
  let activeFocus = 'EDITOR'; // 'EDITOR' | 'EXPLORER'
  let gKeyPressCount = 0;
  let gKeyTimeout = null;
  let spacePressed = false;
  let spaceTimeout = null;
  let treeKeyboardIndex = -1;

  const tabs = ['/', '/projects/', '/blog/', '/experience/', '/contact/'];
  
  const modeEl = document.getElementById('lualine-mode');
  const posEl = document.getElementById('lualine-pos');
  const timeEl = document.getElementById('lualine-time');
  const bufferInfoEl = document.getElementById('lualine-buffer-info');
  const explorer = document.getElementById('nvim-explorer');
  const editorPane = document.getElementById('nvim-editor-pane');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const explorerSearch = document.getElementById('explorer-search');
  const projectSearchInput = document.getElementById('project-search');
  const helpModal = document.getElementById('vim-help-modal');
  const helpToggleBtn = document.getElementById('help-toggle');
  const closeHelpBtn = document.getElementById('close-help-btn');
  const gutter = document.getElementById('line-numbers-gutter');
  const editorBody = document.querySelector('.editor-body');

  // 1. Set Active Window Focus (Explorer vs Editor) & Highlight Borders
  function setFocus(targetFocus) {
    activeFocus = targetFocus;
    if (activeFocus === 'EXPLORER') {
      if (explorer && explorer.classList.contains('collapsed')) {
        toggleSidebar();
      }
      if (explorer) explorer.classList.add('focus-active');
      if (editorPane) editorPane.classList.remove('focus-active');
      if (bufferInfoEl) bufferInfoEl.innerHTML = '<i class="fa-solid fa-folder-open"></i> [EXPLORER FOCUS]';

      const visibleItems = getVisibleTreeItems();
      if (visibleItems.length > 0 && treeKeyboardIndex === -1) {
        setTreeItemFocus(0);
      }
    } else {
      if (editorPane) editorPane.classList.add('focus-active');
      if (explorer) explorer.classList.remove('focus-active');
      if (bufferInfoEl) {
        let path = window.location.pathname;
        if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
        path = path === '/' ? 'index' : path.replace(/^\//, '');
        bufferInfoEl.innerHTML = `<i class="fa-solid fa-bars-staggered"></i> ${path}.buffer`;
      }
      clearTreeItemFocus();
    }
  }

  function getVisibleTreeItems() {
    return Array.from(document.querySelectorAll('#explorer-tree .tree-item')).filter(
      item => item.style.display !== 'none'
    );
  }

  function setTreeItemFocus(idx) {
    const visibleItems = getVisibleTreeItems();
    if (visibleItems.length === 0) return;
    
    treeKeyboardIndex = Math.max(0, Math.min(visibleItems.length - 1, idx));
    visibleItems.forEach((item, i) => {
      if (i === treeKeyboardIndex) {
        item.classList.add('tree-keyboard-focused');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('tree-keyboard-focused');
      }
    });
  }

  function clearTreeItemFocus() {
    treeKeyboardIndex = -1;
    document.querySelectorAll('#explorer-tree .tree-item').forEach(i => i.classList.remove('tree-keyboard-focused'));
  }

  // 2. Line Numbers Calculation
  function generateLineNumbers() {
    if (!gutter || !editorBody) return;

    const contentHeight = editorBody.clientHeight;
    const lineHeight = 28.8;
    const exactLineCount = Math.max(1, Math.round(contentHeight / lineHeight));
    
    if (gutter.children.length === exactLineCount) return;

    const currentScrollLine = Math.min(
      exactLineCount,
      Math.max(1, Math.floor((editorPane ? editorPane.scrollTop : 0) / lineHeight) + 1)
    );

    let html = '';
    for (let i = 1; i <= exactLineCount; i++) {
      const isCurrent = i === currentScrollLine;
      html += `<div class="${isCurrent ? 'current' : ''}">${i}</div>`;
    }
    gutter.innerHTML = html;
  }

  generateLineNumbers();
  window.addEventListener('resize', generateLineNumbers);

  // 3. Sidebar Toggle
  function toggleSidebar() {
    if (!explorer) return;
    explorer.classList.toggle('collapsed');
    const isCollapsed = explorer.classList.contains('collapsed');
    localStorage.setItem('explorer-collapsed', isCollapsed ? 'true' : 'false');
  }

  if (localStorage.getItem('explorer-collapsed') === 'true' && explorer) {
    explorer.classList.add('collapsed');
  }

  requestAnimationFrame(() => {
    document.documentElement.classList.remove('explorer-is-collapsed');
  });

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', toggleSidebar);
  }

  // 4. Live Time Update
  function updateTime() {
    if (!timeEl) return;
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    timeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${hrs}:${mins}`;
  }
  setInterval(updateTime, 10000);
  updateTime();

  // 5. Statusline Mode & Scroll Pos
  function setMode(newMode) {
    mode = newMode;
    if (!modeEl) return;
    modeEl.textContent = mode;
    if (mode === 'SEARCH') {
      modeEl.style.background = '#fabd2f';
      modeEl.style.color = '#1d2021';
    } else {
      modeEl.style.background = '#a89984';
      modeEl.style.color = '#1d2021';
    }
  }

  function updateScrollPos() {
    if (!posEl || !editorPane) return;
    const total = editorPane.scrollHeight - editorPane.clientHeight;
    const current = editorPane.scrollTop;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    
    let label = `${pct}%`;
    if (current === 0) label = 'Top';
    else if (pct >= 99) label = 'Bot';

    const line = Math.floor(current / 28.8) + 1;
    posEl.textContent = `${label} ${line}:1`;

    if (gutter && gutter.children.length > 0) {
      const lineDivs = gutter.children;
      const targetIdx = Math.min(lineDivs.length - 1, line - 1);
      for (let i = 0; i < lineDivs.length; i++) {
        if (i === targetIdx) {
          lineDivs[i].classList.add('current');
        } else {
          lineDivs[i].classList.remove('current');
        }
      }
    }
  }

  if (editorPane) {
    editorPane.addEventListener('scroll', updateScrollPos);
  }
  updateScrollPos();

  // 6. Live Search
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

      if (activeFocus === 'EXPLORER') setTreeItemFocus(0);
    });
  }

  // 7. Tab Switching Helpers (H / L)
  function navigateTab(direction) {
    let currentPath = window.location.pathname;
    if (!currentPath.endsWith('/')) {
      currentPath = currentPath + '/';
    }
    
    let currIdx = tabs.indexOf(currentPath);
    if (currIdx === -1) currIdx = 0;

    let targetIdx;
    if (direction === 'left') {
      targetIdx = (currIdx - 1 + tabs.length) % tabs.length;
    } else {
      targetIdx = (currIdx + 1) % tabs.length;
    }
    window.location.href = tabs[targetIdx];
  }

  // 8. Master Neovim Keyboard Shortcuts Engine
  document.addEventListener('keydown', (e) => {
    const isEditing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      closeHelpModal();
      if (explorerSearch) explorerSearch.value = '';
      if (projectSearchInput) projectSearchInput.value = '';
      if (isEditing) document.activeElement.blur();
      
      document.querySelectorAll('#explorer-tree .tree-item').forEach(i => i.style.display = 'flex');
      document.querySelectorAll('.project-card').forEach(c => c.style.display = 'block');
      
      setFocus('EDITOR');
      setMode('NORMAL');
      return;
    }

    if (isEditing) return;

    // Ctrl + H / Ctrl + L for switching window split focus
    if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      setFocus('EXPLORER');
      return;
    }
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      setFocus('EDITOR');
      return;
    }

    // Shift + H / H for Tab Left, Shift + L / L for Tab Right
    if (e.key === 'H' || (e.shiftKey && (e.key === 'h' || e.key === 'H'))) {
      e.preventDefault();
      navigateTab('left');
      return;
    }
    if (e.key === 'L' || (e.shiftKey && (e.key === 'l' || e.key === 'L'))) {
      e.preventDefault();
      navigateTab('right');
      return;
    }

    if (mode === 'NORMAL') {
      // Space e to toggle Explorer
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

      // Context-aware Vim Keybindings (Explorer Focus vs Editor Focus)
      if (activeFocus === 'EXPLORER') {
        const visibleItems = getVisibleTreeItems();
        if (visibleItems.length === 0) return;

        switch (e.key) {
          case 'j':
          case 'ArrowDown':
            e.preventDefault();
            setTreeItemFocus(treeKeyboardIndex + 1);
            break;
          case 'k':
          case 'ArrowUp':
            e.preventDefault();
            setTreeItemFocus(treeKeyboardIndex - 1);
            break;
          case 'Enter':
          case 'l':
            e.preventDefault();
            if (treeKeyboardIndex >= 0 && visibleItems[treeKeyboardIndex]) {
              visibleItems[treeKeyboardIndex].click();
            }
            break;
          case 'g':
            gKeyPressCount++;
            if (gKeyPressCount === 1) {
              gKeyTimeout = setTimeout(() => { gKeyPressCount = 0; }, 500);
            } else if (gKeyPressCount >= 2) {
              setTreeItemFocus(0);
              gKeyPressCount = 0;
              clearTimeout(gKeyTimeout);
            }
            break;
          case 'G':
            setTreeItemFocus(visibleItems.length - 1);
            break;
        }
      } else {
        // EDITOR FOCUS MODE - Scroll inside editorPane buffer
        switch (e.key) {
          case 'j':
            if (editorPane) editorPane.scrollBy({ top: 90, behavior: 'smooth' });
            break;
          case 'k':
            if (editorPane) editorPane.scrollBy({ top: -90, behavior: 'smooth' });
            break;
          case 'g':
            gKeyPressCount++;
            if (gKeyPressCount === 1) {
              gKeyTimeout = setTimeout(() => { gKeyPressCount = 0; }, 500);
            } else if (gKeyPressCount >= 2) {
              if (editorPane) editorPane.scrollTo({ top: 0, behavior: 'smooth' });
              gKeyPressCount = 0;
              clearTimeout(gKeyTimeout);
            }
            break;
          case 'G':
            if (editorPane) editorPane.scrollTo({ top: editorPane.scrollHeight, behavior: 'smooth' });
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

          // Quick 1..5 Buffer Nav
          case '1':
            window.location.href = '/';
            break;
          case '2':
            window.location.href = '/projects/';
            break;
          case '3':
            window.location.href = '/blog/';
            break;
          case '4':
            window.location.href = '/experience/';
            break;
          case '5':
            window.location.href = '/contact/';
            break;
        }
      }
    }
  });

  // 9. Help Modal
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

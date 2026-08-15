document.addEventListener('DOMContentLoaded', () => {
  let mode = 'NORMAL';
  let activeFocus = sessionStorage.getItem('active-focus') || 'EDITOR'; // 'EDITOR' | 'EXPLORER'
  let gKeyPressCount = 0;
  let gKeyTimeout = null;
  let spacePressed = false;
  let spaceTimeout = null;
  let spaceBPressed = false;
  let spaceBTimeout = null;
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
    sessionStorage.setItem('active-focus', activeFocus);
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

  // Global pointerdown listener: Mouse click on Explorer or Editor immediately switches active focus exactly like Ctrl+H / Ctrl+L
  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.tab-close') || e.target.closest('#help-toggle') || e.target.closest('#sidebar-toggle-btn')) return;

    const treeItem = e.target.closest('#explorer-tree .tree-item');
    const explorerPane = e.target.closest('#nvim-explorer');
    const editorWindow = e.target.closest('#nvim-editor-pane');

    if (treeItem) {
      setFocus('EXPLORER');
      const visibleItems = getVisibleTreeItems();
      const itemIdx = visibleItems.indexOf(treeItem);
      if (itemIdx !== -1) {
        setTreeItemFocus(itemIdx);
      }
    } else if (explorerPane) {
      setFocus('EXPLORER');
    } else if (editorWindow) {
      setFocus('EDITOR');
    }
  }, true);

  // Set initial focus state on load
  setFocus(activeFocus);

  // -------------------------------------------------------------
  // Dynamic Buffer / Tab Close & Reopen Manager
  // -------------------------------------------------------------
  function getClosedTabs() {
    try {
      return JSON.parse(localStorage.getItem('closed-tabs') || '[]');
    } catch {
      return [];
    }
  }

  function saveClosedTabs(closedList) {
    localStorage.setItem('closed-tabs', JSON.stringify(closedList));
  }

  function normalizePath(p) {
    if (!p) return '/';
    if (!p.endsWith('/')) p += '/';
    return p;
  }

  function getTabOrder() {
    try {
      const stored = localStorage.getItem('tab-order');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['/', '/projects/', '/blog/', '/experience/', '/contact/'];
  }

  function saveTabOrder(order) {
    localStorage.setItem('tab-order', JSON.stringify(order));
  }

  function reopenTab(path) {
    const norm = normalizePath(path);
    let closed = getClosedTabs();
    const wasClosed = closed.includes(norm);
    if (wasClosed) {
      closed = closed.filter(item => item !== norm);
      saveClosedTabs(closed);
    }

    let order = getTabOrder();
    if (!order.includes(norm)) {
      order.push(norm);
      saveTabOrder(order);
    } else if (wasClosed) {
      order = order.filter(p => p !== norm);
      order.push(norm);
      saveTabOrder(order);
    }
  }

  function renderTablineState() {
    const currentPath = normalizePath(window.location.pathname);
    const closed = getClosedTabs();
    const order = getTabOrder();
    const wrapper = document.getElementById('tab-list-wrapper');
    const dashboard = document.getElementById('lazyvim-dashboard');
    const contentWrapper = document.getElementById('editor-content-wrapper');

    const openTabs = tabs.filter(t => !closed.includes(normalizePath(t)));
    const allClosed = openTabs.length === 0;

    if (allClosed) {
      if (wrapper) {
        wrapper.querySelectorAll('.tab-item').forEach(t => t.style.display = 'none');
      }
      if (dashboard) dashboard.style.display = 'flex';
      if (contentWrapper) contentWrapper.style.display = 'none';
      if (bufferInfoEl) bufferInfoEl.innerHTML = '<i class="fa-solid fa-terminal"></i> [LAZYVIM DASHBOARD]';
      return;
    }

    if (dashboard) dashboard.style.display = 'none';
    if (contentWrapper) contentWrapper.style.display = 'block';

    reopenTab(currentPath); // Always keep current buffer open when navigating

    if (!wrapper) return;

    const tabMap = {};
    document.querySelectorAll('#tab-list-wrapper .tab-item').forEach((tab) => {
      const norm = normalizePath(tab.dataset.path);
      tabMap[norm] = tab;
    });

    let visibleIndex = 1;

    // Append DOM nodes in dynamic open order
    order.forEach((path) => {
      const tab = tabMap[path];
      if (tab) {
        if (closed.includes(path)) {
          tab.style.display = 'none';
          tab.classList.remove('tab-opening');
        } else {
          const isWasHidden = tab.style.display === 'none';
          tab.style.display = 'flex';
          wrapper.appendChild(tab);

          const numSpan = tab.querySelector('.tab-num');
          if (numSpan) numSpan.textContent = visibleIndex;
          visibleIndex++;

          if (isWasHidden) {
            tab.classList.remove('tab-opening');
            void tab.offsetWidth;
            tab.classList.add('tab-opening');
            setTimeout(() => tab.classList.remove('tab-opening'), 300);
          }
        }
      }
    });
  }

  function animateTabClose(tabElements, callback) {
    const list = Array.isArray(tabElements) ? tabElements : [tabElements];
    const valid = list.filter(Boolean);
    if (valid.length === 0) {
      if (callback) callback();
      return;
    }
    valid.forEach(el => el.classList.add('tab-closing'));
    setTimeout(() => {
      valid.forEach(el => el.classList.remove('tab-closing'));
      if (callback) callback();
    }, 180);
  }

  function closeCurrentBuffer() {
    const currentPath = normalizePath(window.location.pathname);
    const activeTabElem = document.querySelector(`.tab-item[data-path="${window.location.pathname}"]`) || document.querySelector(`.tab-item[data-path="${currentPath}"]`);

    let closed = getClosedTabs();
    if (!closed.includes(currentPath)) {
      closed.push(currentPath);
      saveClosedTabs(closed);
    }

    animateTabClose(activeTabElem, () => {
      const openTabs = tabs.filter(t => !closed.includes(normalizePath(t)));
      if (openTabs.length > 0) {
        window.location.href = openTabs[0];
      } else {
        renderTablineState();
      }
    });
  }

  function closeOtherBuffers() {
    const currentPath = normalizePath(window.location.pathname);
    const otherTabElems = Array.from(document.querySelectorAll('#tab-list-wrapper .tab-item')).filter(t => {
      return normalizePath(t.dataset.path) !== currentPath;
    });

    const otherTabs = tabs.map(t => normalizePath(t)).filter(t => t !== currentPath);
    saveClosedTabs(otherTabs);

    animateTabClose(otherTabElems, () => {
      renderTablineState();
    });
  }

  // Handle Tab Close Click ('x' button) using event delegation
  const handleTabClose = (e) => {
    const closeBtn = e.target.closest('.tab-close');
    if (!closeBtn) return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    const rawPath = closeBtn.dataset.path || (closeBtn.parentElement ? closeBtn.parentElement.dataset.path : null);
    const path = normalizePath(rawPath);
    if (!path) return;

    const tabElem = closeBtn.closest('.tab-item');

    let closed = getClosedTabs();
    if (!closed.includes(path)) {
      closed.push(path);
      saveClosedTabs(closed);
    }

    const currentPath = normalizePath(window.location.pathname);
    animateTabClose(tabElem, () => {
      if (path === currentPath) {
        const openTabs = tabs.filter(t => !closed.includes(normalizePath(t)));
        if (openTabs.length > 0) {
          window.location.href = openTabs[0];
        } else {
          renderTablineState();
        }
      } else {
        renderTablineState();
      }
    });
  };

  const tabWrapper = document.getElementById('tab-list-wrapper');
  if (tabWrapper) {
    tabWrapper.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.tab-close')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        handleTabClose(e);
      }
    }, true);
    tabWrapper.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
    }, true);
  }

  // Re-open buffer when clicking any Explorer tree item
  document.querySelectorAll('#explorer-tree .tree-item').forEach((treeLink) => {
    treeLink.addEventListener('click', () => {
      const path = treeLink.dataset.path;
      if (path) {
        reopenTab(path);
      }
    });
  });

  renderTablineState();

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

    if (sidebarToggleBtn) {
      if (isCollapsed) {
        sidebarToggleBtn.classList.remove('is-open');
      } else {
        sidebarToggleBtn.classList.add('is-open');
      }
    }
  }

  if (localStorage.getItem('explorer-collapsed') === 'true' && explorer) {
    explorer.classList.add('collapsed');
  }

  if (explorer && !explorer.classList.contains('collapsed') && sidebarToggleBtn) {
    sidebarToggleBtn.classList.add('is-open');
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

  // 7. Tab Switching Helpers (H / L and Number Keys 1..5)
  function navigateTab(direction) {
    const visibleTabs = Array.from(document.querySelectorAll('#tab-list-wrapper .tab-item')).filter(
      tab => tab.style.display !== 'none'
    );
    if (visibleTabs.length === 0) return;

    let currentPath = normalizePath(window.location.pathname);
    let currIdx = visibleTabs.findIndex(tab => normalizePath(tab.dataset.path) === currentPath);
    if (currIdx === -1) currIdx = 0;

    let targetIdx;
    if (direction === 'left') {
      targetIdx = (currIdx - 1 + visibleTabs.length) % visibleTabs.length;
    } else {
      targetIdx = (currIdx + 1) % visibleTabs.length;
    }
    const targetPath = visibleTabs[targetIdx].dataset.path;
    if (targetPath) {
      window.location.href = targetPath;
    }
  }

  function navigateToVisibleTab(tabNumber) {
    const visibleTabs = Array.from(document.querySelectorAll('#tab-list-wrapper .tab-item')).filter(
      tab => tab.style.display !== 'none'
    );
    const targetIdx = tabNumber - 1;
    if (targetIdx >= 0 && targetIdx < visibleTabs.length) {
      const targetPath = visibleTabs[targetIdx].dataset.path;
      if (targetPath) {
        window.location.href = targetPath;
      }
    }
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
      // Space sequence tracking for Neovim buffer commands (<Space> e, <Space> b d, <Space> b o)
      if (e.code === 'Space') {
        e.preventDefault();
        spacePressed = true;
        spaceBPressed = false;
        clearTimeout(spaceTimeout);
        clearTimeout(spaceBTimeout);
        spaceTimeout = setTimeout(() => { spacePressed = false; }, 800);
        return;
      }

      if (spacePressed && e.key === 'e') {
        e.preventDefault();
        toggleSidebar();
        spacePressed = false;
        clearTimeout(spaceTimeout);
        return;
      }

      if (spacePressed && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        spaceBPressed = true;
        spacePressed = false;
        clearTimeout(spaceTimeout);
        clearTimeout(spaceBTimeout);
        spaceBTimeout = setTimeout(() => { spaceBPressed = false; }, 800);
        return;
      }

      if (spaceBPressed && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        closeCurrentBuffer();
        spaceBPressed = false;
        clearTimeout(spaceBTimeout);
        return;
      }

      if (spaceBPressed && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        closeOtherBuffers();
        spaceBPressed = false;
        clearTimeout(spaceBTimeout);
        return;
      }

      // LazyVim Welcome Screen Dashboard Shortcuts (when all buffers are closed)
      const closed = getClosedTabs();
      const openTabs = tabs.filter(t => !closed.includes(normalizePath(t)));
      if (openTabs.length === 0) {
        if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          reopenTab('/');
          window.location.href = '/';
          return;
        }
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          reopenTab('/projects/');
          window.location.href = '/projects/';
          return;
        }
        if (e.key === 'b' && !spacePressed) {
          e.preventDefault();
          reopenTab('/blog/');
          window.location.href = '/blog/';
          return;
        }
        if (e.key === 'e' && !spacePressed) {
          e.preventDefault();
          reopenTab('/experience/');
          window.location.href = '/experience/';
          return;
        }
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          reopenTab('/contact/');
          window.location.href = '/contact/';
          return;
        }
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          if (explorerSearch) explorerSearch.focus();
          return;
        }
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

          // Dynamic 1..5 Buffer Nav (matches visible tab sequence 1..5)
          case '1':
            navigateToVisibleTab(1);
            break;
          case '2':
            navigateToVisibleTab(2);
            break;
          case '3':
            navigateToVisibleTab(3);
            break;
          case '4':
            navigateToVisibleTab(4);
            break;
          case '5':
            navigateToVisibleTab(5);
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

  const lazyvimHelpBtn = document.getElementById('lazyvim-help-btn');
  if (helpToggleBtn) helpToggleBtn.addEventListener('click', toggleHelpModal);
  if (lazyvimHelpBtn) lazyvimHelpBtn.addEventListener('click', toggleHelpModal);
  if (closeHelpBtn) closeHelpBtn.addEventListener('click', closeHelpModal);

  document.querySelectorAll('.lazyvim-btn[data-path]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const path = btn.dataset.path;
      if (path) {
        reopenTab(path);
      }
    });
  });
});

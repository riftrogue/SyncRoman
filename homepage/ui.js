(function () {
  // DOM bindings for the homepage search/results/preview interface.
  const elements = {
    status: document.getElementById("status"),
    list: document.getElementById("song-list"),
    search: document.getElementById("song-search"),
    searchBtn: document.getElementById("song-search-btn"),
    searchClearBtn: document.getElementById("song-search-clear-btn"),
    songCount: document.getElementById("song-count"),
    dbStatus: document.getElementById("db-status"),
    totalCount: document.getElementById("total-count"),
    previewModal: document.getElementById("lyrics-preview-modal"),
    previewBox: document.getElementById("lyrics-preview-box"),
    previewCopyBtn: document.getElementById("preview-copy-btn"),
    previewDownloadBtn: document.getElementById("preview-download-btn"),
    previewCloseBtn: document.getElementById("preview-close-btn"),
  };

  const previewCard = elements.previewModal?.querySelector(":scope > div") || null;
  const previewTitle = elements.previewModal?.querySelector("h3") || null;

  let lastFocusedElement = null;

  function setStatus(message, type = "info") {
    elements.status.textContent = message;
    elements.status.dataset.state = type;
  }

  function setSongCount(count) {
    elements.songCount.textContent = `${count} result${count === 1 ? "" : "s"}`;
  }

  function clearSongList() {
    elements.list.innerHTML = "";
  }

  function renderSongs(songs, selectedSongId, handlers) {
    const utils = window.SyncRomanUtils;
    clearSongList();

    songs.forEach((song) => {
      const li = document.createElement("li");

      // Render each song as an accessible, keyboard-activatable list row.
      li.textContent = `${utils.formatSongLabel(song)} (${utils.formatDuration(song?.duration_seconds)})`;
      li.tabIndex = 0;
      li.setAttribute("role", "button");

      if (song.id === selectedSongId) {
        li.setAttribute("aria-current", "true");
      }

      li.addEventListener("click", () => {
        handlers.onSongClick(song);
      });

      li.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handlers.onSongClick(song);
        }
      });

      elements.list.appendChild(li);
    });
  }

  function getSearchQuery() {
    return window.SyncRomanUtils.normalizeSearchInput(elements.search.value);
  }

  function bindSearch(handlers) {
    const { onSearch, onClear } = handlers;

    elements.searchBtn.addEventListener("click", onSearch);
    elements.search.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        onSearch();
      }
    });

    elements.search.addEventListener("input", () => {
      if (!elements.search.value.trim() && onClear) {
        onClear();
      }
    });

    elements.searchClearBtn.addEventListener("click", () => {
      elements.search.value = "";
      elements.search.focus();
    });
  }

  function openPreviewModal() {
    lastFocusedElement = document.activeElement;
    elements.previewModal.hidden = false;
    if (previewCard) {
      if (!previewCard.hasAttribute("tabindex")) {
        previewCard.setAttribute("tabindex", "-1");
      }
      previewCard.focus();
    }
  }

  function closePreviewModal() {
    const activeEl = document.activeElement;
    if (activeEl && elements.previewModal.contains(activeEl)) {
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
      } else {
        elements.search.focus();
      }
    }

    elements.previewModal.hidden = true;
  }

  function setPreviewTitle(text) {
    if (previewTitle) {
      previewTitle.textContent = text;
    }
  }

  function setPreviewText(text) {
    elements.previewBox.textContent = text;
  }

  function setPreviewButtonsEnabled(enabled) {
    elements.previewCopyBtn.disabled = !enabled;
    elements.previewDownloadBtn.disabled = !enabled;
  }

  function bindPreviewActions(handlers) {
    elements.previewCopyBtn.addEventListener("click", handlers.onCopy);
    elements.previewDownloadBtn.addEventListener("click", handlers.onDownload);
    elements.previewCloseBtn.addEventListener("click", handlers.onClose);

    // Clicking outside the modal card closes the preview.
    elements.previewModal.addEventListener("click", (event) => {
      if (event.target === elements.previewModal) {
        handlers.onClose();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        handlers.onClose();
      }
    });
  }

  function setDatabaseStatus(healthy) {
    if (healthy) {
      elements.dbStatus.innerHTML = '<span class="db-status-dot db-status-dot-up"></span><span class="db-status-text">database up</span>';
      elements.dbStatus.title = "Database is up";
    } else {
      elements.dbStatus.innerHTML = '<span class="db-status-dot db-status-dot-down"></span><span class="db-status-text">database down</span>';
      elements.dbStatus.title = "Database is down or not responding";
    }
  }

  function setTotalCount(songs) {
    elements.totalCount.textContent = `${songs} song${songs === 1 ? "" : "s"}`;
  }

  window.SyncRomanUI = {
    setStatus,
    setSongCount,
    clearSongList,
    renderSongs,
    getSearchQuery,
    bindSearch,
    openPreviewModal,
    closePreviewModal,
    setPreviewTitle,
    setPreviewText,
    setPreviewButtonsEnabled,
    bindPreviewActions,
    setDatabaseStatus,
    setTotalCount,
  };
})();

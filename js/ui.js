(function () {
  const elements = {
    status: document.getElementById("status"),
    list: document.getElementById("song-list"),
    search: document.getElementById("song-search"),
    searchBtn: document.getElementById("song-search-btn"),
    searchClearBtn: document.getElementById("song-search-clear-btn"),
    songCount: document.getElementById("song-count"),
    previewModal: document.getElementById("lyrics-preview-modal"),
    previewBackdrop: document.getElementById("lyrics-preview-backdrop"),
    previewCard: document.getElementById("lyrics-preview-card"),
    previewTitle: document.getElementById("lyrics-preview-title"),
    previewBox: document.getElementById("lyrics-preview-box"),
    previewCopyBtn: document.getElementById("preview-copy-btn"),
    previewDownloadBtn: document.getElementById("preview-download-btn"),
    previewCloseBtn: document.getElementById("preview-close-btn"),
  };

  let lastFocusedElement = null;

  function setStatus(message, type = "info") {
    elements.status.textContent = message;
    elements.status.className = `status status-${type}`;
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
      const titleButton = document.createElement("button");
      const titleEl = document.createElement("span");
      const metaEl = document.createElement("span");
      const artistEl = document.createElement("span");
      const durationEl = document.createElement("span");

      titleButton.type = "button";
      titleButton.className = "song-item";
      if (song.id === selectedSongId) {
        titleButton.classList.add("song-item-active");
      }

      titleEl.className = "song-title";
      titleEl.textContent = song?.title || "Untitled";

      metaEl.className = "song-meta";

      artistEl.className = "song-artist";
      artistEl.textContent = song?.artist || "Unknown Artist";

      durationEl.className = "song-duration";
      durationEl.textContent = utils.formatDuration(song?.duration_seconds);

      metaEl.appendChild(artistEl);
      metaEl.appendChild(durationEl);

      titleButton.appendChild(titleEl);
      titleButton.appendChild(metaEl);

      titleButton.addEventListener("click", () => {
        handlers.onSongClick(song);
      });

      li.appendChild(titleButton);
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
    elements.previewModal.classList.remove("preview-modal-hidden");
    elements.previewCard.focus();
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

    elements.previewModal.classList.add("preview-modal-hidden");
    elements.previewModal.hidden = true;
  }

  function setPreviewTitle(text) {
    elements.previewTitle.textContent = text;
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
    elements.previewBackdrop.addEventListener("click", handlers.onClose);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        handlers.onClose();
      }
    });
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
  };
})();

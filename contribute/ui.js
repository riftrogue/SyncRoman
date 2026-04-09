(function () {
  const elements = {
    searchShell: document.getElementById("contrib-search-shell"),
    status: document.getElementById("contrib-status"),
    search: document.getElementById("contrib-search"),
    searchBtn: document.getElementById("contrib-search-btn"),
    clearBtn: document.getElementById("contrib-search-clear-btn"),
    list: document.getElementById("contrib-results"),
    pager: document.getElementById("contrib-pager"),
    prevBtn: document.getElementById("contrib-prev-btn"),
    nextBtn: document.getElementById("contrib-next-btn"),
    pageLabel: document.getElementById("contrib-page-label"),
    formShell: document.getElementById("contrib-form-shell"),
    formStatus: document.getElementById("contrib-form-status"),
    closeFormBtn: document.getElementById("contrib-form-close-btn"),
    title: document.getElementById("contrib-song-title"),
    artist: document.getElementById("contrib-song-artist"),
    album: document.getElementById("contrib-song-album"),
    duration: document.getElementById("contrib-song-duration"),
    lyrics: document.getElementById("contrib-song-lyrics"),
  };

  function setStatus(message) {
    elements.status.textContent = message;
  }

  function setPageLabel(pageNumber) {
    elements.pageLabel.textContent = `Page ${pageNumber}`;
  }

  function setPagerState({ canPrev, canNext }) {
    elements.prevBtn.disabled = !canPrev;
    elements.nextBtn.disabled = !canNext;
  }

  function setPagerVisible(visible) {
    elements.pager.hidden = !visible;
  }

  function clearResults() {
    elements.list.innerHTML = "";
  }

  function showSearchView() {
    elements.searchShell.hidden = false;
    elements.formShell.hidden = true;
    elements.search.focus();
  }

  function showFormView() {
    elements.searchShell.hidden = true;
    elements.formShell.hidden = false;
  }

  function hideForm() {
    showSearchView();
    elements.formStatus.textContent = "Review and edit details before submission.";
  }

  function showForm(song) {
    const seconds = song.durationMs == null ? null : Math.floor(song.durationMs / 1000);
    const durationText = window.SyncRomanUtils.formatDuration(seconds);

    elements.title.value = song.title || "";
    elements.artist.value = song.artist || "";
    elements.album.value = song.album === "No album info" ? "" : (song.album || "");
    elements.duration.value = durationText === "?:??" ? "" : durationText;
    elements.lyrics.value = "";

    elements.formStatus.textContent = `Selected MBID: ${song.id}`;
    showFormView();
  }

  function renderResults(results, onSelect) {
    clearResults();

    if (!results.length) {
      setStatus("No results found.");
      return;
    }

    for (const item of results) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      const title = document.createElement("span");
      const meta = document.createElement("span");

      button.type = "button";
      button.className = "result-item";

      title.className = "result-title";
      title.textContent = item.title;

      const duration = window.SyncRomanUtils.formatDuration(
        item.durationMs == null ? null : Math.floor(item.durationMs / 1000)
      );
      meta.className = "result-meta";
      meta.textContent = `${item.artist} • ${duration} • ${item.album}`;

      button.appendChild(title);
      button.appendChild(meta);
      button.addEventListener("click", () => onSelect(item));

      li.appendChild(button);
      elements.list.appendChild(li);
    }
  }

  function getQuery() {
    return elements.search.value.trim();
  }

  function bindHandlers(handlers) {
    elements.searchBtn.addEventListener("click", handlers.onSearch);
    elements.search.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handlers.onSearch();
      }
    });

    elements.clearBtn.addEventListener("click", () => {
      elements.search.value = "";
      handlers.onClear();
      elements.search.focus();
    });

    elements.prevBtn.addEventListener("click", handlers.onPrev);
    elements.nextBtn.addEventListener("click", handlers.onNext);
    elements.closeFormBtn.addEventListener("click", handlers.onFormClose);
  }

  window.SyncRomanContribUI = {
    setStatus,
    setPageLabel,
    setPagerState,
    setPagerVisible,
    clearResults,
    showSearchView,
    showForm,
    hideForm,
    renderResults,
    getQuery,
    bindHandlers,
  };
})();

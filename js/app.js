(function () {
  const ui = window.SyncRomanUI;
  const songsApi = window.SyncRomanSongs;
  const lyricsApi = window.SyncRomanLyrics;

  const state = {
    selectedSongId: null,
    searchResults: [],
    activeSearchToken: 0,
    previewLyricsText: "",
    previewSongLabel: "",
  };

  function resetToSearchPrompt() {
    state.searchResults = [];
    state.selectedSongId = null;
    state.previewLyricsText = "";
    state.previewSongLabel = "";

    ui.clearSongList();
    ui.setSongCount(0);
    ui.setStatus("Start typing to search songs", "info");
  }

  function renderSongs() {
    ui.renderSongs(state.searchResults, state.selectedSongId, {
      async onSongClick(song) {
        state.selectedSongId = song.id;
        renderSongs();
        await lyricsApi.openPreviewForSong(song, state);
      },
    });
  }

  async function runManualSearch() {
    const query = ui.getSearchQuery();

    if (!query) {
      resetToSearchPrompt();
      return;
    }

    const searchToken = ++state.activeSearchToken;
    ui.setStatus(`Searching for "${query}"...`, "info");

    const { songs, error } = await songsApi.fetchSongs(query);

    if (searchToken !== state.activeSearchToken) {
      return;
    }

    if (error) {
      console.error("songs query failed:", error);
      ui.clearSongList();
      ui.setSongCount(0);
      ui.setStatus(`Search failed: ${error.message}`, "error");
      return;
    }

    if (!songs.length) {
      state.searchResults = [];
      state.selectedSongId = null;
      ui.clearSongList();
      ui.setSongCount(0);
      ui.setStatus(`No songs found for "${query}"`, "warning");
      return;
    }

    state.searchResults = songs;
    songsApi.syncSelection(state);

    renderSongs();
    ui.setSongCount(songs.length);
    ui.setStatus(`Found ${songs.length} song(s)`, "success");
  }

  function init() {
    ui.bindSearch({
      onSearch: runManualSearch,
      onClear: resetToSearchPrompt,
    });

    ui.bindPreviewActions({
      onCopy() {
        lyricsApi.copyPreviewLyrics(state);
      },
      onDownload() {
        lyricsApi.downloadPreviewLrc(state);
      },
      onClose() {
        ui.closePreviewModal();
      },
    });

    resetToSearchPrompt();
  }

  init();
})();

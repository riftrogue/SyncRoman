(function () {
  // Data access layer for searchable songs shown on the homepage.
  const client = window.SyncRomanClient;
  const config = window.SyncRomanConfig;

  function logDebug(...args) {
    if (config.debug) {
      console.log(...args);
    }
  }

  async function fetchSongs(query) {
    // Search by title or artist, capped for predictable UI performance.
    const { data, error } = await client
      .from("songs")
      .select("id, title, artist, duration_seconds")
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
      .order("title", { ascending: true })
      .limit(config.maxSearchResults);

    logDebug("songs query result:", data);
    logDebug("songs query error:", error);

    return {
      songs: data || [],
      error: error || null,
    };
  }

  function syncSelection(state) {
    const selectedVisible = state.searchResults.some(
      (song) => song.id === state.selectedSongId
    );

    if (!selectedVisible) {
      state.selectedSongId = null;
    }
  }

  window.SyncRomanSongs = {
    fetchSongs,
    syncSelection,
  };
})();

(function () {
  // Handles lyrics retrieval plus preview copy/download actions.
  const client = window.SyncRomanClient;
  const utils = window.SyncRomanUtils;
  const ui = window.SyncRomanUI;
  const config = window.SyncRomanConfig;

  function logDebug(...args) {
    if (config.debug) {
      console.log(...args);
    }
  }

  async function fetchLyricsText(songId) {
    const { data, error } = await client
      .from("lyrics")
      .select("lrc_text")
      .eq("song_id", songId)
      .maybeSingle();

    logDebug("lyrics query result:", data);
    logDebug("lyrics query error:", error);

    if (error) {
      return { text: "", error };
    }

    return {
      text: data?.lrc_text || "",
      error: null,
    };
  }

  async function openPreviewForSong(song, state) {
    // Open immediately with loading text, then hydrate when DB returns.
    state.selectedSongId = song.id;
    state.previewSongLabel = utils.formatSongLabel(song);
    state.previewLyricsText = "";

    ui.setPreviewTitle("Preview");
    ui.setPreviewText("Loading lyrics...");
    ui.setPreviewButtonsEnabled(false);
    ui.openPreviewModal();
    ui.setStatus("Loading lyrics preview...", "info");

    const { text, error } = await fetchLyricsText(song.id);

    if (error) {
      console.error("lyrics query failed:", error);
      ui.setPreviewText("Could not load lyrics");
      ui.setStatus(`Failed to load lyrics: ${error.message}`, "error");
      return;
    }

    if (!text) {
      ui.setPreviewText("No lyrics yet");
      ui.setStatus("No lyrics found for this song", "warning");
      return;
    }

    state.previewLyricsText = text;
    ui.setPreviewText(text);
    ui.setPreviewButtonsEnabled(true);
    ui.setStatus("Lyrics preview loaded", "success");
  }

  async function copyPreviewLyrics(state) {
    if (!state.previewLyricsText) {
      ui.setStatus("No lyrics to copy", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(state.previewLyricsText);
      ui.setStatus("Lyrics copied to clipboard", "success");
    } catch (error) {
      console.error("copy failed:", error);
      ui.setStatus("Could not copy lyrics", "error");
    }
  }

  function downloadPreviewLrc(state) {
    if (!state.previewLyricsText) {
      ui.setStatus("No lyrics to download", "warning");
      return;
    }

    const baseName = utils.sanitizeFilename(state.previewSongLabel || "lyrics") || "lyrics";
    const fileName = `${baseName}.lrc`;

    const blob = new Blob([state.previewLyricsText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);

    ui.setStatus(`Downloaded ${fileName}`, "success");
  }

  window.SyncRomanLyrics = {
    openPreviewForSong,
    copyPreviewLyrics,
    downloadPreviewLrc,
  };
})();

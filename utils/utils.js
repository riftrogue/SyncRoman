// Shared formatting and input helpers used across homepage modules.
window.SyncRomanUtils = {
  formatSongLabel(song) {
    const title = song?.title || "Untitled";
    const artist = song?.artist || "Unknown Artist";
    return `${title} - ${artist}`;
  },

  formatDuration(seconds) {
    if (seconds === null || seconds === undefined) {
      return "?:??";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  },

  sanitizeFilename(input) {
    // Remove characters that are invalid in common desktop file systems.
    return String(input || "")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeSearchInput(input) {
    return String(input || "").trim();
  },
};

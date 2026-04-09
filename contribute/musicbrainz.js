(function () {
  const BASE_URL = "https://musicbrainz.org/ws/2/recording";

  function toArtistText(artistCredit) {
    if (!Array.isArray(artistCredit) || !artistCredit.length) {
      return "Unknown Artist";
    }

    return artistCredit
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        const name = part?.name || part?.artist?.name || "";
        const joinPhrase = typeof part?.joinphrase === "string" ? part.joinphrase : "";
        return `${name}${joinPhrase}`;
      })
      .join("")
      .trim() || "Unknown Artist";
  }

  function toArtistDisplay(recording) {
    const phrase = String(recording?.["artist-credit-phrase"] || "").trim();
    if (phrase) {
      return phrase;
    }

    return toArtistText(recording?.["artist-credit"]);
  }

  function toAlbumText(releases) {
    if (!Array.isArray(releases) || !releases.length) {
      return "No album info";
    }

    return releases[0]?.title || "No album info";
  }

  function rankRecordings(recordings, rawQuery) {
    const queryTokens = String(rawQuery || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return recordings
      .map((item) => {
        const title = String(item?.title || "").toLowerCase();
        const artist = toArtistText(item?.["artist-credit"]).toLowerCase();

        let score = 0;
        if (item?.title) score += 2;
        if (artist && artist !== "unknown artist") score += 3;
        if (item?.length) score += 2;
        if (Array.isArray(item?.releases) && item.releases.length) score += 1;

        for (const token of queryTokens) {
          if (title.includes(token)) score += 2;
          if (artist.includes(token)) score += 2;
        }

        return { ...item, _score: score };
      })
      .sort((a, b) => b._score - a._score);
  }

  function normalizeRecording(recording) {
    return {
      id: recording?.id || "",
      title: recording?.title || "Untitled",
      artist: toArtistDisplay(recording),
      durationMs: recording?.length || null,
      album: toAlbumText(recording?.releases),
      raw: recording,
    };
  }

  async function searchRecordings(query, options = {}) {
    const limit = Math.max(1, Math.min(100, Number(options.limit || 10)));
    const offset = Math.max(0, Number(options.offset || 0));

    const params = new URLSearchParams({
      query,
      fmt: "json",
      limit: String(limit),
      offset: String(offset),
      dismax: "true",
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz request failed: ${response.status}`);
    }

    const json = await response.json();
    const rawRecordings = Array.isArray(json?.recordings) ? json.recordings : [];
    const ranked = rankRecordings(rawRecordings, query).map(normalizeRecording);

    return {
      total: Number(json?.count || 0),
      offset: Number(json?.offset || 0),
      limit,
      results: ranked,
    };
  }

  window.SyncRomanContribMusicBrainz = {
    searchRecordings,
  };
})();

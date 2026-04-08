const searchInput = document.getElementById("mb-search-input");
const searchBtn = document.getElementById("mb-search-btn");
const statusText = document.getElementById("mb-search-status");
const resultsList = document.getElementById("mb-results");

function getArtist(recording) {
  if (!recording["artist-credit"] || !recording["artist-credit"].length) {
    return "Unknown Artist";
  }

  return recording["artist-credit"]
    .map((item) => {
      if (typeof item === "string") return item;
      return item.name || item.artist?.name || "";
    })
    .join("");
}

function getAlbum(recording) {
  if (!recording.releases || !recording.releases.length) {
    return "No album";
  }

  return recording.releases[0].title || "No album";
}

function clearResults() {
  resultsList.innerHTML = "";
}

function renderResults(recordings) {
  clearResults();

  if (!recordings.length) {
    statusText.textContent = "No songs found.";
    return;
  }

  recordings.forEach((recording) => {
    const li = document.createElement("li");
    li.className = "song-item";

    li.innerHTML = `
      <strong class="song-title">${recording.title || "Untitled"}</strong>
      <p class="song-artist">Artist: ${getArtist(recording)}</p>
      <p class="song-album">Album: ${getAlbum(recording)}</p>
    `;

    resultsList.appendChild(li);
  });

  statusText.textContent = `Found ${recordings.length} result(s).`;
}

async function searchMusicBrainz(query) {
  const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&fmt=json&limit=8&inc=artist-credits+releases`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch results");
  }

  const data = await response.json();
  return data.recordings || [];
}

async function handleSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    statusText.textContent = "Please enter a song name.";
    clearResults();
    return;
  }

  searchBtn.disabled = true;
  statusText.textContent = "Searching...";
  clearResults();

  try {
    const recordings = await searchMusicBrainz(query);
    renderResults(recordings);
  } catch (error) {
    console.error(error);
    statusText.textContent = "Something went wrong while searching.";
  } finally {
    searchBtn.disabled = false;
  }
}

searchBtn.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});
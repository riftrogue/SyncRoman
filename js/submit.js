const searchSection = document.getElementById("search-section");
const formSection = document.getElementById("form-section");

const searchInput = document.getElementById("mb-search-input");
const searchBtn = document.getElementById("mb-search-btn");
const statusText = document.getElementById("mb-search-status");
const resultsList = document.getElementById("mb-results");

const titleInput = document.getElementById("song-title");
const artistInput = document.getElementById("song-artist");
const albumInput = document.getElementById("song-album");
const durationInput = document.getElementById("song-duration");
const mbidInput = document.getElementById("song-mbid");
const lyricsInput = document.getElementById("song-lyrics");

const backToSearchBtn = document.getElementById("back-to-search-btn");

function getArtist(recording) {
  if (!recording["artist-credit"] || !recording["artist-credit"].length) {
    return "";
  }

  return recording["artist-credit"]
    .map((item) => {
      if (typeof item === "string") return item;
      return item.name || item.artist?.name || "";
    })
    .join("")
    .trim();
}

function getAlbum(recording) {
  if (!recording.releases || !recording.releases.length) {
    return "";
  }

  return recording.releases[0].title || "";
}

function formatDuration(lengthMs) {
  if (!lengthMs) return "";

  const totalSeconds = Math.floor(lengthMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function clearResults() {
  resultsList.innerHTML = "";
}

function showSearchSection() {
  formSection.style.display = "none";
  searchSection.style.display = "block";
}

function showFormSection() {
  searchSection.style.display = "none";
  formSection.style.display = "block";
}

function fillForm(recording) {
  titleInput.value = recording.title || "";
  artistInput.value = getArtist(recording);
  albumInput.value = getAlbum(recording);
  durationInput.value = formatDuration(recording.length);
  mbidInput.value = recording.id || "";

  showFormSection();
}

function createResultItem(recording) {
  const li = document.createElement("li");
  li.className = "song-item";

  const title = recording.title || "Untitled";
  const artist = getArtist(recording) || "Unknown Artist";
  const album = getAlbum(recording) || "No album";

  li.innerHTML = `
    <strong class="song-title">${title}</strong>
    <p class="song-artist">Artist: ${artist}</p>
    <p class="song-album">Album: ${album}</p>
  `;

  li.style.cursor = "pointer";

  li.addEventListener("click", () => {
    fillForm(recording);
  });

  return li;
}

function renderResults(recordings) {
  clearResults();

  if (!recordings.length) {
    statusText.textContent = "No songs found.";
    return;
  }

  recordings.forEach((recording) => {
    resultsList.appendChild(createResultItem(recording));
  });

  statusText.textContent = `Found ${recordings.length} result(s). Click one to continue.`;
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
    event.preventDefault();
    handleSearch();
  }
});

if (backToSearchBtn) {
  backToSearchBtn.addEventListener("click", () => {
    showSearchSection();
  });
}

showSearchSection();
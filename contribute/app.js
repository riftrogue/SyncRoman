(function () {
  const ui = window.SyncRomanContribUI;
  const mb = window.SyncRomanContribMusicBrainz;

  const state = {
    query: "",
    limit: 10,
    offset: 0,
    total: 0,
    selected: null,
    searchScrollY: 0,
  };

  async function runSearch() {
    const query = ui.getQuery();
    if (!query) {
      state.query = "";
      state.offset = 0;
      state.total = 0;
      ui.clearResults();
      ui.setStatus("Search songs from MusicBrainz");
      ui.setPageLabel(1);
      ui.setPagerVisible(false);
      ui.setPagerState({ canPrev: false, canNext: false });
      return;
    }

    state.query = query;
    ui.setPagerVisible(true);
    ui.setStatus(`Searching for "${query}"...`);

    try {
      const data = await mb.searchRecordings(query, {
        limit: state.limit,
        offset: state.offset,
      });

      state.total = data.total;
      ui.renderResults(data.results, (item) => {
        state.searchScrollY = window.scrollY;
        state.selected = item;
        ui.showForm(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      const pageNumber = Math.floor(state.offset / state.limit) + 1;
      ui.setPageLabel(pageNumber);
      ui.setStatus(`Found ${state.total} result(s)`);
      ui.setPagerState({
        canPrev: state.offset > 0,
        canNext: state.offset + state.limit < state.total,
      });
    } catch (error) {
      console.error(error);
      ui.clearResults();
      ui.setStatus("MusicBrainz search failed. Please try again.");
      ui.setPagerState({ canPrev: state.offset > 0, canNext: false });
    }
  }

  function prevPage() {
    if (state.offset <= 0) {
      return;
    }

    state.offset = Math.max(0, state.offset - state.limit);
    runSearch();
  }

  function nextPage() {
    if (state.offset + state.limit >= state.total) {
      return;
    }

    state.offset += state.limit;
    runSearch();
  }

  function clearSearch() {
    state.query = "";
    state.offset = 0;
    state.total = 0;
    state.selected = null;
    ui.clearResults();
    ui.setStatus("Search songs from MusicBrainz");
    ui.setPageLabel(1);
    ui.setPagerVisible(false);
    ui.hideForm();
    ui.setPagerState({ canPrev: false, canNext: false });
  }

  function backToResults() {
    state.selected = null;
    ui.hideForm();
    window.scrollTo({ top: state.searchScrollY, behavior: "smooth" });
  }

  function init() {
    ui.bindHandlers({
      onSearch() {
        state.offset = 0;
        runSearch();
      },
      onClear: clearSearch,
      onPrev: prevPage,
      onNext: nextPage,
      onFormClose: backToResults,
    });

    clearSearch();
  }

  init();
})();

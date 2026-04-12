(function () {
  const ui = window.SyncRomanContribUI;
  const mb = window.SyncRomanContribMusicBrainz;
  const validator = window.SyncRomanContribValidation;
  const submissionApi = window.SyncRomanContribSubmission;
  const config = window.SyncRomanConfig || { debug: false };

  const SUBMIT_COOLDOWN_MS = 2500;
  const LIVE_VALIDATE_DEBOUNCE_METADATA_MS = 140;
  const LIVE_VALIDATE_DEBOUNCE_LYRICS_MS = 360;
  const FORM_FIELDS = ["title", "artist", "album", "duration", "lrc_text"];

  const state = {
    query: "",
    limit: 10,
    offset: 0,
    total: 0,
    selected: null,
    searchScrollY: 0,
    validationWarnings: [],
    formValid: false,
    isSubmitting: false,
    lastSubmitAt: 0,
    touchedFields: new Set(),
    liveValidateTimer: null,
  };

  function logDebug(...args) {
    if (config.debug) {
      console.log(...args);
    }
  }

  function resetFormInteractionState() {
    state.selected = null;
    state.validationWarnings = [];
    state.formValid = false;
    state.isSubmitting = false;
    state.touchedFields.clear();
    if (state.liveValidateTimer) {
      clearTimeout(state.liveValidateTimer);
      state.liveValidateTimer = null;
    }
    ui.setSubmitting(false);
    ui.setSubmitEnabled(false);
  }

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
        resetFormInteractionState();
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
    state.lastSubmitAt = 0;
    resetFormInteractionState();
    ui.clearResults();
    ui.setStatus("Search songs from MusicBrainz");
    ui.setPageLabel(1);
    ui.setPagerVisible(false);
    ui.hideForm();
    ui.setPagerState({ canPrev: false, canNext: false });
  }

  function backToResults() {
    resetFormInteractionState();
    ui.hideForm();
    window.scrollTo({ top: state.searchScrollY, behavior: "smooth" });
  }

  async function validateForm() {
    if (state.isSubmitting) {
      return;
    }

    const now = Date.now();
    if (now - state.lastSubmitAt < SUBMIT_COOLDOWN_MS) {
      ui.showSubmissionOutcome({ ok: false, error: "rate_limited" });
      return;
    }

    const input = ui.getFormData();
    const result = validator.validateContribution(input);
    FORM_FIELDS.forEach((field) => state.touchedFields.add(field));
    ui.showValidationResult(result, {
      live: false,
      focusFirstInvalid: true,
    });
    state.formValid = !!result.isValid;
    state.validationWarnings = Array.isArray(result.warnings) ? result.warnings : [];

    if (!state.formValid) {
      ui.setSubmitEnabled(false);
      return;
    }

    if (!state.selected?.id) {
      return;
    }

    const payload = {
      mbid: state.selected.id,
      ...result.data,
      validation_warnings: state.validationWarnings,
    };

    state.isSubmitting = true;
    ui.setSubmitting(true);
    ui.setSubmitEnabled(false);
    ui.setStatus("Submitting contribution...", "info");

    try {
      const submitResult = await submissionApi.submitContribution(payload);
      ui.showSubmissionOutcome(submitResult);
      if (submitResult.ok) {
        state.lastSubmitAt = Date.now();
      }
      ui.setStatus(
        submitResult.ok ? "Submission processed." : "Submission failed. Please retry.",
        submitResult.ok ? "success" : "error"
      );
      logDebug("contribution submit result", submitResult);
    } catch (error) {
      console.error(error);
      ui.showSubmissionOutcome({ ok: false, error: "internal_error" });
      ui.setStatus("Submission failed. Please retry.", "error");
    } finally {
      state.isSubmitting = false;
      ui.setSubmitting(false);
      ui.setSubmitEnabled(state.formValid);
    }
  }

  function runLiveValidation() {
    const result = validator.validateContribution(ui.getFormData());
    state.formValid = !!result.isValid;
    state.validationWarnings = Array.isArray(result.warnings) ? result.warnings : [];
    ui.showValidationResult(result, {
      live: true,
      touchedFields: state.touchedFields,
      focusFirstInvalid: false,
      showSuccess: true,
    });
    ui.setSubmitEnabled(!!state.selected?.id && state.formValid && !state.isSubmitting);
  }

  function onFormInput(field) {
    if (!field) {
      return;
    }

    state.touchedFields.add(field);
    if (state.liveValidateTimer) {
      clearTimeout(state.liveValidateTimer);
    }

    const debounceMs = field === "lrc_text"
      ? LIVE_VALIDATE_DEBOUNCE_LYRICS_MS
      : LIVE_VALIDATE_DEBOUNCE_METADATA_MS;

    state.liveValidateTimer = setTimeout(() => {
      runLiveValidation();
      state.liveValidateTimer = null;
    }, debounceMs);
  }

  function onFormBlur(field) {
    if (!field) {
      return;
    }

    state.touchedFields.add(field);
    if (state.liveValidateTimer) {
      clearTimeout(state.liveValidateTimer);
      state.liveValidateTimer = null;
    }
    runLiveValidation();
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
      onSubmit: validateForm,
      onFormInput,
      onFormBlur,
    });

    clearSearch();
  }

  init();
})();

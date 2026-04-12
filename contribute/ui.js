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
    confirmShell: document.getElementById("contrib-confirm-shell"),
    confirmText: document.getElementById("contrib-confirm-text"),
    confirmBackBtn: document.getElementById("contrib-confirm-back-btn"),
    formStatus: document.getElementById("contrib-form-status"),
    formMessage: document.getElementById("contrib-form-message"),
    form: document.getElementById("contrib-form"),
    closeFormBtn: document.getElementById("contrib-form-close-btn"),
    submitBtn: document.getElementById("contrib-submit-btn"),
    title: document.getElementById("contrib-song-title"),
    artist: document.getElementById("contrib-song-artist"),
    album: document.getElementById("contrib-song-album"),
    duration: document.getElementById("contrib-song-duration"),
    lyrics: document.getElementById("contrib-song-lyrics"),
    errorTitle: document.getElementById("contrib-error-title"),
    errorArtist: document.getElementById("contrib-error-artist"),
    errorAlbum: document.getElementById("contrib-error-album"),
    errorDuration: document.getElementById("contrib-error-duration"),
    errorLrc: document.getElementById("contrib-error-lrc"),
    payloadPreview: document.getElementById("contrib-payload-preview"),
    payloadPreviewBox: document.getElementById("contrib-payload-preview-box"),
  };

  const errorMap = {
    title: { input: elements.title, node: elements.errorTitle },
    artist: { input: elements.artist, node: elements.errorArtist },
    album: { input: elements.album, node: elements.errorAlbum },
    duration: { input: elements.duration, node: elements.errorDuration },
    lrc_text: { input: elements.lyrics, node: elements.errorLrc },
  };

  const config = window.SyncRomanConfig || { debug: false };

  function setStatus(message, type = "info") {
    elements.status.textContent = message;
    elements.status.dataset.state = type;
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
    elements.confirmShell.hidden = true;
    elements.search.focus();
  }

  function showFormView() {
    elements.searchShell.hidden = true;
    elements.formShell.hidden = false;
    elements.confirmShell.hidden = true;
  }

  function showConfirmation(details) {
    elements.searchShell.hidden = true;
    elements.formShell.hidden = true;
    elements.confirmShell.hidden = false;

    const submissionId = details?.submissionId || "";
    const title = details?.title || "this song";
    const artist = details?.artist || "";
    const songLabel = artist ? `${title} - ${artist}` : title;
    elements.confirmText.textContent = submissionId
      ? `Published! ${songLabel} is now live. Submission ID: ${submissionId}.`
      : `Published! ${songLabel} is now live.`;
  }

  function hideForm() {
    showSearchView();
    elements.formStatus.textContent = "Review and edit details before submission.";
    clearValidationUI();
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
    clearValidationUI();
    showFormView();
  }

  function getFormData() {
    return {
      title: elements.title.value,
      artist: elements.artist.value,
      album: elements.album.value,
      duration: elements.duration.value,
      lrc_text: elements.lyrics.value,
    };
  }

  function clearValidationUI() {
    for (const key of Object.keys(errorMap)) {
      const entry = errorMap[key];
      entry.input.classList.remove("input-invalid");
      entry.input.removeAttribute("aria-invalid");
      entry.node.hidden = true;
      entry.node.textContent = "";
    }

    elements.formMessage.hidden = true;
    elements.formMessage.textContent = "";
    elements.formMessage.className = "contrib-form-message";
    elements.payloadPreview.hidden = true;
    elements.payloadPreviewBox.textContent = "";
  }

  function showValidationResult(result, options = {}) {
    const {
      live = false,
      touchedFields = null,
      focusFirstInvalid = true,
    } = options;

    clearValidationUI();

    const errors = result?.errors || {};
    const warnings = Array.isArray(result?.warnings) ? result.warnings : [];
    const keys = Object.keys(errors);

    let firstInvalidInput = null;
    let visibleErrors = 0;
    for (const key of keys) {
      const entry = errorMap[key];
      if (!entry) {
        continue;
      }

      if (live && touchedFields instanceof Set && !touchedFields.has(key)) {
        continue;
      }

      entry.input.classList.add("input-invalid");
      entry.input.setAttribute("aria-invalid", "true");
      entry.node.textContent = errors[key];
      entry.node.hidden = false;
      visibleErrors += 1;
      if (!firstInvalidInput) {
        firstInvalidInput = entry.input;
      }
    }

    if (!result?.isValid) {
      if (live && visibleErrors === 0) {
        elements.formMessage.hidden = false;
        elements.formMessage.className = "contrib-form-message";
        elements.formMessage.textContent = "Live check: keep editing fields.";
        return;
      }

      elements.formMessage.hidden = false;
      elements.formMessage.className = "contrib-form-message contrib-form-message-error";
      elements.formMessage.textContent = live
        ? "Please fix highlighted fields."
        : "Please fix the highlighted fields.";
      if (focusFirstInvalid && firstInvalidInput) {
        firstInvalidInput.focus();
      }
      return;
    }

    if (live && warnings.length) {
      elements.formMessage.hidden = false;
      elements.formMessage.className = "contrib-form-message contrib-form-message-warning";
      elements.formMessage.textContent = `Live check: ${warnings.join(" ")}`;
      return;
    }

    if (live) {
      elements.formMessage.hidden = false;
      elements.formMessage.className = "contrib-form-message contrib-form-message-success";
      elements.formMessage.textContent = "Live check: looks good so far.";
      return;
    }

    if (warnings.length) {
      elements.formMessage.hidden = false;
      elements.formMessage.className = "contrib-form-message contrib-form-message-warning";
      elements.formMessage.textContent = `Validated with warnings: ${warnings.join(" ")}`;
    } else {
      elements.formMessage.hidden = false;
      elements.formMessage.className = "contrib-form-message contrib-form-message-success";
      elements.formMessage.textContent = "Validated successfully. Ready for Phase 5.";
    }

    if (config.debug && !live) {
      elements.payloadPreview.hidden = false;
      elements.payloadPreviewBox.textContent = JSON.stringify(result.data, null, 2);
    }
  }

  function setSubmitting(isSubmitting) {
    elements.submitBtn.textContent = isSubmitting ? "Submitting..." : "Submit";
  }

  function setSubmitEnabled(enabled) {
    elements.submitBtn.disabled = !enabled;
  }

  function showSubmissionOutcome(result) {
    elements.formMessage.hidden = false;

    if (!result?.ok) {
      elements.formMessage.className = "contrib-form-message contrib-form-message-error";
      if (result?.error === "rate_limited") {
        elements.formMessage.textContent = "Too many submissions right now. Please wait and try again.";
        return;
      }

      if (result?.error === "validation_error") {
        elements.formMessage.textContent = result?.message || "Submission failed validation on server.";
        return;
      }

      elements.formMessage.textContent = result?.message || "Submission failed. Please try again.";
      return;
    }

    if (result.status === "duplicate") {
      elements.formMessage.className = "contrib-form-message contrib-form-message-warning";
      elements.formMessage.textContent = `Already submitted before. Submission ID: ${result.submissionId}.`;
      return;
    }

    elements.formMessage.className = "contrib-form-message contrib-form-message-success";
    elements.formMessage.textContent = `Published successfully. Submission ID: ${result.submissionId}.`;
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
    elements.confirmBackBtn.addEventListener("click", handlers.onConfirmBack);
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      handlers.onSubmit();
    });

    const liveFields = [
      elements.title,
      elements.artist,
      elements.album,
      elements.duration,
      elements.lyrics,
    ];

    for (const fieldEl of liveFields) {
      fieldEl.addEventListener("input", () => {
        if (typeof handlers.onFormInput === "function") {
          handlers.onFormInput(fieldEl.dataset.field || "");
        }
      });

      fieldEl.addEventListener("blur", () => {
        if (typeof handlers.onFormBlur === "function") {
          handlers.onFormBlur(fieldEl.dataset.field || "");
        }
      });
    }
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
    showConfirmation,
    getFormData,
    clearValidationUI,
    showValidationResult,
    setSubmitting,
    setSubmitEnabled,
    showSubmissionOutcome,
    renderResults,
    getQuery,
    bindHandlers,
  };
})();

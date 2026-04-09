(function () {
  const MAX_LRC_CHARS = 25000;
  const MAX_LRC_LINES = 2000;
  const FIELD_MAX_LEN = 120;

  function normalizeIdentityText(input) {
    return String(input || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function hasUsableText(value) {
    return normalizeIdentityText(value).length > 0;
  }

  function validateNameField(label, value) {
    const text = String(value || "").trim();
    if (!text) {
      return `${label} is required.`;
    }

    if (text.length < 2) {
      return `${label} must be at least 2 characters.`;
    }

    if (text.length > FIELD_MAX_LEN) {
      return `${label} must be at most ${FIELD_MAX_LEN} characters.`;
    }

    if (!hasUsableText(text)) {
      return `${label} cannot contain symbols only.`;
    }

    return "";
  }

  function validateAlbum(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }

    if (text.length > FIELD_MAX_LEN) {
      return `Album must be at most ${FIELD_MAX_LEN} characters.`;
    }

    if (!hasUsableText(text)) {
      return "Album cannot contain symbols only.";
    }

    return "";
  }

  function normalizeDuration(input) {
    const raw = String(input || "").trim();
    if (!raw) {
      return { error: "Duration is required.", value: "" };
    }

    const parts = raw.split(":");
    if (parts.length !== 2 && parts.length !== 3) {
      return { error: "Duration must be mm:ss or hh:mm:ss.", value: "" };
    }

    const allDigits = parts.every((part) => /^\d+$/.test(part));
    if (!allDigits) {
      return { error: "Duration must contain digits only.", value: "" };
    }

    if (parts.length === 2) {
      const minutes = Number(parts[0]);
      const seconds = Number(parts[1]);
      if (seconds < 0 || seconds > 59) {
        return { error: "Duration seconds must be between 00 and 59.", value: "" };
      }

      return {
        error: "",
        value: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      };
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number(parts[2]);
    if (minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      return { error: "Duration minutes and seconds must be between 00 and 59.", value: "" };
    }

    return {
      error: "",
      value: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    };
  }

  function parseTimestamp(token) {
    const match = token.match(/^\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]$/);
    if (!match) {
      return null;
    }

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = match[3] || "";

    if (seconds < 0 || seconds > 59) {
      return null;
    }

    const normalized = `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${fraction ? `.${fraction}` : ""}]`;
    return {
      normalized,
      orderKey: `${String(minutes).padStart(3, "0")}:${String(seconds).padStart(2, "0")}:${fraction}`,
    };
  }

  function validateAndNormalizeLrc(input) {
    const source = String(input || "").replace(/\r\n/g, "\n");
    const trimmedAll = source.trim();

    if (!trimmedAll) {
      return {
        error: "Lyrics (LRC) is required.",
        warnings: [],
        normalized: "",
      };
    }

    if (source.length > MAX_LRC_CHARS) {
      return {
        error: `Lyrics exceeds ${MAX_LRC_CHARS} characters.`,
        warnings: [],
        normalized: "",
      };
    }

    const lines = source.split("\n");
    if (lines.length > MAX_LRC_LINES) {
      return {
        error: `Lyrics exceeds ${MAX_LRC_LINES} lines.`,
        warnings: [],
        normalized: "",
      };
    }

    const warnings = [];
    const normalizedLines = [];
    const seenTimestampText = new Set();

    let validTimestampCount = 0;
    let hasTextLine = false;
    let emptyLines = 0;

    for (let index = 0; index < lines.length; index += 1) {
      const rawLine = lines[index];
      const line = rawLine.trim();

      if (!line) {
        emptyLines += 1;
        normalizedLines.push("");
        continue;
      }

      const lineMatch = line.match(/^((?:\[[^\]]+\])+)(.*)$/);
      if (!lineMatch) {
        return {
          error: `Line ${index + 1} must start with a valid timestamp like [00:10.00].`,
          warnings,
          normalized: "",
        };
      }

      const stampBlock = lineMatch[1];
      const rawText = lineMatch[2] || "";
      const stampTokens = stampBlock.match(/\[[^\]]+\]/g) || [];
      if (!stampTokens.length) {
        return {
          error: `Line ${index + 1} is missing timestamp tags.`,
          warnings,
          normalized: "",
        };
      }

      const normalizedStamps = [];
      for (const token of stampTokens) {
        const parsed = parseTimestamp(token);
        if (!parsed) {
          return {
            error: `Line ${index + 1} has invalid timestamp ${token}.`,
            warnings,
            normalized: "",
          };
        }

        validTimestampCount += 1;
        normalizedStamps.push(parsed.normalized);
      }

      const cleanedText = rawText.trim().replace(/\s+/g, " ");
      if (cleanedText) {
        hasTextLine = true;
      }

      const dedupeKey = `${normalizedStamps.join("")}|${cleanedText.toLowerCase()}`;
      if (seenTimestampText.has(dedupeKey)) {
        warnings.push(`Repeated timestamp+text at line ${index + 1}.`);
      }
      seenTimestampText.add(dedupeKey);

      const normalizedLine = cleanedText
        ? `${normalizedStamps.join("")} ${cleanedText}`
        : normalizedStamps.join("");
      normalizedLines.push(normalizedLine);
    }

    if (!validTimestampCount) {
      return {
        error: "Lyrics must contain at least one valid timestamp.",
        warnings,
        normalized: "",
      };
    }

    if (!hasTextLine) {
      return {
        error: "Lyrics must include at least one line with text.",
        warnings,
        normalized: "",
      };
    }

    if (emptyLines > Math.floor(lines.length * 0.3) && emptyLines > 3) {
      warnings.push("Lyrics has many empty lines; check formatting.");
    }

    const letters = (source.match(/[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/g) || []).length;
    const nonLatin = (source.match(/[^\x00-\x7F\s\d\p{P}]/gu) || []).length;
    if (letters + nonLatin > 0 && nonLatin / (letters + nonLatin) > 0.35) {
      warnings.push("Lyrics appear mostly non-Latin; ensure romanized text.");
    }

    return {
      error: "",
      warnings,
      normalized: normalizedLines.join("\n").trim(),
    };
  }

  function validateContribution(input) {
    const errors = {};
    const warnings = [];

    const title = String(input?.title || "").trim();
    const artist = String(input?.artist || "").trim();
    const album = String(input?.album || "").trim();

    const titleError = validateNameField("Title", title);
    if (titleError) errors.title = titleError;

    const artistError = validateNameField("Artist", artist);
    if (artistError) errors.artist = artistError;

    const albumError = validateAlbum(album);
    if (albumError) errors.album = albumError;

    const durationResult = normalizeDuration(input?.duration);
    if (durationResult.error) {
      errors.duration = durationResult.error;
    }

    const lrcResult = validateAndNormalizeLrc(input?.lrc_text);
    if (lrcResult.error) {
      errors.lrc_text = lrcResult.error;
    }

    warnings.push(...lrcResult.warnings);

    const isValid = Object.keys(errors).length === 0;
    if (!isValid) {
      return {
        isValid: false,
        errors,
        warnings,
        data: null,
      };
    }

    const normalized_title = normalizeIdentityText(title);
    const normalized_artist = normalizeIdentityText(artist);
    const normalized_combined = `${normalized_title} ${normalized_artist}`.trim();

    return {
      isValid: true,
      errors: {},
      warnings,
      data: {
        title,
        artist,
        normalized_title,
        normalized_artist,
        normalized_combined,
        duration: durationResult.value,
        lrc_text: lrcResult.normalized,
      },
    };
  }

  window.SyncRomanContribValidation = {
    validateContribution,
  };
})();

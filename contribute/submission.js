(function () {
  const client = window.SyncRomanClient;

  if (!client) {
    throw new Error("SyncRomanClient is not initialized for contribution submission.");
  }

  async function submitContribution(payload) {
    const { data, error } = await client.functions.invoke("submit-lyrics", {
      body: payload,
    });

    if (error) {
      let backendError = null;
      if (error?.context && typeof error.context.json === "function") {
        try {
          backendError = await error.context.json();
        } catch (_ignored) {
          backendError = null;
        }
      }

      let rawResponseText = "";
      if (!backendError && error?.context && typeof error.context.text === "function") {
        try {
          rawResponseText = (await error.context.text()) || "";
        } catch (_ignored) {
          rawResponseText = "";
        }
      }

      if (backendError?.error) {
        return {
          ok: false,
          error: backendError.error,
          message: backendError.message || "",
        };
      }

      const message = `${String(error?.message || "")} ${rawResponseText}`.toLowerCase();
      if (message.includes("401") || message.includes("unauthorized")) {
        return {
          ok: false,
          error: "internal_error",
          message: "Function returned 401 Unauthorized. Disable JWT verification for submit-lyrics in Supabase Edge Function settings and redeploy.",
        };
      }

      if (message.includes("429") || message.includes("rate")) {
        return { ok: false, error: "rate_limited" };
      }

      if (message.includes("fetch") || message.includes("network") || message.includes("cors")) {
        return {
          ok: false,
          error: "internal_error",
          message: "Network/CORS issue while calling submit-lyrics function.",
        };
      }

      return {
        ok: false,
        error: "internal_error",
        message: error?.message || "Function invocation failed.",
      };
    }

    if (!data || typeof data !== "object") {
      return { ok: false, error: "internal_error" };
    }

    if (data.error) {
      return {
        ok: false,
        error: data.error,
        message: data.message || "",
      };
    }

    if (data.status === "duplicate") {
      return {
        ok: true,
        status: "duplicate",
        submissionId: data.submission_id || "",
        currentStatus: data.current_status || "pending",
      };
    }

    if (data.status === "success") {
      return {
        ok: true,
        status: "success",
        submissionId: data.submission_id || "",
      };
    }

    return { ok: false, error: "internal_error", message: "Unexpected function response." };
  }

  window.SyncRomanContribSubmission = {
    submitContribution,
  };
})();

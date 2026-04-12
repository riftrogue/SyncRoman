// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SubmissionRequest = {
  mbid?: string;
  title?: string;
  artist?: string;
  album?: string | null;
  duration?: string;
  normalized_title?: string;
  normalized_artist?: string;
  normalized_combined?: string;
  lrc_text?: string;
  validation_warnings?: string[];
};

const MAX_PER_MINUTE = 5;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS_HEADERS,
    },
  });
}

function normalizeIdentityText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseDurationToSeconds(rawDuration: string): number | null {
  const raw = String(rawDuration || "").trim();
  const parts = raw.split(":");
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  if (!parts.every((part) => /^\d+$/.test(part))) {
    return null;
  }

  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (seconds < 0 || seconds > 59) {
      return null;
    }

    return minutes * 60 + seconds;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2]);
  if (minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function parseLrcTimestamp(token: string): string | null {
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

  return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${
    fraction ? `.${fraction}` : ""
  }]`;
}

function normalizeLrc(rawInput: string): { normalized: string; hasTextLine: boolean; validTimestamps: number } | null {
  const source = String(rawInput || "").replace(/\r\n/g, "\n");
  if (!source.trim()) {
    return null;
  }

  const lines = source.split("\n");
  const normalizedLines: string[] = [];
  let validTimestamps = 0;
  let hasTextLine = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      normalizedLines.push("");
      continue;
    }

    const lineMatch = line.match(/^((?:\[[^\]]+\])+)(.*)$/);
    if (!lineMatch) {
      return null;
    }

    const stampTokens = lineMatch[1].match(/\[[^\]]+\]/g) || [];
    if (!stampTokens.length) {
      return null;
    }

    const normalizedStamps: string[] = [];
    for (const token of stampTokens) {
      const stamp = parseLrcTimestamp(token);
      if (!stamp) {
        return null;
      }

      validTimestamps += 1;
      normalizedStamps.push(stamp);
    }

    const cleanedText = (lineMatch[2] || "").trim().replace(/\s+/g, " ");
    if (cleanedText) {
      hasTextLine = true;
    }

    normalizedLines.push(cleanedText ? `${normalizedStamps.join("")} ${cleanedText}` : normalizedStamps.join(""));
  }

  return {
    normalized: normalizedLines.join("\n").trim(),
    hasTextLine,
    validTimestamps,
  };
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "validation_error", message: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "internal_error" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const payload: SubmissionRequest = await req.json();

    const mbid = String(payload?.mbid || "").trim();
    const title = String(payload?.title || "").trim();
    const artist = String(payload?.artist || "").trim();
    const duration = String(payload?.duration || "").trim();
    const album = payload?.album == null ? null : String(payload.album).trim() || null;
    const lrcText = String(payload?.lrc_text || "");

    if (!mbid || !title || !artist || !duration || !lrcText.trim()) {
      return jsonResponse({ error: "validation_error", message: "Missing required fields" }, 400);
    }

    const durationSeconds = parseDurationToSeconds(duration);
    if (durationSeconds == null) {
      return jsonResponse({ error: "validation_error", message: "Invalid duration" }, 400);
    }

    const lrcParse = normalizeLrc(lrcText);
    if (!lrcParse || lrcParse.validTimestamps < 1 || !lrcParse.hasTextLine) {
      return jsonResponse({ error: "validation_error", message: "Invalid LRC format" }, 400);
    }

    const normalizedTitle = payload.normalized_title?.trim() || normalizeIdentityText(title);
    const normalizedArtist = payload.normalized_artist?.trim() || normalizeIdentityText(artist);
    const normalizedCombined =
      payload.normalized_combined?.trim() || `${normalizedTitle} ${normalizedArtist}`.trim();

    const normalizedLrcHash = await sha256Hex(lrcParse.normalized);
    const idempotencyKey = await sha256Hex(`${mbid}:${normalizedLrcHash}`);

    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const submitterFingerprint = await sha256Hex(`${ip}:${userAgent}`);

    const sinceIso = new Date(Date.now() - 60_000).toISOString();
    const { count: recentCount, error: rateError } = await admin
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("submitter_fingerprint", submitterFingerprint)
      .gte("created_at", sinceIso);

    if (rateError) {
      console.error("rate limit check failed", rateError);
      return jsonResponse({ error: "internal_error" }, 500);
    }

    if ((recentCount || 0) >= MAX_PER_MINUTE) {
      return jsonResponse({ error: "rate_limited" }, 429);
    }

    const { data: existing, error: dupError } = await admin
      .from("submissions")
      .select("id,status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (dupError) {
      console.error("duplicate lookup failed", dupError);
      return jsonResponse({ error: "internal_error" }, 500);
    }

    if (existing) {
      return jsonResponse({
        status: "duplicate",
        submission_id: existing.id,
        current_status: existing.status,
      });
    }

    const warnings = Array.isArray(payload.validation_warnings) ? payload.validation_warnings : [];

    const { data: inserted, error: insertError } = await admin
      .from("submissions")
      .insert({
        status: "pending",
        source: "web",
        mbid,
        title,
        artist,
        album,
        duration_seconds: durationSeconds,
        normalized_title: normalizedTitle,
        normalized_artist: normalizedArtist,
        normalized_combined: normalizedCombined,
        lrc_text: lrcParse.normalized,
        normalized_lrc_hash: normalizedLrcHash,
        idempotency_key: idempotencyKey,
        submitter_fingerprint: submitterFingerprint,
        validation_warnings: warnings,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("submission insert failed", insertError);
      return jsonResponse({ error: "internal_error" }, 500);
    }

    return jsonResponse({
      status: "success",
      submission_id: inserted.id,
    });
  } catch (error) {
    console.error("submit-lyrics error", error);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});

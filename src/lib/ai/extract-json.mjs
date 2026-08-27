/**
 * Extracts the first parseable JSON object from an LLM completion.
 * Tolerates markdown fences, leading/trailing prose, and trailing commas
 * (rewritten only outside string literals). Returns null when nothing
 * parseable is found — callers surface a snippet of the raw output then.
 */
/**
 * @param {unknown} text
 * @returns {any | null}
 */
export function extractJson(text) {
  if (typeof text !== "string" || !text.trim()) return null;

  const t = text.trim();

  // Prefer fenced blocks in order — a model may emit a throwaway code
  // sample before the real JSON, so keep trying until one parses.
  const fences = [...t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
    .map((m) => m[1].trim())
    .filter((c) => c.includes("{"));

  for (const candidate of [t, ...fences]) {
    const parsed = tryParseObject(candidate);
    if (parsed !== null) return parsed;
  }
  return null;
}

/**
 * @param {string} t
 * @returns {any | null}
 */
function tryParseObject(t) {
  const start = t.indexOf("{");
  if (start < 0) return null;
  const end = t.lastIndexOf("}");
  if (end <= start) return null;

  const slice = t.slice(start, end + 1);
  for (const s of [slice, stripTrailingCommas(slice)]) {
    try {
      const v = JSON.parse(s);
      if (v && typeof v === "object") return v;
    } catch {
      // fall through to recovery attempts
    }
  }

  // Last resort: find the last balanced {...} block (handles prose that
  // contains brace pairs before the real payload).
  const balanced = lastBalancedObject(slice);
  if (balanced && balanced !== slice) {
    for (const s of [balanced, stripTrailingCommas(balanced)]) {
      try {
        const v = JSON.parse(s);
        if (v && typeof v === "object") return v;
      } catch {
        // give up
      }
    }
  }
  return null;
}

/** Remove `,` before `}`/`]` — but only outside string literals. */
/**
 * @param {string} s
 * @returns {string}
 */
function stripTrailingCommas(s) {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) {
      out += c;
      esc = false;
      continue;
    }
    if (c === "\\") {
      out += c;
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      out += c;
      continue;
    }
    if (!inStr && c === ",") {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      if (s[j] === "}" || s[j] === "]") continue; // drop the comma
    }
    out += c;
  }
  return out;
}

/** Brace matching that ignores braces inside string literals. */
/**
 * @param {string} t
 * @returns {string | null}
 */
function lastBalancedObject(t) {
  let depth = 0;
  let end = -1;
  let inStr = false;
  for (let i = t.length - 1; i >= 0; i--) {
    const c = t[i];
    if (c === '"') {
      // A quote escaped by a preceding backslash toggled on its left pair.
      if (t[i - 1] !== "\\") inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (c === "}") {
      if (depth === 0) end = i;
      depth++;
    } else if (c === "{") {
      depth--;
      if (depth === 0 && end > i) return t.slice(i, end + 1);
    }
  }
  return null;
}

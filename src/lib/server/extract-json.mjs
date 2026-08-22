/**
 * Extracts the first parseable JSON object from an LLM completion.
 * Tolerates markdown fences, leading/trailing prose, and trailing commas.
 * Returns null when nothing parseable is found — callers surface a snippet
 * of the raw output in that case.
 */
/**
 * @param {unknown} text
 * @returns {any | null}
 */
export function extractJson(text) {
  if (typeof text !== "string" || !text.trim()) return null;

  let t = text.trim();

  // Prefer a ```json fenced block when one exists.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1].includes("{")) {
    t = fence[1].trim();
  }

  const start = t.indexOf("{");
  if (start < 0) return null;
  const end = t.lastIndexOf("}");
  if (end <= start) return null;

  const slice = t.slice(start, end + 1);
  const commaFixed = slice.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(slice);
  } catch {
    // fall through to recovery attempts
  }
  try {
    return JSON.parse(commaFixed);
  } catch {
    // fall through
  }

  // Last resort: find the last balanced {...} block (handles prose that
  // contains brace pairs before the real payload).
  const balanced = lastBalancedObject(slice);
  if (balanced && balanced !== slice) {
    try {
      return JSON.parse(balanced);
    } catch {
      try {
        return JSON.parse(balanced.replace(/,\s*([}\]])/g, "$1"));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * @param {string} t
 * @returns {string | null}
 */
function lastBalancedObject(t) {
  let depth = 0;
  let end = -1;
  for (let i = t.length - 1; i >= 0; i--) {
    const c = t[i];
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

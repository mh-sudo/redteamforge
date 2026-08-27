import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJson } from "../src/lib/ai/extract-json.mjs";

const valid = {
  executiveSummary: "Leaky.",
  overallRisk: "high",
  priorityOrder: ["a"],
  findings: [],
  systemPromptAdvice: ["harden"],
  residualRisk: "some",
};

test("parses raw JSON", () => {
  assert.deepEqual(extractJson(JSON.stringify(valid)), valid);
});

test("parses fenced JSON", () => {
  const t = "```json\n" + JSON.stringify(valid, null, 2) + "\n```";
  assert.deepEqual(extractJson(t), valid);
});

test("parses JSON with leading prose", () => {
  const t = 'Here is my analysis:\n{"overallRisk":"low"}\nThanks!';
  assert.deepEqual(extractJson(t), { overallRisk: "low" });
});

test("tolerates trailing commas", () => {
  const t = '{"a":1,"b":[1,2,],}';
  assert.deepEqual(extractJson(t), { a: 1, b: [1, 2] });
});

test("handles fence with language tag and inner prose", () => {
  const t = 'Sure.\n```json\n// note\n{"ok":true}\n```\nDone.';
  assert.deepEqual(extractJson(t), { ok: true });
});

test("recovers last balanced object when prose contains braces", () => {
  const t = 'Use {"example": 1} as shape. Result: {"real": "value"} end';
  assert.deepEqual(extractJson(t), { real: "value" });
});

test("returns null for pure prose", () => {
  assert.equal(extractJson("I cannot comply with that request."), null);
});

test("returns null for empty or non-string input", () => {
  assert.equal(extractJson(""), null);
  assert.equal(extractJson(null), null);
  assert.equal(extractJson(undefined), null);
});

test("returns null when object never opens", () => {
  assert.equal(extractJson("no braces here"), null);
});

test("prefers the first fence that actually parses", () => {
  const t =
    'Example:\n```js\nconst x = {not: json};\n```\nAnswer:\n```json\n{"ok":true}\n```';
  assert.deepEqual(extractJson(t), { ok: true });
});

test("trailing-comma rewrite does not corrupt string literals", () => {
  const t = '{"a":"x,}","b":[1,2,]}';
  assert.deepEqual(extractJson(t), { a: "x,}", b: [1, 2] });
});

test("brace matching ignores braces inside strings", () => {
  const t = 'shape {"a":"}"} then {"real":{"deep":1}} trailing { junk';
  assert.deepEqual(extractJson(t), { real: { deep: 1 } });
});

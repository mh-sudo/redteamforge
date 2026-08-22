import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GATE_TOKEN_TTL_MS,
  issueGateToken,
  safeEqual,
  verifyGateToken,
} from "../src/lib/server/gate-token";

test("issue/verify round trip", () => {
  const token = issueGateToken("correct horse battery staple");
  assert.equal(verifyGateToken("correct horse battery staple", token), true);
});

test("wrong secret rejects", () => {
  const token = issueGateToken("correct horse battery staple");
  assert.equal(verifyGateToken("wrong password", token), false);
});

test("tampered mac rejects", () => {
  const token = issueGateToken("secret");
  const [iat] = token.split(".");
  const forged = `${iat}.${"a".repeat(64)}`;
  assert.equal(verifyGateToken("secret", forged), false);
});

test("expired token rejects", () => {
  const token = issueGateToken("secret");
  const [iat, mac] = token.split(".");
  const expired = (
    parseInt(iat, 36) -
    GATE_TOKEN_TTL_MS -
    60_000
  ).toString(36);
  assert.equal(verifyGateToken("secret", `${expired}.${mac}`), false);
});

test("malformed tokens reject without throwing", () => {
  for (const bad of ["", "x", "....", "abc.def.ghi", `${"z".repeat(8)}.${"g".repeat(64)}`]) {
    assert.equal(verifyGateToken("secret", bad), false, `token: ${bad}`);
  }
});

test("tokens rotate between unlocks", () => {
  const a = issueGateToken("secret");
  const b = issueGateToken("secret");
  assert.notEqual(a, b);
});

test("safeEqual compares by content, not identity", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});

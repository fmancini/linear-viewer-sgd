import assert from "node:assert/strict";
import { after, test } from "node:test";
import { isAllowedEmail, verifiedGoogleEmail } from "../src/lib/auth-policy";
import { authOptions } from "../src/lib/auth";

const original = process.env.AUTH_ALLOWED_DOMAINS;
process.env.AUTH_ALLOWED_DOMAINS = "asimov.cl,digital.gob.cl";
after(() => {
  if (original === undefined) delete process.env.AUTH_ALLOWED_DOMAINS;
  else process.env.AUTH_ALLOWED_DOMAINS = original;
});

test("el dominio debe coincidir exactamente, sin subdominios ni sufijos", () => {
  for (const email of ["Felipe@Asimov.cl", "otro@asimov.cl", "felipe+alias@asimov.cl", "user@digital.gob.cl", "OTRO@DIGITAL.GOB.CL"]) {
    assert.equal(isAllowedEmail(email), true);
  }
  for (const email of ["felipe@asimov.cl.evil.test", "felipe@sub.asimov.cl", "user@gob.cl", "user@evil.test", "", null]) {
    assert.equal(isAllowedEmail(email), false);
  }
});

test("una lista vacía deniega todo y los cambios revocan el acceso", () => {
  process.env.AUTH_ALLOWED_DOMAINS = "";
  assert.equal(isAllowedEmail("felipe@asimov.cl"), false);
  delete process.env.AUTH_ALLOWED_DOMAINS;
  assert.equal(isAllowedEmail("felipe@asimov.cl"), false);
  process.env.AUTH_ALLOWED_DOMAINS = "asimov.cl,digital.gob.cl";
});

test("Google debe confirmar email_verified como booleano true", () => {
  assert.equal(verifiedGoogleEmail("google", { email: "felipe@asimov.cl", email_verified: true }), "felipe@asimov.cl");
  for (const email_verified of [false, undefined, "true", 1]) {
    assert.equal(verifiedGoogleEmail("google", { email: "felipe@asimov.cl", email_verified }), null);
  }
  assert.equal(verifiedGoogleEmail("other", { email: "felipe@asimov.cl", email_verified: true }), null);
  assert.equal(verifiedGoogleEmail("google", { email: "other@evil.test", email_verified: true }), null);
  assert.equal(verifiedGoogleEmail("google", null), null);
});

test("la sesión exige la marca verificada y la lista vigente", async () => {
  const sessionCallback = authOptions.callbacks!.session!;
  type SessionArgs = Parameters<typeof sessionCallback>[0];
  for (const token of [
    { email: "felipe@asimov.cl" },
    { email: "felipe@asimov.cl", googleVerified: false },
    { email: "otro@evil.test", googleVerified: true },
  ]) {
    const session = await sessionCallback({
      session: { user: { email: "felipe@asimov.cl" }, expires: "2099-01-01" }, token,
    } as unknown as SessionArgs);
    assert.equal(session.user?.email, null);
  }
  const session = await sessionCallback({
    session: { user: {}, expires: "2099-01-01" },
    token: { email: "felipe@asimov.cl", googleVerified: true },
  } as unknown as SessionArgs);
  assert.equal(session.user?.email, "felipe@asimov.cl");
});

test("una actualización del cliente no puede convertir un JWT en autorizado", async () => {
  const jwtCallback = authOptions.callbacks!.jwt!;
  const token = await jwtCallback({
    token: { email: "other@example.test" },
    trigger: "update",
    session: { email: "felipe@asimov.cl", googleVerified: true },
  } as Parameters<typeof jwtCallback>[0]);
  assert.equal(token.email, "other@example.test");
  assert.equal(token.googleVerified, undefined);
});

test("las redirecciones no aceptan destinos externos", async () => {
  const result = await authOptions.callbacks!.redirect!({
    url: "https://evil.example.test", baseUrl: "https://board.example.test",
  });
  assert.equal(result, "https://board.example.test");
});

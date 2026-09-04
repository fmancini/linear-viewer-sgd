import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { encode } from "next-auth/jwt";

const baseUrl = "http://127.0.0.1:3017";

test("el servidor protege páginas, API y JSON con sesiones válidas", { timeout: 60_000 }, async (t) => {
  const secret = randomBytes(48).toString("hex");
  const probeName = `auth-probe-${randomBytes(12).toString("hex")}.json`;
  const probePath = join(process.cwd(), "public", "data", probeName);
  await mkdir(join(process.cwd(), "public", "data"), { recursive: true });
  await writeFile(probePath, JSON.stringify({ privateProbe: true }), { flag: "wx" });
  t.after(() => unlink(probePath));
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3017", "-H", "127.0.0.1"], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXTAUTH_URL: baseUrl,
      NEXTAUTH_SECRET: secret,
      GOOGLE_CLIENT_ID: "integration-test",
      GOOGLE_CLIENT_SECRET: "integration-test",
      AUTH_ALLOWED_DOMAINS: "asimov.cl",
      LINEAR_API_KEY: "",
      LINEAR_PROJECT_ID: randomBytes(16).toString("hex"),
    },
    stdio: "ignore",
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
  });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error("El servidor de prueba no pudo iniciarse");
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(200);
  }
  assert.equal(ready, true);

  const request = (path: string, token?: string, headers: Record<string, string> = {}) => fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: { ...headers, ...(token ? { cookie: `next-auth.session-token=${token}` } : {}) },
  });

  const home = await request("/");
  assert.equal(home.status, 307);
  assert.equal(new URL(home.headers.get("location")!, baseUrl).pathname, "/login");
  const api = await request("/api/board");
  assert.equal(api.status, 401);
  assert.match(api.headers.get("cache-control")!, /private.*no-store/);
  assert.equal((await request("/api/board?t=1", undefined, { "x-middleware-subrequest": "middleware:middleware:middleware:middleware:middleware" })).status, 401);

  for (const path of ["/data/board.json", "/data/board.json?t=1", "/data/board.json/", "/data/%62oard.json", "/%64ata/board.json"]) {
    assert.equal((await fetch(`${baseUrl}${path}`)).status, 404, path);
  }

  for (const token of [
    "not-a-session",
    await encode({ secret, token: { email: "felipe@asimov.cl", googleVerified: true }, maxAge: -60 }),
    await encode({ secret, token: { email: "other@evil.test", googleVerified: true } }),
    await encode({ secret, token: { email: "felipe@asimov.cl" } }),
  ]) {
    assert.equal((await request("/api/board", token)).status, 401);
    assert.equal((await request("/", token)).status, 307);
  }

  const valid = await encode({ secret, token: { email: "felipe@asimov.cl", googleVerified: true }, maxAge: 300 });
  assert.equal((await request("/", valid)).status, 200);
  const allowedApi = await request("/api/board", valid);
  assert.equal(allowedApi.status, 503);
  const error = await allowedApi.json();
  assert.equal(error.error, "No se pudieron actualizar los datos. Intenta más tarde.");
  assert.equal((await request("/data/board.json", valid)).status, 404);

  const probe = await request(`/data/${probeName}`, valid, { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" });
  assert.equal(probe.status, 404);
  assert.equal(await probe.text(), "");
  assert.match(probe.headers.get("cache-control")!, /private.*no-store/);

  const csrf = await request("/api/auth/csrf");
  assert.equal(csrf.status, 200);
  assert.equal(typeof (await csrf.json()).csrfToken, "string");
  assert.match(csrf.headers.get("set-cookie")!, /HttpOnly/i);
  assert.match(csrf.headers.get("set-cookie")!, /SameSite=Lax/i);
  const badSignIn = await fetch(`${baseUrl}/api/auth/signin/google`, {
    method: "POST", redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "csrfToken=invalid&callbackUrl=https%3A%2F%2Fevil.example.test",
  });
  assert.equal(badSignIn.status, 302);
  assert.equal(new URL(badSignIn.headers.get("location")!, baseUrl).origin, baseUrl);
});

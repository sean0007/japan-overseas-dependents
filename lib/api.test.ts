import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PUBLIC_URL } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

test(`GET ${EXAMPLE_GET} → eligible ¥380k`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.equal(body.verdict, "eligible");
  assert.equal(body.totalDeduction, 380000);
  assert.ok(body.sources.length);
});

test("POST JSON body matches GET", async () => {
  const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}`);
  const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(url.searchParams)) }));
  const get = await handler(new Request(url));
  assert.equal(post.status, 200);
  assert.deepEqual(await post.json(), await get.json());
});

test("aliases", async () => {
  const b = await (await handler(new Request(`${PUBLIC_URL}${e.path}?relationship=mother&age=72&sent=${encodeURIComponent("50万")}&method=wise`))).json();
  assert.equal(b.relationship, "parent");
  assert.equal(b.totalDeduction, 480000);
  const w = await (await handler(new Request(`${PUBLIC_URL}${e.path}?relationship=${encodeURIComponent("妻")}&age=40&remittance=100000&yourIncome=9,300,000`))).json();
  assert.equal(w.totalDeduction, 260000);
  const s = await (await handler(new Request(`${PUBLIC_URL}${e.path}?relationship=brother&age=35&student=yes`))).json();
  assert.equal(s.route, "studying_abroad");
});

test("bad inputs → 400 with example", async () => {
  for (const q of ["age=50", "relationship=alien&age=50", "relationship=parent", "relationship=parent&age=abc", "relationship=parent&age=50&method=pigeon", "relationship=parent&age=50&year=2020"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(res.status, 400, q);
    const body = await res.json();
    assert.equal(body.disclaimer, API_DISCLAIMER);
    assert.ok(body.example);
  }
});

test("malformed JSON body → 400", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{nope" }));
  assert.equal(res.status, 400);
});

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("OpenAPI lists /api/check GET and POST", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, [e]) as { openapi: string; paths: Record<string, { get: { parameters: { name: string }[] }; post: unknown }> };
  assert.ok(spec.openapi.startsWith("3."));
  assert.ok(spec.paths["/api/check"]?.post);
  assert.ok(spec.paths["/api/check"].get.parameters.find((p) => p.name === "remittanceTotal"));
});

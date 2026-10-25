import assert from "node:assert/strict";
import test from "node:test";
import { EXAMPLE_CHILD, EXAMPLE_SHARED, isIndexable, parseShared, resultPath, safeCheck, sharedQuery } from "./share";

test("share link round-trips", () => {
  for (const ex of [EXAMPLE_SHARED, EXAMPLE_CHILD]) {
    const back = parseShared(new URLSearchParams(sharedQuery(ex)));
    assert.deepEqual(back, ex);
    assert.ok(isIndexable(ex));
    assert.ok(safeCheck(ex));
  }
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?rel=parent&a=62&r=300000&n=6");
});

test("bad share params → null", () => {
  assert.equal(parseShared(new URLSearchParams("rel=alien&a=50")), null);
  assert.equal(parseShared(new URLSearchParams("rel=parent&a=nope")), null);
});

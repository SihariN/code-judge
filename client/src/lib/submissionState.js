import { isFinal } from "./verdicts";

// Picks the result fields out of a submission object
export function pickResult(s) {
  return {
    id: s.id,
    verdict: s.verdict,
    passedTests: s.passedTests,
    totalTests: s.totalTests,
    failedTest: s.failedTest,
    timeMs: s.timeMs,
    errorMessage: s.errorMessage,
  };
}

// Updates a submission in the list. A finished result is never replaced by an
// in-progress one, because events and responses can arrive in an unlucky order.
// Unknown submissions are only added when a slug is given (the problem page does
// that; the submissions page reloads from the server instead).
export function upsert(list, update, slug) {
  const i = list.findIndex((s) => s.id === update.id);

  if (i === -1) {
    if (!slug || update.problemSlug !== slug) return list;
    return [{ createdAt: new Date().toISOString(), ...update }, ...list];
  }

  const current = list[i];
  if (isFinal(current.verdict) && !isFinal(update.verdict)) return list;

  const copy = [...list];
  copy[i] = { ...current, ...update };
  return copy;
}

// Replaces the list with fresh data from REST, but keeps things the list
// endpoint doesn't carry (failure details, live progress)
export function mergeFresh(prev, fresh) {
  const old = new Map(prev.map((s) => [s.id, s]));
  return fresh.map((f) => {
    const o = old.get(f.id);
    if (!o) return f;
    return {
      ...f,
      failure: o.failure,
      passedTests: isFinal(f.verdict)
        ? f.passedTests
        : Math.max(f.passedTests, o.passedTests),
    };
  });
}
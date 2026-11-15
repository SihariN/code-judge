function publicSubmission(s) {
  return {
    id: s.id,
    problem: s.problem, // only present when included in the query
    language: s.language,
    verdict: s.verdict,
    passedTests: s.passedTests,
    totalTests: s.totalTests,
    failedTest: s.failedTest,
    timeMs: s.timeMs,
    errorMessage: s.errorMessage,
    createdAt: s.createdAt,
  };
}

module.exports = { publicSubmission };
const VERDICT_STYLES = {
  ACCEPTED: ["Accepted", "bg-emerald-500/15 text-emerald-300"],
  WRONG_ANSWER: ["Wrong Answer", "bg-red-500/15 text-red-300"],
  TIME_LIMIT_EXCEEDED: ["Time Limit Exceeded", "bg-amber-500/15 text-amber-300"],
  MEMORY_LIMIT_EXCEEDED: ["Memory Limit Exceeded", "bg-amber-500/15 text-amber-300"],
  OUTPUT_LIMIT_EXCEEDED: ["Output Limit Exceeded", "bg-amber-500/15 text-amber-300"],
  RUNTIME_ERROR: ["Runtime Error", "bg-red-500/15 text-red-300"],
  INTERNAL_ERROR: ["Internal Error", "bg-purple-500/15 text-purple-300"],
  PENDING: ["Pending", "bg-slate-500/20 text-slate-300"],
  JUDGING: ["Judging", "bg-sky-500/15 text-sky-300"],
};

const DIFFICULTY_STYLES = {
  EASY: ["Easy", "bg-emerald-500/15 text-emerald-300"],
  MEDIUM: ["Medium", "bg-amber-500/15 text-amber-300"],
  HARD: ["Hard", "bg-red-500/15 text-red-300"],
};

function Badge({ label, classes }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

export function VerdictBadge({ verdict }) {
  const [label, classes] = VERDICT_STYLES[verdict] || [verdict, VERDICT_STYLES.PENDING[1]];
  return <Badge label={label} classes={classes} />;
}

export function DifficultyBadge({ difficulty }) {
  const [label, classes] = DIFFICULTY_STYLES[difficulty] || [difficulty, ""];
  return <Badge label={label} classes={classes} />;
}
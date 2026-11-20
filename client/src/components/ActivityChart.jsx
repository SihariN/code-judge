export default function ActivityChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div>
      <div className="flex h-24 items-end gap-1">
        {days.map((d) => (
          <div
            key={d.day}
            title={`${d.day}: ${d.count} submission${d.count === 1 ? "" : "s"}`}
            className="flex-1 rounded-sm bg-indigo-500"
            style={{
              height:
                d.count === 0 ? "2px" : `${Math.max(8, (d.count / max) * 100)}%`,
              opacity: d.count === 0 ? 0.25 : 1,
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{days[0].day}</span>
        <span>{days[days.length - 1].day}</span>
      </div>
    </div>
  );
}
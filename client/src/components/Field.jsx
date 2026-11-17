export default function Field({ label, error, ...inputProps }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-300">{label}</span>
      <input
        {...inputProps}
        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
      />
      {error && <span className="mt-1 block text-sm text-red-400">{error}</span>}
    </label>
  );
}
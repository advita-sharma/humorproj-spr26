export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <div>
          <p className="text-zinc-300 text-lg font-medium">Generating captions…</p>
          <p className="text-zinc-600 text-sm mt-1">This takes about 15–30 seconds</p>
        </div>
      </div>
    </div>
  );
}

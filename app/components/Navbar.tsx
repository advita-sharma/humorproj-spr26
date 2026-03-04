import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProfileMenu from "./ProfileMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userName =
    user.user_metadata?.full_name ?? user.email ?? "User";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090b]/80 border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
            <span className="text-xl">😂</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">
            Funniest 67
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/vote"
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-medium hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25 transition-all"
          >
            Vote
          </Link>
          <Link
            href="/upload"
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-medium hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-violet-500/25 transition-all"
          >
            Generate your own
          </Link>
          <ProfileMenu name={userName} />
        </div>
      </div>
    </header>
  );
}

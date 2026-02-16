import { createClient } from "@/lib/supabase/server";
import Pagination from "./components/Pagination";
import ProfileMenu from "./components/ProfileMenu";

type Image = {
  id: string;
  url: string;
  image_description: string | null;
};

type Caption = {
  id: string;
  content: string;
  image_id: string;
  like_count: number;
};

type ImageCaptionPair = {
  image: Image;
  caption: Caption;
  likeCount: number;
};

const ITEMS_PER_PAGE = 12;
const TOP_FUNNIEST = 67;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userName =
    user?.user_metadata?.full_name ?? user?.email ?? "User";

  const [imagesResult, captionsResult] = await Promise.all([
    supabase.from("images").select("id, url, image_description").limit(1000),
    supabase
      .from("captions")
      .select("id, content, image_id, like_count")
      .order("like_count", { ascending: false })
      .limit(5000),
  ]);

  if (imagesResult.error || captionsResult.error) {
    const errorMsg =
      imagesResult.error?.message || captionsResult.error?.message;
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400">Error loading data: {errorMsg}</p>
        </div>
      </div>
    );
  }

  const images = imagesResult.data || [];
  const captions = captionsResult.data || [];

  const captionsByImage: Record<string, Caption[]> = {};
  for (const caption of captions) {
    if (!captionsByImage[caption.image_id]) {
      captionsByImage[caption.image_id] = [];
    }
    captionsByImage[caption.image_id].push(caption);
  }

  const imageCaptionPairs: ImageCaptionPair[] = [];
  for (const image of images) {
    const imageCaptions = captionsByImage[image.id] || [];
    if (imageCaptions.length === 0) continue;

    let bestCaption = imageCaptions[0];
    for (const caption of imageCaptions) {
      if (caption.like_count > bestCaption.like_count) {
        bestCaption = caption;
      }
    }

    imageCaptionPairs.push({
      image,
      caption: bestCaption,
      likeCount: bestCaption.like_count,
    });
  }

  imageCaptionPairs.sort((a, b) => b.likeCount - a.likeCount);
  const topPairs = imageCaptionPairs.slice(0, TOP_FUNNIEST);

  const totalItems = topPairs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPairs = topPairs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090b]/80 border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-xl">😂</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Funniest 67
              </h1>
              <p className="text-xs text-zinc-500">Top rated captions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
              {totalItems} entries
            </span>
            <ProfileMenu name={userName} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedPairs.map((pair, index) => (
            <article
              key={pair.image.id}
              className="group relative bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-zinc-700/50 hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/5 hover:-translate-y-1"
            >
              {/* Rank Badge */}
              <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white border border-white/10">
                #{startIndex + index + 1}
              </div>

              {/* Like Count Badge */}
              <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-rose-400"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
                {pair.likeCount.toLocaleString()}
              </div>

              {/* Image */}
              <div className="relative aspect-[4/5] overflow-hidden">
                {pair.image.url ? (
                  <img
                    src={pair.image.url}
                    alt={pair.image.image_description || "Funny image"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-zinc-600 text-sm">No image</span>
                  </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm leading-relaxed line-clamp-3 drop-shadow-lg">
                  "{pair.caption.content}"
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State */}
        {paginatedPairs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <span className="text-2xl">🤔</span>
            </div>
            <p className="text-zinc-400">No captions found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-zinc-500">
          <p>Showing the funniest captions</p>
          <p>Page {currentPage} of {totalPages}</p>
        </div>
      </footer>
    </div>
  );
}

## Project Guidelines

- If you need the database structure, refer to `schema.sql`
- Top 67 leaderboard: rank all captions by like_count (multiple captions for the same image can qualify), no deduplication by image.
- Implement pagination: 12 image and caption pairs per page.

## Changelog

1. Deployed Next.js app (bootstrapped with `create-next-app`, deployed to Vercel)
2. Connected to Supabase — fetches images and captions, displays top 67 ranked by likes
3. Added Google OAuth — login restricted to `@columbia.edu` and `@barnard.edu` domains, with middleware auth guard
4. Added voting feature — Inserts new rows into `caption_votes` (POST) (if user has not voted on them before), updates existing rows on undo (PATCH). Includes "?" tooltip for image descriptions, preloading of next card, and undo button.
5. Performance & UI fixes — removed Supabase joins (separate batched queries instead), filter out incomplete pairs (missing caption or image), moved "?" description button outside card to top-right, doubled upvote/downvote button size. Note: RLS policies should use `(SELECT auth.uid()) = profile_id` caching trick and indexed fields only — these must be configured directly in Supabase dashboard.
6. Image upload & caption generation — 4-step pipeline (presigned S3 URL → upload → register → generate captions). Upload page at /upload, results at /my-captions?imageId=xxx. imageId persisted in localStorage for session resumption.
7. Global Navbar — shared across all pages via layout.tsx. Shows: logo (→ /), Vote, Generate your own, Profile. Hidden on login page.
8. Leaderboard updates — top 67 now allows multiple captions per image, broken image cards hidden entirely, 12 per page, cards are tappable (full-image modal).
9. Voting filters — only captions with is_public=true shown in vote/leaderboard flows.
10. User feedback improvements — (1) Added user-generated caption option: after uploading an image, users can write their own caption in addition to AI-generated ones. (2) Added "This usually takes 15–30 seconds" waiting message during AI caption generation so users know the app isn't broken. (3) Fixed the refresh/generate-more button behavior and removed faulty image-caption pairs. (4) Added "Back to leaderboard" navigation on all non-leaderboard pages so users can return to the home screen without clicking the site name. Fixed TypeScript build error: `isGenerating` prop was missing from `MyCaptionsClient` call in page.tsx.
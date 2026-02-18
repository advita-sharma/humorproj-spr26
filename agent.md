## Project Guidelines

- If you need the database structure, refer to `schema.sql`
- Always pick the top caption (highest votes) for each image.
- Implement pagination: 30 image and caption pairs per page.

## Changelog

1. Deployed Next.js app (bootstrapped with `create-next-app`, deployed to Vercel)
2. Connected to Supabase — fetches images and captions, displays top 67 ranked by likes
3. Added Google OAuth — login restricted to `@columbia.edu` and `@barnard.edu` domains, with middleware auth guard
4. Added voting feature — Inserts new rows into `caption_votes` (POST) (if user has not voted on them before), updates existing rows on undo (PATCH). Includes "?" tooltip for image descriptions, preloading of next card, and undo button. 
5.Performance & UI fixes — removed Supabase joins (separate batched queries instead), filter out incomplete pairs (missing caption or image), moved "?" description button outside card to top-right, doubled upvote/downvote button size. Note: RLS policies should use `(SELECT auth.uid()) = profile_id` caching trick and indexed fields only — these must be configured directly in Supabase dashboard.

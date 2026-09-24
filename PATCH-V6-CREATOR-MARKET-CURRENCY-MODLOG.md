# Corgi-Bot V6 patch

## Included
- Creator Marketplace backend: members can submit original cosmetic collections/items for review; approved creator listings sell reusable copies rather than transferring the creator's original item.
- Creator metadata: creatorId, creatorName, collectionName, source, review status/reviewer/reason.
- Marketplace review API now returns cosmetic preview metadata and approves/declines the creator cosmetic together with its listing.
- Compact number formatter: 1.2K, 1M, 2.5B, 1T, Qa/Qi/Sx/Sp/Oc/No/Dc.
- Flexible money parser accepts full values and suffixes such as 2500000 or 2.5M where patched.
- Moderation Logs channel is now configurable in /setup > Channels and uses the existing moderationLogs field/fallback logic.

## Creator API
- POST /v1/marketplace/creator/submit
- GET /v1/marketplace/creator/mine
- Existing GET /v1/review/marketplace includes cosmetic metadata.
- Existing review POST approves/declines both creator listing and cosmetic.

No database destructive migration is required; new schema fields have defaults.

## Global `/dev` authorization hardening
- `/dev` now accepts global Developer access from either `DEVELOPER_USER_IDS` / `DEVELOPER_ID` or a `WebRole` document with `role: developer`.
- The authorization is global by Discord User ID, so an authorized Developer can use `/dev` in any guild where Corgi-Bot is installed.
- `/dev` command execution, prefix entry, `dev:*` component interactions, and `progdev:*` interactions are all checked server-side.
- Discord limitation: a globally registered slash command cannot be dynamically hidden in the command picker for an arbitrary MongoDB allowlist while remaining visible to those same users in every guild. Therefore this patch enforces real access security globally, but does not falsely claim per-user command-picker hiding.

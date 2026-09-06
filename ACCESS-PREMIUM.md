# Corgi-Bot V4.5 Access + Premium

- Global user/guild blacklist is enforced before slash commands, prefix commands and interactive components. Developers bypass global lockouts so `/dev` remains recoverable.
- Maintenance mode blocks normal bot use globally; developers bypass it.
- Corgi AI is Premium-only.
- Premium expiry is checked by time, configuration is retained, and server nickname branding is removed while inactive.
- Premium grant/extend/redeem/revoke history is stored in PremiumAudit.
- Premium CD-key redemption is atomic at the key-use reservation layer and rejects repeat use by the same user in the same guild.
- Developer actions can be written to DEVELOPER_LOG_CHANNEL_ID.
- Discord bot avatar is global; automatic avatar mutation remains guarded by ALLOW_GLOBAL_AVATAR_BRANDING.

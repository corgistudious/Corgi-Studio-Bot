const POST_INTERVAL_MS = 30 * 60 * 1000;

async function postTopggStats(client) {
  const token = String(process.env.TOPGG_TOKEN || '').trim();
  if (!token) {
    console.warn('⚠️ Top.gg stats skipped: TOPGG_TOKEN missing');
    return false;
  }

  if (!client?.user?.id || !client?.isReady?.()) {
    console.warn('⚠️ Top.gg stats skipped: Discord client not ready');
    return false;
  }

  const serverCount = client.guilds.cache.size;

  try {
    const response = await fetch(
      `https://top.gg/api/bots/${client.user.id}/stats`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server_count: serverCount,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(
        `⚠️ Top.gg stats failed: HTTP ${response.status}` +
        (body ? ` • ${body.slice(0, 200)}` : '')
      );
      return false;
    }

    console.log(`📊 Top.gg stats posted • Servers: ${serverCount}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Top.gg stats error: ${error.message}`);
    return false;
  }
}

function startTopggStats(client) {
  postTopggStats(client);

  const timer = setInterval(
    () => postTopggStats(client),
    POST_INTERVAL_MS
  );

  timer.unref();
  return timer;
}

module.exports = {
  postTopggStats,
  startTopggStats,
};

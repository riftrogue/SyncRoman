(function () {
  // Stats: database health check and song count
  const client = window.SyncRomanClient;
  const config = window.SyncRomanConfig;

  function logDebug(...args) {
    if (config.debug) {
      console.log(...args);
    }
  }

  async function checkDatabaseHealth() {
    try {
      const { data, error } = await client
        .from("songs")
        .select("id", { count: "exact", head: true });
      
      if (error) {
        logDebug("health check error:", error);
        return { healthy: false };
      }
      return { healthy: true };
    } catch (err) {
      logDebug("health check exception:", err);
      return { healthy: false };
    }
  }

  async function getTotalCounts() {
    try {
      const { count: songCount, error } = await client
        .from("songs")
        .select("id", { count: "exact", head: true });

      if (error) {
        logDebug("count error:", error);
        return { songs: 0 };
      }

      return { songs: songCount || 0 };
    } catch (err) {
      logDebug("count exception:", err);
      return { songs: 0 };
    }
  }

  window.SyncRomanStats = {
    checkDatabaseHealth,
    getTotalCounts,
  };
})();

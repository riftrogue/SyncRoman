(function () {
  // Initializes a shared Supabase client on window for all modules.
  const config = window.SyncRomanConfig;

  if (!window.supabase) {
    throw new Error("Supabase client library is not loaded.");
  }

  if (!config || !config.supabaseUrl || !config.supabaseKey) {
    throw new Error("SyncRoman config is missing Supabase credentials.");
  }

  window.SyncRomanClient = window.supabase.createClient(
    config.supabaseUrl,
    config.supabaseKey
  );
})();

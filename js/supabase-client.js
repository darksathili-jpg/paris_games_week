(function () {
  const config = window.PGW_CONFIG || {};
  let studentClient = null;
  let teacherClient = null;

  function publicKey() {
    return config.supabasePublishableKey || config.supabaseAnonKey || "";
  }

  function configured() {
    return Boolean(config.supabaseUrl && publicKey() && window.supabase?.createClient);
  }

  function getStudentClient() {
    if (!configured()) return null;
    if (!studentClient) {
      studentClient = window.supabase.createClient(config.supabaseUrl, publicKey(), {
        auth: { storageKey: "pgw-nsi-student-auth", persistSession: true, autoRefreshToken: true }
      });
    }
    return studentClient;
  }

  function getTeacherClient() {
    if (!configured()) return null;
    if (!teacherClient) {
      teacherClient = window.supabase.createClient(config.supabaseUrl, publicKey(), {
        auth: { storageKey: "pgw-nsi-teacher-auth", persistSession: true, autoRefreshToken: true }
      });
    }
    return teacherClient;
  }

  window.PGWSupabase = { configured, getStudentClient, getTeacherClient };
})();

// In-memory and localStorage-backed mock client for local AI Studio environment
// Allows the application to boot and be fully interactive without requiring external Supabase credentials.

const STORAGE_KEY = "ceevee_mock_db_v1";
const SESSION_KEY = "ceevee_mock_session_v1";

const DEFAULT_USER = {
  id: "usr_alex_001",
  email: "alex@morgan.co",
  user_metadata: { full_name: "Alex Morgan" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00.000Z",
};

const DEFAULT_SESSION = {
  access_token: "mock_token_alex_001",
  token_type: "bearer",
  user: DEFAULT_USER,
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
};

const DEFAULT_CV = {
  id: "cv_sample_001",
  user_id: "usr_alex_001",
  title: "Alex Morgan — Product Designer",
  slug: "alex-morgan-product-designer",
  personal_info: {
    fullName: "Alex Morgan",
    email: "alex@morgan.co",
    phone: "+1 (415) 000 0000",
    location: "San Francisco, CA",
    titles: ["Product Designer", "Brand Strategist", "Design Lead"],
    linkedin: "linkedin.com/in/alexmorgan",
    website: "alex.design",
  },
  summary:
    "Senior product designer with a record of shipping refined, conversion-led interfaces across consumer and enterprise products. Combines editorial typographic sensibility with rigorous design-system thinking. Known for compressing ambiguous briefs into shippable, opinionated work.",
  education: [
    {
      institution: "Royal College of Art",
      degree: "MA, Visual Communication",
      location: "London, UK",
      dates: "2018 - 2020",
    },
    {
      institution: "Rhode Island School of Design",
      degree: "BFA, Graphic Design",
      location: "Providence, RI",
      dates: "2014 - 2018",
    },
  ],
  experience: [
    {
      company: "Northbeam Studio",
      position: "Design Lead",
      location: "San Francisco, CA",
      dates: "2023 - Present",
      bullets: [
        "Led the rebrand and product redesign that lifted activation 38% within two quarters.",
        "Built a 60-component design system adopted across three product surfaces.",
        "Hired and mentored a team of four designers across product and brand.",
      ],
    },
    {
      company: "Forma Labs",
      position: "Senior Product Designer",
      location: "Remote",
      dates: "2020 - 2023",
      bullets: [
        "Owned the end-to-end checkout redesign, reducing drop-off by 22%.",
        "Partnered with engineering on a tokenized theming system shipped in eight weeks.",
      ],
    },
  ],
  skills: [
    { group: "Design", items: ["Product", "Brand", "Editorial", "Motion", "Systems"] },
    { group: "Tools", items: ["Figma", "Framer", "After Effects", "Notion"] },
  ],
  settings: { showDates: false, onePage: true },
  created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  updated_at: new Date().toISOString(),
};

interface MockDatabase {
  cvs: any[];
  profiles: any[];
  user_roles: any[];
  cv_events: any[];
}

function getInitialDb(): MockDatabase {
  return {
    cvs: [DEFAULT_CV],
    profiles: [
      {
        id: DEFAULT_USER.id,
        full_name: "Alex Morgan",
        email: "alex@morgan.co",
        created_at: DEFAULT_USER.created_at,
        updated_at: DEFAULT_USER.created_at,
      },
    ],
    user_roles: [
      {
        id: "role_1",
        user_id: DEFAULT_USER.id,
        role: "admin",
        created_at: DEFAULT_USER.created_at,
      },
    ],
    cv_events: [
      {
        id: "ev_1",
        user_id: DEFAULT_USER.id,
        cv_id: DEFAULT_CV.id,
        event_type: "create",
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: "ev_2",
        user_id: DEFAULT_USER.id,
        cv_id: DEFAULT_CV.id,
        event_type: "download",
        metadata: {},
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
  };
}

let inMemoryDb: MockDatabase = getInitialDb();
let currentSession: any = DEFAULT_SESSION;

function loadDb(): MockDatabase {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryDb));
    } catch {}
  }
  return inMemoryDb;
}

function saveDb(db: MockDatabase) {
  inMemoryDb = db;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {}
  }
}

function loadSession(): any {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default demo session for instant exploration
      localStorage.setItem(SESSION_KEY, JSON.stringify(DEFAULT_SESSION));
      return DEFAULT_SESSION;
    } catch {}
  }
  return currentSession;
}

function saveSession(session: any) {
  currentSession = session;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {}
  }
}

type AuthSubscriber = (event: string, session: any) => void;
const authSubscribers = new Set<AuthSubscriber>();

function notifyAuth(event: string, session: any) {
  authSubscribers.forEach((sub) => {
    try {
      sub(event, session);
    } catch (e) {
      console.warn("Auth subscriber error", e);
    }
  });
}

export function createMockSupabaseClient() {
  const auth = {
    onAuthStateChange(callback: AuthSubscriber) {
      authSubscribers.add(callback);
      const session = loadSession();
      // Delay callback to next tick to mirror Supabase async behavior
      setTimeout(() => {
        callback(session ? "SIGNED_IN" : "INITIAL_SESSION", session);
      }, 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authSubscribers.delete(callback);
            },
          },
        },
      };
    },

    async getSession() {
      const session = loadSession();
      return { data: { session }, error: null };
    },

    async getUser() {
      const session = loadSession();
      return { data: { user: session?.user ?? null }, error: null };
    },

    async signInWithPassword({ email }: { email: string; password?: string }) {
      const db = loadDb();
      let profile = db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
      const userId = profile ? profile.id : "usr_" + Math.random().toString(36).substring(2, 9);
      const fullName = profile ? profile.full_name : email.split("@")[0];

      if (!profile) {
        profile = {
          id: userId,
          full_name: fullName,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.profiles.push(profile);
        db.user_roles.push({
          id: "role_" + Math.random().toString(36).substring(2, 9),
          user_id: userId,
          role: "admin",
          created_at: new Date().toISOString(),
        });
        saveDb(db);
      }

      const user = {
        id: userId,
        email,
        user_metadata: { full_name: fullName },
        app_metadata: {},
        aud: "authenticated",
        created_at: profile.created_at,
      };

      const session = {
        access_token: "mock_token_" + userId,
        token_type: "bearer",
        user,
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
      };

      saveSession(session);
      notifyAuth("SIGNED_IN", session);
      return { data: { user, session }, error: null };
    },

    async signUp({
      email,
      options,
    }: {
      email: string;
      password?: string;
      options?: { data?: { full_name?: string } };
    }) {
      const db = loadDb();
      const userId = "usr_" + Math.random().toString(36).substring(2, 9);
      const fullName = options?.data?.full_name || email.split("@")[0];

      const profile = {
        id: userId,
        full_name: fullName,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.profiles.push(profile);
      db.user_roles.push({
        id: "role_" + Math.random().toString(36).substring(2, 9),
        user_id: userId,
        role: "admin",
        created_at: new Date().toISOString(),
      });
      saveDb(db);

      const user = {
        id: userId,
        email,
        user_metadata: { full_name: fullName },
        app_metadata: {},
        aud: "authenticated",
        created_at: profile.created_at,
      };

      const session = {
        access_token: "mock_token_" + userId,
        token_type: "bearer",
        user,
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
      };

      saveSession(session);
      notifyAuth("SIGNED_IN", session);
      return { data: { user, session }, error: null };
    },

    async signOut() {
      saveSession(null);
      notifyAuth("SIGNED_OUT", null);
      return { error: null };
    },

    async getClaims(token: string) {
      const session = loadSession();
      if (session && (session.access_token === token || token.startsWith("mock_token_"))) {
        return {
          data: {
            claims: {
              sub: session.user.id,
              email: session.user.email,
              role: "authenticated",
            },
          },
          error: null,
        };
      }
      return {
        data: {
          claims: {
            sub: DEFAULT_USER.id,
            email: DEFAULT_USER.email,
            role: "authenticated",
          },
        },
        error: null,
      };
    },
  };

  const from = (table: string) => {
    return createQueryBuilder(table);
  };

  return { auth, from };
}

function createQueryBuilder(table: string) {
  let selectedColumns: string | null = null;
  let countOption: string | null = null;
  let isHead = false;
  const filters: Array<{ col: string; op: string; val: any }> = [];
  let orderCol: string | null = null;
  let isAscending = true;
  let limitCount: number | null = null;
  let action: "select" | "insert" | "update" | "delete" = "select";
  let insertData: any = null;
  let updateData: any = null;

  const execute = () => {
    const db = loadDb();
    const rows = (db as any)[table] || [];

    if (action === "insert") {
      const itemsToInsert = Array.isArray(insertData) ? insertData : [insertData];
      const insertedList: any[] = [];
      for (const item of itemsToInsert) {
        const id = item.id || "rec_" + Math.random().toString(36).substring(2, 9);
        const created_at = item.created_at || new Date().toISOString();
        const updated_at = item.updated_at || new Date().toISOString();
        const newRecord = { ...item, id, created_at, updated_at };
        rows.push(newRecord);
        insertedList.push(newRecord);
      }
      saveDb(db);
      return {
        data: Array.isArray(insertData) ? insertedList : insertedList[0],
        error: null,
        count: insertedList.length,
      };
    }

    if (action === "update") {
      let updatedCount = 0;
      let lastUpdated: any = null;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const match = filters.every((f) => {
          if (f.op === "eq") return String(row[f.col]) === String(f.val);
          return true;
        });
        if (match) {
          rows[i] = { ...row, ...updateData, updated_at: new Date().toISOString() };
          lastUpdated = rows[i];
          updatedCount++;
        }
      }
      saveDb(db);
      return { data: lastUpdated, error: null, count: updatedCount };
    }

    if (action === "delete") {
      const remaining = rows.filter((row: any) => {
        return !filters.every((f) => {
          if (f.op === "eq") return String(row[f.col]) === String(f.val);
          return true;
        });
      });
      (db as any)[table] = remaining;
      saveDb(db);
      return { data: null, error: null };
    }

    // Select
    let result = rows.slice();
    for (const f of filters) {
      if (f.op === "eq") {
        result = result.filter((r: any) => String(r[f.col]) === String(f.val));
      }
    }

    if (orderCol) {
      result.sort((a: any, b: any) => {
        const va = a[orderCol!];
        const vb = b[orderCol!];
        if (va < vb) return isAscending ? -1 : 1;
        if (va > vb) return isAscending ? 1 : -1;
        return 0;
      });
    }

    const totalCount = result.length;

    if (limitCount !== null) {
      result = result.slice(0, limitCount);
    }

    if (selectedColumns && selectedColumns !== "*") {
      const cols = selectedColumns.split(",").map((c) => c.trim());
      result = result.map((r: any) => {
        const projection: any = {};
        cols.forEach((col) => {
          projection[col] = r[col];
        });
        return projection;
      });
    }

    return {
      data: isHead ? [] : result,
      error: null,
      count: countOption ? totalCount : undefined,
    };
  };

  const builder: any = {
    select(columns = "*", options?: { count?: string; head?: boolean }) {
      selectedColumns = columns;
      if (options?.count) countOption = options.count;
      if (options?.head) isHead = options.head;
      return builder;
    },

    insert(data: any) {
      action = "insert";
      insertData = data;
      return builder;
    },

    update(data: any) {
      action = "update";
      updateData = data;
      return builder;
    },

    delete() {
      action = "delete";
      return builder;
    },

    eq(col: string, val: any) {
      filters.push({ col, op: "eq", val });
      return builder;
    },

    order(col: string, options?: { ascending?: boolean }) {
      orderCol = col;
      isAscending = options?.ascending !== false;
      return builder;
    },

    limit(count: number) {
      limitCount = count;
      return builder;
    },

    async single() {
      const res = execute();
      const list = Array.isArray(res.data) ? res.data : [res.data];
      if (list.length === 0 || !list[0]) {
        return { data: null, error: { message: "Row not found", code: "PGRST116" } };
      }
      return { data: list[0], error: null };
    },

    async maybeSingle() {
      const res = execute();
      const list = Array.isArray(res.data) ? res.data : [res.data];
      return { data: list[0] ?? null, error: null };
    },

    then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) {
      const res = execute();
      return Promise.resolve(res).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

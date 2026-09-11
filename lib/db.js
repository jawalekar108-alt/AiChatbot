const { Pool } = require('pg');

// --- Why this pattern matters on Vercel ---
// Every serverless invocation can spin up a fresh function instance. If each
// one opened a brand new Postgres connection pool, you'd exhaust Supabase's
// connection limit within minutes under any real traffic. Caching the pool
// on `global` lets warm invocations reuse the same pool instead of opening
// new connections every time.
//
// IMPORTANT: use Supabase's CONNECTION POOLER string (port 6543, "Transaction"
// mode), not the direct connection (port 5432). Find it in Supabase:
// Project Settings > Database > Connection string > "Transaction" tab.

let pool;

function getPool() {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5, // keep low - serverless functions run many concurrent instances
      idleTimeoutMillis: 10000,
    });
  }
  return global._pgPool;
}

async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

module.exports = { query };

import pg from 'pg';
const { Pool, types } = pg;
types.setTypeParser(20, Number);
types.setTypeParser(1700, Number);
// Keep DATE as YYYY-MM-DD without timezone conversion.
types.setTypeParser(1082, value => value);
export function createPostgres(url) {
  const pool = new Pool({connectionString:url, max:10});
  return {
    query: (sql, params=[]) => pool.query(sql, params),
    transaction: async (fn) => {
      const client = await pool.connect();
      try { await client.query('BEGIN'); const result=await fn(client); await client.query('COMMIT'); return result; }
      catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    },
    close: () => pool.end()
  };
}

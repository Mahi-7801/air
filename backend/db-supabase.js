const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper to mimic mysql2 query interface
const db = {
  async query(sql, params = []) {
    // Convert MySQL-style ? placeholders to Supabase RPC or direct queries
    const table = extractTableName(sql);
    const operation = extractOperation(sql);

    if (operation === 'SELECT') {
      return await selectQuery(sql, params);
    } else if (operation === 'INSERT') {
      return await insertQuery(sql, params);
    } else if (operation === 'UPDATE') {
      return await updateQuery(sql, params);
    } else if (operation === 'DELETE') {
      return await deleteQuery(sql, params);
    } else if (operation === 'CREATE') {
      return [[], []]; // DDL - ignore in Supabase
    }
    return [[], []];
  }
};

function extractTableName(sql) {
  const upper = sql.toUpperCase();
  // FROM table_name
  let match = sql.match(/FROM\s+(\w+)/i);
  if (match) return match[1];
  // INTO table_name
  match = sql.match(/INTO\s+(\w+)/i);
  if (match) return match[1];
  // UPDATE table_name
  match = sql.match(/UPDATE\s+(\w+)/i);
  if (match) return match[1];
  // DELETE FROM table_name
  match = sql.match(/DELETE\s+FROM\s+(\w+)/i);
  if (match) return match[1];
  return null;
}

function extractOperation(sql) {
  const upper = sql.toUpperCase().trim();
  if (upper.startsWith('SELECT')) return 'SELECT';
  if (upper.startsWith('INSERT')) return 'INSERT';
  if (upper.startsWith('UPDATE')) return 'UPDATE';
  if (upper.startsWith('DELETE')) return 'DELETE';
  if (upper.startsWith('CREATE')) return 'CREATE';
  if (upper.startsWith('ALTER')) return 'CREATE';
  return 'UNKNOWN';
}

function extractColumns(sql) {
  const match = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
  if (match) return match[1].split(',').map(c => c.trim());
  return [];
}

function extractValues(sql) {
  const match = sql.match(/VALUES\s*\(([^)]+)\)/i);
  if (match) return match[1].split(',').map(v => v.trim().replace(/^\?$/, ''));
  return [];
}

async function selectQuery(sql, params) {
  const table = extractTableName(sql);
  if (!table) return [[], []];

  let query = supabase.from(table).select('*');

  // Parse WHERE clause
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s|\s+GROUP\s|\s+LIMIT\s|$)/is);
  if (whereMatch) {
    const conditions = parseWhereClause(whereMatch[1]);
    for (const cond of conditions) {
      const paramIndex = params.findIndex((_, i) => {
        const qCount = (sql.substring(0, sql.indexOf(cond.column)).match(/\?/g) || []).length;
        return i >= qCount;
      });
      const value = paramIndex >= 0 ? params[paramIndex] : cond.value;
      if (cond.operator === '=') query = query.eq(cond.column, value);
      else if (cond.operator === 'LIKE') query = query.ilike(cond.column, `%${value}%`);
      else if (cond.operator === 'BETWEEN') {
        const nextParam = params[params.indexOf(value) + 1];
        query = query.gte(cond.column, value).lte(cond.column, nextParam);
      }
    }
  }

  // ORDER BY
  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    query = query.order(orderMatch[1], { ascending: (orderMatch[2] || 'ASC').toUpperCase() === 'ASC' });
  }

  // LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) query = query.limit(parseInt(limitMatch[1]));

  const { data, error } = await query;
  if (error) {
    console.error(`Supabase SELECT error on ${table}:`, error.message);
    return [[], []];
  }
  return [data || [], []];
}

async function insertQuery(sql, params) {
  const table = extractTableName(sql);
  const columns = extractColumns(sql);
  if (!table || !columns.length) return [[], []];

  // Build object from columns and params
  const obj = {};
  let paramIdx = 0;
  for (const col of columns) {
    if (paramIdx < params.length) {
      obj[col] = params[paramIdx];
    }
    paramIdx++;
  }

  const { data, error } = await supabase.from(table).insert(obj).select();
  if (error) {
    console.error(`Supabase INSERT error on ${table}:`, error.message);
    return [[], []];
  }
  return [{ insertId: data?.[0]?.id || 0, affectedRows: 1 }, []];
}

async function updateQuery(sql, params) {
  const table = extractTableName(sql);
  if (!table) return [[], []];

  // Parse SET clause
  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/is);
  if (!setMatch) return [[], []];

  const setParts = setMatch[1].split(',').map(s => s.trim());
  const obj = {};
  let paramIdx = 0;
  for (const part of setParts) {
    const [col] = part.split('=').map(s => s.trim());
    if (paramIdx < params.length) {
      obj[col] = params[paramIdx];
    }
    paramIdx++;
  }

  // Parse WHERE
  const whereMatch = sql.match(/WHERE\s+(.+?)$/is);
  let query = supabase.from(table).update(obj);
  if (whereMatch) {
    const conditions = parseWhereClause(whereMatch[1]);
    for (const cond of conditions) {
      const value = params[paramIdx] || cond.value;
      if (cond.operator === '=') query = query.eq(cond.column, value);
      paramIdx++;
    }
  }

  const { error } = await query;
  if (error) {
    console.error(`Supabase UPDATE error on ${table}:`, error.message);
    return [[], []];
  }
  return [{ affectedRows: 1 }, []];
}

async function deleteQuery(sql, params) {
  const table = extractTableName(sql);
  if (!table) return [[], []];

  let query = supabase.from(table).delete();
  const whereMatch = sql.match(/WHERE\s+(.+?)$/is);
  if (whereMatch) {
    const conditions = parseWhereClause(whereMatch[1]);
    let paramIdx = 0;
    for (const cond of conditions) {
      const value = paramIdx < params.length ? params[paramIdx] : cond.value;
      if (cond.operator === '=') query = query.eq(cond.column, value);
      paramIdx++;
    }
  }

  const { error } = await query;
  if (error) {
    console.error(`Supabase DELETE error on ${table}:`, error.message);
    return [[], []];
  }
  return [{ affectedRows: 1 }, []];
}

function parseWhereClause(whereStr) {
  const conditions = [];
  // Split by AND
  const parts = whereStr.split(/\s+AND\s+/i);
  for (const part of parts) {
    const match = part.trim().match(/(\w+)\s*(=|LIKE|BETWEEN|>|<|>=|<=)\s*\??/i);
    if (match) {
      conditions.push({ column: match[1], operator: match[2].toUpperCase() });
    }
  }
  return conditions;
}

module.exports = db;

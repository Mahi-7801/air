const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Unified query helper that mimics mysql2's db.query(sql, params)
async function query(sql, params = []) {
  const upper = sql.toUpperCase().trim();

  if (upper.startsWith('SELECT')) return await handleSelect(sql, params);
  if (upper.startsWith('INSERT')) return await handleInsert(sql, params);
  if (upper.startsWith('UPDATE')) return await handleUpdate(sql, params);
  if (upper.startsWith('DELETE')) return await handleDelete(sql, params);
  if (upper.startsWith('CREATE') || upper.startsWith('ALTER')) return [[], []];
  return [[], []];
}

function getTable(sql) {
  const m = sql.match(/(?:FROM|INTO|UPDATE|DELETE\s+FROM)\s+(\w+)/i);
  return m ? m[1] : null;
}

function parseWhere(sql, params) {
  const m = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|\s+HAVING|$)/is);
  if (!m) return { filters: [], paramIdx: 0 };

  const filters = [];
  const parts = m[1].split(/\s+AND\s+/i);
  let paramIdx = 0;

  for (const part of parts) {
    const cm = part.trim().match(/(\w+)\s*(=|LIKE|BETWEEN|>=|<=|>|<|<>)\s*(\?|'[^']*'|\d+)/i);
    if (!cm) continue;

    const col = cm[1];
    const op = cm[2].toUpperCase();
    let val;

    if (cm[3] === '?') {
      val = params[paramIdx++];
    } else if (cm[3].startsWith("'")) {
      val = cm[3].slice(1, -1);
    } else {
      val = isNaN(cm[3]) ? cm[3] : Number(cm[3]);
    }

    if (op === '=') filters.push({ col, op: 'eq', val });
    else if (op === 'LIKE') filters.push({ col, op: 'ilike', val: `%${val}%` });
    else if (op === '>') filters.push({ col, op: 'gt', val });
    else if (op === '<') filters.push({ col, op: 'lt', val });
    else if (op === '>=') filters.push({ col, op: 'gte', val });
    else if (op === '<=') filters.push({ col, op: 'lte', val });
    else if (op === '<>') filters.push({ col, op: 'neq', val });
    else if (op === 'BETWEEN') {
      filters.push({ col, op: 'gte', val });
      const nextVal = params[paramIdx++];
      filters.push({ col, op: 'lte', val: nextVal });
    }
  }
  return { filters, paramIdx };
}

function applyFilters(q, filters) {
  for (const f of filters) {
    if (f.op === 'eq') q = q.eq(f.col, f.val);
    else if (f.op === 'ilike') q = q.ilike(f.col, f.val);
    else if (f.op === 'gt') q = q.gt(f.col, f.val);
    else if (f.op === 'lt') q = q.lt(f.col, f.val);
    else if (f.op === 'gte') q = q.gte(f.col, f.val);
    else if (f.op === 'lte') q = q.lte(f.col, f.val);
    else if (f.op === 'neq') q = q.neq(f.col, f.val);
  }
  return q;
}

async function handleSelect(sql, params) {
  const table = getTable(sql);
  if (!table) return [[], []];

  let q = supabase.from(table).select('*');
  const { filters } = parseWhere(sql, params);
  q = applyFilters(q, filters);

  // JOIN simulation - fetch related data inline
  if (sql.includes('JOIN airports a')) {
    q = supabase.from(table).select('*, airports!inner(*)');
  } else if (sql.includes('JOIN ports p')) {
    q = supabase.from(table).select('*, ports!inner(*)');
  }

  // ORDER BY
  const orderM = sql.match(/ORDER\s+BY\s+(\w+\.?\w*)\s*(ASC|DESC)?/i);
  if (orderM) {
    const col = orderM[1].includes('.') ? orderM[1].split('.')[1] : orderM[1];
    q = q.order(col, { ascending: (orderM[2] || 'ASC').toUpperCase() === 'ASC' });
  }

  // LIMIT
  const limitM = sql.match(/LIMIT\s+(\d+)/i);
  if (limitM) q = q.limit(parseInt(limitM[1]));

  const { data, error } = await q;
  if (error) {
    console.error(`SELECT ${table} error:`, error.message);
    return [[], []];
  }

  // Flatten JOIN results
  const result = (data || []).map(row => {
    if (row.airports) {
      return { ...row, airport_name: row.airports.name, airport_code: row.airports.code, ...row.airports };
    }
    if (row.ports) {
      return { ...row, port_name: row.ports.name, port_code: row.ports.code, ...row.ports };
    }
    return row;
  });

  return [result, []];
}

async function handleInsert(sql, params) {
  const table = getTable(sql);
  const colMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
  if (!table || !colMatch) return [[], []];

  const columns = colMatch[1].split(',').map(c => c.trim());
  const obj = {};
  columns.forEach((col, i) => { if (i < params.length) obj[col] = params[i]; });

  const { data, error } = await supabase.from(table).insert(obj).select();
  if (error) {
    console.error(`INSERT ${table} error:`, error.message);
    // Handle duplicate key
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return [null, { code: 'ER_DUP_ENTRY' }];
    }
    return [[], []];
  }
  return [{ insertId: data?.[0]?.id || 0, affectedRows: 1 }, []];
}

async function handleUpdate(sql, params) {
  const table = getTable(sql);
  if (!table) return [[], []];

  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/is);
  if (!setMatch) return [[], []];

  const setParts = setMatch[1].split(',').map(s => s.trim());
  const obj = {};
  let paramIdx = 0;
  for (const part of setParts) {
    const [col] = part.split('=').map(s => s.trim());
    if (paramIdx < params.length) obj[col] = params[paramIdx];
    paramIdx++;
  }

  const whereStr = sql.substring(sql.toUpperCase().indexOf('WHERE'));
  const { filters } = parseWhere(whereStr, params.slice(paramIdx));

  let q = supabase.from(table).update(obj);
  q = applyFilters(q, filters);

  const { error } = await q;
  if (error) {
    console.error(`UPDATE ${table} error:`, error.message);
    return [[], []];
  }
  return [{ affectedRows: 1 }, []];
}

async function handleDelete(sql, params) {
  const table = getTable(sql);
  if (!table) return [[], []];

  const whereStr = sql.substring(sql.toUpperCase().indexOf('WHERE'));
  const { filters } = parseWhere(whereStr, params);

  let q = supabase.from(table).delete();
  q = applyFilters(q, filters);

  const { error } = await q;
  if (error) {
    console.error(`DELETE ${table} error:`, error.message);
    return [[], []];
  }
  return [{ affectedRows: 1 }, []];
}

// For raw Supabase access when needed
query.raw = supabase;

module.exports = { query };

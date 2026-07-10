require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ap_transport_intelligence',
  });

  console.log('Connected. Seeding data...');

  // Clear existing data
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('TRUNCATE TABLE forecast_logs');
  await conn.query('TRUNCATE TABLE port_forecasts');
  await conn.query('TRUNCATE TABLE ports');
  await conn.query('TRUNCATE TABLE forecasts');
  await conn.query('TRUNCATE TABLE routes');
  await conn.query('TRUNCATE TABLE datasets');
  await conn.query('TRUNCATE TABLE airports');
  await conn.query('TRUNCATE TABLE users');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  // --- AIRPORTS ---
  const airports = [
    ['Vijayawada International Airport', 'VGA', 'airport', 16.5304, 80.7969, 8500000, 'active'],
    ['Tirupati Airport', 'TIR', 'airport', 13.6312, 79.5435, 5200000, 'active'],
    ['Bhogapuram International Airport', 'BPM', 'airport', 18.1434, 83.5613, 6000000, 'under_construction'],
    ['Kadapa Airport', 'CDP', 'airport', 14.5740, 78.8244, 2500000, 'active'],
    ['Rajahmundry Airport', 'RJA', 'airport', 17.1104, 81.8182, 2000000, 'active'],
    ['Kakinada Airport', 'CBD', 'airport', 16.9665, 82.2478, 1800000, 'planned'],
  ];
  const [airRes] = await conn.query('INSERT INTO airports (name, code, type, latitude, longitude, capacity_2035, status) VALUES ?', [airports]);
  console.log(`Inserted ${airRes.affectedRows} airports.`);

  // --- FORECASTS (2026-2035 for all airports) ---
  const forecastRows = [];
  const domesticBase = [2600000, 2900000, 3200000, 3550000, 3900000, 4250000, 4650000, 5050000, 5350000, 5600000];
  const intlBase =     [500000,  530000,  560000,  590000,  620000,  655000,  690000,  725000,  760000,  800000];
  const cargoBase =    [12000,  13500,   15200,   17100,   19200,   21500,   24000,   26800,   29000,   32000];

  for (let airportIdx = 1; airportIdx <= 6; airportIdx++) {
    const scale = airportIdx <= 2 ? 1.0 : airportIdx <= 4 ? 0.45 : 0.3;
    for (let i = 0; i < 10; i++) {
      const year = 2026 + i;
      const dom = Math.round(domesticBase[i] * scale);
      const intl = Math.round(intlBase[i] * scale);
      const cargo = Math.round(cargoBase[i] * scale);
      const lo = 88 + Math.round(Math.random() * 4);
      const hi = 93 + Math.round(Math.random() * 5);
      forecastRows.push([airportIdx, year, dom, intl, cargo, lo, hi]);
    }
  }
  await conn.query('INSERT INTO forecasts (airport_id, year, domestic_passengers, international_passengers, cargo_mt, confidence_low, confidence_high) VALUES ?', [forecastRows]);
  console.log(`Inserted ${forecastRows.length} forecast rows.`);

  // --- PORTS ---
  const ports = [
    ['Visakhapatnam Port', 'VSKP', 17.6868, 83.2185, 120000000, 'active'],
    ['Kakinada Port', 'COA', 16.9665, 82.2478, 35000000, 'active'],
    ['Krishnapatnam Port', 'KRI', 14.2530, 80.1072, 90000000, 'active'],
    ['Machilipatnam Port', 'MTP', 16.1869, 81.1423, 15000000, 'planned'],
  ];
  const [portRes] = await conn.query('INSERT INTO ports (name, code, latitude, longitude, cargo_capacity_mt, status) VALUES ?', [ports]);
  console.log(`Inserted ${portRes.affectedRows} ports.`);

  // --- PORT FORECASTS ---
  const portForecastRows = [];
  const roadBase =   [45000000, 48000000, 51000000, 54500000, 58000000, 62000000, 66500000, 71000000, 75000000, 80000000];
  const railBase =   [30000000, 32000000, 34500000, 37000000, 39500000, 42500000, 45500000, 49000000, 52000000, 56000000];
  const seaBase =    [42000000, 46000000, 50500000, 55000000, 60000000, 65500000, 71000000, 77000000, 82000000, 88000000];

  for (let portIdx = 1; portIdx <= 4; portIdx++) {
    const scale = portIdx === 1 ? 1.0 : portIdx === 2 ? 0.35 : portIdx === 3 ? 0.75 : 0.12;
    for (let i = 0; i < 10; i++) {
      const year = 2026 + i;
      const road = Math.round(roadBase[i] * scale / 1000) * 1000;
      const rail = Math.round(railBase[i] * scale / 1000) * 1000;
      const sea = Math.round(seaBase[i] * scale / 1000) * 1000;
      const total = road + rail + sea;
      const lo = 87 + Math.round(Math.random() * 5);
      const hi = 92 + Math.round(Math.random() * 6);
      portForecastRows.push([portIdx, year, road, rail, sea, total, lo, hi]);
    }
  }
  await conn.query('INSERT INTO port_forecasts (port_id, year, road_cargo_mt, rail_cargo_mt, sea_cargo_mt, total_cargo_mt, confidence_low, confidence_high) VALUES ?', [portForecastRows]);
  console.log(`Inserted ${portForecastRows.length} port forecast rows.`);

  // --- ROUTES ---
  const routes = [
    [1, 'Delhi (DEL)', 92.5, 'High domestic demand driven by business and pilgrimage traffic. Current connectivity insufficient for projected 2028 passenger volumes.', 'Approved'],
    [1, 'Singapore (SIN)', 78.3, 'Growing international tourist arrivals to AP temple circuit. Direct connectivity reduces transit time by 4 hours.', 'Under Review'],
    [2, 'Hyderabad (HYD)', 88.1, 'Short-haul feeder route with strong pilgrimage and business demand. Average 85% load factor on existing connecting flights.', 'Approved'],
    [1, 'Bangalore (BLR)', 85.7, 'IT corridor connectivity critical for Vizag-AP tech ecosystem. Current road connectivity takes 12+ hours.', 'Under Review'],
    [2, 'Chennai (MAA)', 74.6, 'Medical tourism and cultural exchange. Frequency increase recommended based on 92% occupancy on existing flights.', 'Proposed'],
    [3, 'Mumbai (BOM)', 65.2, 'Planned airport needs guaranteed connectivity to major hubs. Proposed 3x daily service from opening day.', 'Proposed'],
    [4, 'Kolkata (CCU)', 58.9, 'Eastern corridor connectivity gap. Industrial demand from Kadapa mining region supports freight-passenger combo.', 'Proposed'],
    [5, 'Visakhapatnam (VTZ)', 71.4, 'Coastal AP intra-state connectivity. Supports port-hinterland logistics and business travel.', 'Approved'],
  ];
  const [routeRes] = await conn.query('INSERT INTO routes (airport_id, destination, demand_score, reasoning, status) VALUES ?', [routes]);
  console.log(`Inserted ${routeRes.affectedRows} routes.`);

  // --- DATASETS ---
  const datasets = [
    ['DGCA Passenger & Cargo Data', 'https://github.com/Vonter/india-aviation-traffic', 'Pre-scraped DGCA monthly passenger and cargo statistics for Indian airports', 'Connected', '2026-07-09 10:30:00'],
    ['data.gov.in Port Cargo Traffic', 'https://www.data.gov.in/catalog/traffic-handled-major-ports-india', 'Major port cargo handling statistics from data.gov.in open data portal', 'Connected', '2026-07-09 09:15:00'],
    ['World Bank Economic Indicators', 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392', 'GDP growth, trade volume, and population projections for economic modeling', 'Connected', '2026-07-08 14:00:00'],
    ['OpenSky Network Flight Data', 'https://opensky-network.org', 'Real-time and historical flight tracking for route frequency analysis', 'Connected', '2026-07-09 11:00:00'],
    ['FASTag Traffic Data', null, 'Highway toll transaction data for freight volume estimation. Awaiting official data-sharing MoU with NHAI/NPCI.', 'Pending', null],
    ['E-Way Bill Data (GSTN)', null, 'Goods movement data for freight pattern analysis. Awaiting government authorization.', 'Pending', null],
    ['FOIS Railway Freight Data', null, 'Indian Railways freight movement data. Access restricted under Railway Board policy.', 'Pending', null],
    ['AviationStack Flight Schedules', 'https://aviationstack.com', 'Optional supplementary flight schedule data. Free tier available.', 'Connected', '2026-07-09 08:00:00'],
  ];
  const [dsRes] = await conn.query('INSERT INTO datasets (name, source_url, description, status, last_synced) VALUES ?', [datasets]);
  console.log(`Inserted ${dsRes.affectedRows} datasets.`);

  // --- USERS ---
  const adminPass = await bcrypt.hash('admin123', 10);
  const viewerPass = await bcrypt.hash('viewer123', 10);
  const users = [
    ['admin@aptransport.gov.in', adminPass, 'System Administrator', 'admin'],
    ['viewer@aptransport.gov.in', viewerPass, 'Department Viewer', 'viewer'],
    ['ramya@aptransport.gov.in', adminPass, 'Ramya', 'admin'],
  ];
  const [userRes] = await conn.query('INSERT INTO users (email, password, full_name, role) VALUES ?', [users]);
  console.log(`Inserted ${userRes.affectedRows} users.`);

  console.log('\nSeed complete!');
  await conn.end();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });

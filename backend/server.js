require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('./db');
const { authMiddleware, adminOnly } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// ===================== SMTP EMAIL =====================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (e) {
    console.error('Email send error:', e.message);
    return false;
  }
}

// ===================== OPENSKY ADS-B DATA =====================
let openskyToken = { value: null, expiresAt: 0 };
let openskyBackoff = { failedAt: 0, cooldownMs: 5 * 60 * 1000 }; // 5-min cooldown after failure

async function getOpenSkyToken() {
  if (openskyToken.value && Date.now() < openskyToken.expiresAt) return openskyToken.value;

  // If we recently failed, don't retry until cooldown expires
  if (openskyBackoff.failedAt && Date.now() - openskyBackoff.failedAt < openskyBackoff.cooldownMs) {
    return null; // silently skip — already logged the first failure
  }

  try {
    const res = await fetch(process.env.OPENSKY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.OPENSKY_CLIENT_ID,
        client_secret: process.env.OPENSKY_CLIENT_SECRET,
      }),
    });
    const data = await res.json();
    if (data.access_token) {
      openskyToken.value = data.access_token;
      openskyToken.expiresAt = Date.now() + (data.expires_in - 60) * 1000;
      openskyBackoff.failedAt = 0; // reset on success
      return openskyToken.value;
    }
  } catch (e) {
    if (!openskyBackoff.failedAt) {
      console.error('OpenSky token error:', e.message, '— will retry after 5 min cooldown');
    }
    openskyBackoff.failedAt = Date.now();
  }
  return null;
}

let openskyCache = { data: null, timestamp: 0 };

async function getOpenSkyStates() {
  const now = Date.now();
  if (openskyCache.data && now - openskyCache.timestamp < 5000) return openskyCache.data;

  const token = await getOpenSkyToken();
  if (!token) {
    return null;
  }

  try {
    const res = await fetch('https://opensky-network.org/api/states/all', {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.states) return null;

    const map = {};
    for (const s of data.states) {
      const callsign = (s[1] || '').trim();
      if (callsign) map[callsign] = {
        latitude: s[6],
        longitude: s[5],
        altitude: s[7],
        on_ground: s[8],
        velocity: s[9],
        heading: s[10],
        vertical_rate: s[11],
        icao24: s[0],
      };
    }
    openskyCache = { data: map, timestamp: now };
    return map;
  } catch (e) {
    console.error('OpenSky states error:', e.message);
    return null;
  }
}

// ===================== HEALTH CHECK =====================
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    name: 'AP Transport Intelligence API',
    port: process.env.PORT || 5000,
    endpoints: [
      '/api/overview',
      '/api/airports',
      '/api/ports',
      '/api/routes',
      '/api/forecasts',
      '/api/datasets',
      '/api/auth/login',
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===================== AUTH =====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, full_name: user.full_name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)', [email, hash, full_name, role || 'viewer']);
    res.json({ id: result.insertId, email, full_name, role: role || 'viewer' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, full_name, role FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== AIRPORTS =====================
app.get('/api/airports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM airports ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/airports/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM airports WHERE id = ?', [req.params.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/airports/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, code, capacity_2035, status, latitude, longitude } = req.body;
    await db.query('UPDATE airports SET name=?, code=?, capacity_2035=?, status=?, latitude=?, longitude=? WHERE id=?',
      [name, code, capacity_2035, status, latitude, longitude, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== FORECASTS =====================
app.get('/api/forecasts/:airportId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM forecasts WHERE airport_id = ? ORDER BY year', [req.params.airportId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/forecasts', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, a.name as airport_name, a.code as airport_code
      FROM forecasts f
      JOIN airports a ON f.airport_id = a.id
      ORDER BY a.name, f.year
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/forecasts/:airportId/:year', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { domestic_passengers, international_passengers, cargo_mt, confidence_low, confidence_high } = req.body;
    const [existing] = await db.query('SELECT * FROM forecasts WHERE airport_id=? AND year=?', [req.params.airportId, req.params.year]);

    if (existing.length > 0) {
      await db.query('UPDATE forecasts SET domestic_passengers=?, international_passengers=?, cargo_mt=?, confidence_low=?, confidence_high=? WHERE airport_id=? AND year=?',
        [domestic_passengers, international_passengers, cargo_mt, confidence_low, confidence_high, req.params.airportId, req.params.year]);
    } else {
      await db.query('INSERT INTO forecasts (airport_id, year, domestic_passengers, international_passengers, cargo_mt, confidence_low, confidence_high) VALUES (?,?,?,?,?,?,?)',
        [req.params.airportId, req.params.year, domestic_passengers, international_passengers, cargo_mt, confidence_low, confidence_high]);
    }

    // Log the change
    const fields = { domestic_passengers, international_passengers, cargo_mt };
    for (const [field, value] of Object.entries(fields)) {
      const oldVal = existing.length > 0 ? String(existing[0][field]) : 'N/A';
      await db.query('INSERT INTO forecast_logs (airport_id, admin_email, field_changed, old_value, new_value) VALUES (?,?,?,?,?)',
        [req.params.airportId, req.user.email, field, oldVal, String(value)]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== PORTS =====================
app.get('/api/ports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ports ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ports/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ports WHERE id = ?', [req.params.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/port-forecasts/:portId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM port_forecasts WHERE port_id = ? ORDER BY year', [req.params.portId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/port-forecasts', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pf.*, p.name as port_name, p.code as port_code
      FROM port_forecasts pf
      JOIN ports p ON pf.port_id = p.id
      ORDER BY p.name, pf.year
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== ROUTES =====================
app.get('/api/routes', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, a.name as airport_name, a.code as airport_code
      FROM routes r
      JOIN airports a ON r.airport_id = a.id
      ORDER BY r.demand_score DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/routes/:airportId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM routes WHERE airport_id = ? ORDER BY demand_score DESC', [req.params.airportId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/routes/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { destination, demand_score, reasoning, status } = req.body;
    await db.query('UPDATE routes SET destination=?, demand_score=?, reasoning=?, status=? WHERE id=?',
      [destination, demand_score, reasoning, status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== LIVE DATA (AviationStack + OpenSky ADS-B) =====================

// AP region bounding box: Andhra Pradesh / Telangana area
const AP_BBOX = { lamin: 8.0, lamax: 20.0, lomin: 76.0, lomax: 90.0 };

// Known AP airport IATA → ICAO mapping for matching
const AP_IATA_ICAO = {
  VTZ: 'VOVZ', VGA: 'VOBZ', TIR: 'VOTP', RJA: 'VORY',
  CDP: 'VOCP', KJB: 'VOYK', HYD: 'VOHS', BLR: 'VOBL',
};

let openskyFlightsCache = { data: null, timestamp: 0 };

async function getOpenSkyFlightsForAP(iata) {
  const now = Date.now();
  if (openskyFlightsCache.data && now - openskyFlightsCache.timestamp < 10000) {
    let flights = openskyFlightsCache.data;
    if (iata) {
      flights = flights.filter(f =>
        f.departure?.iata === iata || f.arrival?.iata === iata ||
        (f.departure?.airport || '').toUpperCase().includes(iata)
      );
    }
    return flights;
  }

  const token = await getOpenSkyToken();
  if (!token) {
    return [];
  }

  // AP region cities for reverse geocoding
  const AP_CITIES = [
    { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
    { name: 'Vijayawada', lat: 16.5062, lon: 80.6480 },
    { name: 'Tirupati', lat: 13.6288, lon: 79.4192 },
    { name: 'Rajahmundry', lat: 17.0005, lon: 81.8040 },
    { name: 'Kadapa', lat: 14.4674, lon: 78.8241 },
    { name: 'Kurnool', lat: 15.8281, lon: 78.0373 },
    { name: 'Guntur', lat: 16.3067, lon: 80.4365 },
    { name: 'Nellore', lat: 14.4426, lon: 79.9865 },
    { name: 'Kakinada', lat: 16.9891, lon: 82.2475 },
    { name: 'Ongole', lat: 15.5057, lon: 80.0499 },
    { name: 'Machilipatnam', lat: 16.1869, lon: 81.1364 },
    { name: 'Eluru', lat: 16.7107, lon: 81.0952 },
    { name: 'Anantapur', lat: 14.6819, lon: 77.5975 },
    { name: 'Chittoor', lat: 13.2172, lon: 79.1003 },
    { name: 'Srikakulam', lat: 18.2948, lon: 83.8938 },
    { name: 'Vizianagaram', lat: 18.1067, lon: 83.3956 },
    { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
    { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
    { name: 'Goa', lat: 15.2993, lon: 74.1240 },
    { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 },
    { name: 'Port Blair', lat: 11.6234, lon: 92.7265 },
  ];

  function findNearestCity(lat, lon) {
    let best = null, bestDist = Infinity;
    for (const city of AP_CITIES) {
      const d = haversineDistance(lat, lon, city.lat, city.lon);
      if (d < bestDist) { bestDist = d; best = city; }
    }
    return bestDist < 200 ? best.name : null;
  }

  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${AP_BBOX.lamin}&lamax=${AP_BBOX.lamax}&lomin=${AP_BBOX.lomin}&lomax=${AP_BBOX.lomax}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.states || data.states.length === 0) return [];

    // Known airline ICAO prefixes for AP region
    const AIRLINE_NAMES = {
      IGO: 'IndiGo', AI: 'Air India', SEJ: 'SpiceJet', I5: 'AirAsia India',
      SG: 'SpiceJet', G8: 'GoFirst', '6E': 'IndiGo', UK: 'Vistara',
      AXB: 'Air India Express', RSH: 'Air India Regional',
    };

    const flights = data.states.map(s => {
      const callsign = (s[1] || '').trim();
      const icao24 = s[0] || '';
      const onGround = s[8];
      const lat = s[6];
      const lon = s[5];

      // Determine airline from callsign prefix
      const prefix3 = callsign.substring(0, 3).toUpperCase();
      const prefix2 = callsign.substring(0, 2).toUpperCase();
      const airlineName = AIRLINE_NAMES[prefix3] || AIRLINE_NAMES[prefix2] || callsign || 'Unknown';

      // Find nearest airport
      let nearestAirport = null;
      let minDist = Infinity;
      for (const [code, airport] of Object.entries(AP_AIRPORTS)) {
        const d = haversineDistance(lat, lon, airport.lat, airport.lon);
        if (d < minDist) { minDist = d; nearestAirport = { code, name: airport.name, dist: d }; }
      }

      const isNearAirport = minDist < 150;
      const isDeparting = onGround || (s[7] && s[7] < 3000 && s[11] && s[11] > 0);

      // Always include IATA code in labels so frontend filters can match
      const depLabel = nearestAirport && isNearAirport
        ? `${nearestAirport.code} - ${nearestAirport.name}`
        : 'AP Region';
      const arrLabel = !isDeparting && nearestAirport && minDist < 80
        ? `${nearestAirport.code} - ${nearestAirport.name}`
        : null;

      return {
        flight: { iata: callsign || null, icao: callsign },
        airline: { name: airlineName, icao: prefix3 },
        departure: {
          iata: isNearAirport && nearestAirport ? nearestAirport.code : null,
          airport: depLabel,
          gate: null, terminal: null,
        },
        arrival: {
          iata: arrLabel ? nearestAirport.code : null,
          airport: arrLabel,
          gate: null, terminal: null,
        },
        flight_status: onGround ? 'ground' : 'active',
        live: onGround ? null : {
          latitude: lat,
          longitude: lon,
          altitude: s[7],
          speed_horizontal: s[9] ? Math.round(s[9] * 3.6) : null,
          direction: s[10],
          vertical_rate: s[11],
          is_ground: false,
          source: 'opensky-adsb',
          position_label: findNearestCity(lat, lon) || (isNearAirport && nearestAirport ? `${nearestAirport.name} Region` : 'AP Region'),
        },
        _icao24: icao24,
        _origin: 'opensky',
      };
    });

    openskyFlightsCache = { data: flights, timestamp: now };

    // Filter by IATA code if provided
    if (iata) {
      const code = iata.toUpperCase();
      return flights.filter(f =>
        f.departure?.iata === code || f.arrival?.iata === code ||
        (f.departure?.airport || '').toUpperCase().includes(code) ||
        (f.arrival?.airport || '').toUpperCase().includes(code)
      );
    }
    return flights;
  } catch (e) {
    console.error('OpenSky AP flights error:', e.message);
    return [];
  }
}

app.get('/api/live-flights', async (req, res) => {
  try {
    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    const iata = req.query.iata;

    // Try AviationStack first (skip if rate-limited)
    let aviationStackData = null;
    if (apiKey && !aviationStackRateLimited) {
      let url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_status=active&limit=100`;
      if (iata) url += `&dep_iata=${iata}`;

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          aviationStackData = data;
        } else if (data.error) {
          const errMsg = data.error.message || JSON.stringify(data.error);
          if (data.error.code === 104 || errMsg.toLowerCase().includes('limit')) {
            aviationStackRateLimited = true;
            console.warn('AviationStack monthly limit reached — disabled for this session');
          } else {
            console.log('AviationStack error:', errMsg);
          }
        }
      } catch (e) {
        console.log('AviationStack timeout/error:', e.message);
      }

      // If no departures for iata, try arrivals
      if (iata && !aviationStackRateLimited && (!aviationStackData || !aviationStackData.data || aviationStackData.data.length === 0)) {
        try {
          const arrUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_status=active&limit=100&arr_iata=${iata}`;
          const arrRes = await fetch(arrUrl, { signal: AbortSignal.timeout(15000) });
          const arrData = await arrRes.json();
          if (arrData.data && arrData.data.length > 0) {
            aviationStackData = arrData;
          } else if (arrData.error) {
            const errMsg = arrData.error.message || JSON.stringify(arrData.error);
            if (arrData.error.code === 104 || errMsg.toLowerCase().includes('limit')) {
              aviationStackRateLimited = true;
              console.warn('AviationStack monthly limit reached — disabled for this session');
            }
          }
        } catch (e) { /* ignore */ }
      }
    }

    // If AviationStack returned data, enrich with OpenSky and return
    if (aviationStackData && aviationStackData.data && aviationStackData.data.length > 0) {
      let openskyStates = null;
      try { openskyStates = await getOpenSkyStates(); } catch (e) { /* ignore */ }
      if (openskyStates) {
        aviationStackData.data = enrichFlightsWithOpenSky(aviationStackData.data, openskyStates);
      }
      return res.json(aviationStackData);
    }

    // Fallback: use OpenSky directly for AP region
    const openskyFlights = await getOpenSkyFlightsForAP(iata);
    if (openskyFlights && openskyFlights.length > 0) {
      return res.json({ data: openskyFlights, source: 'opensky-adsb' });
    }

    // No live data available from any source
    return res.json({ data: [], source: 'unavailable', message: 'Live flight data is currently unavailable. AviationStack and OpenSky APIs are down or rate-limited.' });
  } catch (err) {
    console.error('Live flights error:', err.message);
    res.json({ data: [], source: 'unavailable', error: err.message });
  }
});

function enrichFlightsWithOpenSky(flights, openskyMap) {
  return flights.map(f => {
    const icaoCallsign = (f.flight?.icao || '').trim().toUpperCase();
    const iataCallsign = (f.flight?.iata || '').trim().toUpperCase();
    const airlineIcao = (f.airline?.icao || '').trim().toUpperCase();

    let match = null;
    if (icaoCallsign && openskyMap[icaoCallsign]) match = openskyMap[icaoCallsign];
    if (!match && airlineIcao && icaoCallsign) {
      const fullCallsign = airlineIcao + icaoCallsign.replace(airlineIcao, '');
      if (openskyMap[fullCallsign]) match = openskyMap[fullCallsign];
    }
    if (!match) {
      for (const key of Object.keys(openskyMap)) {
        if (key.includes(icaoCallsign) || icaoCallsign.includes(key)) {
          match = openskyMap[key];
          break;
        }
      }
    }

    if (match && !match.on_ground) {
      f.live = {
        latitude: match.latitude,
        longitude: match.longitude,
        altitude: match.altitude,
        speed_horizontal: match.velocity ? Math.round(match.velocity * 3.6) : null,
        direction: match.heading,
        vertical_rate: match.vertical_rate,
        is_ground: false,
        source: 'opensky-adsb',
      };
    } else if (match && match.on_ground) {
      f.live = { ...f.live, is_ground: true, source: 'opensky-adsb' };
    }

    return f;
  });
}

// AP airports with approximate coordinates for proximity matching
const AP_AIRPORTS = {
  VTZ: { lat: 17.7215, lon: 83.2245, name: 'Visakhapatnam' },
  VGA: { lat: 16.5304, lon: 80.7969, name: 'Vijayawada' },
  TIR: { lat: 13.6312, lon: 79.5435, name: 'Tirupati' },
  RJA: { lat: 17.1104, lon: 81.8182, name: 'Rajahmundry' },
  CDP: { lat: 14.5126, lon: 78.7541, name: 'Kadapa' },
  KJB: { lat: 15.7242, lon: 78.1439, name: 'Kurnool' },
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let apLiveCache = { data: null, timestamp: 0 };
let aviationStackRateLimited = false; // true when monthly limit hit — persists for server lifetime

app.get('/api/ap-live-counts', async (req, res) => {
  const now = Date.now();
  // 30 second cache
  if (apLiveCache.data && now - apLiveCache.timestamp < 30000) {
    return res.json(apLiveCache.data);
  }

  const counts = { VTZ: 0, VGA: 0, TIR: 0, RJA: 0, CDP: 0, KJB: 0 };
  const AP_IATA_CODES = ['VTZ', 'VGA', 'TIR', 'RJA', 'CDP', 'KJB'];

  try {
    const apiKey = process.env.AVIATIONSTACK_API_KEY;

    if (apiKey && !aviationStackRateLimited) {
      // Test one request first to check if rate-limited
      const testUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_status=active&dep_iata=VTZ&limit=1`;
      const testRes = await fetch(testUrl, { signal: AbortSignal.timeout(8000) }).then(r => r.json()).catch(() => null);

      if (testRes?.error?.code === 104 || (testRes?.error?.message || '').toLowerCase().includes('limit')) {
        aviationStackRateLimited = true;
        console.warn('AviationStack monthly limit hit — disabled for this session');
      } else if (testRes?.data) {
        // AviationStack works - fetch all airports
        counts['VTZ'] = testRes.data.length;
        for (const code of AP_IATA_CODES.slice(1)) {
          try {
            const depUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_status=active&dep_iata=${code}&limit=50`;
            const arrUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_status=active&arr_iata=${code}&limit=50`;
            const [depRes, arrRes] = await Promise.all([
              fetch(depUrl, { signal: AbortSignal.timeout(8000) }).then(r => r.json()).catch(() => null),
              fetch(arrUrl, { signal: AbortSignal.timeout(8000) }).then(r => r.json()).catch(() => null),
            ]);
            counts[code] = (depRes?.data?.length || 0) + (arrRes?.data?.length || 0);
          } catch (e) { /* keep 0 */ }
        }
        apLiveCache = { data: counts, timestamp: now };
        return res.json(counts);
      }
    }

    // Fallback: OpenSky ADS-B proximity count (checks both dep + arr labels)
    const flights = await getOpenSkyFlightsForAP();
    for (const f of flights) {
      for (const code of AP_IATA_CODES) {
        const depIata = (f.departure?.iata || '').toUpperCase();
        const arrIata = (f.arrival?.iata || '').toUpperCase();
        const depLabel = (f.departure?.airport || '').toUpperCase();
        const arrLabel = (f.arrival?.airport || '').toUpperCase();
        if (depIata === code || arrIata === code || depLabel.startsWith(code) || arrLabel.startsWith(code)) {
          counts[code]++;
        }
      }
    }
  } catch (e) {
    console.error('ap-live-counts error:', e.message);
  }

  apLiveCache = { data: counts, timestamp: now };
  res.json(counts);
});

// ===================== AIR QUALITY (DataGovIndia) =====================
let airQualityCache = { data: null, timestamp: 0 };

app.get('/api/air-quality', async (req, res) => {
  const now = Date.now();
  if (airQualityCache.data && now - airQualityCache.timestamp < 300000) {
    return res.json(airQualityCache.data);
  }
  try {
    const apiKey = process.env.DATAGOVINDIA_API_KEY;

    if (!apiKey) {
      return res.json({ total: 0, records: [], states: [], cities: [], message: 'Air quality data unavailable. API key not configured.' });
    }

    // Default to Andhra Pradesh since this is an AP dashboard, unless the client asks for all (state='all') or a specific state
    const reqState = req.query.state;
    const state = reqState === 'all' ? '' : (reqState || 'Andhra Pradesh');
    const city = req.query.city || '';
    const limit = req.query.limit || 200;

    let url = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?format=json&api-key=${apiKey}&limit=${limit}`;
    if (state) url += `&filters[state]=${encodeURIComponent(state)}`;
    if (city) url += `&filters[city]=${encodeURIComponent(city)}`;

    const response = await fetch(url);
    const data = await response.json();

    const records = (data.records || []).map(r => ({
      country: r.country,
      state: r.state,
      city: r.city,
      station: r.station,
      last_update: r.last_update,
      latitude: r.latitude,
      longitude: r.longitude,
      pollutant_id: r.pollutant_id,
      min_value: r.min_value,
      max_value: r.max_value,
      avg_value: r.avg_value,
    }));

    if (records.length === 0) {
      console.log('DataGovIndia returned 0 records');
      return res.json({ total: 0, records: [], states: [], cities: [], message: 'No air quality data currently available from Data.gov.in.' });
    }

    const result = {
      total: data.total || records.length,
      records,
      states: [...new Set(records.map(r => r.state).filter(Boolean))].sort(),
      cities: [...new Set(records.map(r => r.city).filter(Boolean))].sort(),
    };

    airQualityCache = { data: result, timestamp: now };
    res.json(result);
  } catch (err) {
    console.warn('DataGovIndia API error:', err.message);
    res.json({ total: 0, records: [], states: [], cities: [], message: 'Failed to fetch real-time air quality data.' });
  }
});

// ===================== DATASETS =====================
app.get('/api/datasets', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM datasets ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/datasets/:id/sync', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('UPDATE datasets SET last_synced = NOW(), status = "Connected" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Sync initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== OVERVIEW / KPI =====================
app.get('/api/overview', async (req, res) => {
  try {
    const [airports] = await db.query('SELECT * FROM airports');
    const [ports] = await db.query('SELECT * FROM ports');
    const [forecasts] = await db.query('SELECT * FROM forecasts');
    const [routes] = await db.query('SELECT * FROM routes');
    const [datasets] = await db.query('SELECT * FROM datasets');

    let totalPassengers2035 = 0;
    let totalCargo2035 = 0;
    forecasts.forEach(f => {
      if (f.year === 2035) {
        totalPassengers2035 += (f.domestic_passengers || 0) + (f.international_passengers || 0);
        totalCargo2035 += (f.cargo_mt || 0);
      }
    });

    const pendingRoutes = routes.filter(r => r.status === 'Proposed').length;
    const pendingDatasets = datasets.filter(d => d.status === 'Pending').length;

    res.json({
      total_airports: airports.length,
      total_ports: ports.length,
      total_passengers_2035: totalPassengers2035,
      total_cargo_2035: totalCargo2035,
      active_alerts: pendingRoutes + pendingDatasets,
      pending_routes: pendingRoutes,
      pending_datasets: pendingDatasets,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/overview/trend', async (req, res) => {
  try {
    const [forecasts] = await db.query('SELECT * FROM forecasts');

    // Group by year
    const byYear = {};
    forecasts.forEach(f => {
      if (!byYear[f.year]) byYear[f.year] = { year: f.year, total_domestic: 0, total_international: 0, total_cargo: 0 };
      byYear[f.year].total_domestic += (f.domestic_passengers || 0);
      byYear[f.year].total_international += (f.international_passengers || 0);
      byYear[f.year].total_cargo += (f.cargo_mt || 0);
    });

    const rows = Object.values(byYear).sort((a, b) => a.year - b.year);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/overview/airports-table', async (req, res) => {
  try {
    const [airports] = await db.query('SELECT * FROM airports');
    const [forecasts] = await db.query('SELECT * FROM forecasts');

    const rows = airports.map(a => {
      const f2035 = forecasts.find(f => f.airport_id === a.id && f.year === 2035);
      const allF = forecasts.filter(f => f.airport_id === a.id);

      let last_updated = null;
      if (allF.length > 0) {
        last_updated = allF.map(f => new Date(f.created_at)).reduce((max, d) => d > max ? d : max, new Date(0));
      }

      return {
        id: a.id,
        name: a.name,
        code: a.code,
        status: a.status,
        capacity_2035: a.capacity_2035,
        passengers_2035: f2035 ? (f2035.domestic_passengers + f2035.international_passengers) : 0,
        cargo_2035: f2035 ? f2035.cargo_mt : 0,
        last_updated: last_updated
      };
    });

    rows.sort((a, b) => a.name.localeCompare(b.name));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== FORECAST LOGS =====================
app.get('/api/logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT fl.*, a.name as airport_name
      FROM forecast_logs fl
      JOIN airports a ON fl.airport_id = a.id
      ORDER BY fl.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== USERS (admin) =====================
app.get('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== REPORT EXPORT =====================
app.get('/api/reports/export', async (req, res) => {
  try {
    const { airport_id, year_from, year_to, format } = req.query;
    const from = parseInt(year_from) || 2026;
    const to = parseInt(year_to) || 2035;

    let query = `
      SELECT a.name as airport_name, a.code, f.year,
        f.domestic_passengers, f.international_passengers, f.cargo_mt,
        f.confidence_low, f.confidence_high
      FROM forecasts f
      JOIN airports a ON f.airport_id = a.id
      WHERE f.year BETWEEN ? AND ?
    `;
    const params = [from, to];

    if (airport_id) {
      query += ' AND f.airport_id = ?';
      params.push(airport_id);
    }
    query += ' ORDER BY a.name, f.year';

    const [rows] = await db.query(query, params);

    if (format === 'xlsx') {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
        'Airport': r.airport_name,
        'Code': r.code,
        'Year': r.year,
        'Domestic Passengers': r.domestic_passengers,
        'International Passengers': r.international_passengers,
        'Cargo (MT)': r.cargo_mt,
        'Confidence Low %': r.confidence_low,
        'Confidence High %': r.confidence_high,
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'Forecast');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=AP_Transport_Forecast_Report.xlsx');
      return res.send(buf);
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== DEMAND FORECASTING =====================
app.get('/api/forecast/demand', async (req, res) => {
  try {
    const { airport_id, type } = req.query;
    let query = `SELECT f.*, a.name as airport_name, a.code as airport_code, a.capacity_2035, a.status as airport_status
      FROM forecasts f JOIN airports a ON f.airport_id = a.id`;
    const params = [];
    if (airport_id) { query += ' WHERE f.airport_id = ?'; params.push(airport_id); }
    query += ' ORDER BY a.name, f.year';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/forecast/cargo', async (req, res) => {
  try {
    const query = `SELECT pf.*, p.name as port_name, p.code as port_code, p.cargo_capacity_mt, p.status as port_status
      FROM port_forecasts pf JOIN ports p ON pf.port_id = p.id ORDER BY p.name, pf.year`;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/capacity/thresholds', async (req, res) => {
  try {
    const [airports] = await db.query(`SELECT a.id, a.name, a.code, a.capacity_2035, a.status,
      (SELECT f.domestic_passengers + f.international_passengers FROM forecasts f WHERE f.airport_id = a.id AND f.year = 2035) as projected_2035
      FROM airports a ORDER BY a.name`);
    const result = airports.map(a => {
      const cap = a.capacity_2035 || 1;
      const proj = a.projected_2035 || 0;
      let threshold_year = null;
      const thresholds = [];
      for (let pct = 50; pct <= 100; pct += 10) {
        const target = cap * (pct / 100);
        thresholds.push({ percentage: pct, target_passengers: Math.round(target) });
      }
      return { ...a, projected_2035: proj, utilization_pct: Math.round((proj / cap) * 100), thresholds };
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/scenario/simulate', async (req, res) => {
  try {
    const { growth_rate, cargo_growth, base_year } = req.query;
    const gr = parseFloat(growth_rate) || 8;
    const cg = parseFloat(cargo_growth) || 6;
    const by = parseInt(base_year) || 2026;
    const [airports] = await db.query('SELECT * FROM airports ORDER BY name');
    const [baseForecasts] = await db.query(`SELECT * FROM forecasts WHERE year = ?`, [by]);
    const baseMap = {};
    baseForecasts.forEach(f => { baseMap[f.airport_id] = f; });
    const scenarios = [];
    for (const airport of airports) {
      const base = baseMap[airport.id];
      if (!base) continue;
      for (let y = by; y <= 2035; y++) {
        const yearsFrom = y - by;
        const factor = Math.pow(1 + gr / 100, yearsFrom);
        const cargoFactor = Math.pow(1 + cg / 100, yearsFrom);
        scenarios.push({
          airport_id: airport.id, airport_name: airport.name, airport_code: airport.code,
          year: y,
          domestic_passengers: Math.round(base.domestic_passengers * factor),
          international_passengers: Math.round(base.international_passengers * factor),
          cargo_mt: Math.round(base.cargo_mt * cargoFactor * 100) / 100,
          capacity_2035: airport.capacity_2035,
          scenario: `Growth: ${gr}% pax, ${cg}% cargo`,
        });
      }
    }
    res.json(scenarios);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/corridors', async (req, res) => {
  const corridors = [
    { id: 1, name: 'Visakhapatnam–Vijayawada Industrial Corridor', mode: 'Road', distance_km: 350, daily_trucks: 12400, cargo_mt_day: 18600, congestion_index: 0.78, bottlenecks: ['Gannavaram Junction', 'Eluru Bypass'], status: 'High Density' },
    { id: 2, name: 'Krishnapatnam–Srikalahasti Freight Link', mode: 'Rail', distance_km: 280, daily_trains: 42, cargo_mt_day: 25200, congestion_index: 0.65, bottlenecks: ['Renigunta Junction'], status: 'Moderate' },
    { id: 3, name: 'Kakinada–Rajahmundry Coastal Route', mode: 'Road', distance_km: 180, daily_trucks: 6800, cargo_mt_day: 10200, congestion_index: 0.52, bottlenecks: ['Coringa Bridge'], status: 'Moderate' },
    { id: 4, name: 'Vizag Port–Araku Valley Mining Route', mode: 'Road', distance_km: 120, daily_trucks: 3200, cargo_mt_day: 9600, congestion_index: 0.82, bottlenecks: ['Anantagiri Ghat Road'], status: 'High Density' },
    { id: 5, name: 'Tirupati–Chennai Freight Corridor', mode: 'Road+Rail', distance_km: 150, daily_trucks: 8900, cargo_mt_day: 15400, congestion_index: 0.71, bottlenecks: ['Gudur Junction', 'Sullurupeta Checkpoint'], status: 'High Density' },
    { id: 6, name: 'Machilipatnam–Vijayawada Port Link', mode: 'Road', distance_km: 90, daily_trucks: 4200, cargo_mt_day: 6300, congestion_index: 0.45, bottlenecks: [], status: 'Low' },
    { id: 7, name: 'Bhimavaram–Tadepalligudem Agricultural Belt', mode: 'Road', distance_km: 65, daily_trucks: 5100, cargo_mt_day: 7650, congestion_index: 0.58, bottlenecks: ['Tadepalligudem Market Yard'], status: 'Moderate' },
    { id: 8, name: 'Nellore–Kakinada Coastal Highway', mode: 'Road', distance_km: 320, daily_trucks: 7600, cargo_mt_day: 11400, congestion_index: 0.69, bottlenecks: ['Ongole Toll Plaza', 'Nellore Bypass'], status: 'High Density' },
    { id: 9, name: 'Vijayawada–Hyderabad National Highway 65', mode: 'Road', distance_km: 275, daily_trucks: 14200, cargo_mt_day: 21300, congestion_index: 0.88, bottlenecks: ['Nandigama Junction', 'Suryapet Bypass', 'Nalgonda Crossing'], status: 'Critical' },
    { id: 10, name: 'Visakhapatnam Port–Kakinada Sea Route', mode: 'Sea', distance_km: 200, daily_vessels: 8, cargo_mt_day: 32000, congestion_index: 0.42, bottlenecks: [], status: 'Low' },
  ];
  res.json(corridors);
});

app.get('/api/od-flows', async (req, res) => {
  const flows = [
    { origin: 'Visakhapatnam', dest: 'Vijayawada', mode: 'Road', volume_mt: 4200, commodity: 'Steel & Minerals' },
    { origin: 'Visakhapatnam', dest: 'Hyderabad', mode: 'Road', volume_mt: 3800, commodity: 'Electronics & Pharma' },
    { origin: 'Krishnapatnam', dest: 'Bengaluru', mode: 'Rail', volume_mt: 5600, commodity: 'Coal & Cement' },
    { origin: 'Vijayawada', dest: 'Chennai', mode: 'Road+Rail', volume_mt: 3200, commodity: 'Agricultural Products' },
    { origin: 'Kakinada', dest: 'Visakhapatnam', mode: 'Road', volume_mt: 2800, commodity: 'Petrochemicals' },
    { origin: 'Tirupati', dest: 'Chennai', mode: 'Road', volume_mt: 2400, commodity: 'Textiles & Auto Parts' },
    { origin: 'Vizag Port', dest: 'West India', mode: 'Sea', volume_mt: 8400, commodity: 'Iron Ore & Steel' },
    { origin: 'Machilipatnam', dest: 'Vijayawada', mode: 'Road', volume_mt: 1800, commodity: 'Rice & Spices' },
    { origin: 'Rajahmundry', dest: 'Visakhapatnam', mode: 'Road', volume_mt: 2200, commodity: 'Oil & Gas' },
    { origin: 'Krishnapatnam', dest: 'Nagpur', mode: 'Rail', volume_mt: 4800, commodity: 'Coal' },
    { origin: 'Vizag Port', dest: 'East Asia', mode: 'Sea', volume_mt: 12000, commodity: 'Iron Ore & Aluminum' },
    { origin: 'Kakinada', dest: 'Mumbai', mode: 'Sea', volume_mt: 6200, commodity: 'Petroleum Products' },
  ];
  const [ports] = await db.query('SELECT name, code, latitude, longitude FROM ports');
  res.json({ flows, locations: ports });
});

app.get('/api/infrastructure/gaps', async (req, res) => {
  try {
    const [airports] = await db.query(`SELECT a.*, 
      (SELECT f.domestic_passengers + f.international_passengers FROM forecasts f WHERE f.airport_id = a.id AND f.year = 2035) as projected_passengers_2035,
      (SELECT f.cargo_mt FROM forecasts f WHERE f.airport_id = a.id AND f.year = 2035) as projected_cargo_2035
      FROM airports a ORDER BY a.name`);
    const [ports] = await db.query(`SELECT p.*,
      (SELECT SUM(pf.total_cargo_mt) FROM port_forecasts pf WHERE pf.port_id = p.id AND pf.year = 2035) as projected_cargo_2035
      FROM ports p ORDER BY p.name`);
    const infraGaps = {
      airports: airports.map(a => ({
        ...a,
        capacity_gap: (a.projected_passengers_2035 || 0) - (a.capacity_2035 || 0),
        capacity_utilization: a.capacity_2035 ? Math.round(((a.projected_passengers_2035 || 0) / a.capacity_2035) * 100) : 0,
        needs_expansion: (a.projected_passengers_2035 || 0) > (a.capacity_2035 || 0) * 0.8,
        gap_severity: (a.projected_passengers_2035 || 0) > (a.capacity_2035 || 0) ? 'Critical' :
          (a.projected_passengers_2035 || 0) > (a.capacity_2035 || 0) * 0.8 ? 'Warning' : 'Adequate',
      })),
      ports: ports.map(p => ({
        ...p,
        capacity_utilization: p.cargo_capacity_mt ? Math.round(((p.projected_cargo_2035 || 0) / p.cargo_capacity_mt) * 100) : 0,
        needs_expansion: (p.projected_cargo_2035 || 0) > (p.cargo_capacity_mt || 0) * 0.8,
        gap_severity: (p.projected_cargo_2035 || 0) > (p.cargo_capacity_mt || 0) ? 'Critical' :
          (p.projected_cargo_2035 || 0) > (p.cargo_capacity_mt || 0) * 0.8 ? 'Warning' : 'Adequate',
      })),
    };
    res.json(infraGaps);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/route-recommendations', async (req, res) => {
  try {
    const [routes] = await db.query(`SELECT r.*, a.name as airport_name, a.code as airport_code
      FROM routes r JOIN airports a ON r.airport_id = a.id ORDER BY r.demand_score DESC`);
    const recommendations = routes.map(r => ({
      ...r,
      reasoning_detail: r.reasoning,
      category: r.demand_score >= 80 ? 'High Priority' : r.demand_score >= 60 ? 'Medium Priority' : 'Low Priority',
    }));
    res.json(recommendations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===================== FEEDBACK =====================
app.get('/api/feedback', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, category, subject, message, rating } = req.body;
    const [result] = await db.query(
      'INSERT INTO feedback (name, email, category, subject, message, rating) VALUES (?,?,?,?,?,?)',
      [name, email, category || 'general', subject, message, rating || 5]
    );
    // Notify admin
    sendEmail(process.env.SMTP_USER, `New Feedback: ${subject}`,
      `<h2>New Feedback Received</h2><p><strong>From:</strong> ${name} (${email})</p><p><strong>Category:</strong> ${category}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong> ${message}</p><p><strong>Rating:</strong> ${rating || 5}/5</p>`
    );
    res.json({ id: result.insertId, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/feedback/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, admin_reply } = req.body;
    await db.query('UPDATE feedback SET status=?, admin_reply=? WHERE id=?', [status, admin_reply, req.params.id]);
    // Notify user
    const [rows] = await db.query('SELECT email, subject FROM feedback WHERE id=?', [req.params.id]);
    if (rows.length > 0 && admin_reply) {
      sendEmail(rows[0].email, `RE: ${rows[0].subject} - AP Transport`,
        `<h2>Your feedback has been updated</h2><p>Status: <strong>${status}</strong></p><p>Admin Reply:</p><blockquote>${admin_reply}</blockquote>`
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===================== QUERIES =====================
app.get('/api/queries', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM queries ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/queries', async (req, res) => {
  try {
    const { name, email, category, subject, message, priority } = req.body;
    const [result] = await db.query(
      'INSERT INTO queries (name, email, category, subject, message, priority) VALUES (?,?,?,?,?,?)',
      [name, email, category || 'general', subject, message, priority || 'medium']
    );
    sendEmail(process.env.SMTP_USER, `New Query: ${subject}`,
      `<h2>New Query Received</h2><p><strong>From:</strong> ${name} (${email})</p><p><strong>Category:</strong> ${category}</p><p><strong>Priority:</strong> ${priority}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong> ${message}</p>`
    );
    res.json({ id: result.insertId, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/queries/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, admin_response, priority } = req.body;
    const updates = [];
    const params = [];
    if (status) { updates.push('status=?'); params.push(status); }
    if (admin_response !== undefined) { updates.push('admin_response=?'); params.push(admin_response); }
    if (priority) { updates.push('priority=?'); params.push(priority); }
    params.push(req.params.id);
    await db.query(`UPDATE queries SET ${updates.join(',')} WHERE id=?`, params);
    const [rows] = await db.query('SELECT email, subject FROM queries WHERE id=?', [req.params.id]);
    if (rows.length > 0 && admin_response) {
      sendEmail(rows[0].email, `RE: ${rows[0].subject} - AP Transport`,
        `<h2>Your query has been answered</h2><p>Status: <strong>${status}</strong></p><p>Admin Response:</p><blockquote>${admin_response}</blockquote>`
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/queries/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM queries WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  AP Transport Intelligence API');
  console.log('========================================');
  console.log(`  Status:    Running`);
  console.log(`  Port:      ${PORT}`);
  console.log(`  URL:       http://localhost:${PORT}`);
  console.log(`  Health:    http://localhost:${PORT}/api/health`);
  console.log(`  API Docs:  http://localhost:${PORT}/`);
  console.log('========================================');
  console.log('');
});

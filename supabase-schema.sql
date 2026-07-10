-- AP Transport Intelligence - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================== AIRPORTS =====================
CREATE TABLE IF NOT EXISTS airports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  type VARCHAR(20) DEFAULT 'airport',
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  capacity_2035 INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== FORECASTS =====================
CREATE TABLE IF NOT EXISTS forecasts (
  id SERIAL PRIMARY KEY,
  airport_id INT NOT NULL REFERENCES airports(id) ON DELETE CASCADE,
  year INT NOT NULL,
  domestic_passengers BIGINT DEFAULT 0,
  international_passengers BIGINT DEFAULT 0,
  cargo_mt DECIMAL(12, 2) DEFAULT 0,
  confidence_low DECIMAL(5, 2) DEFAULT 0,
  confidence_high DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(airport_id, year)
);

-- ===================== ROUTES =====================
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  airport_id INT NOT NULL REFERENCES airports(id) ON DELETE CASCADE,
  destination VARCHAR(255) NOT NULL,
  demand_score DECIMAL(5, 2) DEFAULT 0,
  reasoning TEXT,
  status VARCHAR(30) DEFAULT 'Proposed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== DATASETS =====================
CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  source_url VARCHAR(500),
  description TEXT,
  status VARCHAR(30) DEFAULT 'Pending',
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== USERS =====================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== FORECAST LOGS =====================
CREATE TABLE IF NOT EXISTS forecast_logs (
  id SERIAL PRIMARY KEY,
  airport_id INT NOT NULL REFERENCES airports(id) ON DELETE CASCADE,
  admin_email VARCHAR(255),
  field_changed VARCHAR(100),
  old_value VARCHAR(255),
  new_value VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== PORTS =====================
CREATE TABLE IF NOT EXISTS ports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  cargo_capacity_mt DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== PORT FORECASTS =====================
CREATE TABLE IF NOT EXISTS port_forecasts (
  id SERIAL PRIMARY KEY,
  port_id INT NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
  year INT NOT NULL,
  road_cargo_mt DECIMAL(12, 2) DEFAULT 0,
  rail_cargo_mt DECIMAL(12, 2) DEFAULT 0,
  sea_cargo_mt DECIMAL(12, 2) DEFAULT 0,
  total_cargo_mt DECIMAL(12, 2) DEFAULT 0,
  confidence_low DECIMAL(5, 2) DEFAULT 0,
  confidence_high DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(port_id, year)
);

-- ===================== FEEDBACK =====================
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_id INT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  category VARCHAR(30) DEFAULT 'general',
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  rating INT DEFAULT 5,
  status VARCHAR(20) DEFAULT 'new',
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== QUERIES =====================
CREATE TABLE IF NOT EXISTS queries (
  id SERIAL PRIMARY KEY,
  user_id INT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  category VARCHAR(30) DEFAULT 'general',
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== SEED DATA =====================
-- Airports
INSERT INTO airports (name, code, latitude, longitude, capacity_2035, status) VALUES
('Visakhapatnam Airport', 'VTZ', 17.7215, 83.2245, 5000000, 'active'),
('Vijayawada Airport', 'VGA', 16.5304, 80.7969, 4000000, 'active'),
('Tirupati Airport', 'TIR', 13.6312, 79.5435, 3500000, 'active'),
('Rajahmundry Airport', 'RJA', 17.1104, 81.8182, 2000000, 'active'),
('Kadapa Airport', 'CDP', 14.5126, 78.7541, 1500000, 'active'),
('Kurnool Airport', 'KJB', 15.7242, 78.1439, 1200000, 'planned')
ON CONFLICT (code) DO NOTHING;

-- Ports
INSERT INTO ports (name, code, latitude, longitude, cargo_capacity_mt, status) VALUES
('Visakhapatnam Port', 'VZP', 17.6868, 83.2185, 120000000, 'active'),
('Kakinada Deep Water Port', 'KAK', 16.9891, 82.2475, 50000000, 'active'),
('Krishnapatnam Port', 'KPT', 14.2507, 80.1000, 90000000, 'active'),
('Machilipatnam Port', 'MPT', 16.1869, 81.1364, 20000000, 'planned')
ON CONFLICT (code) DO NOTHING;

-- Forecasts (2026-2035 for each airport)
INSERT INTO forecasts (airport_id, year, domestic_passengers, international_passengers, cargo_mt, confidence_low, confidence_high) VALUES
(1, 2026, 2800000, 400000, 15000, 85, 95), (1, 2027, 3000000, 450000, 16500, 84, 94),
(1, 2028, 3200000, 500000, 18000, 83, 93), (1, 2029, 3450000, 560000, 19800, 82, 92),
(1, 2030, 3700000, 620000, 21500, 81, 91), (1, 2031, 3950000, 690000, 23500, 80, 90),
(1, 2032, 4200000, 760000, 25500, 79, 89), (1, 2033, 4500000, 840000, 27800, 78, 88),
(1, 2034, 4800000, 930000, 30000, 77, 87), (1, 2035, 5100000, 1000000, 32500, 76, 86),
(2, 2026, 2200000, 300000, 12000, 85, 95), (2, 2027, 2400000, 340000, 13200, 84, 94),
(2, 2028, 2600000, 380000, 14500, 83, 93), (2, 2029, 2800000, 430000, 16000, 82, 92),
(2, 2030, 3050000, 480000, 17500, 81, 91), (2, 2031, 3300000, 540000, 19200, 80, 90),
(2, 2032, 3550000, 600000, 21000, 79, 89), (2, 2033, 3800000, 670000, 23000, 78, 88),
(2, 2034, 4100000, 740000, 25000, 77, 87), (2, 2035, 4400000, 820000, 27500, 76, 86),
(3, 2026, 1800000, 250000, 8000, 85, 95), (3, 2027, 1950000, 280000, 8800, 84, 94),
(3, 2028, 2100000, 310000, 9600, 83, 93), (3, 2029, 2280000, 350000, 10500, 82, 92),
(3, 2030, 2450000, 390000, 11500, 81, 91), (3, 2031, 2650000, 440000, 12600, 80, 90),
(3, 2032, 2850000, 490000, 13800, 79, 89), (3, 2033, 3050000, 540000, 15000, 78, 88),
(3, 2034, 3300000, 600000, 16500, 77, 87), (3, 2035, 3500000, 660000, 18000, 76, 86),
(4, 2026, 800000, 100000, 4000, 85, 95), (4, 2027, 880000, 115000, 4500, 84, 94),
(4, 2028, 960000, 130000, 5000, 83, 93), (4, 2029, 1050000, 148000, 5600, 82, 92),
(4, 2030, 1150000, 165000, 6200, 81, 91), (4, 2031, 1250000, 185000, 6900, 80, 90),
(4, 2032, 1360000, 205000, 7600, 79, 89), (4, 2033, 1480000, 228000, 8400, 78, 88),
(4, 2034, 1600000, 252000, 9300, 77, 87), (4, 2035, 1750000, 280000, 10200, 76, 86),
(5, 2026, 600000, 80000, 3000, 85, 95), (5, 2027, 660000, 90000, 3300, 84, 94),
(5, 2028, 720000, 100000, 3600, 83, 93), (5, 2029, 790000, 112000, 4000, 82, 92),
(5, 2030, 860000, 125000, 4400, 81, 91), (5, 2031, 940000, 140000, 4800, 80, 90),
(5, 2032, 1020000, 155000, 5300, 79, 89), (5, 2033, 1110000, 172000, 5800, 78, 88),
(5, 2034, 1210000, 190000, 6400, 77, 87), (5, 2035, 1320000, 210000, 7000, 76, 86),
(6, 2026, 400000, 50000, 2000, 85, 95), (6, 2027, 440000, 56000, 2200, 84, 94),
(6, 2028, 480000, 63000, 2400, 83, 93), (6, 2029, 530000, 70000, 2700, 82, 92),
(6, 2030, 580000, 78000, 3000, 81, 91), (6, 2031, 630000, 87000, 3300, 80, 90),
(6, 2032, 690000, 97000, 3600, 79, 89), (6, 2033, 750000, 108000, 4000, 78, 88),
(6, 2034, 820000, 120000, 4400, 77, 87), (6, 2035, 890000, 132000, 4800, 76, 86)
ON CONFLICT DO NOTHING;

-- Port Forecasts
INSERT INTO port_forecasts (port_id, year, road_cargo_mt, rail_cargo_mt, sea_cargo_mt, total_cargo_mt, confidence_low, confidence_high) VALUES
(1, 2026, 25000000, 30000000, 65000000, 120000000, 85, 95), (1, 2027, 27000000, 32000000, 71000000, 130000000, 84, 94),
(1, 2028, 29000000, 35000000, 76000000, 140000000, 83, 93), (1, 2029, 31000000, 38000000, 81000000, 150000000, 82, 92),
(1, 2030, 33500000, 41000000, 85500000, 160000000, 81, 91), (1, 2031, 36000000, 44000000, 90000000, 170000000, 80, 90),
(1, 2032, 38500000, 47500000, 94000000, 180000000, 79, 89), (1, 2033, 41000000, 51000000, 98000000, 190000000, 78, 88),
(1, 2034, 44000000, 55000000, 101000000, 200000000, 77, 87), (1, 2035, 47000000, 58000000, 105000000, 210000000, 76, 86),
(2, 2026, 10000000, 12000000, 28000000, 50000000, 85, 95), (2, 2027, 11000000, 13000000, 31000000, 55000000, 84, 94),
(2, 2028, 12000000, 14500000, 33500000, 60000000, 83, 93), (2, 2029, 13000000, 16000000, 36000000, 65000000, 82, 92),
(2, 2030, 14000000, 17500000, 38500000, 70000000, 81, 91), (2, 2031, 15500000, 19000000, 40500000, 75000000, 80, 90),
(2, 2032, 17000000, 21000000, 42000000, 80000000, 79, 89), (2, 2033, 18500000, 23000000, 43500000, 85000000, 78, 88),
(2, 2034, 20000000, 25000000, 45000000, 90000000, 77, 87), (2, 2035, 22000000, 27000000, 46000000, 95000000, 76, 86),
(3, 2026, 15000000, 20000000, 55000000, 90000000, 85, 95), (3, 2027, 16500000, 22000000, 59500000, 98000000, 84, 94),
(3, 2028, 18000000, 24000000, 64000000, 106000000, 83, 93), (3, 2029, 20000000, 26500000, 68500000, 115000000, 82, 92),
(3, 2030, 22000000, 29000000, 73000000, 124000000, 81, 91), (3, 2031, 24000000, 31500000, 77500000, 133000000, 80, 90),
(3, 2032, 26000000, 34000000, 82000000, 142000000, 79, 89), (3, 2033, 28500000, 37000000, 86500000, 152000000, 78, 88),
(3, 2034, 31000000, 40000000, 91000000, 162000000, 77, 87), (3, 2035, 33500000, 43000000, 95500000, 172000000, 76, 86),
(4, 2026, 5000000, 6000000, 9000000, 20000000, 85, 95), (4, 2027, 5500000, 6600000, 9900000, 22000000, 84, 94),
(4, 2028, 6000000, 7300000, 10700000, 24000000, 83, 93), (4, 2029, 6600000, 8000000, 11400000, 26000000, 82, 92),
(4, 2030, 7200000, 8800000, 12000000, 28000000, 81, 91), (4, 2031, 7900000, 9600000, 12500000, 30000000, 80, 90),
(4, 2032, 8600000, 10500000, 12900000, 32000000, 79, 89), (4, 2033, 9400000, 11500000, 13100000, 34000000, 78, 88),
(4, 2034, 10300000, 12600000, 13100000, 36000000, 77, 87), (4, 2035, 11200000, 13800000, 13000000, 38000000, 76, 86)
ON CONFLICT DO NOTHING;

-- Routes
INSERT INTO routes (airport_id, destination, demand_score, reasoning, status) VALUES
(1, 'Hyderabad', 92, 'High domestic demand, business corridor', 'Approved'),
(1, 'Delhi', 88, 'Major metro connection, high passenger volume', 'Approved'),
(1, 'Bengaluru', 85, 'IT hub connection, growing demand', 'Approved'),
(1, 'Chennai', 82, 'Industrial corridor, cargo potential', 'Under Review'),
(1, 'Mumbai', 78, 'Financial hub, business travel', 'Under Review'),
(1, 'Kolkata', 72, 'Eastern corridor, emerging route', 'Proposed'),
(2, 'Hyderabad', 90, 'State capital connection, high demand', 'Approved'),
(2, 'Chennai', 85, 'Industrial corridor, cargo potential', 'Approved'),
(2, 'Bengaluru', 80, 'IT corridor, growing demand', 'Under Review'),
(3, 'Chennai', 88, 'Pilgrimage + business, high demand', 'Approved'),
(3, 'Bengaluru', 82, 'Pilgrimage traffic, growing route', 'Approved'),
(3, 'Hyderabad', 78, 'State connectivity, moderate demand', 'Under Review'),
(4, 'Hyderabad', 75, 'Regional connectivity, moderate demand', 'Under Review'),
(4, 'Vishakhapatnam', 70, 'Intra-state route, cargo potential', 'Proposed'),
(5, 'Hyderabad', 72, 'Regional route, growing demand', 'Proposed'),
(5, 'Chennai', 68, 'South corridor, emerging route', 'Proposed'),
(6, 'Hyderabad', 65, 'North AP connectivity', 'Proposed'),
(6, 'Bengaluru', 60, 'Cross-state route, early stage', 'Proposed')
ON CONFLICT DO NOTHING;

-- Datasets
INSERT INTO datasets (name, source_url, description, status) VALUES
('DGCA Flight Data', 'https://dgca.gov.in', 'Directorate General of Civil Aviation flight statistics', 'Connected'),
('Data.gov.in Air Quality', 'https://api.data.gov.in', 'National air quality monitoring data', 'Connected'),
('OpenSky ADS-B', 'https://opensky-network.org', 'Real-time aircraft surveillance data', 'Connected'),
('GSTN Freight Data', 'https://gstn.gov.in', 'Goods and Services Tax Network freight analytics', 'Pending'),
('NHAI Traffic Data', 'https://nhai.gov.in', 'National Highway Authority traffic counts', 'Pending'),
('World Bank Logistics', 'https://worldbank.org', 'Logistics Performance Index data', 'Connected'),
('ICAO Safety Data', 'https://icao.int', 'International Civil Aviation Organization safety metrics', 'Connected'),
('AP State Transport', 'https://transport.ap.gov.in', 'Andhra Pradesh state transport department data', 'Pending')
ON CONFLICT DO NOTHING;

-- Users (passwords are bcrypt hashed)
-- admin123 = $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- viewer123 = $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (email, password, full_name, role) VALUES
('admin@aptransport.gov.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin'),
('viewer@aptransport.gov.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Guest Viewer', 'viewer'),
('demo@aptransport.gov.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo User', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE port_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Public read policies (for read-only data)
CREATE POLICY "Public read airports" ON airports FOR SELECT USING (true);
CREATE POLICY "Public read forecasts" ON forecasts FOR SELECT USING (true);
CREATE POLICY "Public read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public read datasets" ON datasets FOR SELECT USING (true);
CREATE POLICY "Public read ports" ON ports FOR SELECT USING (true);
CREATE POLICY "Public read port_forecasts" ON port_forecasts FOR SELECT USING (true);
CREATE POLICY "Public read forecast_logs" ON forecast_logs FOR SELECT USING (true);

-- Service role full access (for backend API)
CREATE POLICY "Service role all airports" ON airports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all forecasts" ON forecasts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all routes" ON routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all datasets" ON datasets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all forecast_logs" ON forecast_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all ports" ON ports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all port_forecasts" ON port_forecasts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all feedback" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role all queries" ON queries FOR ALL USING (true) WITH CHECK (true);

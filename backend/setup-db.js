require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

async function setup() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Connected to MySQL server.');

  await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'ap_transport_intelligence'}`);
  await conn.query(`USE ${process.env.DB_NAME || 'ap_transport_intelligence'}`);
  console.log('Database created/selected.');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS airports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(10) NOT NULL UNIQUE,
      type ENUM('airport', 'port') DEFAULT 'airport',
      latitude DECIMAL(10, 6),
      longitude DECIMAL(10, 6),
      capacity_2035 INT DEFAULT 0,
      status ENUM('active', 'planned', 'under_construction') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Table: airports');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS forecasts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      airport_id INT NOT NULL,
      year INT NOT NULL,
      domestic_passengers BIGINT DEFAULT 0,
      international_passengers BIGINT DEFAULT 0,
      cargo_mt DECIMAL(12, 2) DEFAULT 0,
      confidence_low DECIMAL(5, 2) DEFAULT 0,
      confidence_high DECIMAL(5, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (airport_id) REFERENCES airports(id) ON DELETE CASCADE,
      UNIQUE KEY unique_airport_year (airport_id, year)
    )
  `);
  console.log('Table: forecasts');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS routes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      airport_id INT NOT NULL,
      destination VARCHAR(255) NOT NULL,
      demand_score DECIMAL(5, 2) DEFAULT 0,
      reasoning TEXT,
      status ENUM('Proposed', 'Under Review', 'Approved') DEFAULT 'Proposed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (airport_id) REFERENCES airports(id) ON DELETE CASCADE
    )
  `);
  console.log('Table: routes');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS datasets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      source_url VARCHAR(500),
      description TEXT,
      status ENUM('Connected', 'Pending', 'Error') DEFAULT 'Pending',
      last_synced DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Table: datasets');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      role ENUM('admin', 'viewer') DEFAULT 'viewer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Table: users');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS forecast_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      airport_id INT NOT NULL,
      admin_email VARCHAR(255),
      field_changed VARCHAR(100),
      old_value VARCHAR(255),
      new_value VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (airport_id) REFERENCES airports(id) ON DELETE CASCADE
    )
  `);
  console.log('Table: forecast_logs');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS ports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(10) NOT NULL UNIQUE,
      latitude DECIMAL(10, 6),
      longitude DECIMAL(10, 6),
      cargo_capacity_mt DECIMAL(15, 2) DEFAULT 0,
      status ENUM('active', 'planned', 'under_construction') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Table: ports');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS port_forecasts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      port_id INT NOT NULL,
      year INT NOT NULL,
      road_cargo_mt DECIMAL(12, 2) DEFAULT 0,
      rail_cargo_mt DECIMAL(12, 2) DEFAULT 0,
      sea_cargo_mt DECIMAL(12, 2) DEFAULT 0,
      total_cargo_mt DECIMAL(12, 2) DEFAULT 0,
      confidence_low DECIMAL(5, 2) DEFAULT 0,
      confidence_high DECIMAL(5, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (port_id) REFERENCES ports(id) ON DELETE CASCADE,
      UNIQUE KEY unique_port_year (port_id, year)
    )
  `);
  console.log('Table: port_forecasts');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      category ENUM('bug', 'feature', 'improvement', 'general') DEFAULT 'general',
      subject VARCHAR(500) NOT NULL,
      message TEXT NOT NULL,
      rating INT DEFAULT 5,
      status ENUM('new', 'read', 'resolved') DEFAULT 'new',
      admin_reply TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Table: feedback');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS queries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      category ENUM('data_request', 'technical', 'partnership', 'general') DEFAULT 'general',
      subject VARCHAR(500) NOT NULL,
      message TEXT NOT NULL,
      priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
      status ENUM('open', 'in_progress', 'answered', 'closed') DEFAULT 'open',
      admin_response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Table: queries');

  console.log('\nAll tables created successfully!');
  await conn.end();
}

setup().catch(err => { console.error('Setup failed:', err); process.exit(1); });

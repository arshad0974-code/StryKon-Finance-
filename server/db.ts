import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: Database | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'strykon.sqlite');

export async function initDb(): Promise<Database> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      db.run('PRAGMA foreign_keys = ON;');
      
      // Check if this database has legacy roles (e.g. accountant, employee) or dummy data
      let hasLegacy = false;
      try {
        const stmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('accountant', 'employee')");
        if (stmt.step()) {
          const res = stmt.getAsObject();
          if (Number(res.count) > 0) hasLegacy = true;
        }
        stmt.free();
      } catch (e) {
        hasLegacy = true;
      }

      if (hasLegacy) {
        console.log('Legacy or dummy database detected. Resetting to clean blank state (v2.1)...');
        db.close();
        db = new SQL.Database();
        db.run('PRAGMA foreign_keys = ON;');
        createTables(db);
        seedInitialData(db);
        saveDb();
        console.log('Initialized fresh clean database.');
        return db;
      }

      console.log('Loaded existing database from disk:', DB_FILE);
      return db;
    } catch (err) {
      console.error('Failed to load existing database, recreating:', err);
    }
  }

  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  createTables(db);
  seedInitialData(db);
  saveDb();
  console.log('Initialized fresh database with clean blank schema.');
  return db;
}

export async function resetDatabase(): Promise<Database> {
  const SQL = await initSqlJs();
  if (db) {
    try { db.close(); } catch (e) {}
  }
  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  createTables(db);
  seedInitialData(db);
  saveDb();
  console.log('Database successfully reset to blank state.');
  return db;
}

export function saveDb(): void {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (err) {
    console.error('Error saving database to disk:', err);
  }
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized! Call initDb() first.');
  return db;
}

export function query<T = any>(sqlStr: string, params: SqlValue[] = []): T[] {
  const database = getDb();
  try {
    const stmt = database.prepare(sqlStr);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('SQL Query Error:', error, 'Query:', sqlStr, 'Params:', params);
    throw error;
  }
}

export function queryOne<T = any>(sqlStr: string, params: SqlValue[] = []): T | null {
  const res = query<T>(sqlStr, params);
  return res.length > 0 ? res[0] : null;
}

export function run(sqlStr: string, params: SqlValue[] = []): { lastInsertRowid: number; changes: number } {
  const database = getDb();
  try {
    if (params && params.length > 0) {
      const stmt = database.prepare(sqlStr);
      stmt.run(params);
      stmt.free();
    } else {
      database.run(sqlStr);
    }
    const changesRes = database.exec('SELECT last_insert_rowid() AS id, changes() AS changes;');
    const lastInsertRowid = (changesRes[0]?.values[0]?.[0] as number) || 0;
    const changes = (changesRes[0]?.values[0]?.[1] as number) || 0;
    saveDb();
    return { lastInsertRowid, changes };
  } catch (error) {
    console.error('SQL Run Error:', error, 'Query:', sqlStr, 'Params:', params);
    throw error;
  }
}

export function transaction<T>(fn: () => T): T {
  const database = getDb();
  database.run('BEGIN TRANSACTION;');
  try {
    const result = fn();
    database.run('COMMIT;');
    saveDb();
    return result;
  } catch (err) {
    database.run('ROLLBACK;');
    throw err;
  }
}

function createTables(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL, -- admin, partner, accountant, employee
      partner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      equity_percentage REAL NOT NULL,
      initial_capital REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      account_number TEXT,
      account_type TEXT NOT NULL, -- bank, cash, partner_personal, stripe_usd
      partner_id INTEGER, -- linked if it is a partner's personal/drawing account
      currency TEXT NOT NULL DEFAULT 'PKR', -- PKR, USD
      current_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      FOREIGN KEY (partner_id) REFERENCES partners(id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      country TEXT DEFAULT 'Pakistan',
      status TEXT DEFAULT 'active', -- active, inactive
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      contract_number TEXT UNIQUE NOT NULL,
      contract_value REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      contract_value_pkr REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      billing_cycle TEXT DEFAULT 'monthly', -- monthly, milestone, one_time
      status TEXT DEFAULT 'active', -- active, completed, terminated
      notes TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      contract_id INTEGER,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      subtotal REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      total_amount_pkr REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      balance_due REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, partially_paid, paid, overdue
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      invoice_id INTEGER,
      account_id INTEGER NOT NULL,
      partner_id INTEGER, -- specific partner who received payment (Musaddiq or Arshad)
      payment_date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      amount_original REAL NOT NULL,
      amount_pkr REAL NOT NULL,
      payment_method TEXT DEFAULT 'bank_transfer',
      reference_note TEXT,
      is_advance INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (partner_id) REFERENCES partners(id)
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      base_salary_pkr REAL NOT NULL,
      joining_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      bank_account_details TEXT
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payroll_number TEXT UNIQUE NOT NULL,
      employee_id INTEGER NOT NULL,
      month_year TEXT NOT NULL,
      base_salary REAL NOT NULL,
      bonus REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_salary REAL NOT NULL,
      account_id INTEGER,
      payment_date TEXT,
      status TEXT DEFAULT 'pending', -- pending, paid
      notes TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- software_tools, marketing, office_rent, utilities, contractors, travel, legal, interest, entertainment, miscellaneous
      amount_original REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      amount_pkr REAL NOT NULL,
      account_id INTEGER NOT NULL,
      paid_by_partner_id INTEGER, -- if personal partner account or company account
      vendor TEXT,
      expense_date TEXT NOT NULL,
      is_reimbursable INTEGER DEFAULT 0,
      receipt_url TEXT,
      notes TEXT,
      status TEXT DEFAULT 'approved',
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (paid_by_partner_id) REFERENCES partners(id)
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_number TEXT UNIQUE NOT NULL,
      lender_name TEXT NOT NULL,
      loan_type TEXT DEFAULT 'commercial', -- commercial, director_loan, bank
      principal_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      principal_pkr REAL NOT NULL,
      interest_rate REAL DEFAULT 0, -- percent per annum
      term_months INTEGER DEFAULT 12,
      start_date TEXT NOT NULL,
      remaining_principal_pkr REAL NOT NULL,
      status TEXT DEFAULT 'active', -- active, paid_off
      account_id INTEGER,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS loan_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL, -- receipt, repayment
      principal_portion_pkr REAL NOT NULL,
      interest_portion_pkr REAL DEFAULT 0,
      total_pkr REAL NOT NULL,
      account_id INTEGER NOT NULL,
      transaction_date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (loan_id) REFERENCES loans(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS partner_distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distribution_number TEXT UNIQUE NOT NULL,
      partner_id INTEGER NOT NULL,
      distribution_type TEXT NOT NULL, -- salary, bonus, dividend, gift, withdrawal
      amount_pkr REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      amount_original REAL NOT NULL,
      account_id INTEGER NOT NULL,
      distribution_date TEXT NOT NULL,
      approved_by TEXT,
      status TEXT DEFAULT 'approved',
      notes TEXT,
      FOREIGN KEY (partner_id) REFERENCES partners(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      transaction_type TEXT NOT NULL, -- client_payment, expense, payroll, bonus, partner_distribution, loan_receipt, loan_repayment, account_transfer, capital_contribution
      debit_account_id INTEGER,
      credit_account_id INTEGER,
      amount_original REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      amount_pkr REAL NOT NULL,
      partner_id INTEGER,
      client_id INTEGER,
      invoice_id INTEGER,
      reference_type TEXT,
      reference_id INTEGER,
      description TEXT NOT NULL,
      is_finalized INTEGER DEFAULT 1,
      is_reversed INTEGER DEFAULT 0,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (debit_account_id) REFERENCES accounts(id),
      FOREIGN KEY (credit_account_id) REFERENCES accounts(id),
      FOREIGN KEY (partner_id) REFERENCES partners(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, REVERSE
      changed_by TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info', -- warning, overdue, alert, info, success
      is_read INTEGER DEFAULT 0,
      link_tab TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedInitialData(database: Database): void {
  // Settings
  database.run(`
    INSERT INTO settings (key, value) VALUES
      ('agency_name', 'Strykon'),
      ('base_currency', 'PKR'),
      ('usd_exchange_rate', '280'),
      ('auto_overdue_check', 'true'),
      ('fiscal_year_start', '07-01'),
      ('disclaimer_acknowledged', 'true');
  `);

  // Partners (Only Musaddiq Mustafa and Arshad Qazi)
  database.run(`
    INSERT INTO partners (id, name, email, phone, equity_percentage, initial_capital) VALUES
      (1, 'Musaddiq Mustafa', 'musaddiq@strykon.agency', '+92 300 1234567', 50.0, 0),
      (2, 'Arshad Qazi', 'arshad@strykon.agency', '+92 301 7654321', 50.0, 0);
  `);

  // Users (Strictly TWO roles: Admin and Partner. Accountant, Hamza, Employee removed)
  database.run(`
    INSERT INTO users (id, username, password_hash, full_name, email, role, partner_id) VALUES
      (1, 'admin', 'admin123', 'Agency Administrator', 'admin@strykon.agency', 'admin', NULL),
      (2, 'musaddiq', 'partner123', 'Musaddiq Mustafa', 'musaddiq@strykon.agency', 'partner', 1),
      (3, 'arshad', 'partner123', 'Arshad Qazi', 'arshad@strykon.agency', 'partner', 2);
  `);

  // Accounts (Clean initial accounts with balance = 0, ready for real data)
  database.run(`
    INSERT INTO accounts (id, name, account_number, account_type, partner_id, currency, current_balance, is_active, notes) VALUES
      (1, 'HBL Corporate Main', 'PK12HABB000123456789', 'bank', NULL, 'PKR', 0, 1, 'Primary operating company account'),
      (2, 'Meezan Islamic Business', 'PK88MEZN000987654321', 'bank', NULL, 'PKR', 0, 1, 'Secondary reserve account'),
      (3, 'Stripe USD Merchant', 'acct_stripe_us_101', 'stripe_usd', NULL, 'USD', 0, 1, 'International client billing account'),
      (4, 'Office Cash Box', 'CASH-ISB-01', 'cash', NULL, 'PKR', 0, 1, 'Petty cash for office logistics'),
      (5, 'Musaddiq Partner Ledger', 'PRT-MUS-01', 'partner_personal', 1, 'PKR', 0, 1, 'Musaddiq personal funds & drawing account'),
      (6, 'Arshad Partner Ledger', 'PRT-ARS-02', 'partner_personal', 2, 'PKR', 0, 1, 'Arshad personal funds & drawing account');
  `);

  // Audit Log - Initial clean database event
  database.run(`
    INSERT INTO audit_logs (id, entity_type, entity_id, action, changed_by, reason) VALUES
      (1, 'system', 1, 'CREATE', 'system', 'Strykon Finance OS initialized in clean blank state (Version 2.1).');
  `);

  // All financial tables: clients, contracts, invoices, invoice_items, payments, employees, payroll, expenses, loans, loan_transactions, partner_distributions, transactions, notifications are completely BLANK (0 records).
}

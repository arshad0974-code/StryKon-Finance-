import { getDb, saveDb } from './db.js';
import { getSheetData } from './sheet_data.js';
import { getValidatedExpenses } from './validated_expenses.js';

export function seedFinancialDataFromSheet(): { success: boolean; stats: any } {
  const db = getDb();

  // Clear existing financial transactional data
  db.run(`
    DELETE FROM transactions;
    DELETE FROM loan_transactions;
    DELETE FROM loans;
    DELETE FROM partner_distributions;
    DELETE FROM payroll;
    DELETE FROM expenses;
    DELETE FROM payments;
    DELETE FROM invoice_items;
    DELETE FROM invoices;
    DELETE FROM contracts;
    DELETE FROM clients;
  `);

  // Reset accounts balances to match exact financial sheet
  db.run(`
    UPDATE accounts SET current_balance = 26372 WHERE id = 1; -- HBL Corporate Main (Agency Net Worth: 26,372)
    UPDATE accounts SET current_balance = 0 WHERE id = 2;     -- Meezan Islamic Business
    UPDATE accounts SET current_balance = 0 WHERE id = 3;     -- Stripe USD Merchant
    UPDATE accounts SET current_balance = 0 WHERE id = 4;     -- Office Cash Box
    UPDATE accounts SET current_balance = 10452 WHERE id = 5; -- Musaddiq Partner Ledger (10,452)
    UPDATE accounts SET current_balance = 20920 WHERE id = 6; -- Arshad Partner Ledger (20,920)
  `);

  const { clients, payments } = getSheetData();
  const expenses = getValidatedExpenses();

  // Insert Clients
  clients.forEach(c => {
    db.run(
      `INSERT INTO clients (id, name, company_name, email, phone, address, country, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [c.id, c.name, c.company_name, c.email, '+92 300 0000000', `${c.company_name} HQ`, c.country]
    );

    // Create active contract
    db.run(
      `INSERT INTO contracts (id, client_id, title, contract_number, contract_value, currency, exchange_rate, contract_value_pkr, start_date, billing_cycle, status, notes)
       VALUES (?, ?, ?, ?, 100000, 'PKR', 1.0, 100000, '2026-03-01', 'monthly', 'active', ?)`,
      [c.id, c.id, `${c.company_name} Master Retainer`, `CNT-2026-00${c.id}`, `Master engagement with ${c.company_name}`]
    );
  });

  // Track transaction IDs
  let txId = 1;

  // Insert Invoices, Invoice Items & Payments (21 Invoices, exactly 623,000 PKR total)
  payments.forEach((p, idx) => {
    const isPaid = !p.invoice_only;
    const invAmount = p.invoice_only ? (p.total_amount || 15000) : p.amount;
    const balanceDue = isPaid ? 0 : invAmount;
    const paidAmount = isPaid ? invAmount : 0;
    const status = isPaid ? 'paid' : 'sent';

    db.run(
      `INSERT INTO invoices (id, invoice_number, client_id, contract_id, issue_date, due_date, currency, exchange_rate, subtotal, tax_amount, total_amount, total_amount_pkr, paid_amount, balance_due, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'PKR', 1.0, ?, 0, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.inv_num,
        p.client_id,
        p.client_id,
        p.date,
        p.date,
        invAmount,
        invAmount,
        invAmount,
        paidAmount,
        balanceDue,
        status,
        p.desc
      ]
    );

    db.run(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
       VALUES (?, ?, 1, ?, ?)`,
      [p.id, p.desc, invAmount, invAmount]
    );

    if (isPaid) {
      // Payment Record
      const paymentAccountId = p.partner_id === 1 ? 5 : 6;
      db.run(
        `INSERT INTO payments (id, payment_number, client_id, invoice_id, account_id, partner_id, payment_date, currency, exchange_rate, amount_original, amount_pkr, payment_method, reference_note, is_advance)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PKR', 1.0, ?, ?, 'bank_transfer', ?, 0)`,
        [
          p.id,
          `PAY-2026-${String(idx + 1).padStart(3, '0')}`,
          p.client_id,
          p.id,
          paymentAccountId,
          p.partner_id,
          p.date,
          p.amount,
          p.amount,
          `Client payment collected by partner ${p.partner_id === 1 ? 'Musaddiq' : 'Arshad'}`
        ]
      );

      // Ledger Transaction entry
      db.run(
        `INSERT INTO transactions (id, transaction_number, date, transaction_type, debit_account_id, credit_account_id, amount_original, currency, exchange_rate, amount_pkr, partner_id, client_id, invoice_id, reference_type, reference_id, description, is_finalized, is_reversed, created_by)
         VALUES (?, ?, ?, 'client_payment', ?, NULL, ?, 'PKR', 1.0, ?, ?, ?, ?, 'payment', ?, ?, 1, 0, 'system')`,
        [
          txId++,
          `TXN-2026-${String(txId).padStart(4, '0')}`,
          p.date,
          paymentAccountId,
          p.amount,
          p.amount,
          p.partner_id,
          p.client_id,
          p.id,
          p.id,
          `Receipt: ${p.desc}`
        ]
      );
    }
  });

  // Map sheet category to category in database
  function mapCategory(cat: string): string {
    const c = cat.toLowerCase();
    if (c.includes('salary')) return 'salary';
    if (c.includes('rent')) return 'office_rent';
    if (c.includes('tool')) return 'software_tools';
    if (c.includes('domain') || c.includes('hosting')) return 'software_tools';
    if (c.includes('bill') || c.includes('water')) return 'utilities';
    if (c.includes('course')) return 'marketing';
    if (c.includes('office') || c.includes('printer')) return 'miscellaneous';
    if (c.includes('charity')) return 'miscellaneous';
    if (c.includes('contractor')) return 'contractors';
    return 'miscellaneous';
  }

  // Insert Expenses (38 expenses, matching 445,628 PKR total)
  expenses.forEach((e, idx) => {
    const expenseId = idx + 1;
    const accountId = e.paid_by_partner_id === 1 ? 5 : 6;
    const dbCat = mapCategory(e.category);

    db.run(
      `INSERT INTO expenses (id, expense_number, title, category, amount_original, currency, exchange_rate, amount_pkr, account_id, paid_by_partner_id, vendor, expense_date, is_reimbursable, receipt_url, notes, status)
       VALUES (?, ?, ?, ?, ?, 'PKR', 1.0, ?, ?, ?, ?, ?, 0, NULL, ?, 'approved')`,
      [
        expenseId,
        `EXP-2026-${String(expenseId).padStart(3, '0')}`,
        e.title,
        dbCat,
        e.amount_pkr,
        e.amount_pkr,
        accountId,
        e.paid_by_partner_id,
        e.vendor,
        e.date,
        `Sheet category: ${e.category} | Disbursed by ${e.paid_by_partner_id === 1 ? 'Musaddiq' : 'Arshad'}`
      ]
    );

    // Ledger Transaction entry
    db.run(
      `INSERT INTO transactions (id, transaction_number, date, transaction_type, debit_account_id, credit_account_id, amount_original, currency, exchange_rate, amount_pkr, partner_id, client_id, invoice_id, reference_type, reference_id, description, is_finalized, is_reversed, created_by)
       VALUES (?, ?, ?, 'expense', NULL, ?, ?, 'PKR', 1.0, ?, ?, NULL, NULL, 'expense', ?, ?, 1, 0, 'system')`,
      [
        txId++,
        `TXN-2026-${String(txId).padStart(4, '0')}`,
        e.date,
        accountId,
        e.amount_pkr,
        e.amount_pkr,
        e.paid_by_partner_id,
        expenseId,
        `Expense: ${e.title} (${e.vendor})`
      ]
    );
  });

  // Insert Dividends / Partner Distributions (146,000 PKR total: Arshad 98,000, Musaddiq 48,000)
  const distributions = [
    { id: 1, partner_id: 1, date: '2026-04-30', amount: 15000, account_id: 5, notes: 'Q1 Interim Dividend - Musaddiq' },
    { id: 2, partner_id: 2, date: '2026-04-30', amount: 25000, account_id: 6, notes: 'Q1 Interim Dividend - Arshad' },
    { id: 3, partner_id: 1, date: '2026-06-30', amount: 15000, account_id: 5, notes: 'H1 Profit Share - Musaddiq' },
    { id: 4, partner_id: 2, date: '2026-06-30', amount: 35000, account_id: 6, notes: 'H1 Profit Share - Arshad' },
    { id: 5, partner_id: 1, date: '2026-08-31', amount: 18000, account_id: 5, notes: 'Summer Profit Dividend - Musaddiq' },
    { id: 6, partner_id: 2, date: '2026-08-31', amount: 38000, account_id: 6, notes: 'Summer Profit Dividend - Arshad' },
  ];

  distributions.forEach((d, idx) => {
    db.run(
      `INSERT INTO partner_distributions (id, distribution_number, partner_id, distribution_type, amount_pkr, currency, exchange_rate, amount_original, account_id, distribution_date, approved_by, status, notes)
       VALUES (?, ?, ?, 'dividend', ?, 'PKR', 1.0, ?, ?, ?, 'Board of Partners', 'approved', ?)`,
      [
        d.id,
        `DST-2026-${String(idx + 1).padStart(3, '0')}`,
        d.partner_id,
        d.amount,
        d.amount,
        d.account_id,
        d.date,
        d.notes
      ]
    );

    db.run(
      `INSERT INTO transactions (id, transaction_number, date, transaction_type, debit_account_id, credit_account_id, amount_original, currency, exchange_rate, amount_pkr, partner_id, client_id, invoice_id, reference_type, reference_id, description, is_finalized, is_reversed, created_by)
       VALUES (?, ?, ?, 'partner_distribution', NULL, ?, ?, 'PKR', 1.0, ?, ?, NULL, NULL, 'distribution', ?, ?, 1, 0, 'system')`,
      [
        txId++,
        `TXN-2026-${String(txId).padStart(4, '0')}`,
        d.date,
        d.account_id,
        d.amount,
        d.amount,
        d.partner_id,
        d.id,
        `Distribution: ${d.notes}`
      ]
    );
  });

  // Insert Loans (Outstanding 5,000 PKR)
  // Loan 1: Arshad gave 5,000 to Agency
  db.run(
    `INSERT INTO loans (id, loan_number, lender_name, loan_type, principal_amount, currency, exchange_rate, principal_pkr, interest_rate, term_months, start_date, remaining_principal_pkr, status, account_id)
     VALUES (1, 'LN-2026-001', 'Arshad Qazi (Partner)', 'director_loan', 5000, 'PKR', 1.0, 5000, 0, 12, '2026-04-10', 5000, 'active', 6)`
  );

  db.run(
    `INSERT INTO loan_transactions (id, loan_id, transaction_type, principal_portion_pkr, interest_portion_pkr, total_pkr, account_id, transaction_date, notes)
     VALUES (1, 1, 'receipt', 5000, 0, 5000, 6, '2026-04-10', 'Director loan from Arshad')`
  );

  db.run(
    `INSERT INTO transactions (id, transaction_number, date, transaction_type, debit_account_id, credit_account_id, amount_original, currency, exchange_rate, amount_pkr, partner_id, client_id, invoice_id, reference_type, reference_id, description, is_finalized, is_reversed, created_by)
     VALUES (?, ?, '2026-04-10', 'loan_receipt', 6, NULL, 5000, 'PKR', 1.0, 5000, 2, NULL, NULL, 'loan', 1, 'Loan given by partner Arshad', 1, 0, 'system')`,
    [txId++, `TXN-2026-${String(txId).padStart(4, '0')}`]
  );

  // Loan 2: Agency loan to Musaddiq (5,000 advanced, settled)
  db.run(
    `INSERT INTO loans (id, loan_number, lender_name, loan_type, principal_amount, currency, exchange_rate, principal_pkr, interest_rate, term_months, start_date, remaining_principal_pkr, status, account_id)
     VALUES (2, 'LN-2026-002', 'Musaddiq Mustafa (Partner)', 'director_loan', 5000, 'PKR', 1.0, 5000, 0, 12, '2026-05-15', 0, 'paid_off', 5)`
  );

  db.run(
    `INSERT INTO loan_transactions (id, loan_id, transaction_type, principal_portion_pkr, interest_portion_pkr, total_pkr, account_id, transaction_date, notes)
     VALUES (2, 2, 'receipt', 5000, 0, 5000, 5, '2026-05-15', 'Short-term advance to Musaddiq to return')`
  );

  db.run(
    `INSERT INTO transactions (id, transaction_number, date, transaction_type, debit_account_id, credit_account_id, amount_original, currency, exchange_rate, amount_pkr, partner_id, client_id, invoice_id, reference_type, reference_id, description, is_finalized, is_reversed, created_by)
     VALUES (?, ?, '2026-05-15', 'account_transfer', 5, NULL, 5000, 'PKR', 1.0, 5000, 1, NULL, NULL, 'loan', 2, 'Loan advance to partner Musaddiq to return', 1, 0, 'system')`,
    [txId++, `TXN-2026-${String(txId).padStart(4, '0')}`]
  );

  // Audit log entry
  db.run(
    `INSERT INTO audit_logs (id, entity_type, entity_id, action, changed_by, reason)
     VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM audit_logs), 'system', 1, 'IMPORT', 'system', 'Imported complete financial ledger directly from Google Sheets financial model.')`
  );

  saveDb();

  return {
    success: true,
    stats: {
      clients: clients.length,
      invoices: payments.length,
      expenses: expenses.length,
      distributions: distributions.length,
      total_transactions: txId - 1
    }
  };
}

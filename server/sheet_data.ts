import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

// Let's create seed_sheet_data.ts to build the exact records
export function getSheetData() {
  // Clients (7 clients, totaling 623,000 PKR)
  const clients = [
    { id: 1, name: 'Merrylaz Client Rep', company_name: 'Merrylaz', email: 'billing@merrylaz.com', country: 'United Kingdom' },
    { id: 2, name: 'PAIDA PARIS Rep', company_name: 'PAIDA PARIS', email: 'contact@paidaparis.com', country: 'France' },
    { id: 3, name: 'Technobird Rep', company_name: 'Technobird', email: 'accounts@technobird.com', country: 'Pakistan' },
    { id: 4, name: 'Smart Fix MD Rep', company_name: 'Smart Fix MD', email: 'info@smartfixmd.com', country: 'United States' },
    { id: 5, name: 'Pukhtoon Trade Test Centre', company_name: 'Pukhtoon Trade Test Centre', email: 'pttc@gmail.com', country: 'Pakistan' },
    { id: 6, name: 'Dr. Hammad', company_name: 'Hammad Physio Clinic', email: 'drhammad@physio.pk', country: 'Pakistan' },
    { id: 7, name: 'Hamza Falcon Rep', company_name: 'Hamza Falcon', email: 'falcon@hamza.com', country: 'Pakistan' }
  ];

  // 21 Invoices & Payments (Musaddiq: 420k, Arshad: 203k, Total: 623k)
  const payments = [
    // Month 1: Mar-2026 (Total 65,000)
    { id: 1, inv_num: 'INV-2026-001', client_id: 1, partner_id: 1, date: '2026-03-08', amount: 45000, desc: 'Merrylaz - SEO & Digital Strategy (March retainer)' },
    { id: 2, inv_num: 'INV-2026-002', client_id: 3, partner_id: 2, date: '2026-03-18', amount: 20000, desc: 'Technobird - Performance Marketing & Ads' },
    // Month 2: Apr-2026 (Total 91,000)
    { id: 3, inv_num: 'INV-2026-003', client_id: 1, partner_id: 1, date: '2026-04-07', amount: 70000, desc: 'Merrylaz - Full-scale Organic Campaign (April retainer)' },
    { id: 4, inv_num: 'INV-2026-004', client_id: 2, partner_id: 2, date: '2026-04-15', amount: 21000, desc: 'PAIDA PARIS - Brand Outreach & Social (Milestone 1)' },
    // Month 3: May-2026 (Total 91,000)
    { id: 5, inv_num: 'INV-2026-005', client_id: 1, partner_id: 1, date: '2026-05-08', amount: 70000, desc: 'Merrylaz - Content & Technical SEO (May retainer)' },
    { id: 6, inv_num: 'INV-2026-006', client_id: 2, partner_id: 2, date: '2026-05-20', amount: 21000, desc: 'PAIDA PARIS - Influencer Marketing (Milestone 2)' },
    // Month 4: Jun-2026 (Total 130,000)
    { id: 7, inv_num: 'INV-2026-007', client_id: 1, partner_id: 1, date: '2026-06-06', amount: 90000, desc: 'Merrylaz - Global Multi-Region Rollout (June retainer)' },
    { id: 8, inv_num: 'INV-2026-008', client_id: 3, partner_id: 2, date: '2026-06-15', amount: 24000, desc: 'Technobird - Growth Hacking & CRO Sprint' },
    { id: 9, inv_num: 'INV-2026-009', client_id: 2, partner_id: 2, date: '2026-06-22', amount: 16000, desc: 'PAIDA PARIS - Creative Design & Asset Delivery' },
    // Month 5: Jul-2026 (Total 106,500)
    { id: 10, inv_num: 'INV-2026-010', client_id: 1, partner_id: 1, date: '2026-07-06', amount: 75000, desc: 'Merrylaz - Summer Scale Retainer' },
    { id: 11, inv_num: 'INV-2026-011', client_id: 3, partner_id: 2, date: '2026-07-12', amount: 11500, desc: 'Technobird - Monthly Maintenance & Analytics' },
    { id: 12, inv_num: 'INV-2026-012', client_id: 5, partner_id: 2, date: '2026-07-18', amount: 10000, desc: 'Pukhtoon Trade Test Centre - Portal Marketing Phase 1' },
    { id: 13, inv_num: 'INV-2026-013', client_id: 6, partner_id: 2, date: '2026-07-25', amount: 10000, desc: 'Hammad Physio Clinic - Local Healthcare SEO' },
    // Month 6: Aug-2026 (Total 114,000)
    { id: 14, inv_num: 'INV-2026-014', client_id: 1, partner_id: 1, date: '2026-08-06', amount: 70000, desc: 'Merrylaz - August Retainer & Backlink Profile' },
    { id: 15, inv_num: 'INV-2026-015', client_id: 2, partner_id: 2, date: '2026-08-12', amount: 16000, desc: 'PAIDA PARIS - Q3 Brand Boost Retainer' },
    { id: 16, inv_num: 'INV-2026-016', client_id: 3, partner_id: 2, date: '2026-08-16', amount: 12000, desc: 'Technobird - Performance Optimization' },
    { id: 17, inv_num: 'INV-2026-017', client_id: 5, partner_id: 2, date: '2026-08-22', amount: 11000, desc: 'Pukhtoon Trade Test Centre - Portal Marketing Phase 2' },
    { id: 18, inv_num: 'INV-2026-018', client_id: 7, partner_id: 2, date: '2026-08-26', amount: 5000, desc: 'Hamza Falcon - Website Launch & Meta Ads' },
    // September-2026: (Total 25,500 from Smart Fix MD, bringing Total to 623,000)
    { id: 19, inv_num: 'INV-2026-019', client_id: 4, partner_id: 2, date: '2026-09-02', amount: 10000, desc: 'Smart Fix MD - Telehealth Lead Generation Sprint 1' },
    { id: 20, inv_num: 'INV-2026-020', client_id: 4, partner_id: 2, date: '2026-09-10', amount: 15500, desc: 'Smart Fix MD - Telehealth Lead Generation Sprint 2' },
    // 21st Invoice: Open upcoming invoice to complete 21 invoices (Overdue / upcoming test support)
    { id: 21, inv_num: 'INV-2026-021', client_id: 3, partner_id: 2, date: '2026-09-15', amount: 0, desc: 'Technobird - Q4 Growth Retainer (Open/Upcoming)', invoice_only: true, total_amount: 15000 }
  ];

  return { clients, payments };
}

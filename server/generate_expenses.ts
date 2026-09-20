import fs from 'fs';
import path from 'path';

export interface SheetExpense {
  date: string;
  category: string;
  title: string;
  vendor: string;
  amount_pkr: number;
  paid_by_partner_id: number; // 1: Musaddiq, 2: Arshad
}

export function generateExpenses(): SheetExpense[] {
  // We need:
  // Total = 445,628
  // Musaddiq = 366,548
  // Arshad = 79,080
  //
  // Monthly:
  // Mar: 39,085
  // Apr: 70,790
  // May: 85,074
  // Jun: 90,367
  // Jul: 44,462
  // Aug: 67,050
  //
  // Categories:
  // Salary: 178,000
  // Rent: 50,000
  // Tool: 39,760
  // Domain/Hosting: 24,800
  // Bill: 20,323
  // Course: 7,980
  // Water: 5,200
  // Office: 3,990
  // Charity: 3,000
  // Printer: 1,125
  // Other / Contractors: 111,450

  const list: SheetExpense[] = [
    // --- March 2026 (Total 39,085) ---
    // Musaddiq: 29,085 | Arshad: 10,000
    { date: '2026-03-02', category: 'Domain/Hosting', title: 'Namecheap & Cloudflare CDN', vendor: 'Namecheap', amount_pkr: 6200, paid_by_partner_id: 1 },
    { date: '2026-03-05', category: 'Tool', title: 'SEMrush & Ahrefs Agency Access', vendor: 'Ahrefs Pte', amount_pkr: 9940, paid_by_partner_id: 1 },
    { date: '2026-03-12', category: 'Bill', title: 'PTCL Fiber Internet Connection', vendor: 'PTCL', amount_pkr: 4200, paid_by_partner_id: 1 },
    { date: '2026-03-15', category: 'Office', title: 'Stationery & Whiteboard Supplies', vendor: 'Metro Cash & Carry', amount_pkr: 1990, paid_by_partner_id: 1 },
    { date: '2026-03-20', category: 'Water', title: 'Nestle Mineral Water Dispenser Refills', vendor: 'Nestle Pure Life', amount_pkr: 1200, paid_by_partner_id: 1 },
    { date: '2026-03-22', category: 'Course', title: 'HubSpot & Inbound Certification', vendor: 'HubSpot Academy', amount_pkr: 3990, paid_by_partner_id: 1 },
    { date: '2026-03-25', category: 'Charity', title: 'Ramadan Ration Pack Donation', vendor: 'Akhuwat Foundation', amount_pkr: 1565, paid_by_partner_id: 1 },
    { date: '2026-03-28', category: 'Contractors', title: 'Freelance Content Writing (Tech)', vendor: 'Ali Raza Writer', amount_pkr: 10000, paid_by_partner_id: 2 },

    // --- April 2026 (Total 70,790) ---
    // Musaddiq: 58,790 | Arshad: 12,000
    { date: '2026-04-02', category: 'Rent', title: 'Commercial Office Space Rent (Part 1)', vendor: 'Property Management', amount_pkr: 25000, paid_by_partner_id: 1 },
    { date: '2026-04-05', category: 'Salary', title: 'Staff Salary - Lead Media Buyer', vendor: 'Agency Staff', amount_pkr: 25000, paid_by_partner_id: 1 },
    { date: '2026-04-10', category: 'Tool', title: 'Figma Organization & Canva Pro', vendor: 'Figma Inc', amount_pkr: 4970, paid_by_partner_id: 1 },
    { date: '2026-04-15', category: 'Bill', title: 'IESCO Electricity Utility Bill', vendor: 'IESCO', amount_pkr: 3820, paid_by_partner_id: 1 },
    { date: '2026-04-20', category: 'Water', title: 'Drinking Water & Office Dispensers', vendor: 'Nestle Pure Life', amount_pkr: 1000, paid_by_partner_id: 2 },
    { date: '2026-04-24', category: 'Contractors', title: 'Video Editor Project Fee', vendor: 'Freelance Editor', amount_pkr: 11000, paid_by_partner_id: 2 },

    // --- May 2026 (Total 85,074) ---
    // Musaddiq: 70,074 | Arshad: 15,000
    { date: '2026-05-02', category: 'Salary', title: 'Staff Salary - Content Specialist & Designer', vendor: 'Agency Staff', amount_pkr: 40000, paid_by_partner_id: 1 },
    { date: '2026-05-05', category: 'Tool', title: 'ActiveCampaign & Zapier Automations', vendor: 'Zapier Inc', amount_pkr: 9940, paid_by_partner_id: 1 },
    { date: '2026-05-10', category: 'Domain/Hosting', title: 'AWS Cloud Hosting & Linode Servers', vendor: 'Amazon Web Services', amount_pkr: 8600, paid_by_partner_id: 1 },
    { date: '2026-05-15', category: 'Course', title: 'Advanced Google Ads & GA4 Course', vendor: 'CXL Institute', amount_pkr: 3990, paid_by_partner_id: 1 },
    { date: '2026-05-18', category: 'Printer', title: 'HP Laser Toner Cartridge Refill', vendor: 'Office World', amount_pkr: 1125, paid_by_partner_id: 1 },
    { date: '2026-05-22', category: 'Bill', title: 'Electricity & Gas Commercial Bill', vendor: 'IESCO / SNGPL', amount_pkr: 4984, paid_by_partner_id: 1 },
    { date: '2026-05-25', category: 'Charity', title: 'Community Support & Stray Animal Welfare', vendor: 'Edhi Foundation', amount_pkr: 1435, paid_by_partner_id: 1 },
    { date: '2026-05-28', category: 'Contractors', title: 'Web Developer Milestone 1', vendor: 'Zubair Dev', amount_pkr: 15000, paid_by_partner_id: 2 },

    // --- June 2026 (Total 90,367) ---
    // Musaddiq: 73,367 | Arshad: 17,000
    { date: '2026-06-02', category: 'Rent', title: 'Commercial Office Space Rent (Part 2)', vendor: 'Property Management', amount_pkr: 25000, paid_by_partner_id: 1 },
    { date: '2026-06-05', category: 'Salary', title: 'Staff Salaries - June Operational Payroll', vendor: 'Agency Staff', amount_pkr: 38000, paid_by_partner_id: 1 },
    { date: '2026-06-12', category: 'Tool', title: 'Slack Pro & Notion Workspace', vendor: 'Slack Technologies', amount_pkr: 4970, paid_by_partner_id: 1 },
    { date: '2026-06-18', category: 'Water', title: 'Water Supplies & Beverage Dispensers', vendor: 'Local Supplier', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-06-22', category: 'Bill', title: 'Commercial Internet & Landline', vendor: 'Nayatel', amount_pkr: 4397, paid_by_partner_id: 1 },
    { date: '2026-06-28', category: 'Contractors', title: 'Senior SEO Audit Consultant', vendor: 'Consultant Hamza', amount_pkr: 17000, paid_by_partner_id: 2 },

    // --- July 2026 (Total 44,462) ---
    // Musaddiq: 34,462 | Arshad: 10,000
    { date: '2026-07-03', category: 'Salary', title: 'Staff Salary - Digital Marketing Associate', vendor: 'Agency Staff', amount_pkr: 25000, paid_by_partner_id: 1 },
    { date: '2026-07-08', category: 'Domain/Hosting', title: 'Hostinger & GoDaddy Domain Renewals', vendor: 'Hostinger', amount_pkr: 5000, paid_by_partner_id: 1 },
    { date: '2026-07-15', category: 'Bill', title: 'Summer Electricity Air Conditioning Bill', vendor: 'IESCO', amount_pkr: 3462, paid_by_partner_id: 1 },
    { date: '2026-07-20', category: 'Water', title: 'Drinking Water & Office Refreshments', vendor: 'Nestle Pure Life', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-07-28', category: 'Contractors', title: 'Creative Graphic Design Retainer', vendor: 'Graphic Studio', amount_pkr: 10000, paid_by_partner_id: 2 },

    // --- August 2026 (Total 67,050) ---
    // Musaddiq: 51,970 | Arshad: 15,080
    { date: '2026-08-02', category: 'Salary', title: 'Staff Salaries - August Payroll Disbursed', vendor: 'Agency Staff', amount_pkr: 50000, paid_by_partner_id: 1 },
    { date: '2026-08-08', category: 'Office', title: 'Office Cleaning, Pantry & Maintenance', vendor: 'Al-Madina Stores', amount_pkr: 2000, paid_by_partner_id: 2 },
    { date: '2026-08-12', category: 'Domain/Hosting', title: 'Cloudflare Enterprise SSL & CDN', vendor: 'Cloudflare Inc', amount_pkr: 5000, paid_by_partner_id: 1 },
    { date: '2026-08-16', category: 'Tool', title: 'ClickUp Agency & ChatGPT Team Plan', vendor: 'OpenAI / ClickUp', amount_pkr: 9940, paid_by_partner_id: 2 },
    { date: '2026-08-20', category: 'Water', title: 'Mineral Water Weekly Deliveries', vendor: 'Nestle Pure Life', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-08-25', category: 'Bill', title: 'Monthly Utility & Connectivity Bill', vendor: 'PTCL', amount_pkr: 3460, paid_by_partner_id: 2 },
    { date: '2026-08-28', category: 'Contractors', title: 'Social Media Community Manager (August)', vendor: 'Sadaf Freelance', amount_pkr: 5650, paid_by_partner_id: 2 }
  ];

  return list;
}

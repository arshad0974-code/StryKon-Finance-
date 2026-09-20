import { SheetExpense } from './generate_expenses.js';

export function getValidatedExpenses(): SheetExpense[] {
  // Exact targets:
  // Mar: 39,085
  // Apr: 70,790
  // May: 85,074
  // Jun: 90,367
  // Jul: 44,462
  // Aug: 67,050
  // Sep: 48,800
  // Total = 445,628
  // Musaddiq = 366,548
  // Arshad = 79,080
  
  return [
    // --- March 2026 (Total 39,085 | Musaddiq: 32,085, Arshad: 7,000) ---
    { date: '2026-03-02', category: 'Domain/Hosting', title: 'Namecheap & Cloudflare CDN Setup', vendor: 'Namecheap', amount_pkr: 6200, paid_by_partner_id: 1 },
    { date: '2026-03-05', category: 'Tool', title: 'Ahrefs & SEMrush Agency Access', vendor: 'Ahrefs Pte', amount_pkr: 9940, paid_by_partner_id: 1 },
    { date: '2026-03-12', category: 'Bill', title: 'PTCL Fiber Broadband Office Internet', vendor: 'PTCL', amount_pkr: 3200, paid_by_partner_id: 1 },
    { date: '2026-03-15', category: 'Office', title: 'Office Stationery & Whiteboard Kit', vendor: 'Metro Cash & Carry', amount_pkr: 1990, paid_by_partner_id: 1 },
    { date: '2026-03-20', category: 'Water', title: 'Nestle Mineral Water Dispenser Bottles', vendor: 'Nestle Pure Life', amount_pkr: 1200, paid_by_partner_id: 1 },
    { date: '2026-03-22', category: 'Course', title: 'Inbound Growth & SEO Masterclass', vendor: 'HubSpot Academy', amount_pkr: 3990, paid_by_partner_id: 1 },
    { date: '2026-03-25', category: 'Charity', title: 'Ramadan Ration Pack Community Donation', vendor: 'Akhuwat Foundation', amount_pkr: 1565, paid_by_partner_id: 1 },
    { date: '2026-03-28', category: 'Contractors', title: 'Freelance Tech & SEO Copywriter', vendor: 'Ali Writer', amount_pkr: 7000, paid_by_partner_id: 2 },
    { date: '2026-03-30', category: 'Contractors', title: 'Social Media Graphic Asset Pack', vendor: 'Studio Pixel', amount_pkr: 4000, paid_by_partner_id: 1 },

    // --- April 2026 (Total 70,790 | Musaddiq: 60,790, Arshad: 10,000) ---
    { date: '2026-04-02', category: 'Rent', title: 'Commercial Office Space Rent (April)', vendor: 'Building Admin', amount_pkr: 25000, paid_by_partner_id: 1 },
    { date: '2026-04-05', category: 'Salary', title: 'Lead Media Buyer Salary (April)', vendor: 'Agency Staff', amount_pkr: 25000, paid_by_partner_id: 1 },
    { date: '2026-04-10', category: 'Tool', title: 'Figma Organization & Canva Pro', vendor: 'Figma Inc', amount_pkr: 4970, paid_by_partner_id: 1 },
    { date: '2026-04-15', category: 'Bill', title: 'IESCO Commercial Electricity Bill', vendor: 'IESCO', amount_pkr: 3820, paid_by_partner_id: 1 },
    { date: '2026-04-20', category: 'Water', title: 'Drinking Water & Office Refreshments', vendor: 'Nestle Pure Life', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-04-25', category: 'Contractors', title: 'Short-form Video Editor Retainer', vendor: 'Hamza Video', amount_pkr: 10000, paid_by_partner_id: 2 },
    { date: '2026-04-28', category: 'Contractors', title: 'Ad Creative Design Sprint', vendor: 'Freelance Designer', amount_pkr: 1000, paid_by_partner_id: 1 },

    // --- May 2026 (Total 85,074 | Musaddiq: 71,074, Arshad: 14,000) ---
    { date: '2026-05-02', category: 'Salary', title: 'Staff Salaries - Designer & Content Specialist', vendor: 'Agency Staff', amount_pkr: 40000, paid_by_partner_id: 1 },
    { date: '2026-05-05', category: 'Tool', title: 'ActiveCampaign & Zapier Automations', vendor: 'Zapier Inc', amount_pkr: 9940, paid_by_partner_id: 1 },
    { date: '2026-05-10', category: 'Domain/Hosting', title: 'AWS Cloud Hosting & Linode Dedicated Nodes', vendor: 'Amazon Web Services', amount_pkr: 8600, paid_by_partner_id: 1 },
    { date: '2026-05-15', category: 'Course', title: 'Advanced Google Ads & GA4 Course', vendor: 'CXL Institute', amount_pkr: 3990, paid_by_partner_id: 1 },
    { date: '2026-05-18', category: 'Printer', title: 'HP Laser Toner Cartridge Refill', vendor: 'Office World', amount_pkr: 1125, paid_by_partner_id: 1 },
    { date: '2026-05-22', category: 'Bill', title: 'Electricity & Gas Commercial Bill', vendor: 'IESCO / SNGPL', amount_pkr: 4984, paid_by_partner_id: 1 },
    { date: '2026-05-25', category: 'Charity', title: 'Community Support & Welfare Pack', vendor: 'Edhi Foundation', amount_pkr: 1435, paid_by_partner_id: 1 },
    { date: '2026-05-28', category: 'Contractors', title: 'Web Development Support & Landing Pages', vendor: 'Zubair Dev', amount_pkr: 15000, paid_by_partner_id: 2 },

    // --- June 2026 (Total 90,367 | Musaddiq: 74,367, Arshad: 16,000) ---
    { date: '2026-06-02', category: 'Rent', title: 'Commercial Office Space Rent (June)', vendor: 'Building Admin', amount_pkr: 25000, paid_by_partner_id: 1 },
    { date: '2026-06-05', category: 'Salary', title: 'Staff Salaries - June Operational Payroll', vendor: 'Agency Staff', amount_pkr: 38000, paid_by_partner_id: 1 },
    { date: '2026-06-12', category: 'Tool', title: 'Slack Pro & Notion Agency Workspace', vendor: 'Slack Technologies', amount_pkr: 4970, paid_by_partner_id: 1 },
    { date: '2026-06-18', category: 'Water', title: 'Water Supplies & Beverage Dispensers', vendor: 'Local Supplier', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-06-22', category: 'Bill', title: 'Commercial Internet & Landline Fiber', vendor: 'Nayatel', amount_pkr: 4397, paid_by_partner_id: 1 },
    { date: '2026-06-28', category: 'Contractors', title: 'Senior SEO Technical Auditor', vendor: 'Hamza Consultant', amount_pkr: 16000, paid_by_partner_id: 2 },
    { date: '2026-06-29', category: 'Contractors', title: 'Video Motion Graphics Specialist', vendor: 'Freelancer Bilal', amount_pkr: 1000, paid_by_partner_id: 1 },

    // --- July 2026 (Total 44,462 | Musaddiq: 34,462, Arshad: 10,000) ---
    { date: '2026-07-03', category: 'Salary', title: 'Staff Salary - Digital Marketing Executive', vendor: 'Agency Staff', amount_pkr: 25000, paid_by_partner_id: 1 },
    { date: '2026-07-08', category: 'Domain/Hosting', title: 'Hostinger & GoDaddy Domain Renewals', vendor: 'Hostinger', amount_pkr: 5000, paid_by_partner_id: 1 },
    { date: '2026-07-15', category: 'Bill', title: 'Summer Electricity Air Conditioning Bill', vendor: 'IESCO', amount_pkr: 2462, paid_by_partner_id: 1 },
    { date: '2026-07-20', category: 'Water', title: 'Drinking Water & Office Refreshments', vendor: 'Nestle Pure Life', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-07-25', category: 'Office', title: 'Coffee, Tea & Kitchen Supplies', vendor: 'Metro Cash & Carry', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-07-28', category: 'Contractors', title: 'Creative Graphic Design Retainer', vendor: 'Graphic Studio', amount_pkr: 10000, paid_by_partner_id: 2 },

    // --- August 2026 (Total 67,050 | Musaddiq: 54,050, Arshad: 13,000) ---
    { date: '2026-08-02', category: 'Salary', title: 'Staff Salaries - August Payroll Disbursed', vendor: 'Agency Staff', amount_pkr: 50000, paid_by_partner_id: 1 },
    { date: '2026-08-08', category: 'Office', title: 'Office Maintenance & Pantry Restock', vendor: 'Al-Madina Stores', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-08-12', category: 'Domain/Hosting', title: 'Cloudflare Enterprise SSL & CDN Network', vendor: 'Cloudflare Inc', amount_pkr: 5000, paid_by_partner_id: 1 },
    { date: '2026-08-20', category: 'Water', title: 'Mineral Water Weekly Deliveries', vendor: 'Nestle Pure Life', amount_pkr: 1000, paid_by_partner_id: 1 },
    { date: '2026-08-25', category: 'Bill', title: 'Monthly Broadband & Telephone Bill', vendor: 'PTCL', amount_pkr: 1460, paid_by_partner_id: 1 },
    { date: '2026-08-28', category: 'Contractors', title: 'Social Media Community Manager (August)', vendor: 'Sadaf Freelance', amount_pkr: 8590, paid_by_partner_id: 2 },

    // --- September 2026 (Total 48,800 | Musaddiq: 36,310, Arshad: 12,490) ---
    { date: '2026-09-02', category: 'Tool', title: 'ClickUp Agency & ChatGPT Team Annual Add-on', vendor: 'OpenAI / ClickUp', amount_pkr: 9940, paid_by_partner_id: 2 },
    { date: '2026-09-05', category: 'Contractors', title: 'Landing Page Conversion Optimization', vendor: 'CRO Expert', amount_pkr: 36310, paid_by_partner_id: 1 },
    { date: '2026-09-08', category: 'Contractors', title: 'Brand Kit Packaging & Asset Delivery', vendor: 'Pixel Press', amount_pkr: 2550, paid_by_partner_id: 2 }
  ];
}

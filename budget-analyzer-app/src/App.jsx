import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, FileText, TrendingUp, TrendingDown, Minus, X, Shield, ArrowRight, Check, Loader, ArrowLeft, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Zap, LogOut, User, PlusCircle, FolderOpen, Settings as SettingsIcon, Trash2, Menu } from 'lucide-react';
import './storage.js';
import { supabase } from './supabase.js';

const TEST_CSV = `Date,Description,Debit,Credit,Balance
01/03/2026,Opening Balance,,,5000.00
01/03/2026,Direct Credit ACME PTY LTD Payroll,,3500.00,8500.00
03/03/2026,P&I Payment Home Loan Repayment,2380.00,,6120.00
05/03/2026,Sydney Water,55.00,,6065.00
07/03/2026,Woolworths 1234 Chatswood,124.50,,5940.50
10/03/2026,Telstra,80.00,,5860.50
11/03/2026,Starbucks Collins St,8.50,,5852.00
12/03/2026,Uber Eats,42.80,,5809.20
14/03/2026,BP Petrol Station Lane Cove,82.00,,5727.20
14/03/2026,Woolworths 1234 Chatswood,98.30,,5628.90
15/03/2026,Direct Credit ACME PTY LTD Payroll,,3500.00,9128.90
15/03/2026,AGL Energy,145.00,,8983.90
17/03/2026,Netflix,22.99,,8960.91
17/03/2026,Spotify,12.99,,8947.92
18/03/2026,Thai Kitchen Restaurant,68.00,,8879.92
19/03/2026,Coles Supermarket Artarmon,156.20,,8723.72
20/03/2026,NRMA Insurance,185.00,,8538.72
21/03/2026,Starbucks Collins St,8.50,,8530.22
21/03/2026,Amazon AU,45.99,,8484.23
22/03/2026,Translink Go Card,30.00,,8454.23
24/03/2026,Woolworths 1234 Chatswood,112.40,,8341.83
25/03/2026,Hungry Jacks Drive Thru,15.80,,8326.03
26/03/2026,BP Petrol Station Lane Cove,78.50,,8247.53
27/03/2026,Uber Eats,38.50,,8209.03
28/03/2026,The Local Bistro,94.00,,8115.03
29/03/2026,Direct Credit ACME PTY LTD Payroll,,3500.00,11615.03
31/03/2026,Coles Supermarket Artarmon,88.90,,11526.13
01/04/2026,Dan Murphy's,72.00,,11454.13
03/04/2026,P&I Payment Home Loan Repayment,2380.00,,9074.13
04/04/2026,Starbucks Collins St,8.50,,9065.63
05/04/2026,Sydney Water,55.00,,9010.63
07/04/2026,Woolworths 1234 Chatswood,138.60,,8872.03
08/04/2026,Uber Trip,24.50,,8847.53
10/04/2026,Telstra,80.00,,8767.53
11/04/2026,Menulog,31.90,,8735.63
12/04/2026,Direct Credit ACME PTY LTD Payroll,,3500.00,12235.63
14/04/2026,BP Petrol Station Lane Cove,91.00,,12144.63
15/04/2026,AGL Energy,145.00,,11999.63
15/04/2026,NRMA Insurance,185.00,,11814.63
16/04/2026,Netflix,22.99,,11791.64
16/04/2026,Spotify,12.99,,11778.65
17/04/2026,Coles Supermarket Artarmon,142.30,,11636.35
18/04/2026,Starbucks Collins St,8.50,,11627.85
19/04/2026,Thai Kitchen Restaurant,55.00,,11572.85
21/04/2026,Woolworths 1234 Chatswood,104.70,,11468.15
22/04/2026,Anytime Fitness,45.00,,11423.15
23/04/2026,Translink Go Card,30.00,,11393.15
24/04/2026,Uber Eats,52.30,,11340.85
25/04/2026,Kmart Australia,87.50,,11253.35
26/04/2026,Direct Credit ACME PTY LTD Payroll,,3500.00,14753.35
26/04/2026,BP Petrol Station Lane Cove,84.00,,14669.35
28/04/2026,The Local Bistro,78.00,,14591.35
28/04/2026,Dan Murphy's,48.00,,14543.35
29/04/2026,Woolworths 1234 Chatswood,119.80,,14423.55
30/04/2026,Amazon AU,32.99,,14390.56
30/04/2026,Starbucks Collins St,8.50,,14382.06`;

// --- Australian salary benchmarks (2024/25, full-time, national median base) ---
const AU_SALARY_BENCHMARKS = [
  { keywords: ['software engineer','software developer','frontend','backend','full stack','fullstack','web developer','react','javascript developer'], title: 'Software Developer / Engineer', low: 85000, median: 118000, high: 162000, next: [['Senior Software Engineer', 130000, 180000],['Tech Lead / Principal Engineer', 148000, 200000],['Engineering Manager', 160000, 230000]], field: 'software-developer' },
  { keywords: ['data analyst','data analytics','business intelligence','bi analyst'], title: 'Data Analyst', low: 72000, median: 93000, high: 125000, next: [['Senior Data Analyst', 100000, 135000],['Data Scientist', 115000, 155000],['Analytics Manager', 130000, 175000]], field: 'data-analyst' },
  { keywords: ['data scientist','machine learning','ml engineer','ai engineer'], title: 'Data Scientist / ML Engineer', low: 100000, median: 130000, high: 170000, next: [['Senior Data Scientist', 140000, 185000],['Principal Data Scientist', 165000, 220000],['Head of Data', 180000, 250000]], field: 'data-scientist' },
  { keywords: ['devops','cloud engineer','site reliability','sre','platform engineer','infrastructure engineer'], title: 'DevOps / Cloud Engineer', low: 100000, median: 132000, high: 170000, next: [['Senior DevOps Engineer', 140000, 180000],['Cloud Architect', 155000, 210000],['Head of Infrastructure', 170000, 230000]], field: 'devops-engineer' },
  { keywords: ['product manager','product owner'], title: 'Product Manager', low: 105000, median: 140000, high: 185000, next: [['Senior Product Manager', 150000, 195000],['Group Product Manager', 175000, 230000],['CPO / VP Product', 200000, 300000]], field: 'product-manager' },
  { keywords: ['ux designer','ui designer','ux/ui','user experience','interaction designer'], title: 'UX / UI Designer', low: 78000, median: 105000, high: 145000, next: [['Senior UX Designer', 115000, 150000],['Lead Designer', 135000, 175000],['Design Manager / Director', 155000, 210000]], field: 'ux-designer' },
  { keywords: ['project manager','program manager','pmo'], title: 'Project Manager', low: 92000, median: 120000, high: 155000, next: [['Senior Project Manager', 128000, 165000],['Program Manager', 145000, 190000],['Head of PMO', 160000, 210000]], field: 'project-manager' },
  { keywords: ['business analyst','systems analyst','ba '], title: 'Business Analyst', low: 82000, median: 108000, high: 145000, next: [['Senior Business Analyst', 115000, 150000],['Principal BA / Solution Architect', 138000, 175000],['IT Manager / Director', 150000, 200000]], field: 'business-analyst' },
  { keywords: ['accountant','accounting'], title: 'Accountant', low: 62000, median: 85000, high: 120000, next: [['Senior Accountant', 90000, 125000],['Finance Manager', 110000, 150000],['CFO / Financial Controller', 150000, 250000]], field: 'accountant' },
  { keywords: ['financial analyst','finance analyst','fp&a'], title: 'Financial Analyst', low: 78000, median: 100000, high: 135000, next: [['Senior Financial Analyst', 108000, 145000],['Finance Manager', 120000, 165000],['Director of Finance', 160000, 220000]], field: 'financial-analyst' },
  { keywords: ['marketing manager','head of marketing','marketing director'], title: 'Marketing Manager', low: 90000, median: 118000, high: 155000, next: [['Senior Marketing Manager', 125000, 165000],['Head of Marketing', 145000, 195000],['CMO', 180000, 280000]], field: 'marketing-manager' },
  { keywords: ['digital marketing','seo','sem','performance marketing','paid media'], title: 'Digital Marketing Specialist', low: 62000, median: 82000, high: 115000, next: [['Digital Marketing Manager', 90000, 125000],['Head of Digital', 120000, 165000],['Marketing Director', 145000, 200000]], field: 'digital-marketing-specialist' },
  { keywords: ['hr manager','human resources','people and culture','talent acquisition','recruiter'], title: 'HR / People & Culture Manager', low: 85000, median: 108000, high: 145000, next: [['Senior HR Manager', 115000, 155000],['HR Director', 145000, 195000],['Chief People Officer', 175000, 260000]], field: 'hr-manager' },
  { keywords: ['sales manager','account manager','account executive','sales executive','business development'], title: 'Sales / Account Manager', low: 70000, median: 98000, high: 160000, next: [['Senior Account Manager', 105000, 175000],['Sales Director', 140000, 220000],['VP Sales', 175000, 300000]], field: 'sales-manager' },
  { keywords: ['operations manager','operations director','head of operations','coo'], title: 'Operations Manager', low: 90000, median: 120000, high: 165000, next: [['Senior Operations Manager', 130000, 170000],['Director of Operations', 155000, 210000],['COO', 190000, 300000]], field: 'operations-manager' },
  { keywords: ['registered nurse','rn ','nurse ','nursing'], title: 'Registered Nurse', low: 72000, median: 88000, high: 108000, next: [['Clinical Nurse Specialist', 92000, 115000],['Nurse Manager / CNS', 100000, 130000],['Director of Nursing', 120000, 165000]], field: 'registered-nurse' },
  { keywords: ['physiotherapist','physio'], title: 'Physiotherapist', low: 72000, median: 92000, high: 120000, next: [['Senior Physiotherapist', 98000, 130000],['Clinical Lead / Manager', 115000, 150000],['Practice Principal', 130000, 180000]], field: 'physiotherapist' },
  { keywords: ['pharmacist'], title: 'Pharmacist', low: 85000, median: 100000, high: 128000, next: [['Senior Pharmacist / Clinical', 105000, 135000],['Pharmacy Manager', 115000, 150000],['Pharmaceutical Industry', 120000, 200000]], field: 'pharmacist' },
  { keywords: ['psychologist','counsellor','counselor','therapist'], title: 'Psychologist / Counsellor', low: 78000, median: 102000, high: 135000, next: [['Senior Psychologist', 110000, 145000],['Clinical Psychology Specialist', 125000, 160000],['Private Practice Principal', 140000, 220000]], field: 'psychologist' },
  { keywords: ['doctor','gp','general practitioner','physician','medical officer'], title: 'Medical Officer / GP', low: 160000, median: 240000, high: 380000, next: [['GP Principal / Owner', 280000, 450000],['Specialist Physician', 300000, 600000]], field: 'medical-officer' },
  { keywords: ['teacher','educator','instructor'], title: 'Teacher / Educator', low: 68000, median: 88000, high: 108000, next: [['Head of Department', 95000, 115000],['Deputy Principal', 108000, 135000],['Principal', 130000, 175000]], field: 'teacher' },
  { keywords: ['electrician','electrical tradesperson'], title: 'Electrician', low: 68000, median: 90000, high: 120000, next: [['Electrical Supervisor / Foreman', 98000, 130000],['Electrical Contractor (self-employed)', 120000, 200000],['Project Electrical Engineer', 110000, 155000]], field: 'electrician' },
  { keywords: ['plumber','plumbing'], title: 'Plumber', low: 65000, median: 87000, high: 115000, next: [['Plumbing Supervisor', 95000, 125000],['Plumbing Contractor', 115000, 190000],['Project Manager (construction)', 110000, 150000]], field: 'plumber' },
  { keywords: ['civil engineer','structural engineer','mechanical engineer','electrical engineer','engineering'], title: 'Engineer (Civil / Structural / Mechanical)', low: 82000, median: 110000, high: 148000, next: [['Senior Engineer', 118000, 155000],['Principal Engineer', 140000, 185000],['Engineering Manager / Director', 160000, 220000]], field: 'engineer' },
  { keywords: ['lawyer','solicitor','barrister','legal'], title: 'Lawyer / Solicitor', low: 78000, median: 130000, high: 250000, next: [['Senior Associate', 140000, 190000],['Special Counsel', 175000, 240000],['Partner', 250000, 500000]], field: 'lawyer' },
  { keywords: ['social worker','case manager','community worker'], title: 'Social Worker / Case Manager', low: 62000, median: 78000, high: 100000, next: [['Senior Social Worker', 84000, 108000],['Team Leader / Manager', 95000, 125000],['Program Director (NGO / Govt)', 110000, 150000]], field: 'social-worker' },
  { keywords: ['real estate agent','property manager','real estate'], title: 'Real Estate Agent / Property Manager', low: 55000, median: 85000, high: 160000, next: [['Senior Sales Agent (top performer)', 120000, 250000],['Licensee in Charge', 110000, 175000],['Property Development Manager', 130000, 200000]], field: 'real-estate-agent' },
  { keywords: ['chef','cook','head chef','sous chef'], title: 'Chef', low: 52000, median: 68000, high: 95000, next: [['Head Chef / Executive Chef', 80000, 120000],['Food & Beverage Manager', 85000, 120000],['Catering Manager (corporate)', 90000, 130000]], field: 'chef' },
  { keywords: ['graphic designer','designer','visual designer'], title: 'Graphic / Visual Designer', low: 58000, median: 78000, high: 108000, next: [['Senior Designer', 88000, 120000],['Creative Director', 115000, 160000],['Design Manager', 120000, 165000]], field: 'graphic-designer' },
  { keywords: ['supply chain','logistics','procurement','warehouse manager'], title: 'Supply Chain / Logistics Manager', low: 85000, median: 112000, high: 155000, next: [['Senior Supply Chain Manager', 120000, 160000],['Head of Logistics / Procurement', 145000, 195000],['Chief Supply Chain Officer', 175000, 260000]], field: 'supply-chain-manager' },
];

const AU_LOCATION_PREMIUM = { sydney: 0.12, melbourne: 0.10, brisbane: 0.05, perth: 0.08, canberra: 0.18, adelaide: -0.02, hobart: -0.05, darwin: 0.06, national: 0 };

// Bill comparison lookup — matched against recurring expense descriptions
const BILL_LOOKUP = [
  // Electricity / Gas
  { match: ['agl'], provider: 'AGL', cat: 'Electricity & Gas', icon: '⚡', alts: [
    { name: 'Energy Made Easy', desc: 'Government comparison — free, covers every provider in your area', url: 'https://www.energymadeeasy.gov.au', badge: 'Gov tool' },
    { name: 'Amber Electric', desc: 'Wholesale rates — avg household saves $300–600/yr', url: 'https://www.amber.com.au', badge: 'Switch' },
    { name: 'Red Energy', desc: '100% Australian-owned, competitive rates', url: 'https://www.redenergy.com.au', badge: 'Switch' },
  ]},
  { match: ['origin energy', 'origin '], provider: 'Origin Energy', cat: 'Electricity & Gas', icon: '⚡', alts: [
    { name: 'Energy Made Easy', desc: 'Government comparison — free, covers your area', url: 'https://www.energymadeeasy.gov.au', badge: 'Gov tool' },
    { name: 'Amber Electric', desc: 'Wholesale rates — save $300–600/yr avg', url: 'https://www.amber.com.au', badge: 'Switch' },
    { name: 'Alinta Energy', desc: 'Competitive electricity & gas bundles', url: 'https://www.alintaenergy.com.au', badge: 'Switch' },
  ]},
  { match: ['energyaustralia', 'energy australia'], provider: 'EnergyAustralia', cat: 'Electricity & Gas', icon: '⚡', alts: [
    { name: 'Energy Made Easy', desc: 'Government comparison tool', url: 'https://www.energymadeeasy.gov.au', badge: 'Gov tool' },
    { name: 'Simply Energy', desc: 'Flat-rate plans, easy to understand', url: 'https://www.simplyenergy.com.au', badge: 'Switch' },
    { name: 'Amber Electric', desc: 'Wholesale rates', url: 'https://www.amber.com.au', badge: 'Switch' },
  ]},
  { match: ['alinta'], provider: 'Alinta Energy', cat: 'Electricity & Gas', icon: '⚡', alts: [
    { name: 'Energy Made Easy', desc: 'Find cheaper in your area', url: 'https://www.energymadeeasy.gov.au', badge: 'Gov tool' },
    { name: 'Amber Electric', desc: 'Wholesale rates', url: 'https://www.amber.com.au', badge: 'Switch' },
  ]},
  { match: ['simply energy'], provider: 'Simply Energy', cat: 'Electricity & Gas', icon: '⚡', alts: [
    { name: 'Energy Made Easy', desc: 'Government comparison', url: 'https://www.energymadeeasy.gov.au', badge: 'Gov tool' },
    { name: 'Amber Electric', desc: 'Wholesale rates — often cheaper', url: 'https://www.amber.com.au', badge: 'Switch' },
  ]},
  { match: ['lumo energy', 'powershop', 'red energy', 'momentum energy', 'click energy', 'dodo power', 'sumo gas'], provider: null, cat: 'Electricity & Gas', icon: '⚡', alts: [
    { name: 'Energy Made Easy', desc: 'Government comparison — find cheapest for your address', url: 'https://www.energymadeeasy.gov.au', badge: 'Gov tool' },
    { name: 'Amber Electric', desc: 'Wholesale rates — save avg $300–600/yr', url: 'https://www.amber.com.au', badge: 'Switch' },
  ]},
  // Internet & Phone
  { match: ['telstra'], provider: 'Telstra', cat: 'Internet & Mobile', icon: '📡', alts: [
    { name: 'Aussie Broadband', desc: 'NBN 100 from $75/mo — local support, no lock-in', url: 'https://www.aussiebroadband.com.au', badge: 'NBN' },
    { name: 'Superloop', desc: 'NBN 100 from $69/mo — fast and reliable', url: 'https://www.superloop.com', badge: 'NBN' },
    { name: 'Boost Mobile', desc: "Uses Telstra's network. 25GB + unlimited calls from $30/mo", url: 'https://www.boost.com.au', badge: 'Mobile' },
  ]},
  { match: ['optus'], provider: 'Optus', cat: 'Internet & Mobile', icon: '📡', alts: [
    { name: 'Aussie Broadband', desc: 'NBN from $75/mo — consistently highly rated', url: 'https://www.aussiebroadband.com.au', badge: 'NBN' },
    { name: 'Circles.Life', desc: '40GB + unlimited calls from $28/mo', url: 'https://www.circles.life/au/', badge: 'Mobile' },
    { name: 'WhistleOut', desc: 'Compare all NBN & mobile plans in 2 minutes', url: 'https://www.whistleout.com.au', badge: 'Compare' },
  ]},
  { match: ['tpg', 'iinet', 'internode', 'dodo internet', 'belong'], provider: null, cat: 'Internet & Mobile', icon: '📡', alts: [
    { name: 'Aussie Broadband', desc: 'NBN 100 from $75/mo — top-rated support', url: 'https://www.aussiebroadband.com.au', badge: 'NBN' },
    { name: 'Superloop', desc: 'NBN 100 from $69/mo', url: 'https://www.superloop.com', badge: 'NBN' },
    { name: 'Exetel', desc: 'NBN 50 from $59/mo — month-to-month', url: 'https://www.exetel.com.au', badge: 'NBN' },
  ]},
  { match: ['vodafone'], provider: 'Vodafone', cat: 'Internet & Mobile', icon: '📡', alts: [
    { name: 'Circles.Life', desc: '40GB + unlimited from $28/mo', url: 'https://www.circles.life/au/', badge: 'Mobile' },
    { name: 'amaysim', desc: '12GB + unlimited from $18/mo (Optus network)', url: 'https://www.amaysim.com.au', badge: 'Mobile' },
    { name: 'WhistleOut', desc: 'Compare every plan', url: 'https://www.whistleout.com.au', badge: 'Compare' },
  ]},
  // Insurance
  { match: ['nrma'], provider: 'NRMA Insurance', cat: 'Insurance', icon: '🛡', alts: [
    { name: 'Budget Direct', desc: 'Typically 20–40% cheaper than big brands — car & home', url: 'https://www.budgetdirect.com.au', badge: 'Switch' },
    { name: 'Bingle', desc: 'Online-only car insurance — no frills, lowest price', url: 'https://www.bingle.com.au', badge: 'Car' },
    { name: 'Canstar', desc: 'Compare every insurer side by side', url: 'https://www.canstar.com.au/car-insurance/', badge: 'Compare' },
  ]},
  { match: ['aami'], provider: 'AAMI', cat: 'Insurance', icon: '🛡', alts: [
    { name: 'Budget Direct', desc: 'Often 20–40% cheaper on car & home', url: 'https://www.budgetdirect.com.au', badge: 'Switch' },
    { name: 'Honey Insurance', desc: 'Smart home insurance — sensor discount applies', url: 'https://www.honey.insurance', badge: 'Home' },
    { name: 'Canstar', desc: 'Compare all insurers', url: 'https://www.canstar.com.au/insurance/', badge: 'Compare' },
  ]},
  { match: ['gio ', 'gio insurance', 'suncorp', 'allianz', 'comminsure', 'racq', 'rac ', 'sgic', 'cua insurance', 'youi'], provider: null, cat: 'Insurance', icon: '🛡', alts: [
    { name: 'Budget Direct', desc: 'Typically 20–40% cheaper — car & home', url: 'https://www.budgetdirect.com.au', badge: 'Switch' },
    { name: 'Canstar', desc: 'Compare every insurer', url: 'https://www.canstar.com.au/insurance/', badge: 'Compare' },
  ]},
  { match: ['medibank'], provider: 'Medibank', cat: 'Health Insurance', icon: '🏥', alts: [
    { name: 'privatehealth.gov.au', desc: 'Official government comparison — free, comprehensive', url: 'https://www.privatehealth.gov.au', badge: 'Gov tool' },
    { name: 'HCF', desc: 'Not-for-profit — often 10–20% cheaper than big funds', url: 'https://www.hcf.com.au', badge: 'Switch' },
    { name: 'GMHBA', desc: 'Member-owned fund, competitive premiums', url: 'https://www.gmhba.com.au', badge: 'Switch' },
  ]},
  { match: ['bupa'], provider: 'Bupa', cat: 'Health Insurance', icon: '🏥', alts: [
    { name: 'privatehealth.gov.au', desc: 'Government comparison — free', url: 'https://www.privatehealth.gov.au', badge: 'Gov tool' },
    { name: 'HCF', desc: 'Not-for-profit, often 10–20% cheaper', url: 'https://www.hcf.com.au', badge: 'Switch' },
    { name: 'Teachers Health', desc: 'Open to all — competitive premiums', url: 'https://www.teachershealth.com.au', badge: 'Switch' },
  ]},
  { match: ['hcf', 'nib ','nib health', 'australian unity health', 'peoplecare', 'cbhs', 'frank health'], provider: null, cat: 'Health Insurance', icon: '🏥', alts: [
    { name: 'privatehealth.gov.au', desc: 'Government comparison — compare all funds free', url: 'https://www.privatehealth.gov.au', badge: 'Gov tool' },
  ]},
  // Streaming & Subscriptions
  { match: ['netflix'], provider: 'Netflix', cat: 'Streaming', icon: '📺', alts: [
    { name: 'Netflix with Ads', desc: 'Same library, $7.99/mo instead of $22.99 — saves $180/yr', url: 'https://www.netflix.com/au', badge: 'Downgrade plan' },
    { name: 'Rotate services', desc: 'Subscribe for 1–2 months, pause, swap to Disney+ or Stan. Save $100+/yr.', url: null, badge: 'Tip' },
  ]},
  { match: ['disney'], provider: 'Disney+', cat: 'Streaming', icon: '📺', alts: [
    { name: 'Disney+ Basic', desc: 'Ad-supported tier — lower price, same content', url: 'https://www.disneyplus.com/en-au', badge: 'Downgrade plan' },
    { name: 'Rotate services', desc: 'Pause Disney+, subscribe to Netflix for a month, rotate back.', url: null, badge: 'Tip' },
  ]},
  { match: ['foxtel', 'binge'], provider: 'Foxtel/Binge', cat: 'Streaming', icon: '📺', alts: [
    { name: 'Binge Basic', desc: '$10/mo vs Foxtel $46+/mo — same Foxtel content', url: 'https://www.binge.com.au', badge: 'Downgrade' },
    { name: 'Kayo Sports', desc: 'Sport only — $25/mo for live sports only', url: 'https://kayosports.com.au', badge: 'Sports only' },
  ]},
  { match: ['spotify'], provider: 'Spotify', cat: 'Music', icon: '🎵', alts: [
    { name: 'Spotify Family', desc: 'Up to 6 people — $17.99/mo total ($3/person vs $13.99)', url: 'https://www.spotify.com/au/family/', badge: 'Share plan' },
    { name: 'YouTube Music', desc: 'Included with YouTube Premium — $14.99/mo bundles both', url: 'https://music.youtube.com', badge: 'Bundle' },
  ]},
  // Gym
  { match: ['anytime fitness'], provider: 'Anytime Fitness', cat: 'Gym', icon: '🏋', alts: [
    { name: 'Jetts Fitness', desc: 'No lock-in, 24/7 access — often $10–15/mo cheaper', url: 'https://www.jetts.com.au', badge: 'Switch' },
    { name: 'Council gym / pool', desc: 'Local council facilities from $10–18/mo — half the price', url: null, badge: 'Tip' },
    { name: 'Fitness First', desc: 'Compare 12-month contract rates — sometimes cheaper', url: 'https://www.fitnessfirst.com.au', badge: 'Compare' },
  ]},
  { match: ['fitness first', 'goodlife', 'virgin active', 'f45'], provider: null, cat: 'Gym', icon: '🏋', alts: [
    { name: 'Jetts Fitness', desc: 'No lock-in gym, 24/7 access — often cheaper', url: 'https://www.jetts.com.au', badge: 'Switch' },
    { name: 'Council gym / pool', desc: 'Often $10–18/mo — compare with your local council', url: null, badge: 'Tip' },
  ]},
];

const BADGE_COLORS = {
  'Gov tool': { bg: '#dfe8d8', text: '#2e5a3a' },
  'Switch':   { bg: '#fae8d7', text: '#7a3010' },
  'Compare':  { bg: '#e8e1d0', text: '#3a3020' },
  'NBN':      { bg: '#d8e0f0', text: '#1a2a6a' },
  'Mobile':   { bg: '#d8e0f0', text: '#1a2a6a' },
  'Downgrade plan': { bg: '#f8f0e0', text: '#6a4010' },
  'Downgrade': { bg: '#f8f0e0', text: '#6a4010' },
  'Share plan': { bg: '#e0d8f0', text: '#3a1a6a' },
  'Bundle':   { bg: '#e0d8f0', text: '#3a1a6a' },
  'Tip':      { bg: '#e0f0e8', text: '#1a4a30' },
  'Car':      { bg: '#fae8d7', text: '#7a3010' },
  'Home':     { bg: '#fae8d7', text: '#7a3010' },
  'Health':   { bg: '#fae8d7', text: '#7a3010' },
  'Sports only': { bg: '#f0e8d8', text: '#5a3a10' },
};
// Rule order matters — the FIRST matching rule wins. So specific patterns
// (e.g. "mortgage") must come before generic ones (e.g. "transfer to").
const CATEGORY_RULES = [
  // Housing & mortgage — highest priority because transfers often describe the purpose
  { match: ['mortgage', 'home loan', 'loan repayment', 'principal and interest', 'p&i payment'], category: 'Mortgage' },
  { match: ['rent ', 'real estate', 'property mgmt', 'property management', 'ray white', 'lj hooker', 'strata', 'body corporate', 'council rates', 'rates '], category: 'Rent/Housing' },

  // Bank fees — catch these before anything else so they can't hide in Transfers
  { match: ['overdraw fee', 'unpaid payment fee', 'excess interest', 'debit excess', 'international transaction fee', 'foreign currency conversion', 'dishonour fee', 'late payment fee', 'account keeping fee', 'atm fee', 'account service fee'], category: 'Bank Fees' },

  // Credit card payments & internal money movement
  { match: ['cr card autopay', 'credit card payment', 'cba cr card', 'card payment', 'credit card autopay'], category: 'Credit Card Payment' },
  { match: ['transfer to xx', 'transfer from xx'], category: 'Internal Transfers' },

  // Gambling — a real category; don't hide in Other
  { match: ['sportsbet', 'tabcorp', 'bet365', 'ladbrokes', 'neds ', 'unibet', 'pointsbet', 'tab.com', 'lotterywest', 'tatts ', 'the lott', 'crown casino', 'star casino'], category: 'Gambling' },

  // Buy Now Pay Later — deferred spending
  { match: ['afterpay', 'zip pay', 'zip.co', 'humm ', 'pypl payin4', 'paypal payin', 'klarna', 'latitudepay', 'openpay'], category: 'Buy Now Pay Later' },

  // Groceries — extended
  { match: ['woolworths', 'coles ', 'coles-', 'coles4', 'coles8', 'aldi', 'iga ', 'iga-', 'harris farm', 'foodworks', 'costco', 'ritchies', 'drake'], category: 'Groceries' },

  // Coffee
  { match: ['starbucks', 'gloria jean', 'coffee club', 'zarraffa', 'muffin break', 'dome cafe', 'merlo coffee', ' coffee', 'cafe ', 'sq *gather'], category: 'Coffee' },

  // Food delivery
  { match: ['uber eats', 'ubereats', 'uber *eats', 'menulog', 'deliveroo', 'doordash', 'mr yum', 'hungry panda', 'easi ', 'dominos estore', 'dominos.com'], category: 'Food Delivery' },

  // Dining out — fast food + restaurants
  { match: ['mcdonald', 'kfc', 'hungry jack', 'hjs ', 'wendys', 'grill\'d', 'guzman', 'nando', 'gyg ', 'subway', 'domino', 'pizza hut', 'red rooster', 'oporto', 'boost juice', 'restaurant', 'bistro', 'thai ', 'sushi', 'ramen', ' pub ', 'chinese', 'indian', 'collins restaurants', 'bavarian', 'jaylianos', 'hotel app', 'kai upper kedron', 'twcm ', 'sparkletown', 'winghas', 'eatfirst', 'bloom canteen', 'sushi hub', 'sandwichchefs', 'sushi honke', 'phatboy'], category: 'Dining Out' },

  // Snacks & vending
  { match: ['innovative retail', 'cocacolaepp', 'coca-cola epp', 'turbo vending'], category: 'Snacks & Vending' },

  // Rideshare / taxi
  { match: ['uber trip', 'uber   ', 'uber *trip', 'didi ', 'ola ', 'gocatch', 'taxi', 'cabcharge', '13cabs', 'lime*ride', 'lime ride'], category: 'Rideshare' },

  // Fuel — extended
  { match: ['bp ', 'bp-', 'bp ferny', 'shell ', 'caltex', 'ampol', '7-eleven', '7 eleven', '7eleven', 'united petrol', 'metro petroleum', 'mobil', 'viva energy', 'reddy express', 'eg group'], category: 'Fuel' },

  // Transit
  { match: ['opal ', 'translink', 'myki', 'metro trains', 'transperth', 'adelaide metro', 'transport nsw', 'transportfornsw', 'go card'], category: 'Transit' },

  // Parking & tolls
  { match: ['parking', 'car park', 'cellopark', 'wilson parking', 'secure parking', 'bcc wtc', 'bac parking', 'linkt', 'e-toll', 'transurban', 'brisbane airport'], category: 'Parking & Tolls' },

  // Shopping — extended (includes Bunnings since hardware/home goods)
  { match: ['amazon', 'amzn', 'kmart', 'big w', 'bigw', 'target', 'myer', 'david jones', 'harvey norman', 'jb hi-fi', 'jbhifi', 'officeworks', 'bunnings', 'ikea', 'ebay', 'etsy', 'temu', 'shein', 'asos', 'the iconic', 'rebel sport', 'eb games', 'mr toys', 'smiggle'], category: 'Shopping' },

  // Subscriptions — streaming + software + cloud
  { match: [
    'netflix', 'stan ', 'stan.com', 'binge', 'hubbl', 'kayo', 'disney+', 'disney plus', 'foxtel', 'amazon prime', 'amznprimea', 'prime video', 'prime vide',
    'spotify', 'apple music', 'youtube premium', 'paramount', 'apple.com/bill',
    'dropbox', 'google one', 'icloud', 'openai', 'chatgpt', 'distrokid', 'patreon', 'namecheap', 'name-cheap',
    'blizzard', 'steam purchase', 'steamgames', 'playstation', 'playstationnetwork', 'nintendo', 'xbox live',
    '1 month member', '1 month membership', 'cambridge gb', 'member subscri', 'membership subscri',
    'uber one', 'uber *one',
  ], category: 'Subscriptions' },

  // Phone & Internet — extended
  { match: ['telstra', 'optus', 'vodafone', 'tpg', 'aussie broadband', 'belong', 'boost mobile', 'amaysim', 'felix mobile', 'kogan mobile', 'superloop'], category: 'Phone & Internet' },

  // Utilities — extended
  { match: ['agl', 'origin energy', 'energy australia', 'red energy', 'alinta', 'ergon', 'synergy', 'sydney water', 'yarra valley water', 'water corp', 'unitywater', 'seqwater', 'urban utilities', 'electricity'], category: 'Utilities' },

  // Insurance (separate from health insurance)
  { match: ['nrma', 'aami', 'racv', 'racq', 'suncorp insurance', 'allianz', 'budget direct', 'youi', 'qbe '], category: 'Insurance' },

  // Pharmacy (self-care / OTC)
  { match: ['chemist warehouse', 'priceline', 'terry white', 'terrywhite', 'amcal', 'pharmacy', 'blooms chemist', 'chempro', 'discount drug'], category: 'Pharmacy' },

  // Healthcare — doctors, hospitals, health insurance
  { match: ['medicare', 'bupa', 'medibank', 'hcf ', 'nib ', 'ahm ', 'dr ', ' gp ', 'dental', 'pathology', 'sullivan nicolaides', 'qml ', 'mater private', 'mater hospital', 'physio', 'optometrist', 'specsavers', 'radiology', 'imaging', 'mcare'], category: 'Healthcare' },

  // Personal care
  { match: ['barber', 'hair salon', 'nail ', 'beauty ', 'spa ', 'massage', 'smp*ht', 'my life spa'], category: 'Personal Care' },

  // Fitness
  { match: ['f45', 'anytime fitness', 'fitness first', 'goodlife', 'plus fitness', 'virgin active', 'snap fitness', 'gym', 'yoga', 'pilates', 'crossfit', 'pcyc', 'pure tennis'], category: 'Fitness' },

  // Travel
  { match: ['qantas', 'virgin aus', 'jetstar', 'rex airline', 'airbnb', 'booking.com', 'hotel ', ' hotel', 'motel', 'trivago', 'webjet', 'flight centre', 'wi-fi onboard'], category: 'Travel' },

  // Alcohol
  { match: ['dan murphy', 'bws', 'first choice liquor', 'liquorland', 'vintage cellars', 'liquor'], category: 'Alcohol' },

  // Generic transfers — AFTER mortgage/internal so those win
  { match: ['transfer to', 'fast transfer to', 'osko payment', 'payid', 'beem it', 'bpay'], category: 'Transfers' },

  // Income
  { match: ['salary', 'payroll', 'wages', 'direct credit', 'pay/salary', 'pay salary', 'net pay', 'paye ', 'fast transfer from'], category: 'Income' },
];

// Alternative switches tuned to the Australian market
const ALTERNATIVES = {
  // Mortgage — the biggest potential savings lever for most households
  'mortgage': { alt: 'Refinance or renegotiate your rate', savings: 15, reason: 'most Australians are paying 0.5–1% above the best available rate; a $500k loan at 6.2% vs 5.5% saves ~$230/mo' },
  'home loan': { alt: 'Refinance or renegotiate your rate', savings: 15, reason: 'call your lender and say you\'re thinking of leaving — the retention team usually beats their public rate' },

  // Groceries
  'woolworths': { alt: 'Aldi or IGA specials', savings: 20, reason: 'Aldi baskets run ~15–25% lower for comparable staples (Choice 2024)' },
  'coles': { alt: 'Aldi or IGA specials', savings: 20, reason: 'Aldi baskets run ~15–25% lower for comparable staples (Choice 2024)' },

  // Coffee
  'starbucks': { alt: 'Local indie café or home brew', savings: 60, reason: 'a $6 latte daily = $2,190/yr; beans at home cost a fraction' },
  'gloria jean': { alt: 'Home brew', savings: 60, reason: 'chain coffee adds up fast; a moka pot pays for itself in a week' },
  'sq *gather': { alt: 'Home brew for weekdays', savings: 50, reason: 'a daily $6.80 coffee = $2,480/yr' },
  'merlo': { alt: 'Home brew for weekdays', savings: 50, reason: 'buying beans and making it at home saves thousands per year' },

  // Food delivery
  'uber eats': { alt: 'Pickup or cook at home', savings: 35, reason: 'delivery fees + service fees + tips add ~30–40%' },
  'ubereats': { alt: 'Pickup or cook at home', savings: 35, reason: 'delivery fees + service fees + tips add ~30–40%' },
  'menulog': { alt: 'Pickup or cook at home', savings: 30, reason: 'service fees + delivery fees add ~25–35%' },
  'deliveroo': { alt: 'Pickup or cook at home', savings: 35, reason: 'service fees + delivery fees add ~30–40%' },
  'doordash': { alt: 'Pickup or cook at home', savings: 35, reason: 'service fees + delivery fees add ~30–40%' },
  'dominos estore': { alt: 'Pickup from store', savings: 20, reason: 'delivery fee + often-worse deals vs walking in' },

  // Rideshare
  'uber trip': { alt: 'DiDi or public transport', savings: 20, reason: 'DiDi is often 10–25% cheaper than Uber on the same route' },

  // Phone & internet
  'telstra': { alt: 'Belong (owned by Telstra)', savings: 40, reason: 'Belong uses the Telstra network at roughly half the price' },
  'optus': { alt: 'Amaysim or Catch Connect', savings: 45, reason: 'MVNOs on the Optus network offer the same coverage for less' },
  'vodafone': { alt: 'Felix or Kogan Mobile', savings: 40, reason: 'Vodafone-network MVNOs typically $20–30/mo for unlimited' },
  'superloop': { alt: 'Compare on WhistleOut', savings: 15, reason: 'NBN prices move a lot; Aussie Broadband, Leaptel, Launtel often beat major RSPs' },

  // Streaming / subscriptions
  'netflix': { alt: 'Rotate one streamer at a time', savings: 50, reason: 'most people only actively watch one streamer per month' },
  'stan': { alt: 'Rotate one streamer at a time', savings: 50, reason: 'most people only actively watch one streamer per month' },
  'binge': { alt: 'Rotate one streamer at a time', savings: 50, reason: 'most people only actively watch one streamer per month' },
  'foxtel': { alt: 'Kayo + Binge bundle', savings: 55, reason: 'gets you the sport + drama for a fraction of full Foxtel' },
  'prime video': { alt: 'Bundle with Prime shopping or cancel', savings: 100, reason: 'if you\'re paying separately for Prime shopping, this is double-charging' },
  'spotify': { alt: 'Spotify Family plan (split with household)', savings: 50, reason: 'Family plan is $24/mo for 6 users vs $13/mo per Individual' },
  'openai': { alt: 'Review usage — free tier may cover it', savings: 100, reason: 'many users don\'t hit paid-tier usage; free tier now includes GPT-4o' },
  'chatgpt': { alt: 'Review usage — free tier may cover it', savings: 100, reason: 'many users don\'t hit paid-tier usage; free tier now includes GPT-4o' },
  'dropbox': { alt: 'Google One or iCloud+ if you already pay', savings: 80, reason: 'if you already have Google One or iCloud+, Dropbox is redundant' },

  // Gym
  'f45': { alt: 'Anytime Fitness or Plus Fitness', savings: 55, reason: 'F45 runs ~$65/wk; budget gyms are ~$15/wk' },
  'fitness first': { alt: 'Plus Fitness or Anytime Fitness', savings: 40, reason: '24/7 budget gyms have similar equipment at half the price' },

  // Shopping
  'amazon': { alt: 'Wait 48h + price-compare on Catch/eBay', savings: 20, reason: 'cuts impulse buys; Catch and eBay often beat Amazon AU' },

  // Alcohol
  'dan murphy': { alt: 'BWS member prices or Aldi wine', savings: 20, reason: 'Aldi medal-winning wines are consistently cheaper than branded equivalents' },
  'bws': { alt: 'Aldi or Dan\'s member deals', savings: 15, reason: 'Aldi wines are often 20–30% cheaper than branded equivalents' },

  // Gambling — treated as a savings opportunity because 100% elimination is the target
  'sportsbet': { alt: 'Stop or self-exclude', savings: 100, reason: 'betting is a negative-EV category; the average sports bettor loses ~10% of every dollar wagered' },

  // BNPL — same deal
  'afterpay': { alt: 'Save up and buy outright', savings: 100, reason: 'BNPL trains you to treat future income as present income; cancelling typically cuts discretionary spend by 15–25%' },
  'pypl payin4': { alt: 'Save up and buy outright', savings: 100, reason: 'PayPal Payin4 is BNPL under another name; same spending-acceleration effect' },
};

// Australian household monthly spending benchmarks (AUD).
// Derived from ABS Monthly Household Spending Indicator + Finder 2024/25 data.
// Average AU household spend is ~$2,856/week → ~$12,400/month; rent ~$634/week → ~$2,750/month.
// Mortgage benchmark: ABS Dec 2024 avg owner-occupier repayment ~$2,400/mo; higher in capitals.
// Figures below are rough per-household monthly medians, rounded for readability.
const BENCHMARKS = {
  'Mortgage': 2400,
  'Rent/Housing': 2750,
  'Groceries': 900,
  'Dining Out': 380,
  'Food Delivery': 110,
  'Coffee': 90,
  'Alcohol': 180,
  'Utilities': 280,
  'Phone & Internet': 150,
  'Insurance': 220,
  'Fuel': 250,
  'Transit': 95,
  'Rideshare': 70,
  'Parking & Tolls': 60,
  'Shopping': 380,
  'Subscriptions': 75,
  'Snacks & Vending': 30,
  'Pharmacy': 60,
  'Healthcare': 210,
  'Personal Care': 90,
  'Fitness': 85,
  'Travel': 420,
  'Gambling': 0,        // not a benchmark — target is zero
  'Buy Now Pay Later': 0, // same
  'Bank Fees': 0,       // same — avoidable
};

function categorize(description) {
  const d = description.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.match.some(m => d.includes(m))) return rule.category;
  }
  return 'Other';
}

// All built-in categories, in a sensible order for picker UIs
const BUILT_IN_CATEGORIES = [
  'Mortgage', 'Rent/Housing', 'Utilities', 'Phone & Internet', 'Insurance',
  'Groceries', 'Dining Out', 'Food Delivery', 'Coffee', 'Snacks & Vending', 'Alcohol',
  'Fuel', 'Transit', 'Rideshare', 'Parking & Tolls', 'Travel',
  'Shopping', 'Subscriptions', 'Personal Care', 'Fitness',
  'Pharmacy', 'Healthcare',
  'Gambling', 'Buy Now Pay Later',
  'Bank Fees', 'Credit Card Payment', 'Internal Transfers', 'Transfers', 'Income',
];

function findAlternative(description) {
  const d = description.toLowerCase();
  for (const key of Object.keys(ALTERNATIVES)) {
    if (d.includes(key)) return { merchant: key, ...ALTERNATIVES[key] };
  }
  return null;
}

const CATEGORY_TARGET_REDUCTIONS = {
  'Groceries': 0.15, 'Coffee': 0.50, 'Food Delivery': 0.50, 'Dining Out': 0.30,
  'Rideshare': 0.25, 'Fuel': 0.10, 'Subscriptions': 0.40, 'Entertainment': 0.20,
  'Shopping': 0.20, 'Alcohol': 0.25, 'Clothing': 0.20, 'Fitness': 0.10,
  'Health & Fitness': 0.10, 'Buy Now Pay Later': 0.75, 'Gambling': 1.00,
  'Snacks & Vending': 0.35, 'Bank Fees': 0.50, 'Other': 0.15,
  'Personal Care': 0.15, 'Travel': 0.15, 'Parking & Tolls': 0.10,
};

const HOW_TO_GET_THERE = {
  'Groceries': [
    'Switch to Aldi for dry goods and staples — typically 15–25% cheaper than major chains',
    'Plan meals for the week before you shop to cut impulse buys',
    'Buy home-brand staples: flour, rice, pasta, oil, canned goods',
  ],
  'Coffee': [
    'Brew at home on weekdays — a $6 café latte costs ~$0.50 at home',
    'Limit café visits to weekends only, or one per week as a treat',
    'A basic espresso machine pays for itself within a month',
  ],
  'Food Delivery': [
    'Switch to pickup — delivery and service fees add 30–40% to every order',
    'Cook in bulk on Sundays and freeze portions for busy nights',
    'Keep a list of quick 15-minute meals for when you can\'t be bothered cooking',
  ],
  'Dining Out': [
    'Set a once-a-week dining budget and stick to it',
    'Cook 4–5 nights at home and reserve dining for social occasions',
    'Use lunch specials and set menus — same restaurants, meaningfully lower prices',
  ],
  'Rideshare': [
    'Use DiDi — consistently 15–25% cheaper than Uber on the same route',
    'Combine rideshare with public transport for longer journeys',
    'Check if a monthly transit pass would be cheaper than your weekly rideshare spend',
  ],
  'Fuel': [
    'Use the 7-Eleven app\'s Fuel Lock — lock in a cheap price and redeem it at any 7-Eleven for up to 7 days',
    'Swipe your Woolworths Everyday Rewards or Coles flybuys card every shop — both give 4c/L off at partner stations. In QLD, the free Night Owl Owl Club app also gives 4c/L off at Night Owl servos',
    'Use MotorMouth or FuelCheck (NSW) to find the cheapest servo nearby, and fill up on Tuesdays or Wednesdays when prices typically bottom out',
  ],
  'Subscriptions': [
    'Rotate streaming services — binge one, cancel, switch to another next month',
    'Use Spotify Family plan split across your household ($24/mo for up to 6 people)',
    'Audit everything you\'re paying for and cancel anything unused in the last 30 days',
  ],
  'Entertainment': [
    'Libraries offer free movies, books, and digital magazines through apps like Libby',
    'Check community listings for free concerts, markets, and local festivals',
    'Set a monthly entertainment cash allowance — spending physical money makes limits visible',
  ],
  'Shopping': [
    'Apply a 48-hour rule before any non-essential purchase',
    'Price-compare on Catch.com.au and eBay before buying — often 20–30% cheaper',
    'Unsubscribe from retailer email lists to cut down temptation',
  ],
  'Alcohol': [
    'Buy from bottle shops instead of venues — you\'re paying for location at a bar',
    'Aldi award-winning wines are consistently cheaper than branded equivalents',
    'Track your weekly drinks and set a hard unit and dollar budget',
  ],
  'Buy Now Pay Later': [
    'Cancel BNPL accounts — they make future money feel like present money and inflate discretionary spend',
    'Save up for purchases instead: you\'ll buy fewer things and appreciate them more',
    'BNPL users spend 15–25% more on discretionary items per month on average',
  ],
  'Gambling': [
    'Self-exclude via BetStop (betStop.com.au) to block all licensed Australian bookmakers at once',
    'The house edge means every dollar wagered returns ~$0.90 on average over time',
    'Free support: 1800 858 858 (Gambling Help Online) or gamblersanonymous.org.au',
  ],
  'Bank Fees': [
    'Switch to a fee-free account — ING Orange Everyday, UP Bank, and HSBC Everyday Global charge nothing',
    'Most banks waive fees if you meet a monthly deposit threshold — check yours',
    'Set up automatic transfers to avoid overdraft and dishonour fees',
  ],
  'Snacks & Vending': [
    'Keep snacks in your bag or desk drawer to avoid vending machine impulses',
    'Meal-prep snack packs on Sundays: boiled eggs, fruit, and portioned nuts',
    'Calculate your weekly vending spend — it adds up faster than most people expect',
  ],
  'Fitness': [
    'Budget gyms (Plus Fitness, Anytime Fitness) offer 24/7 access for ~$15/wk vs $65+/wk at boutique studios',
    'YouTube has free full-length yoga, HIIT, and strength programs',
    'Negotiate your current membership — most gyms will match a competitor\'s price',
  ],
  'Health & Fitness': [
    'Budget gyms offer 24/7 access for ~$15/wk vs $65+/wk at boutique studios',
    'YouTube has free full-length yoga, HIIT, and strength training programs',
    'Negotiate your current membership — most gyms will match a competitor\'s price',
  ],
  'Mortgage': [
    'Call your lender and mention you\'re comparing rates — the retention team can usually beat their published rate',
    'Even a 0.5% rate reduction on a $500k loan saves ~$150/mo — use the calculator in the previous section',
    'Refinancing costs ~$500–$1,000 in fees but a better rate typically recovers that within 2 months',
  ],
  'Insurance': [
    'Get comparison quotes on iSelect or Compare the Market at each renewal',
    'Bundling home, contents, and car with one insurer often yields a 10–15% multi-policy discount',
    'Increasing your excess lowers your premium — worthwhile if you have an emergency fund',
  ],
  'Phone & Internet': [
    'Belong (Telstra network) and Amaysim (Optus network) offer the same coverage at roughly half the price',
    'Compare NBN plans on WhistleOut — Aussie Broadband and Leaptel often undercut major providers',
    'Check whether you\'re paying for more data than you use and downgrade your plan',
  ],
  'Utilities': [
    'Compare energy providers on Energy Made Easy (the government comparison tool)',
    'Switch to a controlled load tariff for hot water if your supplier offers one',
    'LED globes and smart power strips cut standby consumption with no lifestyle change',
  ],
  'Transit': [
    'A weekly or monthly pass is almost always cheaper than paying per trip',
    'Check if your employer offers a commuter pre-tax transit benefit',
    'Combine cycling for short legs of your commute with transit for longer ones',
  ],
  'Parking & Tolls': [
    'Use Google Maps to route around tolls when time allows',
    'Book parking in advance via apps like Wilson or Secure Parking — walk-up rates are 30–50% higher',
    'Consider park-and-ride options if you commute into the CBD regularly',
  ],
  'Personal Care': [
    'Compare prices on Chemist Warehouse vs supermarkets — identical products, different margins',
    'Switch to home-brand toiletries for staples like shampoo, conditioner, and body wash',
    'Space out salon visits by 2–4 weeks and learn basic maintenance at home',
  ],
  'Travel': [
    'Book flights 6–8 weeks out on Tuesdays for the best fares',
    'Use Google Flights fare tracker to get alerts when prices drop on routes you want',
    'Consider off-peak travel dates — shoulder season is often 30–40% cheaper than peak school holidays',
  ],
};

// ---------- Anomaly detection ----------
// Extracts a "merchant key" — the identifying chunk of a description,
// stripping store numbers, suburbs, transaction IDs, etc.
function merchantKey(description) {
  const d = description.toLowerCase()
    .replace(/\b\d{3,}\b/g, '') // store numbers, txn IDs
    .replace(/\b(au|aus|australia|pty|ltd|nsw|vic|qld|wa|sa|tas|nt|act)\b/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Skip common generic banking prefixes so the ACTUAL payer/payee becomes the key.
  // Without this, every "Direct Credit X", "Fast Transfer From Y", "Direct Debit Z"
  // collapses to the same key regardless of who's on the other side.
  const STRIP_PREFIXES = [
    'direct credit', 'direct debit', 'fast transfer from', 'fast transfer to',
    'transfer to', 'transfer from', 'osko payment to', 'osko payment from',
    'payid to', 'payid from', 'return', 'dir dep', 'ach credit', 'ach debit',
    'bpay', 'payment to', 'payment from',
  ];
  let cleaned = d;
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of STRIP_PREFIXES) {
      if (cleaned.startsWith(p + ' ')) {
        cleaned = cleaned.slice(p.length + 1).trim();
        changed = true;
        break;
      }
    }
  }
  // Take the first 2–3 meaningful words of what's left
  const parts = cleaned.split(' ').filter(p => p.length > 2);
  return parts.slice(0, 3).join(' ') || cleaned || d;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[m - 1] + sorted[m]) / 2 : sorted[m];
}

// ---------- Recurring-transaction detection ----------
// Works for both income (credits) and expenses (debits). Given a list of
// transactions, groups by merchantKey and returns groups that look recurring:
// repeat at a weekly / fortnightly / monthly cadence with consistent amounts.
// Each returned stream includes a CONSERVATIVE budget amount (mode of rounded
// amounts, or minimum if no clear mode) so budgets err on the safe side —
// for income that means under-estimating, for expenses that means keeping
// the amount tight instead of inflating it with one-off spikes.
function detectRecurring(txns) {
  const byMerchant = {};
  for (const t of txns) {
    const key = t._merchantKey || merchantKey(t.description);
    if (!byMerchant[key]) byMerchant[key] = [];
    byMerchant[key].push(t);
  }

  const streams = [];
  for (const [key, items] of Object.entries(byMerchant)) {
    if (items.length < 2) continue;
    const sorted = items.slice().sort((a, b) => a.date.localeCompare(b.date));

    // Gap analysis
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      const d1 = new Date(sorted[i - 1].date);
      const d2 = new Date(sorted[i].date);
      gaps.push((d2 - d1) / (1000 * 60 * 60 * 24));
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

    let cadence = null;
    if (avgGap >= 5 && avgGap <= 9) cadence = 'weekly';
    else if (avgGap >= 12 && avgGap <= 17) cadence = 'fortnightly';
    else if (avgGap >= 25 && avgGap <= 35) cadence = 'monthly';
    else if (avgGap >= 20 && avgGap <= 40) cadence = 'monthly'; // looser fallback
    if (!cadence) continue;

    // Amount consistency — use absolute values so this works for debits too
    const amounts = sorted.map(x => Math.abs(x.amount));
    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
    const stddev = Math.sqrt(variance);
    const cv = mean > 0 ? stddev / mean : 1;
    if (cv > 0.4) continue;

    // Conservative budget amount: mode (of rounded dollars), else minimum
    const rounded = amounts.map(a => Math.round(a));
    const freq = {};
    for (const r of rounded) freq[r] = (freq[r] || 0) + 1;
    let modeVal = null;
    let modeCount = 0;
    for (const [val, count] of Object.entries(freq)) {
      if (count > modeCount) {
        modeCount = count;
        modeVal = Number(val);
      }
    }
    const budgetAmount = modeCount >= 2 ? modeVal : Math.min(...amounts);

    let monthlyEquivalent;
    if (cadence === 'weekly') monthlyEquivalent = budgetAmount * (52 / 12);
    else if (cadence === 'fortnightly') monthlyEquivalent = budgetAmount * (26 / 12);
    else monthlyEquivalent = budgetAmount;

    streams.push({
      key,
      sample: sorted[0].description,
      count: sorted.length,
      cadence,
      avgAmount: mean,
      budgetAmount,
      estimateMethod: modeCount >= 2 ? `mode (×${modeCount})` : 'minimum',
      monthlyEquivalent,
      items: sorted,
    });
  }
  streams.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
  return streams;
}

function detectAnomalies(spending) {
  const anomalies = [];
  const byMerchant = new Map();

  // Categories that are intentionally recurring and should NEVER surface as
  // unusual spends — the whole point is they repeat at a consistent amount.
  const RECURRING_CATEGORIES = new Set([
    'Mortgage', 'Rent/Housing', 'Insurance', 'Utilities',
    'Phone & Internet', 'Subscriptions', 'Healthcare',
    'Credit Card Payment', 'Internal Transfers', 'Transfers',
  ]);

  for (const t of spending) {
    // Skip anything already in a known-recurring category
    if (t.category && RECURRING_CATEGORIES.has(t.category)) continue;
    // Use the merchant key already set upstream (handles the virtual mortgage
    // key and any other normalisation the main pipeline did). Fall back to
    // computing one if needed.
    const key = t._merchantKey || merchantKey(t.description);
    if (!key) continue;
    if (!byMerchant.has(key)) byMerchant.set(key, []);
    byMerchant.get(key).push({ ...t, absAmount: Math.abs(t.amount) });
  }

  // Pattern 1: Unusually large visits to a merchant the user shops at regularly
  for (const [key, visits] of byMerchant.entries()) {
    if (visits.length < 3) continue;
    const amounts = visits.map(v => v.absAmount);
    const med = median(amounts);
    if (med < 10) continue; // ignore tiny-spend merchants (e.g. parking)

    for (const v of visits) {
      // Flag if the visit is 2× the median AND at least $30 more than median
      if (v.absAmount >= med * 2 && v.absAmount >= med + 30) {
        anomalies.push({
          type: 'large_visit',
          merchant: key,
          date: v.date,
          description: v.description,
          amount: v.absAmount,
          typical: med,
          multiple: v.absAmount / med,
          visits: visits.length,
        });
      }
    }
  }

  // Pattern 2: Single large one-off purchases
  for (const [key, visits] of byMerchant.entries()) {
    if (visits.length > 1) continue; // only one-offs
    const v = visits[0];
    if (v.absAmount < 200) continue;
    anomalies.push({
      type: 'large_oneoff',
      merchant: key,
      date: v.date,
      description: v.description,
      amount: v.absAmount,
    });
  }

  // Sort by amount, largest first; cap at 8 so we don't overwhelm
  anomalies.sort((a, b) => b.amount - a.amount);
  return anomalies.slice(0, 8);
}

// ---------- CSV parsing ----------
// Handles the common CSV formats Australian banks export:
//   - CBA NetBank: Date,Amount,Description,Balance (2-year history, up to 600 txns)
//   - CBA classic export: Date,Description,Debit,Credit,Balance
//   - Westpac/NAB/ANZ variations with similar columns
//   - Up Bank, Bendigo, Macquarie, Bankwest, ING
// The parser is column-name aware and tolerant of unknown column orders.

const MONTHS = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };

function parseDate(str) {
  const s = (str || '').trim().replace(/"/g, '');
  if (!s) return null;

  // DD/MM/YYYY or DD/MM/YY (Australian)
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const yr = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  // YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  // DD-MM-YYYY
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) {
    const yr = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${yr}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  // "15 Mar 2026" or "15 Mar"
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})(?:,?\s+(\d{2,4}))?$/);
  if (m && MONTHS[m[2].toLowerCase()]) {
    const yr = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : new Date().getFullYear();
    return `${yr}-${String(MONTHS[m[2].toLowerCase()]).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  return null;
}

// Parse a single CSV line handling quoted fields with embedded commas/quotes
function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { out.push(cur); cur = ''; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function parseAmount(str) {
  if (str == null) return null;
  const s = String(str).trim().replace(/"/g, '');
  if (!s) return null;
  // Strip $ and commas, handle parentheses for negatives, and trailing minus
  const negative = /^\(.*\)$/.test(s) || /-$/.test(s) || /^-/.test(s);
  const cleaned = s.replace(/[$,()\s]/g, '').replace(/-/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return negative ? -num : num;
}

// Identify which columns in the header correspond to what
function identifyColumns(header) {
  const lower = header.map(h => (h || '').toLowerCase().trim());
  const find = (patterns) => {
    for (let i = 0; i < lower.length; i++) {
      for (const p of patterns) {
        if (lower[i] === p || lower[i].includes(p)) return i;
      }
    }
    return -1;
  };

  return {
    date: find(['date', 'transaction date', 'posted date', 'processed date']),
    description: find(['description', 'narrative', 'details', 'transaction details', 'memo', 'payee', 'merchant', 'name']),
    amount: find(['amount', 'transaction amount', 'txn amount', 'value']),
    debit: find(['debit', 'withdrawal', 'withdrawals', 'paid out', 'money out', 'out']),
    credit: find(['credit', 'deposit', 'deposits', 'paid in', 'money in', 'in']),
    balance: find(['balance', 'running balance', 'closing balance']),
  };
}

// Detect whether a CSV has a header row
function hasHeader(firstRow) {
  // If any cell in the first row looks like a date or a currency amount, treat it as data
  for (const cell of firstRow) {
    if (parseDate(cell)) return false;
    const amt = parseAmount(cell);
    if (amt !== null && /[0-9]/.test(cell)) {
      // Only consider amount-like cells that aren't tiny ambiguous numbers
      if (Math.abs(amt) > 0.5 && /\./.test(cell)) return false;
    }
  }
  // Otherwise first row is probably headers
  return true;
}

function parseCSV(text) {
  // Handle BOM and CRLF
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return { transactions: [], allRows: [], error: 'File is empty.' };
  }

  const rows = lines.map(parseCSVLine);

  // Guess header vs no header
  let columnMap;
  let startIdx = 0;
  if (hasHeader(rows[0])) {
    columnMap = identifyColumns(rows[0]);
    startIdx = 1;
  } else {
    // CBA's classic no-header format is: Date, Amount, Description, Balance
    columnMap = { date: 0, amount: 1, description: 2, balance: 3, debit: -1, credit: -1 };
    // But check the column count — if only 3, it's Date, Amount, Description
    if (rows[0].length === 3) {
      columnMap.balance = -1;
    }
  }

  if (columnMap.date === -1) {
    return {
      transactions: [], allRows: [],
      error: 'Could not find a date column. Headers seen: ' + rows[0].join(', '),
    };
  }
  if (columnMap.description === -1) {
    return {
      transactions: [], allRows: [],
      error: 'Could not find a description column. Headers seen: ' + rows[0].join(', '),
    };
  }
  if (columnMap.amount === -1 && columnMap.debit === -1 && columnMap.credit === -1) {
    return {
      transactions: [], allRows: [],
      error: 'Could not find an amount/debit/credit column. Headers seen: ' + rows[0].join(', '),
    };
  }

  const allRows = [];
  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const rawDate = columnMap.date >= 0 ? row[columnMap.date] : '';
    const iso = parseDate(rawDate);
    const description = columnMap.description >= 0 ? (row[columnMap.description] || '') : '';

    let amount = null;
    let signSource = '';
    if (columnMap.debit !== -1 || columnMap.credit !== -1) {
      const debit = columnMap.debit >= 0 ? parseAmount(row[columnMap.debit]) : null;
      const credit = columnMap.credit >= 0 ? parseAmount(row[columnMap.credit]) : null;
      if (credit && credit !== 0) {
        amount = Math.abs(credit);
        signSource = 'credit column';
      } else if (debit && debit !== 0) {
        amount = -Math.abs(debit);
        signSource = 'debit column';
      }
    } else if (columnMap.amount >= 0) {
      const amt = parseAmount(row[columnMap.amount]);
      if (amt != null) {
        amount = amt;
        signSource = 'signed amount column';
      }
    }

    const rawLine = row.join(' | ');

    if (!iso) {
      allRows.push({ date: rawDate, description, amount: 0, rejected: true, _rawLine: rawLine, _signReason: 'unrecognised date format' });
      continue;
    }
    if (amount === null || amount === 0) {
      allRows.push({ date: iso, description, amount: 0, rejected: true, _rawLine: rawLine, _signReason: 'no valid amount' });
      continue;
    }
    if (!description || description.length < 1) {
      allRows.push({ date: iso, description: '(empty)', amount: 0, rejected: true, _rawLine: rawLine, _signReason: 'no description' });
      continue;
    }

    allRows.push({
      date: iso,
      description: description.trim(),
      amount,
      rejected: false,
      _rawLine: rawLine,
      _signReason: signSource,
    });
  }

  const transactions = allRows.filter(r => !r.rejected).map(r => ({
    date: r.date,
    description: r.description,
    amount: r.amount,
  }));

  return {
    transactions,
    allRows,
    columnMap,
    error: null,
  };
}

function normalizeSigns(transactions, allLines) {
  const joined = allLines.join(' ').toLowerCase();
  const isCard = /credit card|minimum payment|new balance|payment due date/.test(joined)
              && !/savings account|everyday account|transaction account|available balance/.test(joined);

  if (!isCard) return transactions;

  return transactions.map(t => {
    const desc = t.description.toLowerCase();
    if (/payment\s*-?\s*thank you|autopay|online payment|mobile payment|bpay payment/.test(desc)) {
      return { ...t, amount: Math.abs(t.amount) };
    }
    return { ...t, amount: -Math.abs(t.amount) };
  });
}
export default function App() {
  const [view, setView] = useState('upload'); // 'upload' | 'results' | 'budget'
  const [transactions, setTransactions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [fileNames, setFileNames] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawLines, setRawLines] = useState([]);
  const [showRaw, setShowRaw] = useState(false);
  const [columnMap, setColumnMap] = useState(null);
  const [mortgageCalc, setMortgageCalc] = useState({ principal: '', years: '', rate: '', type: 'variable', compRate: '' });
  const [budgetAllocs, setBudgetAllocs] = useState({});
  const [budgetIncome, setBudgetIncome] = useState('');
  const [budgetCats, setBudgetCats] = useState([]);
  const [allRows, setAllRows] = useState([]);
  // User-assigned category overrides, keyed by merchantKey(description).
  // e.g. { 'sportsbet melbourne': 'Entertainment' }
  const [overrides, setOverrides] = useState({});
  // Categories the user has added manually (on top of the built-in list)
  const [customCategories, setCustomCategories] = useState([]);
  // Which uncategorised merchant is currently on top of the stack.
  // Starts at 0; incremented after each assignment/skip.
  const [catStackIdx, setCatStackIdx] = useState(0);
  // Whether the per-category summary table is expanded (hidden by default)
  const [showBreakdown, setShowBreakdown] = useState(false);
  // Whether we've finished loading from persistent storage (prevents saving
  // empty state over real data on initial mount)
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [isPaid, setIsPaid] = useState(() => localStorage.getItem('pinchy:paid') === 'true');
  const [showExportModal, setShowExportModal] = useState(false);
  const fileRef = useRef();

  // Auth & cloud state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedBudgets, setSavedBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [budgetSaveName, setBudgetSaveName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadedCats, setLoadedCats] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Salary insights state
  const [jobTitle, setJobTitle] = useState('');
  const [jobLocation, setJobLocation] = useState('national');
  const [currentSalary, setCurrentSalary] = useState('');
  const [salaryResult, setSalaryResult] = useState(null);

  // Habits wizard state
  const [habitStep, setHabitStep] = useState(0);
  const [habitChoices, setHabitChoices] = useState({});

  // Check for Stripe payment success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      localStorage.setItem('pinchy:paid', 'true');
      setIsPaid(true);
      window.history.replaceState({}, '', window.location.pathname);
      setShowExportModal(true);
    }
  }, []);

  // Supabase auth state
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; } // supabase always set, but guard kept for safety
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowAuthModal(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load saved categorisations from persistent storage on mount
  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== 'undefined' && window.storage) {
          const saved = await window.storage.get('categorisations').catch(() => null);
          if (saved && saved.value) {
            const data = JSON.parse(saved.value);
            if (data.overrides) setOverrides(data.overrides);
            if (data.customCategories) setCustomCategories(data.customCategories);
          }
        }
      } catch (e) {
        console.warn('Could not load saved categorisations:', e);
      }
      setStorageLoaded(true);
    })();
  }, []);

  // Save categorisations whenever they change (but not until initial load completes)
  useEffect(() => {
    if (!storageLoaded) return;
    (async () => {
      try {
        if (typeof window !== 'undefined' && window.storage) {
          await window.storage.set('categorisations', JSON.stringify({
            overrides,
            customCategories,
          }));
        }
      } catch (e) {
        console.warn('Could not save categorisations:', e);
      }
    })();
  }, [overrides, customCategories, storageLoaded]);

  const handleFiles = async (newFiles, existingTransactions = []) => {
    setError('');
    setLoading(true);
    const parsed = [];
    const errors = [];

    for (const file of newFiles) {
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (newFiles.length === 1) setRawLines(lines);

        const result = parseCSV(text);
        if (result.error) { errors.push(`${file.name}: ${result.error}`); continue; }
        if (result.transactions.length === 0) { errors.push(`${file.name}: no transactions found`); continue; }

        if (parsed.length === 0 && existingTransactions.length === 0) {
          setColumnMap(result.columnMap);
          setAllRows(result.allRows);
        }
        parsed.push({ name: file.name, txns: result.transactions });
      } catch (err) {
        errors.push(`${file.name}: ${err.message || err}`);
      }
    }

    if (errors.length) setError(errors.join('\n'));

    const allTxns = [...existingTransactions, ...parsed.flatMap(p => p.txns)];
    // Deduplicate by date + description + amount (catches same-account multi-month uploads)
    const seen = new Set();
    const deduped = allTxns.filter(t => {
      const key = `${t.date}|${t.description}|${t.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    deduped.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (deduped.length > 0) {
      setTransactions(deduped);
      const names = [...fileNames, ...parsed.map(p => p.name)];
      setFileNames(names);
      setFileName(names.length === 1 ? names[0] : `${names.length} files`);
    }
    setLoading(false);
  };

  // Keep old single-file handler for the test data button
  const handleFile = (file) => handleFiles([file]);

  const reset = () => {
    setTransactions([]);
    setFileName('');
    setFileNames([]);
    setError('');
    setRawLines([]);
    setShowRaw(false);
    setBudgetAllocs({});
    setBudgetIncome('');
    setLoadedCats(null);
    setHabitStep(0);
    setHabitChoices({});
    setView('upload');
    if (fileRef.current) fileRef.current.value = '';
  };

  const signIn = async (provider) => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        ...(provider === 'azure' ? { scopes: 'email profile' } : {}),
      },
    });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
    setView('upload');
  };

  const loadBudgets = async () => {
    if (!supabase || !user) return;
    setBudgetsLoading(true);
    const { data } = await supabase
      .from('budgets')
      .select('id, name, created_at, data')
      .order('created_at', { ascending: false });
    setSavedBudgets(data ?? []);
    setBudgetsLoading(false);
  };

  const saveBudget = async () => {
    if (!supabase || !user) return;
    const cats = computeBudgetCats(analysis);
    const name = budgetSaveName.trim() || fileName || `Budget ${new Date().toLocaleDateString('en-AU')}`;
    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      name,
      data: { income: analysis?.reliableMonthlyIncome ?? 0, cats, fileName },
    });
    if (!error) {
      setBudgetSaveName('');
      setShowSaveModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const openSavedBudget = (budget) => {
    setLoadedCats(budget.data.cats);
    setBudgetIncome(String(Math.round(budget.data.income ?? 0)));
    setView('budget');
  };

  const deleteBudget = async (id) => {
    if (!supabase || !user) return;
    await supabase.from('budgets').delete().eq('id', id);
    setSavedBudgets(prev => prev.filter(b => b.id !== id));
  };

  const FIXED_BUDGET_CATS = new Set(['Mortgage', 'Rent/Housing', 'Insurance', 'Utilities', 'Phone & Internet', 'Internal Transfers', 'Credit Card Payment']);

  const DEFICIT_PLAYBOOK = [
    {
      step: 1,
      label: 'Buy time & ease pressure',
      timeframe: 'Do this week',
      summary: 'Stop the bleeding before making bigger changes. These actions cost nothing and can take effect immediately.',
      items: [
        { action: 'Call your bank\'s hardship team', impact: 'Immediate relief', note: 'Banks are legally required to help. Ask for a repayment pause, interest-only period, or fee waiver. 10-minute call.' },
        { action: 'Sell unused items — Facebook Marketplace, eBay, Gumtree', impact: '$500–$2,000 one-off', note: 'Electronics, furniture, clothes, tools, sports gear. Most households have $1k+ sitting idle. Quick listings, cash in days.' },
        { action: 'Cancel every non-essential subscription', impact: '+$50–$300/mo', note: 'Go through your bank statement line by line. Streaming, apps, gym, box deliveries. Cancel first, reconsider later.' },
        { action: 'Switch to interest-only on your mortgage temporarily', impact: '+$400–$900/mo', note: 'Ask your lender — most will allow 12 months interest-only without refinancing. You\'re not saving, but you\'re surviving.' },
      ],
    },
    {
      step: 2,
      label: 'Add a second income stream',
      timeframe: 'Start within 2 weeks',
      summary: 'The fastest way to close a large gap is earning more. These options are available to most people immediately.',
      items: [
        { action: 'Pick up delivery shifts (Uber Eats, DoorDash, Menulog)', impact: '+$800–$1,400/mo', note: 'Sign up takes a few days. Weekends only gives you $600–$900. Full part-time effort reaches $1,400+. Most drivers clear $20–28/hr after costs.' },
        { action: 'Register on Airtasker', impact: '+$500–$1,500/mo', note: 'Removals, furniture assembly, handyman, cleaning, gardening. Flexible, immediate, and often better paid than delivery.' },
        { action: 'Freelance your skills online', impact: '+$400–$2,000/mo', note: 'Upwork, Fiverr, or direct clients. Writing, design, dev, bookkeeping, tutoring, VA work. Start with one client.' },
        { action: 'Take on overtime or a pay review at your current job', impact: 'Varies', note: 'If you haven\'t had a raise in 12+ months, now is the time to ask. A 5% raise on a $90k salary is $375/mo after tax.' },
      ],
    },
    {
      step: 3,
      label: 'Restructure your biggest costs',
      timeframe: 'Within 4 weeks',
      summary: 'Your mortgage, car, and housing costs likely represent 60–70% of your spending. Small changes here have the biggest impact.',
      items: [
        { action: 'Refinance your mortgage', impact: '+$200–$800/mo', note: 'Even 0.5% lower on a $600k loan saves ~$250/mo. A broker costs you nothing — they\'re paid by the bank. Get 3 quotes.' },
        { action: 'Take in a housemate', impact: '+$800–$1,500/mo', note: 'The single fastest ongoing income change. Even 6 months of a housemate can reset the balance sheet.' },
        { action: 'Rent out your car when not in use (Car Next Door)', impact: '+$300–$800/mo', note: 'Insured through the platform. Works especially well if your car sits idle during work hours.' },
        { action: 'Consolidate high-interest debt into your mortgage or a personal loan', impact: '+$100–$500/mo', note: 'Credit card debt at 20%+ is crushing cash flow. Rolling it into lower-rate debt frees up cash immediately.' },
      ],
    },
    {
      step: 4,
      label: 'Sell or downsize assets',
      timeframe: '1–3 months',
      summary: 'If the deficit persists, the asset side of the ledger needs a hard look. These are significant decisions but have major impact.',
      items: [
        { action: 'Sell a second vehicle', impact: '+$500–$1,200/mo', note: 'Rego, insurance, fuel, and servicing on a second car typically costs $600–$1,000/mo all-in. One car is liveable for most households.' },
        { action: 'Downgrade your car', impact: '+$200–$600/mo', note: 'Selling a financed car and buying a cheap runabout outright eliminates the loan repayment entirely.' },
        { action: 'Sell shares, ETFs or managed fund holdings', impact: 'One-off injection', note: 'Buys time but reduces future wealth. CGT may apply — consider timing. Talk to an accountant first.' },
      ],
    },
    {
      step: 5,
      label: 'Make a structural change',
      timeframe: '3–6 months',
      summary: 'If you\'re still in deficit after steps 1–4, the budget requires a structural reset. These decisions are hard but permanent.',
      items: [
        { action: 'Move to a cheaper suburb or downsize your home', impact: '+$500–$2,000/mo', note: 'Extreme but the most powerful lever available. A $200k cheaper home at 6% saves $1,000/mo in repayments alone.' },
        { action: 'Change jobs for a higher salary', impact: 'Varies', note: 'Job switches typically yield 10–20% pay increases vs 2–3% internal raises. If you\'re underpaid, the market will pay you more.' },
        { action: 'Speak to a free financial counsellor', impact: 'Clarity + plan', note: 'National Debt Helpline: 1800 007 007. Free, confidential, non-judgmental. They\'ve seen everything and can negotiate with creditors on your behalf.' },
      ],
    },
  ];

  // Stripe Payment Link — create at dashboard.stripe.com/payment-links
  // In the link settings → After payment → set redirect to:
  //   https://hobeybennett.github.io/Budget-app-/?payment=success
  // Then paste your link ID below (the part after buy.stripe.com/)
  const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_5kQ7sEf5X1KQ85N78v43S01';

  const computeBudgetCats = (a) => {
    if (!a) return [];
    const SKIP = new Set(['Internal Transfers', 'Credit Card Payment']);
    return Object.entries(a.monthlyByCategory)
      .filter(([cat]) => !SKIP.has(cat))
      .map(([cat, data]) => {
        const current = data.monthlyTotal;
        const reduction = CATEGORY_TARGET_REDUCTIONS[cat] ?? 0.10;
        const benchmark = a.categoryBreakdown.find(c => c.category === cat)?.average;
        const suggested = FIXED_BUDGET_CATS.has(cat)
          ? current
          : (benchmark && benchmark < current * (1 - reduction)) ? benchmark : Math.max(0, current * (1 - reduction));
        const saving = current - suggested;
        return { cat, current, suggested: Math.round(suggested), saving: Math.round(saving), tips: HOW_TO_GET_THERE[cat] || null };
      })
      .sort((a, b) => b.saving - a.saving);
  };

  const exportReport = (cats) => {
    const dateStr = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    const incomeStreams = analysis?.reliableStreams ?? [];
    const totalIncome = analysis?.reliableMonthlyIncome ?? 0;
    const totalSuggested = cats.reduce((s, c) => s + c.suggested, 0);
    const surplus = totalIncome - totalSuggested;
    const savingsGoal = totalIncome * 0.2;
    const catsWithTips = cats.filter(c => c.tips?.length);

    const fmt = (n) => '$' + Math.round(n).toLocaleString('en-AU');

    const incomeRows = incomeStreams.map(r =>
      `<tr><td>${r.sample}</td><td class="num">${fmt(r.monthlyEquivalent)}</td></tr>`
    ).join('');

    const expenseRows = cats.map(c =>
      `<tr><td>${c.cat}${FIXED_BUDGET_CATS.has(c.cat) ? ' <span class="badge">Committed</span>' : ''}</td><td class="num">${fmt(c.suggested)}</td></tr>`
    ).join('');

    const tipSections = catsWithTips.map(c =>
      `<div class="tip-block">
        <div class="tip-cat">${c.cat}</div>
        ${c.tips.map(t => `<div class="tip-item"><span class="tip-dot">→</span>${t}</div>`).join('')}
      </div>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pinchy — Budget Plan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f4efe6;color:#1a1f1a;font-family:'JetBrains Mono',monospace;font-size:13px;padding:0}
  .display{font-family:'Fraunces',serif}
  header{background:#1f3a2e;color:#f4efe6;padding:32px 48px;display:flex;justify-content:space-between;align-items:flex-end}
  header .logo{font-family:'Fraunces',serif;font-size:36px;font-weight:700;letter-spacing:-0.02em}
  header .meta{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.7;text-align:right;line-height:1.8}
  .body{padding:48px}
  h2{font-family:'Fraunces',serif;font-size:22px;font-weight:700;margin-bottom:16px;color:#1f3a2e}
  .columns{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:48px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#1f3a2e;color:#f4efe6}
  thead th{padding:10px 14px;text-align:left;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600}
  thead th.num{text-align:right}
  tbody tr{border-bottom:1px solid #e8e1d0}
  tbody tr:last-child{border-bottom:none}
  tbody td{padding:10px 14px;font-size:13px}
  td.num{text-align:right;font-weight:600;font-family:'Fraunces',serif;font-size:15px}
  tfoot tr{background:#f0ebe0;font-weight:700}
  tfoot td{padding:12px 14px;border-top:2px solid #1f3a2e}
  tfoot td.num{font-family:'Fraunces',serif;font-size:17px;font-weight:700;color:#1f3a2e}
  .badge{background:#d6cfc4;color:#6b6758;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:2px 6px;vertical-align:middle;margin-left:6px}
  .surplus-row td{color:#2e5a3a;font-weight:700}
  .surplus-row td.num{color:#2e5a3a}
  .tips-section{margin-top:0}
  .tips-section h2{margin-bottom:24px}
  .tips-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
  .tip-block{background:#fff;border:1px solid #2e5a3a;padding:20px}
  .tip-cat{font-family:'Fraunces',serif;font-size:15px;font-weight:700;color:#1f3a2e;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #e8e1d0}
  .tip-item{display:flex;gap:10px;padding:6px 0;font-size:12px;color:#3a3d38;line-height:1.5;border-bottom:1px solid #f0ebe0}
  .tip-item:last-child{border-bottom:none}
  .tip-dot{color:#2e5a3a;font-weight:700;flex-shrink:0}
  footer{background:#1f3a2e;color:#f4efe6;padding:20px 48px;display:flex;justify-content:space-between;align-items:center;margin-top:48px}
  footer .ft{font-family:'Fraunces',serif;font-size:18px;font-weight:700}
  footer .url{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.6}
  @media print{body{background:#fff}header,footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}.tip-block{break-inside:avoid}}
</style>
</head>
<body>
<header>
  <div class="logo">Pinchy</div>
  <div class="meta">Monthly Budget Plan<br>Generated ${dateStr}</div>
</header>
<div class="body">
  <div class="columns">
    <div>
      <h2>Income</h2>
      <table>
        <thead><tr><th>Source</th><th class="num">Monthly</th></tr></thead>
        <tbody>${incomeRows || '<tr><td colspan="2" style="opacity:0.5;font-style:italic">No recurring income detected</td></tr>'}</tbody>
        <tfoot><tr><td>Total Income</td><td class="num">${fmt(totalIncome)}</td></tr></tfoot>
      </table>
    </div>
    <div>
      <h2>Suggested Budget</h2>
      <table>
        <thead><tr><th>Category</th><th class="num">Monthly</th></tr></thead>
        <tbody>${expenseRows}</tbody>
        <tfoot>
          <tr><td>Total Expenses</td><td class="num">${fmt(totalSuggested)}</td></tr>
          <tr class="surplus-row"><td>Monthly Surplus</td><td class="num">${fmt(surplus)}</td></tr>
          <tr><td style="opacity:0.7;font-size:11px">20% Savings Goal</td><td class="num" style="opacity:0.7;font-size:12px">${fmt(savingsGoal)}</td></tr>
        </tfoot>
      </table>
    </div>
  </div>
  ${catsWithTips.length > 0 ? `<div class="tips-section"><h2>How to Get There</h2><div class="tips-grid">${tipSections}</div></div>` : ''}
</div>
<footer>
  <div class="ft">Pinchy</div>
  <div class="url">pinchy.money</div>
</footer>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pinchy-budget-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const goToBudget = () => {
    if (!analysis) return;
    const income = analysis.reliableMonthlyIncome || 0;
    const allocs = { __savings__: Math.round(income * 0.2) };
    for (const [cat, data] of Object.entries(analysis.monthlyByCategory)) {
      const monthly = data.monthlyTotal;
      allocs[cat] = FIXED_BUDGET_CATS.has(cat)
        ? Math.round(monthly)
        : Math.max(0, Math.round(monthly * 0.9));
    }
    setBudgetAllocs(allocs);
    setBudgetIncome(income > 0 ? String(Math.round(income)) : '');
    setView('budget');
  };

  const checkSalary = () => {
    const query = jobTitle.toLowerCase().trim();
    if (!query) return;
    const match = AU_SALARY_BENCHMARKS.find(b => b.keywords.some(k => query.includes(k) || k.includes(query)));
    if (!match) { setSalaryResult({ notFound: true, query: jobTitle }); return; }
    const premium = AU_LOCATION_PREMIUM[jobLocation] ?? 0;
    const low = Math.round(match.low * (1 + premium));
    const median = Math.round(match.median * (1 + premium));
    const high = Math.round(match.high * (1 + premium));
    const current = parseInt(currentSalary.replace(/[^0-9]/g, ''), 10) || 0;
    const pctVsMedian = current > 0 ? Math.round(((current - median) / median) * 100) : null;
    const nextRoles = match.next.map(([title, nLow, nHigh]) => ({
      title,
      low: Math.round(nLow * (1 + premium)),
      high: Math.round(nHigh * (1 + premium)),
    }));
    setSalaryResult({ match, low, median, high, current, pctVsMedian, nextRoles, field: match.field, location: jobLocation });
  };

  const HABIT_CATS = [
    { cat: 'Dining Out',    verb: 'eat out',             icon: '🍽', suggestion: 0.75 },
    { cat: 'Coffee',        verb: 'buy coffee',           icon: '☕', suggestion: 0.75 },
    { cat: 'Takeaway',      verb: 'order in',             icon: '📦', suggestion: 0.75 },
    { cat: 'Alcohol',       verb: 'buy alcohol',          icon: '🍺', suggestion: 0.75 },
    { cat: 'Shopping',      verb: 'shop online or in-store', icon: '🛍', suggestion: 0.80 },
    { cat: 'Entertainment', verb: 'go out',               icon: '🎬', suggestion: 0.75 },
    { cat: 'Fuel',          verb: 'fill up',              icon: '⛽', suggestion: 0.85 },
  ];

  const computeHabits = () => {
    if (!analysis) return [];
    const pm = analysis.periodMonths || 1;
    return HABIT_CATS.map(({ cat, verb, icon, suggestion }) => {
      const entry = analysis.byCategory?.[cat];
      if (!entry || entry.count === 0) return null;
      const countPerMonth = entry.count / pm;
      if (countPerMonth < 1) return null;
      const spendPerMonth = entry.total / pm;
      const avgPerVisit = entry.total / entry.count;
      const suggestedCount = Math.max(0, Math.round(countPerMonth * suggestion));
      const suggestedSpend = suggestedCount * avgPerVisit;
      const saving = spendPerMonth - suggestedSpend;
      return { cat, verb, icon, suggestion, countPerMonth, spendPerMonth, avgPerVisit, suggestedCount, suggestedSpend, saving };
    }).filter(Boolean).sort((a, b) => b.saving - a.saving);
  };

  const goToBudgetWithHabits = (choices) => {
    if (!analysis) return;
    const pm = analysis.periodMonths || 1;
    const income = analysis.reliableMonthlyIncome || 0;
    const habits = computeHabits();
    const habitCatSet = new Set(habits.map(h => h.cat));

    const cats = computeBudgetCats(analysis).map(c => {
      if (!habitCatSet.has(c.cat)) return c;
      const h = habits.find(x => x.cat === c.cat);
      if (!h) return c;
      if (choices[c.cat] === true) {
        return { ...c, suggested: Math.round(h.suggestedSpend), saving: Math.round(c.current - h.suggestedSpend) };
      }
      if (choices[c.cat] === false) {
        return { ...c, suggested: Math.round(c.current), saving: 0 };
      }
      return c;
    });

    setBudgetIncome(income > 0 ? String(Math.round(income)) : '');
    setLoadedCats(cats);
    setView('budget');
  };

  const analysis = useMemo(() => {
    if (transactions.length === 0) return null;

    // --- Statement period (needed early for some checks) ---
    const allDates = transactions.map(t => new Date(t.date)).sort((a, b) => a - b);
    const firstDate = allDates[0];
    const lastDate = allDates[allDates.length - 1];
    const periodDays = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24) + 1);
    const periodMonths = periodDays / 30.44;

    // --- Reliable recurring INCOME detection (used for budget floor) ---
    const creditsWithKeys = transactions
      .filter(t => t.amount > 0)
      .map(t => ({ ...t, _merchantKey: merchantKey(t.description) }));
    const reliableStreams = detectRecurring(creditsWithKeys);
    const reliableMonthlyIncome = reliableStreams.reduce((s, r) => s + r.monthlyEquivalent, 0);

    // --- Recurring EXPENSE detection ---
    // Same algorithm as income: merchants you pay repeatedly at a consistent cadence
    // and amount. This catches mortgage, rent, utilities, subscriptions, insurance etc.
    // even when the description doesn't contain the word "mortgage".
    //
    // IMPORTANT: Any transaction with "mortgage" or "home loan" in the description
    // is force-grouped under a single virtual merchant key — so that e.g. two
    // different people's names in the reference field don't fragment the stream.
    const MORTGAGE_VIRTUAL_KEY = '__mortgage__';
    const debitsWithKeys = transactions
      .filter(t => t.amount < 0)
      .map(t => {
        const d = t.description.toLowerCase();
        const isMortgage = /\bmortgage\b|\bhome loan\b|\bloan repayment\b|\bp&i payment\b/.test(d);
        return {
          ...t,
          _merchantKey: isMortgage ? MORTGAGE_VIRTUAL_KEY : merchantKey(t.description),
        };
      });
    const recurringExpenses = detectRecurring(debitsWithKeys);

    // --- Auto-classify mortgage ---
    // Any debit keyed to the virtual mortgage key is Mortgage by definition.
    // Plus: the biggest recurring monthly expense above $1,500/mo is almost certainly
    // either mortgage or rent. If nothing already matches the Mortgage/Rent rules
    // by keyword, reclassify the largest qualifying recurring expense as Mortgage
    // so it doesn't get lost in Transfers/Other.
    const autoMortgageKeys = new Set();
    autoMortgageKeys.add(MORTGAGE_VIRTUAL_KEY);
    for (const r of recurringExpenses) {
      if (r.monthlyEquivalent < 1500) continue; // housing-sized only
      // Check what the rule-based categoriser would normally return for this
      const sampleCategory = categorize(r.sample);
      if (sampleCategory === 'Mortgage' || sampleCategory === 'Rent/Housing') continue; // already covered
      // Also respect any user override for this merchant
      if (overrides[r.key]) continue;
      autoMortgageKeys.add(r.key);
    }

    // --- Now categorise every transaction ---
    // Precedence: user override > auto-detected mortgage > rule-based > 'Other'
    const categorized = transactions.map(t => {
      // Use the same virtual-key logic for debits so per-transaction categorisation
      // agrees with the stream-level classification.
      const d = t.description.toLowerCase();
      const isMortgageKeyword = t.amount < 0 && /\bmortgage\b|\bhome loan\b|\bloan repayment\b|\bp&i payment\b/.test(d);
      const key = isMortgageKeyword ? MORTGAGE_VIRTUAL_KEY : merchantKey(t.description);
      let category;
      if (overrides[key]) category = overrides[key];
      else if (autoMortgageKeys.has(key)) category = 'Mortgage';
      else category = categorize(t.description);
      return { ...t, category, _merchantKey: key };
    });
    const spending = categorized.filter(t => t.amount < 0);

    // Classify each income transaction into a sub-type
    const classifyIncome = (desc) => {
      const d = desc.toLowerCase();
      if (/salary|payroll|wages|pay\/salary|net pay|paye\s/i.test(d)) return 'Salary';
      if (/interest|int\s*paid|bonus\s*interest/i.test(d)) return 'Interest';
      if (/refund|reversal|reverse|reimburs/i.test(d)) return 'Refunds';
      if (/dividend|distribution/i.test(d)) return 'Investments';
      if (/transfer from|osko|payid|fast transfer|beem|bpay credit/i.test(d)) return 'Transfers In';
      if (/direct credit|ach credit|direct dep/i.test(d)) return 'Direct Credits';
      return 'Other Income';
    };

    const incomeTxns = categorized
      .filter(t => t.amount > 0)
      .map(t => ({ ...t, incomeType: classifyIncome(t.description) }));
    const totalIn = incomeTxns.reduce((s, t) => s + t.amount, 0);
    const totalOut = spending.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Group income by type for the ledger summary
    const incomeByType = {};
    for (const t of incomeTxns) {
      if (!incomeByType[t.incomeType]) incomeByType[t.incomeType] = { total: 0, count: 0, items: [] };
      incomeByType[t.incomeType].total += t.amount;
      incomeByType[t.incomeType].count += 1;
      incomeByType[t.incomeType].items.push(t);
    }
    const incomeBreakdown = Object.entries(incomeByType)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.total - a.total);

    const byCategory = {};
    for (const t of spending) {
      const c = t.category;
      if (!byCategory[c]) byCategory[c] = { total: 0, count: 0, items: [] };
      byCategory[c].total += Math.abs(t.amount);
      byCategory[c].count += 1;
      byCategory[c].items.push(t);
    }

    const suggestions = [];
    const seen = new Set();
    for (const t of spending) {
      const alt = findAlternative(t.description);
      if (alt && !seen.has(alt.merchant)) {
        seen.add(alt.merchant);
        const merchantTotal = spending
          .filter(x => x.description.toLowerCase().includes(alt.merchant))
          .reduce((s, x) => s + Math.abs(x.amount), 0);
        suggestions.push({
          ...alt,
          merchantTotal,
          estimatedSavings: (merchantTotal * alt.savings) / 100,
        });
      }
    }
    suggestions.sort((a, b) => b.estimatedSavings - a.estimatedSavings);

    const categoryBreakdown = Object.entries(byCategory)
      .map(([cat, data]) => {
        const avg = BENCHMARKS[cat];
        const diff = avg ? ((data.total - avg) / avg) * 100 : null;
        const catSuggestions = suggestions.filter(s => {
          const matchedTxn = data.items.find(it => it.description.toLowerCase().includes(s.merchant));
          return !!matchedTxn;
        });
        return { category: cat, ...data, average: avg, diff, suggestions: catSuggestions };
      })
      .sort((a, b) => b.total - a.total);

    // --- Monthly budget math ---
    // Convert each spending category's total into a monthly equivalent
    // based on the actual statement period length.
    const monthlyByCategory = {};
    for (const [cat, data] of Object.entries(byCategory)) {
      monthlyByCategory[cat] = {
        ...data,
        monthlyTotal: data.total / periodMonths,
      };
    }
    const monthlySpending = totalOut / periodMonths;
    const monthlySurplus = reliableMonthlyIncome - monthlySpending;

    return {
      categorized, byCategory, totalIn, totalOut,
      netFlow: totalIn - totalOut,
      suggestions, categoryBreakdown, incomeTxns, incomeBreakdown,
      anomalies: detectAnomalies(spending),
      // Budget-specific fields
      reliableStreams,
      reliableMonthlyIncome,
      recurringExpenses,
      autoMortgageKeys: Array.from(autoMortgageKeys),
      periodDays,
      periodMonths,
      monthlyByCategory,
      monthlySpending,
      monthlySurplus,
      firstDate: firstDate ? firstDate.toISOString().slice(0, 10) : null,
      lastDate: lastDate ? lastDate.toISOString().slice(0, 10) : null,
    };
  }, [transactions, overrides]);

  const fmt = (n) => `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  return (
    <div style={{ background: '#f4efe6', minHeight: '100vh', fontFamily: 'Georgia, "Times New Roman", serif', color: '#1a1f1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700;9..144,900&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .display { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 144; letter-spacing: -0.02em; }
        .mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
        .fade-in { animation: fadeIn 0.5s ease-out both; }
        .slide-in { animation: slideIn 0.5s ease-out both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        .row-hover:hover { background: #ebe4d5; }
        button { font-family: inherit; cursor: pointer; }
        .btn-primary { background: #1f3a2e; color: #f4efe6; border: none; padding: 14px 28px; font-size: 15px; font-weight: 500; letter-spacing: 0.03em; transition: background 0.2s; }
        .btn-primary:hover { background: #0f2a1e; }
        .btn-ghost { background: transparent; color: #1f3a2e; border: 1px solid #1f3a2e; padding: 14px 28px; font-size: 15px; letter-spacing: 0.03em; transition: all 0.2s; }
        .btn-ghost:hover { background: #1f3a2e; color: #f4efe6; }
        .dropzone { border: 2px dashed #8a8578; transition: all 0.2s; }
        .dropzone.drag { border-color: #1f3a2e; background: #ebe4d5; }
        .btn-analyse { background: #1f3a2e; color: #f4efe6; border: none; padding: 20px 40px; font-size: 18px; font-weight: 500; letter-spacing: 0.05em; transition: all 0.2s; display: inline-flex; align-items: center; gap: 12px; }
        .btn-analyse:hover { background: #0f2a1e; transform: translateY(-1px); }
        .nav-desktop { display: flex; align-items: center; gap: 4; flex: 1; }
        .nav-desktop-auth { display: block; }
        .nav-mobile-btn { display: none !important; }
        @media (max-width: 680px) {
          .nav-desktop { display: none !important; }
          .nav-desktop-auth { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .page-pad { padding: 20px 16px 60px !important; }
          .hero-title { font-size: 36px !important; }
          .stepper-pad { padding: 16px !important; }
          .stepper-label { display: none !important; }
          .tile-grid { grid-template-columns: 1fr 1fr !important; }
          .budget-nav-label { display: none !important; }
          .salary-form { grid-template-columns: 1fr !important; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-in { animation: cardIn 0.25s ease forwards; }
      `}</style>

      {/* ============ TOP NAV ============ */}
      <nav style={{ background: '#1f3a2e', color: '#f4efe6', padding: '0 20px', display: 'flex', alignItems: 'center', height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
        {/* Logo */}
        <button
          onClick={() => { setView('upload'); setLoadedCats(null); setMobileMenuOpen(false); }}
          className="display"
          style={{ fontSize: 22, fontWeight: 700, color: '#f4efe6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '-0.02em', flexShrink: 0 }}
        >
          Pinchy
        </button>

        {/* Desktop nav links */}
        {user && (
          <div className="nav-desktop" style={{ marginLeft: 8 }}>
            {[
              { label: 'Create Budget', icon: <PlusCircle size={14} />, action: () => { setView('upload'); setLoadedCats(null); } },
              { label: 'My Budgets', icon: <FolderOpen size={14} />, action: () => { setView('budgets'); loadBudgets(); } },
              { label: 'Settings', icon: <SettingsIcon size={14} />, action: () => setView('settings') },
            ].map(({ label, icon, action }) => (
              <button
                key={label}
                onClick={action}
                className="mono"
                style={{ background: 'none', border: 'none', color: '#f4efe6', opacity: 0.8, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '0 12px', height: 56, display: 'flex', alignItems: 'center', gap: 6, borderBottom: '2px solid transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderBottomColor = '#a8c5b0'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = 0.8; e.currentTarget.style.borderBottomColor = 'transparent'; }}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        )}

        {/* Desktop auth */}
        <div className="nav-desktop-auth" style={{ marginLeft: 'auto', position: 'relative' }}>
          {authLoading ? null : user ? (
            <>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{ background: 'none', border: '1px solid rgba(244,239,230,0.3)', color: '#f4efe6', padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 4 }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2e5a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                  {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.05em', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.user_metadata?.full_name || user.email}
                </span>
              </button>
              {userMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#f4efe6', border: '1px solid #d6cfc4', minWidth: 180, zIndex: 200 }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #e8e1d0', fontSize: 12, color: '#6b6758' }} className="mono">{user.email}</div>
                  <button onClick={signOut} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#1a1f1a', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogOut size={14} color="#6b6758" /> Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="mono" style={{ background: 'transparent', border: '1px solid rgba(244,239,230,0.5)', color: '#f4efe6', padding: '8px 18px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign In
            </button>
          )}
        </div>

        {/* Mobile right: avatar + hamburger */}
        <div className="nav-mobile-btn" style={{ marginLeft: 'auto', alignItems: 'center', gap: 10 }}>
          {user && (
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2e5a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#f4efe6', padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div style={{ position: 'absolute', top: 56, left: 0, right: 0, background: '#1a2e22', borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 200 }}>
            {user ? (
              <>
                {[
                  { label: 'Create Budget', icon: <PlusCircle size={16} />, action: () => { setView('upload'); setLoadedCats(null); setMobileMenuOpen(false); } },
                  { label: 'My Budgets', icon: <FolderOpen size={16} />, action: () => { setView('budgets'); loadBudgets(); setMobileMenuOpen(false); } },
                  { label: 'Settings', icon: <SettingsIcon size={16} />, action: () => { setView('settings'); setMobileMenuOpen(false); } },
                ].map(({ label, icon, action }) => (
                  <button key={label} onClick={action} style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#f4efe6', fontSize: 15, fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    {icon}{label}
                  </button>
                ))}
                <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="mono" style={{ fontSize: 11, color: 'rgba(244,239,230,0.4)', letterSpacing: '0.05em' }}>{user.email}</div>
                </div>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', color: 'rgba(244,239,230,0.7)', fontSize: 15, fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }} style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', color: '#f4efe6', fontSize: 15, fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <User size={16} /> Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="page-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>
        {/* Hero — only on upload view */}
        {view === 'upload' && (
          <header style={{ borderBottom: '3px double #1f3a2e', paddingBottom: 24, marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
              <h1 className="display hero-title" style={{ fontSize: 56, fontWeight: 900, margin: 0, lineHeight: 1 }}>Pinchy</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b6758' }}>
                <Shield size={14} /> <span className="mono" style={{ letterSpacing: '0.1em' }}>PROCESSED ON-DEVICE</span>
              </div>
            </div>
            <p className="display" style={{ fontSize: 22, fontWeight: 700, margin: '24px 0 0', maxWidth: 640, lineHeight: 1.35, color: '#1f3a2e' }}>
              Find out what you're paying for your bills — and where you're overpaying.
            </p>
            <p style={{ fontSize: 15, maxWidth: 600, margin: '14px 0 0', color: '#6b6758', lineHeight: 1.6 }}>
              Upload a bank statement CSV and Pinchy finds your utilities, insurance, internet, phone and subscriptions — then shows you a cheaper option for each one. <strong style={{ color: '#3a3d38' }}>Processed in your browser. Nothing uploaded.</strong>
            </p>
          </header>
        )}

        {/* ============ PROGRESS STEPPER ============ */}
        {['upload', 'results', 'budget'].includes(view) && (() => {
          const steps = [
            { key: 'upload', label: 'Upload' },
            { key: 'results', label: 'Create' },
            { key: 'budget', label: 'Download' },
          ];
          const currentIdx = steps.findIndex(s => s.key === view);
          return (
            <div className="stepper-pad" style={{ display: 'flex', alignItems: 'center', padding: '24px 40px', borderBottom: '1px solid #d6cfc4', background: '#f4efe6', position: 'sticky', top: 56, zIndex: 99 }}>
              {steps.map((step, i) => {
                const done = i < currentIdx;
                const active = i === currentIdx;
                return (
                  <React.Fragment key={step.key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: done ? '#1f3a2e' : active ? '#1f3a2e' : 'transparent',
                        border: done || active ? '2px solid #1f3a2e' : '2px solid #b0a898',
                        color: done || active ? '#f4efe6' : '#b0a898',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {done ? <Check size={13} /> : i + 1}
                      </div>
                      <span className="mono stepper-label" style={{
                        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: active ? '#1f3a2e' : done ? '#1f3a2e' : '#b0a898',
                        fontWeight: active ? 700 : 500,
                      }}>
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{ flex: 1, height: 2, margin: '0 16px', background: done ? '#1f3a2e' : '#d6cfc4' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })()}

        {/* ============ UPLOAD VIEW ============ */}
        {view === 'upload' && !loading && (
          <div className="fade-in">
            {transactions.length === 0 ? (
              <>
                <div
                  className="dropzone"
                  style={{ padding: 60, textAlign: 'center', background: '#faf6ee', marginBottom: 24 }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('drag')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('drag');
                    if (e.dataTransfer.files.length) handleFiles(Array.from(e.dataTransfer.files));
                  }}
                >
                  <Upload size={32} color="#1f3a2e" style={{ marginBottom: 16 }} />
                  <div className="display" style={{ fontSize: 28, marginBottom: 8 }}>Drop CSV statements here</div>
                  <div style={{ color: '#6b6758', marginBottom: 24, fontSize: 14, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
                    Drop multiple files at once — transactions are merged and deduplicated automatically. Works with CBA, Westpac, NAB, ANZ, ING, Macquarie, Up, Bankwest and more.
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={() => fileRef.current?.click()}>
                      Choose CSV files
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => handleFile(new File([TEST_CSV], 'test-budget.csv', { type: 'text/csv' }))}
                    >
                      Load test data
                    </button>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt,text/csv"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files.length && handleFiles(Array.from(e.target.files))}
                  />
                </div>

                {error && (
                  <div style={{ padding: 16, background: '#fae8d7', border: '1px solid #c47a3a', color: '#6b3a14', fontSize: 14, marginBottom: 16 }}>
                    {error}
                    {rawLines.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <button onClick={() => setShowRaw(!showRaw)} style={{ background: 'transparent', border: '1px solid #6b3a14', color: '#6b3a14', padding: '6px 12px', fontSize: 12 }}>
                          {showRaw ? 'Hide' : 'Show'} extracted text ({rawLines.length} lines)
                        </button>
                        {showRaw && (
                          <pre className="mono" style={{ marginTop: 12, padding: 12, background: '#1f3a2e', color: '#f4efe6', fontSize: 11, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                            {rawLines.slice(0, 200).join('\n')}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 40 }}>
                  {[
                    { t: 'Categorised', d: 'Groceries, coffee, delivery, rent — sorted automatically from transaction descriptions.' },
                    { t: 'Benchmarked', d: 'Each category compared with what the average Australian household spends (ABS + Finder data).' },
                    { t: 'Optimised', d: "Suggests cheaper alternatives where they exist and estimates what you'd save by switching." },
                  ].map((x) => (
                    <div key={x.t} style={{ borderTop: '2px solid #1f3a2e', paddingTop: 16 }}>
                      <div className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{x.t}</div>
                      <div style={{ fontSize: 14, color: '#3a3d38', lineHeight: 1.5 }}>{x.d}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Statement(s) uploaded successfully — show summary + Analyse button
              <div className="slide-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: '#1f3a2e', color: '#f4efe6', marginBottom: 32 }}>
                  <Check size={18} />
                  <span className="mono" style={{ fontSize: 13, letterSpacing: '0.1em' }}>{fileNames.length > 1 ? `${fileNames.length} FILES MERGED` : 'STATEMENT PARSED'}</span>
                </div>

                <div className="display" style={{ fontSize: 20, color: '#6b6758', marginBottom: 8, fontStyle: 'italic' }}>
                  {fileNames.length > 1 ? 'Transactions across all files' : 'Found in your statement'}
                </div>
                <div className="display mono" style={{ fontSize: 72, fontWeight: 700, lineHeight: 1, marginBottom: 8, letterSpacing: '-0.03em' }}>
                  {transactions.length}
                </div>
                <div className="display" style={{ fontSize: 20, color: '#3a3d38', marginBottom: 24 }}>
                  transactions
                </div>

                {/* File chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
                  {fileNames.map((n, i) => (
                    <span key={i} className="mono" style={{ background: '#e8e1d0', padding: '4px 12px', fontSize: 12, color: '#3a3d38', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={12} />{n}
                    </span>
                  ))}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="mono"
                    style={{ background: 'none', border: '1px dashed #8a8578', padding: '4px 12px', fontSize: 12, color: '#6b6758', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    + Add another file
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt,text/csv"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files.length) handleFiles(Array.from(e.target.files), transactions);
                      e.target.value = '';
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-analyse" onClick={() => setView('bills')}>
                    Next <ArrowRight size={20} />
                  </button>
                  <button className="btn-ghost" onClick={reset}>
                    Start over
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="fade-in" style={{ textAlign: 'center', padding: 80 }}>
            <Loader className="spin" size={32} color="#1f3a2e" style={{ marginBottom: 16 }} />
            <div className="display" style={{ fontSize: 24, marginBottom: 8 }}>Reading your CSV…</div>
            <div style={{ color: '#6b6758', fontSize: 14, marginBottom: 24 }}>
              Parsing locally — nothing leaves your device.
            </div>
          </div>
        )}

        {/* ============ BILLS VIEW ============ */}
        {view === 'bills' && analysis && (() => {
          // Match recurring expenses + category transactions against BILL_LOOKUP
          const matchBill = (description) => {
            const d = (description || '').toLowerCase();
            return BILL_LOOKUP.find(b => b.match.some(kw => d.includes(kw))) ?? null;
          };

          // Build a deduplicated list of matched bills from recurring expenses
          const seen = new Set();
          const bills = [];
          for (const r of analysis.recurringExpenses) {
            const hit = matchBill(r.sample);
            if (!hit) continue;
            const key = hit.cat + ':' + (hit.provider ?? r.sample);
            if (seen.has(key)) continue;
            seen.add(key);
            bills.push({ ...hit, monthly: r.monthlyEquivalent, sample: r.sample, detectedProvider: hit.provider ?? r.sample });
          }
          // Also check non-recurring transactions in relevant categories
          const BILL_CATS = new Set(['Utilities', 'Phone & Internet', 'Insurance', 'Subscriptions']);
          for (const [cat, data] of Object.entries(analysis.byCategory)) {
            if (!BILL_CATS.has(cat)) continue;
            for (const txn of data.items) {
              const hit = matchBill(txn.description);
              if (!hit) continue;
              const key = hit.cat + ':' + (hit.provider ?? txn.description);
              if (seen.has(key)) continue;
              seen.add(key);
              bills.push({ ...hit, monthly: Math.abs(txn.amount), sample: txn.description, detectedProvider: hit.provider ?? txn.description });
            }
          }

          const totalMonthly = bills.reduce((s, b) => s + b.monthly, 0);

          return (
            <div className="fade-in">
              {/* Top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1f3a2e', color: '#f4efe6', marginBottom: 32, flexWrap: 'wrap', gap: 8 }}>
                <button onClick={() => setView('upload')} style={{ background: 'transparent', border: 'none', color: '#f4efe6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <span className="mono" style={{ fontSize: 13, letterSpacing: '0.1em' }}>YOUR BILLS</span>
                <button onClick={() => setView('results')} style={{ background: 'transparent', border: '1px solid rgba(244,239,230,0.4)', color: '#f4efe6', padding: '6px 14px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Full analysis →
                </button>
              </div>

              <div style={{ padding: '0 0 48px' }}>
                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                  <h2 className="display" style={{ fontSize: 32, fontWeight: 700, margin: '0 0 6px' }}>
                    {bills.length > 0 ? `We found ${bills.length} bill${bills.length !== 1 ? 's' : ''} you might be overpaying on` : 'Your bills'}
                  </h2>
                  {bills.length > 0 && (
                    <p style={{ fontSize: 15, color: '#6b6758', margin: 0 }}>
                      You're spending <strong style={{ color: '#1f3a2e' }}>{fmt(totalMonthly)}/mo</strong> on these. Here's where you can save.
                    </p>
                  )}
                </div>

                {bills.length === 0 && (
                  <div style={{ padding: '48px 24px', textAlign: 'center', border: '2px dashed #d6cfc4' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                    <div className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No known bills detected</div>
                    <p style={{ color: '#6b6758', margin: '0 0 24px' }}>We couldn't match any transactions to known utility or subscription providers. Try the full analysis to see all your spending.</p>
                    <button onClick={() => setView('results')} style={{ background: '#1f3a2e', color: '#f4efe6', border: 'none', padding: '12px 28px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}>
                      View Full Analysis
                    </button>
                  </div>
                )}

                {/* Bill cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 28 }}>
                  {bills.map((bill, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #e8e1d0', overflow: 'hidden' }}>
                      {/* Card header */}
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e1d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf6ee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{bill.icon}</span>
                          <div>
                            <div className="display" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}>{bill.detectedProvider}</div>
                            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6758', marginTop: 3 }}>{bill.cat}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="display" style={{ fontSize: 22, fontWeight: 700, color: '#a04020' }}>{fmt(bill.monthly)}</div>
                          <div className="mono" style={{ fontSize: 10, color: '#6b6758' }}>/mo</div>
                        </div>
                      </div>
                      {/* Alternatives */}
                      <div style={{ padding: '12px 0' }}>
                        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', padding: '0 20px 8px' }}>Better deals available</div>
                        {bill.alts.map((alt, j) => {
                          const bc = BADGE_COLORS[alt.badge] ?? { bg: '#e8e1d0', text: '#3a3020' };
                          return (
                            <div key={j} style={{ padding: '10px 20px', borderTop: j === 0 ? 'none' : '1px solid #f0ebe0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{alt.name}</div>
                                <div style={{ fontSize: 12, color: '#6b6758', lineHeight: 1.4 }}>{alt.desc}</div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                <span style={{ background: bc.bg, color: bc.text, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px' }}>{alt.badge}</span>
                                {alt.url && (
                                  <a href={alt.url} target="_blank" rel="noopener noreferrer" style={{ background: '#1f3a2e', color: '#f4efe6', fontSize: 11, fontWeight: 600, padding: '5px 10px', textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                    Compare →
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom CTAs */}
                {bills.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <button
                      onClick={() => { setHabitStep(0); setHabitChoices({}); setView('habits'); }}
                      style={{ background: '#2e5a3a', color: '#f4efe6', border: 'none', padding: '18px', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      <Zap size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Review Habits
                    </button>
                    <button
                      onClick={goToBudget}
                      style={{ background: '#1f3a2e', color: '#f4efe6', border: 'none', padding: '18px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      Build My Budget →
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ============ RESULTS VIEW ============ */}
        {view === 'results' && analysis && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1f3a2e', color: '#f4efe6', marginBottom: 40, flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => setView('upload')} style={{ background: 'transparent', border: 'none', color: '#f4efe6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <ArrowLeft size={14} /> Back
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setHabitStep(0); setHabitChoices({}); setView('habits'); }}
                  style={{ background: 'rgba(244,239,230,0.15)', border: '1px solid rgba(244,239,230,0.4)', color: '#f4efe6', padding: '8px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Zap size={13} /> View Habits
                </button>
                <button
                  onClick={goToBudget}
                  style={{ background: '#f4efe6', color: '#1f3a2e', border: 'none', padding: '8px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Build Budget <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* --- Your monthly budget --- */}
            <section style={{ marginBottom: 56 }}>
              <h2 className="display" style={{ fontSize: 36, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Your monthly budget
              </h2>
              <p style={{ color: '#6b6758', margin: '0 0 24px', fontSize: 15 }}>
                {analysis.reliableStreams.length > 0
                  ? `Based on ${analysis.reliableStreams.length} recurring income stream${analysis.reliableStreams.length === 1 ? '' : 's'}. All figures monthly.`
                  : 'No reliable income detected yet.'}
              </p>

              {analysis.reliableStreams.length === 0 ? (
                <div style={{ padding: 24, border: '1px solid #a04020', background: '#fae8d7', color: '#6b3010' }}>
                  <strong>No reliable income detected.</strong> We look for credits that repeat weekly, fortnightly, or monthly with consistent amounts. Try uploading a longer CSV or adjusting category assignments.
                </div>
              ) : (
                <>
                  {/* Top tile: monthly reliable income */}
                  <div style={{ padding: 32, border: '1px solid #1f3a2e', background: '#1f3a2e', color: '#f4efe6', marginBottom: 16 }}>
                    <div className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 8 }}>
                      Reliable monthly income
                    </div>
                    <div className="display mono" style={{ fontSize: 44, fontWeight: 500, marginBottom: 12 }}>
                      {fmt(analysis.reliableMonthlyIncome)}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
                      Conservative estimate — uses the most common payment amount (or the lowest, if there's no clear pattern) rather than an average. Bonuses and overtime are left out on purpose so the budget has a safety margin.
                    </div>
                  </div>

                  {/* Recurring income streams list */}
                  <div style={{ border: '1px solid #1f3a2e', background: '#faf6ee', padding: 16, marginBottom: 16 }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 12 }}>
                      Recurring streams detected
                    </div>
                    {analysis.reliableStreams.map((r) => (
                      <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderTop: '1px solid #e8e1d0', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{r.sample}</div>
                          <div className="mono" style={{ fontSize: 11, color: '#6b6758' }}>
                            {r.cadence} · {r.count} payment{r.count === 1 ? '' : 's'} · budget uses {fmt(r.budgetAmount)} ({r.estimateMethod}) · avg was {fmt(r.avgAmount)}
                          </div>
                        </div>
                        <div className="display mono" style={{ fontSize: 18, fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {fmt(r.monthlyEquivalent)}<span style={{ fontSize: 12, color: '#6b6758' }}>/mo</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly flows summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div style={{ padding: 24, border: '1px solid #1f3a2e', background: '#faf6ee' }}>
                      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 8 }}>
                        Typical monthly spend
                      </div>
                      <div className="display mono" style={{ fontSize: 28, fontWeight: 500, color: '#a04020' }}>
                        {fmt(analysis.monthlySpending)}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b6758', marginTop: 4 }}>
                        Your typical total outgoings each month
                      </div>
                    </div>

                    <div style={{ padding: 24, border: '1px solid #1f3a2e', background: analysis.monthlySurplus >= 0 ? '#dfe8d8' : '#fae8d7' }}>
                      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 8 }}>
                        Monthly {analysis.monthlySurplus >= 0 ? 'surplus' : 'shortfall'}
                      </div>
                      <div className="display mono" style={{ fontSize: 28, fontWeight: 500, color: analysis.monthlySurplus >= 0 ? '#2e5a3a' : '#a04020' }}>
                        {analysis.monthlySurplus >= 0 ? '+' : ''}{fmt(analysis.monthlySurplus)}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b6758', marginTop: 4 }}>
                        {analysis.monthlySurplus >= 0
                          ? 'Reliable income minus typical spend'
                          : `You're spending ${fmt(Math.abs(analysis.monthlySurplus))} more per month than your reliable income`}
                      </div>
                    </div>
                  </div>

                  {/* Drawer: detailed breakdown table (hidden by default) */}
                  <div style={{ marginTop: 16, border: '1px solid #1f3a2e' }}>
                    <button
                      onClick={() => setShowBreakdown(s => !s)}
                      className="mono"
                      style={{
                        width: '100%',
                        background: '#faf6ee',
                        border: 'none',
                        borderBottom: showBreakdown ? '1px solid #1f3a2e' : 'none',
                        padding: '14px 18px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: 12,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#1f3a2e',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>See the breakdown</span>
                      <span style={{ fontSize: 14 }}>{showBreakdown ? '▾' : '▸'}</span>
                    </button>

                    {showBreakdown && (
                      <div style={{ background: '#faf6ee', overflowX: 'auto' }}>
                        <table className="mono" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#1f3a2e', color: '#f4efe6' }}>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10 }}>Out</th>
                              <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10, whiteSpace: 'nowrap' }}>vs Avg</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10, whiteSpace: 'nowrap' }}>Potential Savings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.categoryBreakdown.map((c) => {
                              const monthly = c.total / analysis.periodMonths;
                              const hasBenchmark = c.average != null;
                              const monthlyDiff = hasBenchmark ? ((monthly - c.average) / c.average) * 100 : null;
                              const isHigh = hasBenchmark && monthlyDiff > 10;
                              const isLow = hasBenchmark && monthlyDiff < -10;
                              const trendLabel = isHigh ? `+${monthlyDiff.toFixed(0)}% higher` :
                                                 isLow ? `${monthlyDiff.toFixed(0)}% lower` :
                                                 hasBenchmark ? 'on track' : '—';
                              const trendColor = isHigh ? '#a04020' : isLow ? '#2e5a3a' : '#6b6758';
                              const monthlyCatSavings = c.suggestions.reduce((s, x) => s + x.estimatedSavings, 0) / analysis.periodMonths;
                              const anchorId = `cat-${c.category.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

                              return (
                                <tr
                                  key={c.category}
                                  style={{ borderBottom: '1px solid #e8e1d0', cursor: monthlyCatSavings > 0 ? 'pointer' : 'default' }}
                                  onClick={() => {
                                    if (monthlyCatSavings > 0) {
                                      const el = document.getElementById(anchorId);
                                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }}
                                  onMouseOver={(e) => { if (monthlyCatSavings > 0) e.currentTarget.style.background = '#f0ead8'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <td style={{ padding: '10px 14px' }}>
                                    <div style={{ fontWeight: 500, color: '#1a1f1a' }}>{c.category}</div>
                                    <div style={{ fontSize: 11, color: '#6b6758' }}>{fmt(monthly)}/mo</div>
                                  </td>
                                  <td style={{ padding: '10px 14px', textAlign: 'center', color: trendColor, fontSize: 12, whiteSpace: 'nowrap' }}>
                                    {trendLabel}
                                  </td>
                                  <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    {monthlyCatSavings > 0 ? (
                                      <span style={{ color: '#2e5a3a', fontWeight: 600, textDecoration: 'underline' }}>
                                        {fmt(monthlyCatSavings)}/mo →
                                      </span>
                                    ) : (
                                      <span style={{ color: '#c4bca8' }}>—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}

                            <tr style={{ background: '#ebe4d5', borderTop: '2px solid #1f3a2e' }}>
                              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#a04020' }}>
                                Total out {fmt(analysis.monthlySpending)}/mo
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: analysis.monthlySurplus >= 0 ? '#2e5a3a' : '#a04020' }}>
                                {analysis.monthlySurplus >= 0 ? '+' : ''}{fmt(analysis.monthlySurplus)}/mo net
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#2e5a3a' }}>
                                {fmt(analysis.suggestions.reduce((s, x) => s + x.estimatedSavings, 0) / analysis.periodMonths)}/mo
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* --- CTAs --- */}
            <section style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <div style={{ padding: 40, background: '#1f3a2e', color: '#f4efe6', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 12 }}>Next step</div>
                <div className="display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>Build your budget</div>
                <p style={{ fontSize: 14, opacity: 0.8, margin: '0 auto 24px', lineHeight: 1.6 }}>Turn your spending into a realistic monthly plan.</p>
                <button className="btn-analyse" onClick={goToBudget} style={{ background: '#f4efe6', color: '#1f3a2e', padding: '14px 28px', fontSize: 15 }}>
                  Build My Budget <ArrowRight size={18} />
                </button>
              </div>
              <div style={{ padding: 40, background: '#2e5a3a', color: '#f4efe6', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 12 }}>Behaviour</div>
                <div className="display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>See your habits</div>
                <p style={{ fontSize: 14, opacity: 0.8, margin: '0 auto 24px', lineHeight: 1.6 }}>How often you eat out, grab coffee, shop online — and what to cut.</p>
                <button className="btn-analyse" onClick={() => setView('habits')} style={{ background: '#f4efe6', color: '#2e5a3a', padding: '14px 28px', fontSize: 15 }}>
                  View Habits <Zap size={18} />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ============ BUDGET VIEW ============ */}
        {view === 'budget' && (analysis || loadedCats) && (() => {
          const income = parseFloat(budgetIncome) || 0;
          const cats = loadedCats ?? computeBudgetCats(analysis);

          const totalCurrent = cats.reduce((s, c) => s + c.current, 0);
          const totalSuggested = cats.reduce((s, c) => s + c.suggested, 0);
          const totalSaving = totalCurrent - totalSuggested;
          const savingsGoal = income > 0 ? Math.round(income * 0.2) : 0;

          return (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1f3a2e', color: '#f4efe6', marginBottom: 40 }}>
                <button onClick={() => loadedCats ? setView('budgets') : setView('results')} style={{ background: 'transparent', border: 'none', color: '#f4efe6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <ArrowLeft size={14} /> {loadedCats ? 'My Budgets' : 'Results'}
                </button>
                <span className="mono" style={{ fontSize: 13, letterSpacing: '0.1em' }}>MY BUDGET</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!loadedCats && (
                    <button
                      onClick={() => { if (!user) { setShowAuthModal(true); } else { setBudgetSaveName(fileName || ''); setShowSaveModal(true); } }}
                      style={{ background: 'transparent', border: '1px solid rgba(244,239,230,0.5)', color: '#f4efe6', padding: '6px 14px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {saveSuccess ? <><Check size={13} /> Saved</> : 'Save'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowExportModal(true)}
                    style={{ background: '#f4efe6', color: '#1f3a2e', border: 'none', padding: '6px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    Export
                  </button>
                </div>
              </div>

              <section style={{ marginBottom: 48 }}>
                <h2 className="display" style={{ fontSize: 36, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Your new budget</h2>
                <p style={{ color: '#6b6758', margin: '0 0 28px', fontSize: 15 }}>
                  Your current spending, what we suggest, and exactly how to get there.
                </p>

                {/* Summary header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, marginBottom: 40 }}>
                  <div style={{ padding: '20px 24px', background: '#fae8d7', border: '1px solid #c47a3a' }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b3a14', marginBottom: 8 }}>Current spending</div>
                    <div className="display mono" style={{ fontSize: 30, fontWeight: 700, color: '#6b3a14' }}>{fmt(totalCurrent)}<span style={{ fontSize: 14 }}>/mo</span></div>
                  </div>
                  <div style={{ padding: '20px 24px', background: '#dfe8d8', border: '1px solid #2e5a3a' }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2e5a3a', marginBottom: 8 }}>Suggested budget</div>
                    <div className="display mono" style={{ fontSize: 30, fontWeight: 700, color: '#2e5a3a' }}>{fmt(totalSuggested)}<span style={{ fontSize: 14 }}>/mo</span></div>
                  </div>
                  <div style={{ padding: '20px 24px', background: '#1f3a2e', color: '#f4efe6' }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 8 }}>You'd free up</div>
                    <div className="display mono" style={{ fontSize: 30, fontWeight: 700 }}>{fmt(totalSaving)}<span style={{ fontSize: 14, opacity: 0.7 }}>/mo</span></div>
                    <div className="mono" style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{fmt(totalSaving * 12)} per year</div>
                  </div>
                  {income > 0 && (
                    <div style={{ padding: '20px 24px', background: '#ebe4d5', border: '1px solid #d4ccba' }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 8 }}>20% savings goal</div>
                      <div className="display mono" style={{ fontSize: 30, fontWeight: 700 }}>{fmt(savingsGoal)}<span style={{ fontSize: 14, color: '#6b6758' }}>/mo</span></div>
                      <div className="mono" style={{ fontSize: 11, color: '#6b6758', marginTop: 4 }}>from {fmt(income)}/mo income</div>
                    </div>
                  )}
                </div>

                {/* Deficit recovery section */}
                {income > 0 && (income - totalSuggested) < 0 && (() => {
                  const shortfall = totalSuggested - income;
                  return (
                    <section style={{ marginBottom: 48 }}>
                      <div style={{ background: '#2d1a0e', color: '#f4efe6', padding: '28px 32px', marginBottom: 24 }}>
                        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>Budget shortfall</div>
                        <div className="display" style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, lineHeight: 1 }}>
                          You're {fmt(shortfall)}/mo in the red
                        </div>
                        <p style={{ fontSize: 15, opacity: 0.8, margin: 0, lineHeight: 1.5, maxWidth: 560 }}>
                          Cutting costs alone won't close a gap this size. Here are practical ways to get back into the black — ranked by impact.
                        </p>
                      </div>

                      <div style={{ display: 'grid', gap: 0 }}>
                        {DEFICIT_PLAYBOOK.map(({ step, label, timeframe, summary, items }, si) => (
                          <div key={step} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: '0 20px' }}>
                            {/* Step spine */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step === 1 ? '#2d1a0e' : '#1f3a2e', color: '#f4efe6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{step}</div>
                              {si < DEFICIT_PLAYBOOK.length - 1 && (
                                <div style={{ width: 2, flex: 1, background: '#d6cfc4', margin: '4px 0' }} />
                              )}
                            </div>
                            {/* Step content */}
                            <div style={{ paddingBottom: 32 }}>
                              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: step === 1 ? '#b5451b' : '#2e5a3a', marginBottom: 4 }}>{timeframe}</div>
                              <div className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{label}</div>
                              <p style={{ fontSize: 13, color: '#6b6758', margin: '0 0 14px', lineHeight: 1.5 }}>{summary}</p>
                              <div style={{ display: 'grid', gap: 8 }}>
                                {items.map((item, i) => (
                                  <div key={i} style={{ background: '#fff', border: '1px solid #e8e1d0', padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.action}</div>
                                      <div style={{ fontSize: 13, color: '#6b6758', lineHeight: 1.5 }}>{item.note}</div>
                                    </div>
                                    <div style={{ background: step === 1 ? '#2d1a0e' : '#1f3a2e', color: '#f4efe6', padding: '5px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', alignSelf: 'start', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
                                      {item.impact}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })()}

                {/* ── Salary insights ── */}
                <section style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2e5a3a', marginBottom: 6 }}>Income side</div>
                      <h3 className="display" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Can you earn more?</h3>
                    </div>
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #e8e1d0', padding: 24, marginBottom: 16 }}>
                    <div className="salary-form" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div>
                        <label className="mono" style={{ display: 'block', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 6 }}>Your job title</label>
                        <input
                          value={jobTitle}
                          onChange={e => setJobTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && checkSalary()}
                          placeholder="e.g. Software Engineer"
                          style={{ width: '100%', border: '1px solid #d6cfc4', background: '#faf6ee', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label className="mono" style={{ display: 'block', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 6 }}>Location</label>
                        <select
                          value={jobLocation}
                          onChange={e => setJobLocation(e.target.value)}
                          style={{ width: '100%', border: '1px solid #d6cfc4', background: '#faf6ee', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', appearance: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="national">National (avg)</option>
                          <option value="sydney">Sydney</option>
                          <option value="melbourne">Melbourne</option>
                          <option value="brisbane">Brisbane</option>
                          <option value="perth">Perth</option>
                          <option value="canberra">Canberra</option>
                          <option value="adelaide">Adelaide</option>
                          <option value="hobart">Hobart</option>
                          <option value="darwin">Darwin</option>
                        </select>
                      </div>
                      <div>
                        <label className="mono" style={{ display: 'block', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 6 }}>Current salary (optional)</label>
                        <input
                          value={currentSalary}
                          onChange={e => setCurrentSalary(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && checkSalary()}
                          placeholder="e.g. 95000"
                          style={{ width: '100%', border: '1px solid #d6cfc4', background: '#faf6ee', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={checkSalary}
                        style={{ background: '#1f3a2e', color: '#f4efe6', border: 'none', padding: '12px 28px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                      >
                        Check Market
                      </button>
                    </div>
                  </div>

                  {salaryResult && (
                    salaryResult.notFound ? (
                      <div style={{ background: '#fff8f0', border: '1px solid #e8cdb0', padding: '20px 24px', color: '#7a5020' }}>
                        <strong>No match found</strong> for "{salaryResult.query}". Try a more general title like "accountant", "nurse", or "project manager".
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 16 }}>
                        {/* Market range bar */}
                        <div style={{ background: '#fff', border: '1px solid #e8e1d0', padding: 24 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 4 }}>Market rate —{' '}
                                {salaryResult.location === 'national' ? 'National' : salaryResult.location.charAt(0).toUpperCase() + salaryResult.location.slice(1)}
                              </div>
                              <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>{salaryResult.match.title}</div>
                            </div>
                            {salaryResult.pctVsMedian !== null && (
                              <div style={{
                                background: salaryResult.pctVsMedian >= 10 ? '#e8f5ee' : salaryResult.pctVsMedian >= -5 ? '#f0ebe0' : '#fdf0ec',
                                border: `1px solid ${salaryResult.pctVsMedian >= 10 ? '#2e5a3a' : salaryResult.pctVsMedian >= -5 ? '#b0a060' : '#c05030'}`,
                                padding: '10px 18px', textAlign: 'center'
                              }}>
                                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 4 }}>vs median</div>
                                <div className="display" style={{ fontSize: 22, fontWeight: 700, color: salaryResult.pctVsMedian >= 10 ? '#2e5a3a' : salaryResult.pctVsMedian >= -5 ? '#7a6520' : '#c05030' }}>
                                  {salaryResult.pctVsMedian > 0 ? '+' : ''}{salaryResult.pctVsMedian}%
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Range bar */}
                          <div style={{ position: 'relative', marginBottom: 8 }}>
                            <div style={{ height: 12, background: '#e8e1d0', borderRadius: 0, position: 'relative', overflow: 'visible' }}>
                              {/* filled bar */}
                              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: 'linear-gradient(to right, #d6cfc4, #1f3a2e)' }} />
                              {/* current salary marker */}
                              {salaryResult.current > 0 && (() => {
                                const pct = Math.min(100, Math.max(0, ((salaryResult.current - salaryResult.low) / (salaryResult.high - salaryResult.low)) * 100));
                                return (
                                  <div style={{ position: 'absolute', left: `${pct}%`, top: -6, transform: 'translateX(-50%)', width: 4, height: 24, background: '#b5451b', zIndex: 2 }} />
                                );
                              })()}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                              <div style={{ textAlign: 'left' }}>
                                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6758' }}>Low</div>
                                <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>${salaryResult.low.toLocaleString('en-AU')}</div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6758' }}>Median</div>
                                <div className="display" style={{ fontSize: 15, fontWeight: 700, color: '#1f3a2e' }}>${salaryResult.median.toLocaleString('en-AU')}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6758' }}>High</div>
                                <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>${salaryResult.high.toLocaleString('en-AU')}</div>
                              </div>
                            </div>
                          </div>

                          {salaryResult.current > 0 && salaryResult.pctVsMedian < -5 && (
                            <div style={{ marginTop: 16, background: '#fdf0ec', border: '1px solid #e8b090', padding: '12px 16px', fontSize: 13, color: '#7a3010', lineHeight: 1.5 }}>
                              <strong>You're earning below the median.</strong> The typical {salaryResult.match.title} earns ${salaryResult.median.toLocaleString('en-AU')} — that's ${(salaryResult.median - salaryResult.current).toLocaleString('en-AU')} more per year, or ${Math.round((salaryResult.median - salaryResult.current) / 12).toLocaleString('en-AU')}/mo after tax. A job switch at this stage typically yields 15–20% more than an internal raise.
                            </div>
                          )}
                          {salaryResult.current > 0 && salaryResult.pctVsMedian >= -5 && salaryResult.pctVsMedian < 10 && (
                            <div style={{ marginTop: 16, background: '#f8f5e8', border: '1px solid #d6c870', padding: '12px 16px', fontSize: 13, color: '#5a4810', lineHeight: 1.5 }}>
                              <strong>You're around the median.</strong> There's still room to move up — consider negotiating a raise or targeting the next role tier below.
                            </div>
                          )}
                          {salaryResult.current > 0 && salaryResult.pctVsMedian >= 10 && (
                            <div style={{ marginTop: 16, background: '#e8f5ee', border: '1px solid #a0d0b0', padding: '12px 16px', fontSize: 13, color: '#1a4a28', lineHeight: 1.5 }}>
                              <strong>You're above median.</strong> You're well-paid for this role. The next income leap likely requires a title change — see below.
                            </div>
                          )}
                        </div>

                        {/* Next roles */}
                        <div style={{ background: '#fff', border: '1px solid #e8e1d0', padding: 24 }}>
                          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 16 }}>Next career moves</div>
                          <div style={{ display: 'grid', gap: 10 }}>
                            {salaryResult.nextRoles.map(({ title, low, high }) => (
                              <div key={title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#faf6ee', border: '1px solid #e8e1d0' }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div className="display" style={{ fontSize: 16, fontWeight: 700, color: '#2e5a3a' }}>${low.toLocaleString('en-AU')} – ${high.toLocaleString('en-AU')}</div>
                                  <a
                                    href={`https://www.seek.com.au/${salaryResult.field}-jobs`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ background: '#1f3a2e', color: '#f4efe6', padding: '5px 12px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'none', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
                                  >
                                    Seek →
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 12, fontSize: 11, color: '#9a9288' }}>
                            Salary ranges are 2024/25 AU market estimates. Actual salaries vary by employer, experience, and negotiation.
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </section>

                {/* Category cards */}
                <div style={{ display: 'grid', gap: 16 }}>
                  {cats.map(({ cat, current, suggested, saving, tips }) => {
                    const isFixed = FIXED_BUDGET_CATS.has(cat);
                    const noSaving = saving < 2;
                    return (
                      <div key={cat} style={{ border: `1px solid ${noSaving ? '#d4ccba' : '#1f3a2e'}`, background: '#fff' }}>
                        {/* Card header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e8e1d0', background: noSaving ? '#faf6ee' : '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {isFixed && <span className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#ebe4d5', color: '#6b6758', padding: '2px 7px' }}>Committed</span>}
                            <span className="display" style={{ fontSize: 20, fontWeight: 700 }}>{cat}</span>
                          </div>
                          {!noSaving && (
                            <div style={{ background: '#1f3a2e', color: '#f4efe6', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
                              Save {fmt(saving)}/mo
                            </div>
                          )}
                        </div>

                        {/* Numbers row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: tips ? '1px solid #e8e1d0' : 'none', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 4 }}>Current</div>
                            <div className="display mono" style={{ fontSize: 26, fontWeight: 700, color: '#a04020' }}>{fmt(current)}<span style={{ fontSize: 12, color: '#6b6758' }}>/mo</span></div>
                          </div>
                          <ArrowRight size={20} color="#6b6758" style={{ flexShrink: 0 }} />
                          <div style={{ textAlign: 'center' }}>
                            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 4 }}>Suggested</div>
                            <div className="display mono" style={{ fontSize: 26, fontWeight: 700, color: noSaving ? '#6b6758' : '#2e5a3a' }}>{fmt(suggested)}<span style={{ fontSize: 12, color: '#6b6758' }}>/mo</span></div>
                          </div>
                          {!noSaving && (
                            <>
                              <div style={{ width: 1, height: 40, background: '#e8e1d0', flexShrink: 0 }} />
                              <div>
                                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 4 }}>Annual saving</div>
                                <div className="display mono" style={{ fontSize: 20, fontWeight: 700, color: '#2e5a3a' }}>{fmt(saving * 12)}</div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* How to get there */}
                        {tips && (
                          <div style={{ padding: '12px 20px 20px', background: '#faf6ee', display: 'grid', gap: 10 }}>
                            {tips.map((tip, i) => (
                              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', background: '#fff', border: '1px solid #2e5a3a', padding: '14px 18px' }}>
                                <div>
                                  <div className="mono" style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 5 }}>
                                    How to get there
                                  </div>
                                  <div className="display" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>
                                    {tip}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          );
        })()}

        {/* ============ HABITS WIZARD ============ */}
        {view === 'habits' && analysis && (() => {
          const habits = computeHabits();
          const isDone = habitStep >= habits.length;
          const current = habits[habitStep] ?? null;
          const remaining = habits.length - habitStep;
          const committedSaving = habits.reduce((s, h) => habitChoices[h.cat] === true ? s + h.saving : s, 0);

          const CARD_COLORS = [
            { bg: '#FFE566', border: '#D4BC00', text: '#2d2500' },
            { bg: '#ADE8FF', border: '#5ABADF', text: '#001a2d' },
            { bg: '#FFB8CC', border: '#DF5A80', text: '#2d0015' },
            { bg: '#B8FFD4', border: '#5ADF90', text: '#002d15' },
            { bg: '#FFD4A8', border: '#DFA055', text: '#2d1500' },
            { bg: '#D4B8FF', border: '#9055DF', text: '#15002d' },
            { bg: '#FFE5A8', border: '#DFB855', text: '#2d1a00' },
          ];

          const answer = (yes) => {
            setHabitChoices(prev => ({ ...prev, [habits[habitStep].cat]: yes }));
            setHabitStep(prev => prev + 1);
          };

          return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '85vh' }}>
              {/* Top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1f3a2e', color: '#f4efe6' }}>
                <button
                  onClick={() => habitStep === 0 ? setView('upload') : setHabitStep(s => s - 1)}
                  style={{ background: 'transparent', border: 'none', color: '#f4efe6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <span className="mono" style={{ fontSize: 13, letterSpacing: '0.1em' }}>YOUR HABITS</span>
                {!isDone
                  ? <span className="mono" style={{ fontSize: 12, opacity: 0.6 }}>{habitStep + 1} / {habits.length}</span>
                  : <span style={{ width: 40 }} />
                }
              </div>

              {/* CARD STACK */}
              {!isDone && current && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px 20px' }}>
                  <p className="display" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 28px', textAlign: 'center' }}>
                    Let's talk about your habits
                  </p>

                  {/* Stack */}
                  <div style={{ position: 'relative', width: '100%', maxWidth: 400, marginBottom: 28 }}>
                    {/* Shadow cards behind */}
                    {remaining >= 3 && (
                      <div style={{ position: 'absolute', inset: 0, background: CARD_COLORS[(habitStep + 2) % CARD_COLORS.length].bg, transform: 'translateY(14px) translateX(8px) rotate(3deg)', borderRadius: 2, border: `2px solid ${CARD_COLORS[(habitStep + 2) % CARD_COLORS.length].border}` }} />
                    )}
                    {remaining >= 2 && (
                      <div style={{ position: 'absolute', inset: 0, background: CARD_COLORS[(habitStep + 1) % CARD_COLORS.length].bg, transform: 'translateY(7px) translateX(-5px) rotate(-1.5deg)', borderRadius: 2, border: `2px solid ${CARD_COLORS[(habitStep + 1) % CARD_COLORS.length].border}` }} />
                    )}
                    {/* Top card */}
                    {(() => {
                      const col = CARD_COLORS[habitStep % CARD_COLORS.length];
                      return (
                        <div
                          key={habitStep}
                          className="card-in"
                          style={{ position: 'relative', background: col.bg, border: `2px solid ${col.border}`, borderRadius: 2, padding: '32px 28px', color: col.text, boxShadow: '0 6px 28px rgba(0,0,0,0.18)' }}
                        >
                          <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>{current.icon}</div>
                          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, textAlign: 'center', marginBottom: 8 }}>{current.cat}</div>
                          <div className="display" style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, marginBottom: 6 }}>
                            You {current.verb}<br />
                            <span style={{ color: '#c04010' }}>{Math.round(current.countPerMonth)} times</span> a month
                          </div>
                          <div style={{ fontSize: 14, textAlign: 'center', opacity: 0.7, marginBottom: 24 }}>
                            {fmt(current.avgPerVisit)} avg · {fmt(current.spendPerMonth)}/mo
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.07)', borderRadius: 2, padding: '16px 20px', textAlign: 'center', marginBottom: 0 }}>
                            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Would you be willing to drop to</div>
                            <div className="display" style={{ fontSize: 38, fontWeight: 700, lineHeight: 1 }}>
                              {current.suggestedCount}<span style={{ fontSize: 18, fontWeight: 400 }}>× /mo</span>
                            </div>
                            {current.saving > 2 && (
                              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Save {fmt(current.saving)}/mo</div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 400 }}>
                    <button
                      onClick={() => answer(true)}
                      style={{ background: '#1f3a2e', color: '#f4efe6', border: 'none', padding: '18px', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 2 }}
                    >
                      Yes, I can
                    </button>
                    <button
                      onClick={() => answer(false)}
                      style={{ background: '#fff', color: '#3a3d38', border: '2px solid #d6cfc4', padding: '18px', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 2 }}
                    >
                      Not right now
                    </button>
                  </div>
                </div>
              )}

              {/* DONE SCREEN */}
              {isDone && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto', width: '100%' }}>
                  <div className="display" style={{ fontSize: 44, fontWeight: 700, margin: '0 0 8px' }}>All done.</div>
                  {committedSaving > 0 ? (
                    <>
                      <p style={{ fontSize: 16, color: '#6b6758', margin: '0 0 24px', lineHeight: 1.6 }}>Based on your answers, you could save</p>
                      <div style={{ background: '#1f3a2e', color: '#f4efe6', padding: '24px 40px', marginBottom: 28, width: '100%' }}>
                        <div className="display" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{fmt(committedSaving)}<span style={{ fontSize: 20, fontWeight: 400, opacity: 0.7 }}>/mo</span></div>
                        <div className="mono" style={{ fontSize: 11, opacity: 0.6, marginTop: 6, letterSpacing: '0.1em' }}>{fmt(committedSaving * 12)} PER YEAR</div>
                      </div>
                      <div style={{ width: '100%', marginBottom: 28 }}>
                        {habits.map((h, i) => (
                          <div key={h.cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e8e1d0', fontSize: 14 }}>
                            <span>{h.icon} {h.cat}</span>
                            {habitChoices[h.cat] === true
                              ? <span style={{ color: '#2e5a3a', fontWeight: 700 }}>−{fmt(h.saving)}/mo</span>
                              : <span style={{ color: '#b0a898' }}>Keeping as is</span>
                            }
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 16, color: '#6b6758', margin: '0 0 32px', lineHeight: 1.6 }}>
                      No worries — your budget reflects your actual spending and we'll find other ways to save.
                    </p>
                  )}
                  <button
                    onClick={() => goToBudgetWithHabits(habitChoices)}
                    style={{ background: '#1f3a2e', color: '#f4efe6', border: 'none', padding: '18px', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', width: '100%' }}
                  >
                    Build My Budget →
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ============ BUDGETS DASHBOARD ============ */}
        {view === 'budgets' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2e5a3a', marginBottom: 6 }}>Cloud</div>
                <h2 className="display" style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>My Budgets</h2>
              </div>
              <button
                onClick={() => { setView('upload'); setLoadedCats(null); }}
                style={{ background: '#1f3a2e', color: '#f4efe6', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <PlusCircle size={15} /> Create New Budget
              </button>
            </div>

            {budgetsLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6b6758' }}><Loader size={24} className="mono" /></div>
            ) : savedBudgets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', border: '2px dashed #d6cfc4' }}>
                <FolderOpen size={40} color="#b0a898" style={{ marginBottom: 16 }} />
                <div className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No saved budgets yet</div>
                <p style={{ color: '#6b6758', margin: '0 0 24px' }}>Upload a statement and save your budget to see it here.</p>
                <button onClick={() => setView('upload')} style={{ background: '#1f3a2e', color: '#f4efe6', border: 'none', padding: '12px 24px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Upload a Statement
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {savedBudgets.map(b => {
                  const surplus = (b.data.income ?? 0) - (b.data.cats ?? []).reduce((s, c) => s + c.suggested, 0);
                  return (
                    <div key={b.id} style={{ background: '#fff', border: '1px solid #d6cfc4', padding: 24, position: 'relative' }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 8 }}>
                        {new Date(b.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, paddingRight: 32 }}>{b.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                        <div style={{ background: '#f4efe6', padding: '10px 14px' }}>
                          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 4 }}>Income</div>
                          <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>${Math.round(b.data.income ?? 0).toLocaleString('en-AU')}</div>
                        </div>
                        <div style={{ background: surplus >= 0 ? '#dfe8d8' : '#fde8e8', padding: '10px 14px' }}>
                          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 4 }}>Surplus</div>
                          <div className="display" style={{ fontSize: 18, fontWeight: 700, color: surplus >= 0 ? '#2e5a3a' : '#a03030' }}>${Math.round(surplus).toLocaleString('en-AU')}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => openSavedBudget(b)}
                          style={{ flex: 1, background: '#1f3a2e', color: '#f4efe6', border: 'none', padding: '10px 0', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => deleteBudget(b.id)}
                          style={{ background: 'none', border: '1px solid #d6cfc4', color: '#6b6758', padding: '10px 12px', cursor: 'pointer' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ SETTINGS ============ */}
        {view === 'settings' && user && (
          <div className="fade-in" style={{ maxWidth: 560 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2e5a3a', marginBottom: 6 }}>Account</div>
            <h2 className="display" style={{ fontSize: 36, fontWeight: 700, margin: '0 0 32px' }}>Settings</h2>

            <div style={{ background: '#fff', border: '1px solid #d6cfc4', padding: 24, marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 12 }}>Profile</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1f3a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#f4efe6' }}>
                  {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{user.user_metadata?.full_name || 'No name'}</div>
                  <div className="mono" style={{ fontSize: 12, color: '#6b6758' }}>{user.email}</div>
                  <div className="mono" style={{ fontSize: 11, color: '#b0a898', marginTop: 2 }}>
                    Signed in via {user.app_metadata?.provider ?? 'email'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #d6cfc4', padding: 24, marginBottom: 16 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 12 }}>Export unlock</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>Budget report download</span>
                <span className="mono" style={{ fontSize: 12, color: isPaid ? '#2e5a3a' : '#6b6758', fontWeight: 600 }}>
                  {isPaid ? '✓ Unlocked' : 'Not purchased'}
                </span>
              </div>
            </div>

            <button
              onClick={signOut}
              style={{ width: '100%', padding: '14px 24px', background: 'none', border: '1px solid #d6cfc4', color: '#6b6758', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}

        {/* ============ AUTH MODAL ============ */}
        {showAuthModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,31,26,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) setShowAuthModal(false); }}
          >
            <div style={{ background: '#f4efe6', maxWidth: 440, width: '100%', padding: 40, position: 'relative' }}>
              <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b6758' }}>×</button>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2e5a3a', marginBottom: 8 }}>Free account</div>
              <div className="display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.1 }}>Sign in to save your budgets</div>
              <p style={{ fontSize: 14, color: '#6b6758', margin: '0 0 28px', lineHeight: 1.5 }}>
                Your budgets sync across devices. No password needed — use your existing account.
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { provider: 'google', label: 'Continue with Google', color: '#fff', textColor: '#1a1f1a', border: '1px solid #d6cfc4' },
                  { provider: 'azure', label: 'Continue with Microsoft', color: '#0078d4', textColor: '#fff', border: 'none' },
                  { provider: 'apple', label: 'Continue with Apple', color: '#000', textColor: '#fff', border: 'none' },
                ].map(({ provider, label, color, textColor, border }) => (
                  <button
                    key={provider}
                    onClick={() => signIn(provider)}
                    style={{ padding: '14px 20px', background: color, color: textColor, border, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#b0a898', margin: '20px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
                Apple sign-in requires an Apple Developer account to be configured. Google and Microsoft work out of the box.
              </p>
            </div>
          </div>
        )}

        {/* ============ SAVE BUDGET MODAL ============ */}
        {showSaveModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,31,26,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
          >
            <div style={{ background: '#f4efe6', maxWidth: 400, width: '100%', padding: 40, position: 'relative' }}>
              <button onClick={() => setShowSaveModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b6758' }}>×</button>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2e5a3a', marginBottom: 8 }}>Save</div>
              <div className="display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Name this budget</div>
              <input
                type="text"
                value={budgetSaveName}
                onChange={e => setBudgetSaveName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveBudget()}
                placeholder={fileName || 'My Budget'}
                autoFocus
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #1f3a2e', background: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none', marginBottom: 16 }}
              />
              <button
                onClick={saveBudget}
                style={{ width: '100%', padding: '14px 24px', background: '#1f3a2e', color: '#f4efe6', border: 'none', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Save Budget
              </button>
            </div>
          </div>
        )}

        {/* ============ EXPORT / PAYWALL MODAL ============ */}
        {showExportModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,31,26,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false); }}
          >
            <div style={{ background: '#f4efe6', maxWidth: 480, width: '100%', padding: 40, position: 'relative' }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b6758', lineHeight: 1 }}
              >×</button>

              {isPaid ? (
                <>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2e5a3a', marginBottom: 8 }}>Export</div>
                  <div className="display" style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Save your budget</div>
                  <p style={{ fontSize: 14, color: '#6b6758', margin: '0 0 28px', lineHeight: 1.5 }}>
                    Download your budget plan or print it as a PDF.
                  </p>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <button
                      onClick={() => { exportReport(computeBudgetCats(analysis)); setShowExportModal(false); }}
                      style={{ padding: '16px 24px', background: '#1f3a2e', color: '#f4efe6', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>Download Budget Report</span>
                      <span style={{ opacity: 0.7, fontSize: 13 }}>Open in browser · print to PDF</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 8 }}>Unlock</div>
                  <div className="display" style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, lineHeight: 1.1 }}>Export your budget plan</div>
                  <p style={{ fontSize: 15, color: '#3a3d38', margin: '0 0 24px', lineHeight: 1.5 }}>
                    One-time payment. Download your personalised budget as a CSV or PDF — yours to keep and use in any spreadsheet.
                  </p>

                  <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
                    {[
                      'Branded HTML report — income vs suggested budget, side by side',
                      'Tips per category — open in any browser, print to PDF',
                      'Yours forever — no subscription, no account required',
                    ].map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#3a3d38' }}>
                        <Check size={16} color="#2e5a3a" style={{ flexShrink: 0, marginTop: 2 }} />
                        {feat}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { window.location.href = STRIPE_PAYMENT_LINK; }}
                    style={{ width: '100%', padding: '18px 24px', background: '#1f3a2e', color: '#f4efe6', border: 'none', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>Unlock for $4.99</span>
                    <span style={{ opacity: 0.7, fontSize: 13 }}>One-time · Secure checkout</span>
                  </button>

                  <p style={{ fontSize: 12, color: '#6b6758', margin: 0, textAlign: 'center' }}>
                    Powered by Stripe. Your card details never touch this site.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        <footer style={{ marginTop: 80, paddingTop: 24, borderTop: '3px double #1f3a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#6b6758' }}>
          <div className="mono" style={{ letterSpacing: '0.1em' }}>
            <Check size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            ZERO PII RETENTION · CLIENT-SIDE PROCESSING
          </div>
          <div className="mono" style={{ letterSpacing: '0.1em' }}>FINIS</div>
        </footer>
      </div>
    </div>
  );
}

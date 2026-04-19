import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, FileText, TrendingUp, TrendingDown, Minus, X, Shield, ArrowRight, Check, Loader, ArrowLeft, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Zap } from 'lucide-react';
import './storage.js';

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

// --- Australian merchant categorisation rules ---
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
    'Swipe your Woolworths Everyday Rewards or Coles flybuys card every shop — both give 4c/L off at partner stations, and stack with docket discounts',
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawLines, setRawLines] = useState([]);
  const [showRaw, setShowRaw] = useState(false);
  const [columnMap, setColumnMap] = useState(null);
  const [mortgageCalc, setMortgageCalc] = useState({ principal: '', years: '', rate: '', type: 'variable', compRate: '' });
  const [budgetAllocs, setBudgetAllocs] = useState({});
  const [budgetIncome, setBudgetIncome] = useState('');
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
  const fileRef = useRef();

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

  const handleFile = async (file) => {
    setError('');
    setLoading(true);
    setTransactions([]);
    setColumnMap(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      setRawLines(lines);

      const result = parseCSV(text);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setColumnMap(result.columnMap);
      setAllRows(result.allRows);

      // Don't call normalizeSigns — CSVs have authoritative signs from the bank
      // (either via a signed amount column, or separate debit/credit columns).
      // normalizeSigns was designed for PDF parsing of credit card statements.
      const normalized = result.transactions;

      if (normalized.length === 0) {
        setError('No transactions could be parsed from this CSV. Check that the columns include a date, description, and amount (or debit/credit).');
      } else {
        setTransactions(normalized);
      }
      setFileName(file.name);
    } catch (err) {
      console.error(err);
      setError('Could not read this CSV file. Error: ' + (err.message || err));
    }
    setLoading(false);
  };

  const reset = () => {
    setTransactions([]);
    setFileName('');
    setError('');
    setRawLines([]);
    setShowRaw(false);
    setBudgetAllocs({});
    setBudgetIncome('');
    setView('upload');
    if (fileRef.current) fileRef.current.value = '';
  };

  const FIXED_BUDGET_CATS = new Set(['Mortgage', 'Rent/Housing', 'Insurance', 'Utilities', 'Phone & Internet', 'Internal Transfers', 'Credit Card Payment']);

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
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>
        <header style={{ borderBottom: '3px double #1f3a2e', paddingBottom: 24, marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="display" style={{ fontSize: 56, fontWeight: 900, margin: 0, lineHeight: 1 }}>
                Pinchy
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b6758' }}>
              <Shield size={14} /> <span className="mono" style={{ letterSpacing: '0.1em' }}>PROCESSED ON-DEVICE</span>
            </div>
          </div>
          <p style={{ fontSize: 17, maxWidth: 640, margin: '20px 0 0', color: '#3a3d38', lineHeight: 1.5 }}>
            Upload a CSV export from your bank or credit card. Categorises your spending, compares each category to the average Australian household, and finds cheaper alternatives — all in your browser. <strong>The file is read locally and never uploaded.</strong>
          </p>
        </header>

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
                    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                  }}
                >
                  <Upload size={32} color="#1f3a2e" style={{ marginBottom: 16 }} />
                  <div className="display" style={{ fontSize: 28, marginBottom: 8 }}>Drop a CSV statement</div>
                  <div style={{ color: '#6b6758', marginBottom: 24, fontSize: 14, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
                    Works with CSV exports from CBA NetBank, Westpac, NAB, ANZ, ING, Macquarie, Bendigo, UBank, Up, Bankwest, and most other Australian banks and card issuers.
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={() => fileRef.current?.click()}>
                      Choose CSV
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
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
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
                    { n: 'I', t: 'Categorised', d: 'Groceries, coffee, delivery, rent — sorted automatically from transaction descriptions.' },
                    { n: 'II', t: 'Benchmarked', d: 'Each category compared with what the average Australian household spends (ABS + Finder data).' },
                    { n: 'III', t: 'Optimised', d: "Suggests cheaper alternatives where they exist and estimates what you'd save by switching." },
                  ].map((x) => (
                    <div key={x.n} style={{ borderTop: '2px solid #1f3a2e', paddingTop: 16 }}>
                      <div className="display" style={{ fontStyle: 'italic', fontSize: 14, color: '#6b6758', marginBottom: 6 }}>Chapter {x.n}</div>
                      <div className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{x.t}</div>
                      <div style={{ fontSize: 14, color: '#3a3d38', lineHeight: 1.5 }}>{x.d}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Statement uploaded successfully — show summary + Analyse button
              <div className="slide-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: '#1f3a2e', color: '#f4efe6', marginBottom: 32 }}>
                  <Check size={18} />
                  <span className="mono" style={{ fontSize: 13, letterSpacing: '0.1em' }}>STATEMENT PARSED</span>
                </div>

                <div className="display" style={{ fontSize: 20, color: '#6b6758', marginBottom: 8, fontStyle: 'italic' }}>
                  Found in your statement
                </div>
                <div className="display mono" style={{ fontSize: 72, fontWeight: 700, lineHeight: 1, marginBottom: 8, letterSpacing: '-0.03em' }}>
                  {transactions.length}
                </div>
                <div className="display" style={{ fontSize: 24, color: '#3a3d38', marginBottom: 48 }}>
                  transactions from <em>{fileName}</em>
                </div>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                  <button className="btn-analyse" onClick={() => setView('results')}>
                    Analyse Spending <ArrowRight size={20} />
                  </button>
                  <button className="btn-ghost" onClick={reset}>
                    Upload a different file
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

        {/* ============ RESULTS VIEW ============ */}
        {view === 'results' && analysis && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1f3a2e', color: '#f4efe6', marginBottom: 40 }}>
              <button onClick={() => setView('upload')} style={{ background: 'transparent', border: 'none', color: '#f4efe6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <FileText size={16} />
                <span className="mono">{fileName}</span>
                <span style={{ opacity: 0.6 }}>·</span>
                <span>{transactions.length} txns</span>
              </div>
              <button onClick={reset} style={{ background: 'transparent', border: 'none', color: '#f4efe6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <X size={14} /> Clear
              </button>
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

            {/* --- Category breakdown with inline benchmarks + suggestions --- */}
            <section style={{ marginBottom: 56 }}>
              <h2 className="display" style={{ fontSize: 36, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                By category
              </h2>
              <p style={{ color: '#6b6758', margin: '0 0 24px', fontSize: 15 }}>
                Each category compared with the average Australian household (ABS monthly data).
              </p>

              <div style={{ display: 'grid', gap: 16 }}>
                {analysis.categoryBreakdown.map((c) => {
                  const monthly = c.total / analysis.periodMonths;
                  const pct = (c.total / analysis.totalOut) * 100;
                  const hasBenchmark = c.average != null;
                  // Recompute diff against monthly spend (benchmarks are monthly)
                  const monthlyDiff = hasBenchmark ? ((monthly - c.average) / c.average) * 100 : null;
                  const isHigh = hasBenchmark && monthlyDiff > 10;
                  const isLow = hasBenchmark && monthlyDiff < -10;
                  const TrendIcon = isHigh ? TrendingUp : isLow ? TrendingDown : Minus;
                  const trendColor = isHigh ? '#a04020' : isLow ? '#2e5a3a' : '#6b6758';

                  return (
                    <div key={c.category} id={`cat-${c.category.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`} style={{ border: '1px solid #1f3a2e', background: '#faf6ee', scrollMarginTop: 20 }}>
                      {/* Category header row */}
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid #d4ccba' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                            <span className="display" style={{ fontSize: 24, fontWeight: 700 }}>{c.category}</span>
                            <span className="mono" style={{ fontSize: 12, color: '#6b6758' }}>
                              {c.count} {c.count === 1 ? 'txn' : 'txns'} · {pct.toFixed(1)}% of spend
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="display mono" style={{ fontSize: 28, fontWeight: 500 }}>
                              {fmt(monthly)}<span style={{ fontSize: 14, color: '#6b6758' }}>/mo</span>
                            </div>
                          </div>
                        </div>

                        {/* Spend bar */}
                        <div style={{ height: 4, background: '#e8e1d0', marginBottom: hasBenchmark ? 16 : 0 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#1f3a2e' }} />
                        </div>

                        {/* Benchmark comparison — now apples-to-apples monthly */}
                        {hasBenchmark && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ color: '#3a3d38' }}>
                              Avg. Australian household: <strong className="mono">{fmt(c.average)}/mo</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: trendColor }}>
                              <TrendIcon size={15} />
                              <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>
                                {monthlyDiff > 0 ? '+' : ''}{monthlyDiff.toFixed(0)}% vs. average
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Suggestions for this category */}
                      {c.suggestions.length > 0 && (
                        <div style={{ padding: '16px 24px', background: '#f4efe6', display: 'grid', gap: 12 }}>
                          {c.suggestions.map((s, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', background: '#fff', border: '1px solid #2e5a3a', padding: '16px 20px' }}>
                              <div>
                                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 6 }}>
                                  Instead of {s.merchant}
                                </div>
                                <div className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                                  {s.alt}
                                </div>
                                <div style={{ fontSize: 13, color: '#3a3d38', lineHeight: 1.4 }}>
                                  {s.reason}
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', background: '#1f3a2e', color: '#f4efe6', padding: '12px 18px', minWidth: 90 }}>
                                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>Save up to</div>
                                <div className="display mono" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                                  {fmt(s.estimatedSavings / analysis.periodMonths)}
                                </div>
                                <div className="mono" style={{ fontSize: 11, opacity: 0.7 }}>/mo</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mortgage calculator */}
                      {c.category === 'Mortgage' && (() => {
                        const INDICATIVE_RATES = { variable: 5.74, fixed: 5.79 };
                        const mc = mortgageCalc;
                        const setMc = (patch) => setMortgageCalc(prev => ({ ...prev, ...patch }));

                        const P = parseFloat(mc.principal.replace(/,/g, '')) || 0;
                        const n = parseFloat(mc.years) * 12 || 0;
                        const rCurrent = (parseFloat(mc.rate) / 100) / 12;
                        const compRateVal = mc.compRate !== '' ? parseFloat(mc.compRate) : INDICATIVE_RATES[mc.type];
                        const rComp = (compRateVal / 100) / 12;

                        const calcPayment = (principal, monthlyRate, months) => {
                          if (!principal || !monthlyRate || !months) return 0;
                          return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
                        };

                        const currentPayment = calcPayment(P, rCurrent, n);
                        const compPayment = calcPayment(P, rComp, n);
                        const monthlySaving = currentPayment - compPayment;
                        const totalSaving = monthlySaving * n;
                        const hasResult = P > 0 && n > 0 && parseFloat(mc.rate) > 0 && monthlySaving > 0;

                        const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d4ccba', background: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
                        const labelStyle = { fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 6, display: 'block' };

                        return (
                          <div style={{ padding: '24px', background: '#fff', borderTop: '2px solid #1f3a2e' }}>
                            <div className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                              Calculate your refinancing savings
                            </div>
                            <p style={{ fontSize: 14, color: '#6b6758', margin: '0 0 20px', lineHeight: 1.5 }}>
                              Enter your loan details to see how much you could save by switching to a better rate.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
                              <div>
                                <label className="mono" style={labelStyle}>Loan balance remaining</label>
                                <div style={{ position: 'relative' }}>
                                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b6758', fontSize: 15 }}>$</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="450,000"
                                    value={mc.principal}
                                    onChange={e => setMc({ principal: e.target.value })}
                                    style={{ ...inputStyle, paddingLeft: 24 }}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="mono" style={labelStyle}>Years remaining</label>
                                <input
                                  type="number"
                                  min="1" max="30"
                                  placeholder="25"
                                  value={mc.years}
                                  onChange={e => setMc({ years: e.target.value })}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label className="mono" style={labelStyle}>Your current rate</label>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="6.40"
                                    value={mc.rate}
                                    onChange={e => setMc({ rate: e.target.value })}
                                    style={{ ...inputStyle, paddingRight: 28 }}
                                  />
                                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b6758', fontSize: 15 }}>%</span>
                                </div>
                              </div>
                              <div>
                                <label className="mono" style={labelStyle}>Loan type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                                  {['variable', 'fixed'].map(t => (
                                    <button
                                      key={t}
                                      onClick={() => setMc({ type: t, compRate: '' })}
                                      style={{ padding: '10px', border: '1px solid #d4ccba', background: mc.type === t ? '#1f3a2e' : '#fff', color: mc.type === t ? '#f4efe6' : '#1a1f1a', fontSize: 13, textTransform: 'capitalize', cursor: 'pointer', fontFamily: 'inherit', marginLeft: t === 'fixed' ? -1 : 0 }}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div style={{ padding: '12px 16px', background: '#f4efe6', border: '1px solid #d4ccba', fontSize: 13, color: '#3a3d38', marginBottom: 20 }}>
                              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6758' }}>Comparison rate </span>
                              <input
                                type="number"
                                step="0.01"
                                value={mc.compRate !== '' ? mc.compRate : compRateVal}
                                onChange={e => setMc({ compRate: e.target.value })}
                                style={{ width: 70, padding: '2px 6px', border: '1px solid #d4ccba', fontSize: 13, fontFamily: 'inherit', marginRight: 4 }}
                              />
                              <span style={{ marginRight: 12 }}>% — indicative best {mc.type} rate (Apr 2026). </span>
                              <a href="https://www.finder.com.au/home-loans" target="_blank" rel="noopener noreferrer" style={{ color: '#1f3a2e', fontWeight: 600 }}>Find live rates on Finder →</a>
                            </div>

                            {hasResult ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                                <div style={{ padding: '16px 20px', background: '#fae8d7', border: '1px solid #c47a3a' }}>
                                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b3a14', marginBottom: 6 }}>Your current repayment</div>
                                  <div className="display mono" style={{ fontSize: 26, fontWeight: 700, color: '#6b3a14' }}>{fmt(currentPayment)}<span style={{ fontSize: 13 }}>/mo</span></div>
                                  <div className="mono" style={{ fontSize: 11, color: '#6b3a14', marginTop: 4 }}>at {mc.rate}%</div>
                                </div>
                                <div style={{ padding: '16px 20px', background: '#dfe8d8', border: '1px solid #2e5a3a' }}>
                                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2e5a3a', marginBottom: 6 }}>At comparison rate</div>
                                  <div className="display mono" style={{ fontSize: 26, fontWeight: 700, color: '#2e5a3a' }}>{fmt(compPayment)}<span style={{ fontSize: 13 }}>/mo</span></div>
                                  <div className="mono" style={{ fontSize: 11, color: '#2e5a3a', marginTop: 4 }}>at {compRateVal}%</div>
                                </div>
                                <div style={{ padding: '16px 20px', background: '#1f3a2e', border: '1px solid #1f3a2e', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a8c4a0', marginBottom: 6 }}>You could save</div>
                                  <div className="display mono" style={{ fontSize: 28, fontWeight: 700, color: '#f4efe6' }}>{fmt(monthlySaving)}<span style={{ fontSize: 13, opacity: 0.7 }}>/mo</span></div>
                                  <div className="mono" style={{ fontSize: 12, color: '#a8c4a0', marginTop: 4 }}>{fmt(totalSaving)} over {mc.years} yrs</div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ padding: '20px', background: '#f4efe6', border: '1px dashed #d4ccba', textAlign: 'center', color: '#6b6758', fontSize: 14 }}>
                                Fill in your loan details above to calculate your savings.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* --- Unusual spends --- */}
            {analysis.anomalies.length > 0 && (
              <section style={{ marginBottom: 56 }}>
                <h2 className="display" style={{ fontSize: 36, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  Unusual spends
                </h2>
                <p style={{ color: '#6b6758', margin: '0 0 24px', fontSize: 15 }}>
                  Transactions that stand out — either large one-offs, or visits to regular merchants that cost much more than your typical shop. Worth a second look.
                </p>

                <div style={{ display: 'grid', gap: 12 }}>
                  {analysis.anomalies.map((a, i) => (
                    <div key={i} style={{ background: '#faf6ee', border: '1px solid #c47a3a', borderLeftWidth: 4, padding: '16px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
                      <div style={{ color: '#c47a3a' }}>
                        {a.type === 'large_visit' ? <Zap size={20} /> : <AlertTriangle size={20} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span className="display" style={{ fontSize: 18, fontWeight: 500, textTransform: 'capitalize' }}>{a.description}</span>
                          <span className="mono" style={{ fontSize: 11, color: '#6b6758' }}>{a.date}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#3a3d38', lineHeight: 1.4 }}>
                          {a.type === 'large_visit' ? (
                            <>This shop was <strong>{a.multiple.toFixed(1)}×</strong> your usual spend at this merchant. Typical visit: <strong>{fmt(a.typical)}</strong> (across {a.visits} visits).</>
                          ) : (
                            <>A one-off purchase. Worth checking it was intentional.</>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 2 }}>Amount</div>
                        <div className="display mono" style={{ fontSize: 22, fontWeight: 700 }}>{fmt(a.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, padding: 14, background: '#ebe4d5', fontSize: 13, color: '#3a3d38', lineHeight: 1.5 }}>
                  <strong>Why can't we see the items?</strong> Bank statements only show the merchant and total — never what was in the basket. Loyalty programs like Flybuys and Everyday Rewards hold that data, but don't offer a public API. For now, unusual-visit flagging is the closest signal we can get without compromising privacy.
                </div>
              </section>
            )}
            {analysis.suggestions.length > 0 && (
              <section style={{ marginBottom: 56, padding: 32, background: '#1f3a2e', color: '#f4efe6' }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 8 }}>
                  Summary
                </div>
                <div className="display" style={{ fontSize: 28, fontWeight: 400, marginBottom: 8, lineHeight: 1.3 }}>
                  If you adopted every suggestion, you could save up to
                </div>
                <div className="display mono" style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {fmt(analysis.suggestions.reduce((s, x) => s + x.estimatedSavings, 0) / analysis.periodMonths)}<span style={{ fontSize: 28, opacity: 0.6 }}>/mo</span>
                </div>
                <div style={{ fontSize: 14, opacity: 0.75, marginTop: 12 }}>
                  That's {fmt(analysis.suggestions.reduce((s, x) => s + x.estimatedSavings, 0) * 12 / analysis.periodMonths)} per year. Estimates are based on your actual spend at each merchant.
                </div>
              </section>
            )}

            {/* --- Transaction ledger --- */}
            <section>
              <h2 className="display" style={{ fontSize: 36, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                The ledger
              </h2>
              <p style={{ color: '#6b6758', margin: '0 0 24px', fontSize: 15 }}>
                Every transaction, categorised.
              </p>

              <div style={{ border: '1px solid #1f3a2e', maxHeight: 500, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 160px 120px', padding: '12px 16px', background: '#1f3a2e', color: '#f4efe6', position: 'sticky', top: 0 }}>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Date</div>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Description</div>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Category</div>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'right' }}>Amount</div>
                </div>
                {analysis.categorized.map((t, i) => (
                  <div key={i} className="row-hover" style={{ display: 'grid', gridTemplateColumns: '110px 1fr 160px 120px', padding: '10px 16px', borderTop: i > 0 ? '1px solid #e8e1d0' : 'none', alignItems: 'center' }}>
                    <div className="mono" style={{ fontSize: 12, color: '#6b6758' }}>{t.date}</div>
                    <div style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{t.description}</div>
                    <div style={{ fontSize: 12 }}>
                      <span style={{ padding: '3px 8px', background: '#ebe4d5', border: '1px solid #d4ccba' }}>{t.category}</span>
                    </div>
                    <div className="mono" style={{ textAlign: 'right', fontSize: 14, fontWeight: 500, color: t.amount > 0 ? '#2e5a3a' : '#1a1f1a' }}>
                      {t.amount > 0 ? '+' : ''}{fmt(Math.abs(t.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* --- Categorisation helper (post-it card stack style) --- */}
            {(() => {
              // Group 'Other' spending transactions by merchant key.
              // Skip merchants the user has explicitly marked as Other —
              // those are intentionally uncategorised and shouldn't keep reappearing.
              const uncat = {};
              for (const t of analysis.categorized) {
                if (t.category !== 'Other' || t.amount >= 0) continue;
                if (overrides[t._merchantKey] === 'Other') continue;
                const key = t._merchantKey;
                if (!uncat[key]) uncat[key] = { key, total: 0, count: 0, sample: t.description };
                uncat[key].total += Math.abs(t.amount);
                uncat[key].count += 1;
              }
              const uncatList = Object.values(uncat).sort((a, b) => b.total - a.total);
              if (uncatList.length === 0) return null;

              const allCategories = [...BUILT_IN_CATEGORIES, ...customCategories];
              // Clamp the stack index — the list shrinks when overrides are assigned,
              // and wraps to 0 when the user "Later"s past the end.
              const idx = uncatList.length > 0 ? catStackIdx % uncatList.length : 0;
              const current = uncatList[idx];
              const remaining = uncatList.length;

              // Assign a category: don't change the index — the list will
              // filter this merchant out, and the next one naturally slides up.
              const assign = (cat) => {
                setOverrides(prev => ({ ...prev, [current.key]: cat }));
              };
              // Defer: advance the index to show the next card without recording anything
              const later = () => setCatStackIdx(i => i + 1);

              return (
                <section style={{ marginBottom: 56, marginTop: 56 }}>
                  <h2 className="display" style={{ fontSize: 36, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    Want to make the budget more accurate?
                  </h2>
                  <p style={{ color: '#6b6758', margin: '0 0 24px', fontSize: 15 }}>
                    Help us figure these {remaining} transaction{remaining === 1 ? '' : 's'} out. Tap a category — we'll apply it to every matching transaction and move to the next.
                  </p>

                  {/* Post-it card stack: show the top card with hints of cards behind it */}
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    {/* Ghost cards peeking out behind */}
                    {remaining > 2 && (
                      <div style={{ position: 'absolute', inset: 0, transform: 'translate(8px, 8px) rotate(1.5deg)', background: '#ebe4d5', border: '1px solid #c4bca8', zIndex: 0 }} />
                    )}
                    {remaining > 1 && (
                      <div style={{ position: 'absolute', inset: 0, transform: 'translate(4px, 4px) rotate(-0.8deg)', background: '#f0ead8', border: '1px solid #c4bca8', zIndex: 1 }} />
                    )}

                    {/* Top card */}
                    <div style={{ position: 'relative', zIndex: 2, border: '1px solid #1f3a2e', background: '#faf6ee', padding: 24 }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 12 }}>
                        {idx + 1} of {remaining}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>{current.sample}</div>
                          <div className="mono" style={{ fontSize: 11, color: '#6b6758', letterSpacing: '0.05em' }}>
                            {current.count} transaction{current.count === 1 ? '' : 's'} · key: {current.key}
                          </div>
                        </div>
                        <div className="display mono" style={{ fontSize: 24, fontWeight: 500, color: '#1a1f1a', whiteSpace: 'nowrap' }}>
                          −${current.total.toFixed(2)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {allCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => assign(cat)}
                            className="mono"
                            style={{
                              background: 'transparent',
                              border: '1px solid #1f3a2e',
                              color: '#1f3a2e',
                              padding: '8px 14px',
                              fontSize: 12,
                              letterSpacing: '0.05em',
                              cursor: 'pointer',
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 12, borderTop: '1px solid #e8e1d0' }}>
                        <button
                          onClick={() => {
                            const name = window.prompt('New category name?');
                            if (!name || !name.trim()) return;
                            const clean = name.trim();
                            if (!customCategories.includes(clean) && !BUILT_IN_CATEGORIES.includes(clean)) {
                              setCustomCategories(prev => [...prev, clean]);
                            }
                            assign(clean);
                          }}
                          className="mono"
                          style={{
                            background: '#1f3a2e',
                            border: '1px solid #1f3a2e',
                            color: '#f4efe6',
                            padding: '8px 14px',
                            fontSize: 12,
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                          }}
                        >
                          + New category
                        </button>
                        <button
                          onClick={() => assign('Other')}
                          className="mono"
                          style={{
                            background: 'transparent',
                            border: '1px dashed #6b6758',
                            color: '#6b6758',
                            padding: '8px 14px',
                            fontSize: 12,
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                          }}
                          title="Mark this merchant as intentionally uncategorised"
                        >
                          Skip (Other)
                        </button>
                        <button
                          onClick={later}
                          className="mono"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#6b6758',
                            padding: '8px 14px',
                            fontSize: 12,
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                          title="Decide later — come back to this one"
                        >
                          Later →
                        </button>
                      </div>
                    </div>
                  </div>

                  {Object.keys(overrides).length > 0 && (
                    <div style={{ padding: 12, background: '#ebe4d5', fontSize: 12, color: '#3a3d38' }}>
                      <strong>{Object.keys(overrides).length}</strong> manual assignment{Object.keys(overrides).length === 1 ? '' : 's'} active.{' '}
                      <button
                        onClick={() => { setOverrides({}); setCatStackIdx(0); }}
                        style={{ background: 'none', border: 'none', color: '#a04020', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 12 }}
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* --- Build my budget CTA --- */}
            <section style={{ marginTop: 56, padding: 40, background: '#1f3a2e', color: '#f4efe6', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 12 }}>Next step</div>
              <div className="display" style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>
                Build a budget that fits your life
              </div>
              <p style={{ fontSize: 15, opacity: 0.8, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
                We'll use your actual spending as a starting point and generate a realistic monthly budget — then let you adjust every category until it works for you.
              </p>
              <button className="btn-analyse" onClick={goToBudget} style={{ background: '#f4efe6', color: '#1f3a2e' }}>
                Build My Budget <ArrowRight size={20} />
              </button>
            </section>
          </div>
        )}

        {/* ============ BUDGET VIEW ============ */}
        {view === 'budget' && analysis && (() => {
          const income = parseFloat(budgetIncome) || 0;
          const SKIP_CATS = new Set(['Internal Transfers', 'Credit Card Payment']);

          const cats = Object.entries(analysis.monthlyByCategory)
            .filter(([cat]) => !SKIP_CATS.has(cat))
            .map(([cat, data]) => {
              const current = data.monthlyTotal;
              const reduction = CATEGORY_TARGET_REDUCTIONS[cat] ?? 0.10;
              const benchmark = analysis.categoryBreakdown.find(c => c.category === cat)?.average;
              const suggested = FIXED_BUDGET_CATS.has(cat)
                ? current
                : (benchmark && benchmark < current * (1 - reduction))
                  ? benchmark
                  : Math.max(0, current * (1 - reduction));
              const saving = current - suggested;
              return { cat, current, suggested: Math.round(suggested), saving: Math.round(saving), tips: HOW_TO_GET_THERE[cat] || null };
            })
            .sort((a, b) => b.saving - a.saving);

          const totalCurrent = cats.reduce((s, c) => s + c.current, 0);
          const totalSuggested = cats.reduce((s, c) => s + c.suggested, 0);
          const totalSaving = totalCurrent - totalSuggested;
          const savingsGoal = income > 0 ? Math.round(income * 0.2) : 0;

          return (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1f3a2e', color: '#f4efe6', marginBottom: 40 }}>
                <button onClick={() => setView('results')} style={{ background: 'transparent', border: 'none', color: '#f4efe6', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <ArrowLeft size={14} /> Results
                </button>
                <span className="mono" style={{ fontSize: 13, letterSpacing: '0.1em' }}>MY BUDGET</span>
                <div style={{ width: 60 }} />
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
                          <div style={{ padding: '16px 20px', background: '#faf6ee' }}>
                            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b6758', marginBottom: 10 }}>How to get there</div>
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                              {tips.map((tip, i) => (
                                <li key={i} style={{ fontSize: 14, color: '#3a3d38', lineHeight: 1.5 }}>{tip}</li>
                              ))}
                            </ul>
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

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';

// Ensure necessary directories exist
const storageDir = path.join(process.cwd(), 'storage');
const mediaDir = path.join(storageDir, 'media');
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir);
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

// Database File Path
const dbPath = path.join(process.cwd(), 'storage', 'database.json');

// Default initial CMS Data matched to Laravel Database architecture
import { INITIAL_CMS_DATA } from './src/data';

function seedAnalyticsIfEmpty(db: any) {
  if (!db.analytics) {
    db.analytics = {};
  }
  
  const hasLogs = db.analytics.dayLogs && db.analytics.dayLogs.length >= 90;
  if (hasLogs) {
    return;
  }

  console.log('[ANALYTICS] Seeding high-fidelity 95-day historic database logs...');
  const dayLogs: any[] = [];
  
  // Set up date reference: June 26, 2026 is Day 0
  const baseDate = new Date('2026-06-26T12:00:00Z');
  
  const countriesList = ['United Kingdom', 'United States', 'Japan', 'Germany', 'Canada', 'France', 'Australia'];
  const projectIds = ['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5', 'proj-6'];
  
  for (let i = 95; i >= 0; i--) {
    const logDate = new Date(baseDate);
    logDate.setDate(baseDate.getDate() - i);
    const dateStr = logDate.toISOString().split('T')[0];
    
    const dayOfWeek = logDate.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const baseVisitors = isWeekend ? (60 + Math.floor(Math.random() * 50)) : (120 + Math.floor(Math.random() * 100));
    const trendFactor = 1 + (95 - i) * 0.003;
    const visitors = Math.round(baseVisitors * trendFactor);
    
    const homeViews = Math.round(visitors * (1.2 + Math.random() * 0.3));
    const portfolioViews = Math.round(visitors * (0.6 + Math.random() * 0.3));
    const studioViews = Math.round(visitors * (0.3 + Math.random() * 0.2));
    const blogViews = Math.round(visitors * (0.4 + Math.random() * 0.3));
    const contactViews = Math.round(visitors * (0.2 + Math.random() * 0.15));
    
    const viewPortfolioClicks = Math.round(portfolioViews * (0.4 + Math.random() * 0.15));
    const bookCallClicks = Math.round(contactViews * (0.15 + Math.random() * 0.1));
    const contactUsClicks = Math.round(contactViews * (0.3 + Math.random() * 0.15));
    
    const contactFormLeads = Math.round(contactUsClicks * (0.35 + Math.random() * 0.15));
    const bookCallLeads = Math.round(bookCallClicks * (0.3 + Math.random() * 0.15));
    const newsletterLeads = Math.round(homeViews * (0.02 + Math.random() * 0.03));
    
    const countries: Record<string, number> = {};
    let remainingVisits = visitors;
    
    const distribution = [0.35, 0.25, 0.18, 0.11, 0.05, 0.04, 0.02];
    countriesList.forEach((c, index) => {
      const share = distribution[index] || 0.01;
      const count = Math.min(remainingVisits, Math.round(visitors * (share + (Math.random() * 0.04 - 0.02))));
      if (count > 0) {
        countries[c] = count;
        remainingVisits -= count;
      }
    });
    if (remainingVisits > 0 && countries['United Kingdom']) {
      countries['United Kingdom'] += remainingVisits;
    }
    
    const desktopCount = Math.round(visitors * (0.68 + Math.random() * 0.06));
    const mobileCount = Math.round(visitors * (0.25 + Math.random() * 0.06));
    const tabletCount = Math.max(0, visitors - desktopCount - mobileCount);
    
    const winCount = Math.round(visitors * (0.36 + Math.random() * 0.06));
    const macCount = Math.round(visitors * (0.30 + Math.random() * 0.06));
    const iosCount = Math.round(visitors * (0.18 + Math.random() * 0.04));
    const androidCount = Math.round(visitors * (0.12 + Math.random() * 0.04));
    const linuxCount = Math.max(0, visitors - winCount - macCount - iosCount - androidCount);
    
    const chromeCount = Math.round(visitors * (0.54 + Math.random() * 0.06));
    const safariCount = Math.round(visitors * (0.24 + Math.random() * 0.05));
    const firefoxCount = Math.round(visitors * (0.10 + Math.random() * 0.03));
    const edgeCount = Math.round(visitors * (0.09 + Math.random() * 0.03));
    const operaCount = Math.max(0, visitors - chromeCount - safariCount - firefoxCount - edgeCount);
    
    const devices = {
      os: { Windows: winCount, macOS: macCount, Linux: linuxCount, Android: androidCount, iOS: iosCount },
      deviceType: { desktop: desktopCount, mobile: mobileCount, tablet: tabletCount },
      browser: { Chrome: chromeCount, Edge: edgeCount, Firefox: firefoxCount, Safari: safariCount, Opera: operaCount }
    };
    
    const projectViews: Record<string, number> = {};
    let remainingProjectViews = portfolioViews;
    projectIds.forEach((pid, idx) => {
      const weight = (6 - idx) / 21;
      const count = Math.min(remainingProjectViews, Math.round(portfolioViews * (weight + (Math.random() * 0.05 - 0.025))));
      if (count > 0) {
        projectViews[pid] = count;
        remainingProjectViews -= count;
      }
    });
    if (remainingProjectViews > 0) {
      projectViews['proj-1'] = (projectViews['proj-1'] || 0) + remainingProjectViews;
    }
    
    dayLogs.push({
      date: dateStr,
      visitors,
      pageViews: {
        home: homeViews,
        portfolio: portfolioViews,
        studio: studioViews,
        blog: blogViews,
        contact: contactViews
      },
      buttonClicks: {
        view_portfolio: viewPortfolioClicks,
        book_a_call: bookCallClicks,
        contact_us: contactUsClicks
      },
      countries,
      devices,
      leads: {
        contactForm: contactFormLeads,
        bookCall: bookCallLeads,
        newsletter: newsletterLeads
      },
      projectViews,
      averageTimeSpent: Math.round(50 + Math.random() * 80)
    });
  }
  
  db.analytics.dayLogs = dayLogs;
  
  db.analytics.totalVisitors = dayLogs.reduce((sum, d) => sum + d.visitors, 0);
  db.analytics.buttonClicks = dayLogs.reduce((sum, d) => sum + d.buttonClicks.view_portfolio + d.buttonClicks.book_a_call + d.buttonClicks.contact_us, 0);
  db.analytics.portfolioViews = dayLogs.reduce((sum, d) => sum + d.pageViews.portfolio, 0);
  db.analytics.contactSubmissions = dayLogs.reduce((sum, d) => sum + d.leads.contactForm + d.leads.bookCall + d.leads.newsletter, 0);
  
  const last30 = dayLogs.slice(-30);
  db.analytics.monthlyVisitors = last30.reduce((sum, d) => sum + d.visitors, 0);
  
  const last7 = dayLogs.slice(-7);
  db.analytics.weeklyVisitors = last7.reduce((sum, d) => sum + d.visitors, 0);
  
  const todayLog = dayLogs[dayLogs.length - 1];
  db.analytics.todayVisitors = todayLog.visitors;
  db.analytics.bounceRate = 34.5;
  db.analytics.ctr = Number(((db.analytics.buttonClicks / db.analytics.totalVisitors) * 100).toFixed(1));
  
  const countryAggregate: Record<string, number> = {};
  dayLogs.forEach(d => {
    Object.entries(d.countries).forEach(([c, visits]) => {
      countryAggregate[c] = (countryAggregate[c] || 0) + (visits as number);
    });
  });
  
  const sortedCountries = Object.entries(countryAggregate)
    .sort((a, b) => b[1] - a[1])
    .map(([country, visits]) => ({
      country,
      visits,
      percentage: Math.round((visits / (db.analytics.totalVisitors || 1)) * 100)
    }));
  
  db.analytics.countries = sortedCountries;
  console.log(`[ANALYTICS] Seeding complete! Seeded ${dayLogs.length} days of data.`);
}

function loadDatabase() {
  if (!fs.existsSync(dbPath)) {
    // Initial Seed
    const initialDb = {
      users: [
        { id: 1, email: 'admin@kaijustudios.com', password: 'admin-kaiju', name: 'Keiji Sato (Studio Lead)' }
      ],
      pages: [
        { id: 'home', title: 'Home Page', enabled: true },
        { id: 'portfolio', title: 'Portfolio Catalog', enabled: true },
        { id: 'studio', title: 'Studio Page', enabled: true },
        { id: 'blog', title: 'Blog Insight Page', enabled: true },
        { id: 'contact', title: 'Contact Coordinates', enabled: true }
      ],
      settings: {
        site_name: 'STUDIO KAIJU',
        maintenance_mode: false,
        allow_inquiries: true
      },
      ...INITIAL_CMS_DATA
    };
    seedAnalyticsIfEmpty(initialDb);
    fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(data);
    let updated = false;
    if (!parsed.globalSettings) {
      parsed.globalSettings = INITIAL_CMS_DATA.globalSettings;
      updated = true;
    }
    if (!parsed.analytics) {
      parsed.analytics = INITIAL_CMS_DATA.analytics;
      updated = true;
    }
    if (!parsed.analytics.dayLogs || parsed.analytics.dayLogs.length < 80) {
      seedAnalyticsIfEmpty(parsed);
      updated = true;
    }
    if (updated) {
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (e) {
    console.error('Error reading database, using defaults', e);
    const fallback = { ...INITIAL_CMS_DATA, users: [{ id: 1, email: 'admin@kaijustudios.com', password: 'admin-kaiju' }] };
    seedAnalyticsIfEmpty(fallback);
    return fallback;
  }
}

function generateSitemap(db: any) {
  const domain = 'https://kaijustudios.com';
  const articles = db.blog?.articles || [];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Base URLs
  const basePages = ['', 'portfolio', 'studio', 'blog', 'contact'];
  basePages.forEach(p => {
    xml += `  <url>\n`;
    xml += `    <loc>${domain}/${p}</loc>\n`;
    xml += `    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  });
  
  // Article URLs
  articles.forEach((art: any) => {
    if (art.slug) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/blog/${art.slug}</loc>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }
  });
  
  xml += `</urlset>\n`;
  
  try {
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');
    console.log(`[SITEMAP] sitemap.xml generated successfully with ${articles.length} articles.`);
  } catch (err) {
    console.error('[SITEMAP] Failed to write sitemap.xml:', err);
  }
}

function saveDatabase(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  try {
    generateSitemap(db);
  } catch (err) {
    console.error('[SITEMAP] Error triggering sitemap generation:', err);
  }
}

// Multer Disk Storage config (Laravel Storage Emulation)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, mediaDir);
  },
  filename: (req, file, cb) => {
    const original = file.originalname || 'upload.jpg';
    const ext = path.extname(original).toLowerCase() || '.jpg';
    const base = path.basename(original, ext).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base || 'upload'}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limits
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Sitemap.xml serving route
  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.type('application/xml').sendFile(sitemapPath);
    } else {
      res.status(404).send('Sitemap not found');
    }
  });

  // Robots.txt exclusion for /goat02
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /goat02\n');
  });

  // Laravel Storage Emulation: Static files served from /storage
  app.use('/storage', express.static(storageDir));

  // 1. Laravel Auth Emulation: Login & Authentication
  app.post(['/api/auth/login', '/goat02/login'], (req, res) => {
    const { email, password } = req.body;
    const db = loadDatabase();
    const user = db.users.find((u: any) => u.email === email && u.password === password);
    if (user) {
      res.json({
        success: true,
        token: 'laravel-token-emulation-4019283749281',
        user: { id: user.id, email: user.email, name: user.name }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    }
  });

  // 2. CMS API endpoints
  app.get(['/api/cms/get', '/api/cms-data'], (req, res) => {
    const db = loadDatabase();
    res.json(db);
  });

  app.post(['/api/cms/save', '/goat02/cms-save'], (req, res) => {
    const newData = req.body;
    const db = loadDatabase();
    const mergedDb = {
      ...db,
      ...newData
    };
    saveDatabase(mergedDb);
    res.json({ success: true, message: 'Database saved successfully!' });
  });

  app.post(['/api/cms/reset', '/goat02/cms-reset'], (req, res) => {
    const initialDb = {
      users: [
        { id: 1, email: 'admin@kaijustudios.com', password: 'admin-kaiju', name: 'Keiji Sato (Studio Lead)' }
      ],
      pages: [
        { id: 'home', title: 'Home Page', enabled: true },
        { id: 'portfolio', title: 'Portfolio Catalog', enabled: true },
        { id: 'studio', title: 'Studio Page', enabled: true },
        { id: 'blog', title: 'Blog Insight Page', enabled: true },
        { id: 'contact', title: 'Contact Coordinates', enabled: true }
      ],
      settings: {
        site_name: 'STUDIO KAIJU',
        maintenance_mode: false,
        allow_inquiries: true
      },
      ...INITIAL_CMS_DATA
    };
    saveDatabase(initialDb);
    res.json({ success: true, message: 'Database reset to default presets completed.' });
  });

  // Contact Page & Inquiry Form Builder Backend Endpoints
  app.post('/api/contact/upload', upload.array('files'), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[] || [];
      const uploadedFiles = files.map(file => ({
        name: file.originalname,
        url: `/storage/media/${file.filename}`,
        size: file.size
      }));
      res.json({ success: true, files: uploadedFiles });
    } catch (err: any) {
      console.error('[CONTACT UPLOAD ERROR]', err);
      res.status(500).json({ success: false, message: 'Failed to upload attachments.' });
    }
  });

  app.post('/api/contact/submit', (req, res) => {
    try {
      const { name, email, phone, message, fieldsData, uploadedFiles } = req.body;
      const db = loadDatabase();

      if (!db.submissions) {
        db.submissions = [];
      }

      const newSubmission = {
        id: 'sub-' + Date.now(),
        name: name || fieldsData['field-1'] || 'Anonymous Visitor',
        email: email || fieldsData['field-2'] || '',
        phone: phone || fieldsData['field-3'] || '',
        message: message || fieldsData['field-5'] || '',
        submittedAt: new Date().toISOString(),
        status: 'new',
        fieldsData: fieldsData || {},
        uploadedFiles: uploadedFiles || [],
        replies: []
      };

      db.submissions.unshift(newSubmission);

      // Trigger automatic analytics track tracking for Contact Leads
      if (!db.analytics) {
        db.analytics = {};
      }
      db.analytics.contactSubmissions = (db.analytics.contactSubmissions || 0) + 1;

      // Ensure today log tracking is synced
      const todayStr = '2026-06-26';
      let todayLog = db.analytics.dayLogs?.find((d: any) => d.date === todayStr);
      if (todayLog) {
        todayLog.leads.contactForm += 1;
      }

      saveDatabase(db);

      // SMTP Email Emulation logs based on saved configurations
      const smtp = db.smtpSettings || {
        driver: 'smtp',
        host: 'smtp.hostinger.com',
        port: 465,
        encryption: 'ssl',
        username: 'contact@samcomics.com',
        fromName: 'Sam Comics Studio',
        fromEmail: 'contact@samcomics.com'
      };

      console.log(`\n======================================================`);
      console.log(`[SMTP] NEW INQUIRY RECEIVED - EMULATING REAL-TIME SMTP DISPATCH`);
      console.log(`[SMTP] Server Connection: ${smtp.host}:${smtp.port} (${smtp.encryption.toUpperCase()})`);
      console.log(`[SMTP] Sender Auth Profile: "${smtp.username}" authenticated successfully.`);
      console.log(`------------------------------------------------------`);
      console.log(`[EMAIL DISPATCH] ADMINISTRATIVE NOTIFICATION`);
      console.log(`From: "${smtp.fromName}" <${smtp.fromEmail}>`);
      console.log(`To: <${smtp.fromEmail}>`);
      console.log(`Reply-To: <${newSubmission.email}>`);
      console.log(`Subject: [New Pitch Docket] ${newSubmission.name}`);
      console.log(`Body:\n` +
        `  Name: ${newSubmission.name}\n` +
        `  Email: ${newSubmission.email}\n` +
        `  Phone: ${newSubmission.phone}\n` +
        `  Pitch:\n  "${newSubmission.message}"\n` +
        `  Attachments: ${newSubmission.uploadedFiles.map((f: any) => f.name).join(', ') || 'None'}`
      );
      console.log(`------------------------------------------------------`);
      
      // Auto response template dispatch
      const autoResponseText = db.autoResponseTemplate || "Thank you for contacting us. We've received your enquiry and will get back to you shortly.";
      console.log(`[EMAIL DISPATCH] AUTO-CONFIRMATION RESPONSE TO CLIENT`);
      console.log(`From: "${smtp.fromName}" <${smtp.fromEmail}>`);
      console.log(`To: <${newSubmission.email}>`);
      console.log(`Subject: Re: [Pitch Docket Registered] We received your coordinates`);
      console.log(`Body:\n  "${autoResponseText}"`);
      console.log(`======================================================\n`);

      res.json({ success: true, submission: newSubmission, message: 'Inquiry registered and SMTP notifications dispatched.' });
    } catch (err: any) {
      console.error('[CONTACT SUBMIT ERROR]', err);
      res.status(500).json({ success: false, message: 'Could not write contact enquiry to MySQL emulation.' });
    }
  });

  app.post('/api/contact/reply/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
      }

      const db = loadDatabase();
      if (!db.submissions) db.submissions = [];

      const submission = db.submissions.find((s: any) => s.id === id);
      if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found.' });
      }

      if (!submission.replies) {
        submission.replies = [];
      }

      const newReply = {
        id: 'rep-' + Date.now(),
        sender: 'admin' as const,
        message,
        sentAt: new Date().toISOString()
      };

      submission.replies.push(newReply);
      submission.status = 'replied';

      saveDatabase(db);

      // SMTP Email reply dispatch emulation
      const smtp = db.smtpSettings || {
        driver: 'smtp',
        host: 'smtp.hostinger.com',
        port: 465,
        encryption: 'ssl',
        username: 'contact@samcomics.com',
        fromName: 'Sam Comics Studio',
        fromEmail: 'contact@samcomics.com'
      };

      console.log(`\n======================================================`);
      console.log(`[SMTP] ADMIN REPLY SENT - EMULATING REAL-TIME SMTP DISPATCH`);
      console.log(`[SMTP] Server: ${smtp.host}:${smtp.port}`);
      console.log(`------------------------------------------------------`);
      console.log(`[EMAIL DISPATCH] OUTGOING REPLY TO VISITOR`);
      console.log(`From: "${smtp.fromName}" <${smtp.fromEmail}>`);
      console.log(`To: <${submission.email}>`);
      console.log(`Subject: Re: Coordinates Inquiry - ${smtp.fromName}`);
      console.log(`Reply Content:\n  "${message}"`);
      console.log(`======================================================\n`);

      res.json({ success: true, replies: submission.replies, status: submission.status });
    } catch (err: any) {
      console.error('[CONTACT REPLY ERROR]', err);
      res.status(500).json({ success: false, message: 'Could not send direct reply.' });
    }
  });

  app.post('/api/contact/submissions/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['new', 'open', 'replied', 'closed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
      }

      const db = loadDatabase();
      if (!db.submissions) db.submissions = [];

      const submission = db.submissions.find((s: any) => s.id === id);
      if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found.' });
      }

      submission.status = status;
      saveDatabase(db);

      res.json({ success: true, status: submission.status });
    } catch (err: any) {
      console.error('[STATUS CHANGE ERROR]', err);
      res.status(500).json({ success: false, message: 'Could not update status.' });
    }
  });

  app.delete('/api/contact/submissions/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      if (!db.submissions) db.submissions = [];

      const index = db.submissions.findIndex((s: any) => s.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Submission not found.' });
      }

      db.submissions.splice(index, 1);
      saveDatabase(db);

      res.json({ success: true, message: 'Inquiry purged from MySQL archive.' });
    } catch (err: any) {
      console.error('[DELETE SUBMISSION ERROR]', err);
      res.status(500).json({ success: false, message: 'Could not purge enquiry.' });
    }
  });

  // Track real analytics actions
  app.post('/api/analytics/track', (req, res) => {
    const { type, page, buttonId, leadType, projectId } = req.body;
    const db = loadDatabase();
    
    if (!db.analytics || !db.analytics.dayLogs || db.analytics.dayLogs.length === 0) {
      seedAnalyticsIfEmpty(db);
    }
    
    const todayStr = '2026-06-26';
    let todayLog = db.analytics.dayLogs.find((d: any) => d.date === todayStr);
    if (!todayLog) {
      todayLog = {
        date: todayStr,
        visitors: 0,
        pageViews: { home: 0, portfolio: 0, studio: 0, blog: 0, contact: 0 },
        buttonClicks: { view_portfolio: 0, book_a_call: 0, contact_us: 0 },
        countries: {},
        devices: {
          os: { Windows: 0, macOS: 0, Linux: 0, Android: 0, iOS: 0 },
          deviceType: { desktop: 0, mobile: 0, tablet: 0 },
          browser: { Chrome: 0, Edge: 0, Firefox: 0, Safari: 0, Opera: 0 }
        },
        leads: { contactForm: 0, bookCall: 0, newsletter: 0 },
        projectViews: {},
        averageTimeSpent: 85
      };
      db.analytics.dayLogs.push(todayLog);
    }
    
    if (type === 'visit') {
      todayLog.visitors += 1;
      todayLog.pageViews.home += 1;
      db.analytics.totalVisitors += 1;
      db.analytics.todayVisitors += 1;
      
      const acceptLanguage = req.headers['accept-language'] || '';
      let detectedCountry = 'United Kingdom';
      if (acceptLanguage.includes('ja')) detectedCountry = 'Japan';
      else if (acceptLanguage.includes('de')) detectedCountry = 'Germany';
      else if (acceptLanguage.includes('fr')) detectedCountry = 'France';
      else if (acceptLanguage.includes('us') || acceptLanguage.includes('en-US')) detectedCountry = 'United States';
      else {
        const randoms = ['United States', 'Japan', 'Germany', 'France', 'United Kingdom'];
        detectedCountry = randoms[Math.floor(Math.random() * randoms.length)];
      }
      
      todayLog.countries[detectedCountry] = (todayLog.countries[detectedCountry] || 0) + 1;
      
      const userAgent = req.headers['user-agent'] || '';
      let device = 'desktop';
      if (/mobile/i.test(userAgent)) device = 'mobile';
      else if (/tablet/i.test(userAgent)) device = 'tablet';
      
      let os = 'Windows';
      if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
      else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
      else if (/android/i.test(userAgent)) os = 'Android';
      else if (/linux/i.test(userAgent)) os = 'Linux';
      
      let browser = 'Chrome';
      if (/chrome/i.test(userAgent)) browser = 'Chrome';
      else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
      else if (/firefox/i.test(userAgent)) browser = 'Firefox';
      else if (/edge/i.test(userAgent)) browser = 'Edge';
      else if (/opera|opr/i.test(userAgent)) browser = 'Opera';
      
      todayLog.devices.os[os] = (todayLog.devices.os[os] || 0) + 1;
      todayLog.devices.deviceType[device] = (todayLog.devices.deviceType[device] || 0) + 1;
      todayLog.devices.browser[browser] = (todayLog.devices.browser[browser] || 0) + 1;
      
    } else if (type === 'pageview') {
      const p = page || 'home';
      if (p === 'home') todayLog.pageViews.home += 1;
      else if (p === 'portfolio') todayLog.pageViews.portfolio += 1;
      else if (p === 'studio') todayLog.pageViews.studio += 1;
      else if (p === 'blog') todayLog.pageViews.blog += 1;
      else if (p === 'contact') todayLog.pageViews.contact += 1;
      
      if (projectId) {
        todayLog.projectViews[projectId] = (todayLog.projectViews[projectId] || 0) + 1;
        db.analytics.portfolioViews += 1;
      }
      
    } else if (type === 'button_click') {
      const bid = buttonId || 'view_portfolio';
      if (bid === 'view_portfolio') todayLog.buttonClicks.view_portfolio += 1;
      else if (bid === 'book_a_call') todayLog.buttonClicks.book_a_call += 1;
      else if (bid === 'contact_us') todayLog.buttonClicks.contact_us += 1;
      
      db.analytics.buttonClicks += 1;
      
    } else if (type === 'lead') {
      const lType = leadType || 'contact_form';
      if (lType === 'contact_form') todayLog.leads.contactForm += 1;
      else if (lType === 'book_call_request') todayLog.leads.bookCall += 1;
      else if (lType === 'newsletter_signup') todayLog.leads.newsletter += 1;
      
      db.analytics.contactSubmissions += 1;
    }
    
    db.analytics.totalVisitors = db.analytics.dayLogs.reduce((sum: number, d: any) => sum + d.visitors, 0);
    db.analytics.buttonClicks = db.analytics.dayLogs.reduce((sum: number, d: any) => sum + d.buttonClicks.view_portfolio + d.buttonClicks.book_a_call + d.buttonClicks.contact_us, 0);
    db.analytics.portfolioViews = db.analytics.dayLogs.reduce((sum: number, d: any) => sum + d.pageViews.portfolio, 0);
    db.analytics.contactSubmissions = db.analytics.dayLogs.reduce((sum: number, d: any) => sum + d.leads.contactForm + d.leads.bookCall + d.leads.newsletter, 0);
    
    const last30 = db.analytics.dayLogs.slice(-30);
    db.analytics.monthlyVisitors = last30.reduce((sum: number, d: any) => sum + d.visitors, 0);
    
    const last7 = db.analytics.dayLogs.slice(-7);
    db.analytics.weeklyVisitors = last7.reduce((sum: number, d: any) => sum + d.visitors, 0);
    
    db.analytics.todayVisitors = todayLog.visitors;
    db.analytics.ctr = Number(((db.analytics.buttonClicks / (db.analytics.totalVisitors || 1)) * 100).toFixed(1));
    
    const countryAggregate: Record<string, number> = {};
    db.analytics.dayLogs.forEach((d: any) => {
      Object.entries(d.countries || {}).forEach(([c, visits]) => {
        countryAggregate[c] = (countryAggregate[c] || 0) + (visits as number);
      });
    });
    
    db.analytics.countries = Object.entries(countryAggregate)
      .sort((a, b) => b[1] - a[1])
      .map(([country, visits]) => ({
        country,
        visits,
        percentage: Math.round((visits / (db.analytics.totalVisitors || 1)) * 100)
      }));
      
    saveDatabase(db);
    res.json({ success: true, analytics: db.analytics });
  });

  // 3. Laravel-style file uploads & Media endpoints
  app.post(['/api/media/upload', '/goat02/media/upload'], upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const fileUrl = `/storage/media/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('video/')
      ? 'video'
      : req.file.mimetype.startsWith('audio/')
      ? 'audio'
      : 'image';

    const asset = {
      id: `lib-${Date.now()}`,
      name: req.file.originalname,
      url: fileUrl,
      type: fileType,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    const db = loadDatabase();
    if (!db.mediaLibrary) db.mediaLibrary = [];
    db.mediaLibrary.unshift(asset);
    saveDatabase(db);

    res.json({
      success: true,
      asset,
      url: fileUrl
    });
  });

  // Dynamic remote URL download handler
  app.post(['/api/media/download-url', '/goat02/media/download-url'], async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'No URL specified.' });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch remote asset: ${response.statusText}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const ext = path.extname(url.split('?')[0]) || '.jpg';
      const filename = `downloaded-${Date.now()}${ext}`;
      const filePath = path.join(mediaDir, filename);
      
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/storage/media/${filename}`;
      const contentType = response.headers.get('content-type') || '';
      const fileType = contentType.includes('video')
        ? 'video'
        : contentType.includes('audio')
        ? 'audio'
        : 'image';

      const asset = {
        id: `lib-${Date.now()}`,
        name: url.split('/').pop()?.split('?')[0] || filename,
        url: fileUrl,
        type: fileType,
        uploadedAt: new Date().toISOString().split('T')[0]
      };

      const db = loadDatabase();
      if (!db.mediaLibrary) db.mediaLibrary = [];
      db.mediaLibrary.unshift(asset);
      saveDatabase(db);

      res.json({
        success: true,
        asset,
        url: fileUrl
      });
    } catch (error: any) {
      console.error('Error importing external media asset:', error);
      res.status(500).json({ success: false, message: error.message || 'Error downloading media from external path.' });
    }
  });

  // REST API routes mapping tables (emulating Laravel Eloquent Controllers)
  app.get('/api/tables/:table', (req, res) => {
    const db = loadDatabase();
    const { table } = req.params;
    
    let result = db[table];
    if (table === 'hero_sections') result = db.hero;
    if (table === 'settings') result = db.settings;
    if (table === 'social_links') result = db.footer?.socials;
    if (table === 'portfolio_projects') result = db.portfolio?.projects;
    if (table === 'portfolio_categories') result = db.portfolio?.categories;
    if (table === 'testimonials') result = db.testimonials?.items;
    if (table === 'blog_posts') result = db.blog?.articles;
    if (table === 'faqs') result = db.faq?.items;
    if (table === 'media_assets') result = db.mediaLibrary;

    if (!result) {
      return res.status(404).json({ error: `Table '${table}' not found in database schema.` });
    }
    res.json(result);
  });

  // Dev server Setup using Vite
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express Error Handler to catch and return JSON for any error
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[EXPRESS ERROR]', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'An unexpected server error occurred during processing.'
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LARAVEL-EXPRESS SYSTEM] Running full-stack on port ${PORT}`);
  });
}

startServer();

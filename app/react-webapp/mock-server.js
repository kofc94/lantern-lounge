import express from 'express';
import { randomUUID } from 'crypto';

const app = express();
app.use(express.json());

// Helper to get a date string N days from today
const dateFrom = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// In-memory store seeded with fixture events
const items = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    title: 'Monthly Members Meeting',
    description: 'Monthly meeting for all members. Agenda: club finances, upcoming events, open forum.',
    date: dateFrom(5),
    time: '19:00',
    location: 'Main Hall',
    isPublic: 1,
    createdBy: 'admin@lanternlounge.org',
    createdByUserId: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    timestamp: new Date().toISOString(),
    title: 'Pool Tournament',
    description: 'Single elimination pool tournament. Sign up at the bar.',
    date: dateFrom(8),
    time: '18:00',
    location: 'Pool Room',
    isPublic: 1,
    createdBy: 'admin@lanternlounge.org',
    createdByUserId: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    timestamp: new Date().toISOString(),
    title: 'Friday Happy Hour',
    description: 'Members-only happy hour. Half-price drinks 5–7pm.',
    date: dateFrom(12),
    time: '17:00',
    location: 'Bar',
    isPublic: 0,
    createdBy: 'admin@lanternlounge.org',
    createdByUserId: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    timestamp: new Date().toISOString(),
    title: 'Trivia Night',
    description: 'Weekly trivia night hosted by Mike. Teams of up to 6.',
    date: dateFrom(14),
    time: '20:00',
    location: 'Main Hall',
    isPublic: 1,
    createdBy: 'admin@lanternlounge.org',
    createdByUserId: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    timestamp: new Date().toISOString(),
    title: 'Board Meeting',
    description: 'Quarterly board meeting. Members welcome to observe.',
    date: dateFrom(18),
    time: '18:30',
    location: 'Conference Room',
    isPublic: 0,
    createdBy: 'admin@lanternlounge.org',
    createdByUserId: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    timestamp: new Date().toISOString(),
    title: 'St. Patrick\'s Day Party',
    description: 'Annual St. Patrick\'s Day celebration. Live music, Irish food, and green beer.',
    date: dateFrom(22),
    time: '16:00',
    location: 'Patio & Bar',
    isPublic: 1,
    createdBy: 'admin@lanternlounge.org',
    createdByUserId: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /calendar/items
app.get('/calendar/items', (req, res) => {
  const isAuthenticated = !!req.headers.authorization;
  const { startDate, endDate } = req.query;

  let result = isAuthenticated ? items : items.filter(i => i.isPublic === 1);
  if (startDate) result = result.filter(i => i.date >= startDate);
  if (endDate)   result = result.filter(i => i.date <= endDate);

  res.json({ items: result, count: result.length, authenticated: isAuthenticated });
});

// POST /calendar/items
app.post('/calendar/items', (req, res) => {
  const { title, date } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: 'Bad request', message: 'Missing required field: title or date' });
  }
  const item = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...req.body,
    isPublic: req.body.isPublic ? 1 : 0,
    createdBy: 'dev@local',
    createdByUserId: 'local-dev',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(item);
  res.status(201).json({ message: 'Calendar item created successfully', item });
});

// PUT /calendar/items/:id
app.put('/calendar/items/:id', (req, res) => {
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { ...items[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json({ message: 'Calendar item updated successfully', item: items[idx] });
});

// DELETE /calendar/items/:id
app.delete('/calendar/items/:id', (req, res) => {
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items.splice(idx, 1);
  res.json({ message: 'Calendar item deleted successfully' });
});

app.listen(3001, () => {
  console.log('Mock API running at http://localhost:3001');
  console.log('  GET  /calendar/items');
  console.log('  POST /calendar/items');
  console.log('  PUT  /calendar/items/:id');
  console.log('  DELETE /calendar/items/:id');
});

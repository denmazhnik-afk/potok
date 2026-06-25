const SUPABASE_URL = 'https://qgmzuhprvbdwjgtwajei.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbXp1aHBydmJkd2pndHdhamVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzQ5NDcsImV4cCI6MjA5NzgxMDk0N30.lZ_qaVEZ1UR4btb2VvgD60sGH39fa10hj2iCB9wFo8I';
const TABLE = 'app_state';
const ROW_KEY = 'planner_data';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
  };

  try {
    if (req.method === 'GET') {
      const url = SUPABASE_URL + '/rest/v1/' + TABLE + '?key=eq.' + ROW_KEY + '&select=data';
      const r = await fetch(url, { headers });
      const json = await r.json();
      if (Array.isArray(json) && json.length > 0 && json[0].data) {
        return res.status(200).json({ data: json[0].data });
      }
      return res.status(200).json({ data: null });
    }

    if (req.method === 'POST') {
      const incoming = req.body;

      if (!incoming || !incoming.data) {
        return res.status(400).json({
          error: 'No data in body',
          hasBody: !!req.body,
          bodyType: typeof req.body,
          keys: req.body ? Object.keys(req.body) : [],
        });
      }

      const url = SUPABASE_URL + '/rest/v1/' + TABLE;
      const r = await fetch(url, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({
          key: ROW_KEY,
          data: incoming.data,
          updated_at: new Date().toISOString(),
        }),
      });

      if (r.ok) {
        return res.status(200).json({ ok: true });
      }
      const json = await r.json().catch(() => ({}));
      return res.status(500).json({ error: json });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

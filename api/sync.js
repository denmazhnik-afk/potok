const SUPABASE_URL = 'https://qgmzuhprvbdwjgtwajei.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbXp1aHBydmJkd2pndHdhamVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzQ5NDcsImV4cCI6MjA5NzgxMDk0N30.lZ_qaVEZ1UR4btb2VvgD60sGH39fa10hj2iCB9wFo8I';
const TABLE = 'app_state';
const ROW_KEY = 'planner_data';

module.exports = async function handler(req, res) {
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
    // GET — загрузка данных
    if (req.method === 'GET') {
      const url = `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${ROW_KEY}&select=data`;
      const r = await fetch(url, { headers });
      const json = await r.json();
      if (Array.isArray(json) && json.length > 0 && json[0].data) {
        return res.status(200).json({ data: json[0].data });
      }
      return res.status(200).json({ data: null });
    }

    // POST — сохранение данных
    if (req.method === 'POST') {
      let data;

      if (req.body && req.body.data !== undefined) {
        // Body was auto-parsed by Vercel
        data = req.body.data;
      } else {
        // Fallback: read raw body
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        if (!raw) {
          return res.status(400).json({ error: 'Empty request body' });
        }
        const parsed = JSON.parse(raw);
        data = parsed.data;
      }

      const url = `${SUPABASE_URL}/rest/v1/${TABLE}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          key: ROW_KEY,
          data: data,
          updated_at: new Date().toISOString(),
        }),
      });

      const json = await r.json();
      if (r.ok) {
        return res.status(200).json({ ok: true });
      }
      return res.status(500).json({ error: json });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

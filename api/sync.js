export default async function handler(req, res) {
  // Разрешаем запросы от твоего браузера
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Нет ссылки' });

  try {
    // Vercel-сервер сам скачивает файл у Яндекса (здесь нет проблем с CORS!)
    const r = await fetch(targetUrl);
    const data = await r.json();
    
    // И отдает чистые данные твоему сайту
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
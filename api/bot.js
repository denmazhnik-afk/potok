export default async function handler(req, res) {
  const { amount, type, cat, note } = req.query;

  if (!amount || !type) {
    return res.status(400).json({ error: 'Не хватает параметров суммы или типа' });
  }

  const token = process.env.YANDEX_TOKEN;
  const filePath = 'disk:/potok-data.json'; 

  try {
    const getUrlResponse = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`, {
      headers: { Authorization: `OAuth ${token}` }
    });
    const getUrlData = await getUrlResponse.json();
    
    const fileResponse = await fetch(getUrlData.href);
    let data = await fileResponse.json();

    // Записываем прямо в новую базу транзакций, которую читает finance.js
    if (!data.flow_transactions) {
      data.flow_transactions = [];
    }

    data.flow_transactions.push({
      id: Date.now(),
      type: type,
      category: cat || (type === 'income' ? 'Заработок' : 'Прочее'),
      amount: parseFloat(amount),
      note: note || 'С телефона',
      date: new Date().toISOString().split('T')[0]
    });

    const uploadUrlResponse = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`, {
      headers: { Authorization: `OAuth ${token}` }
    });
    const uploadUrlData = await uploadUrlResponse.json();

    await fetch(uploadUrlData.href, {
      method: 'PUT',
      body: JSON.stringify(data)
    });

    res.status(200).json({ success: true, message: 'Транзакция записана в flow_transactions' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
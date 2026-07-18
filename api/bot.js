export default async function handler(req, res) {
  // Получаем данные из ссылки (GET-параметры)
  const { amount, type, cat, note } = req.query;

  if (!amount || !type) {
    return res.status(400).json({ error: 'Не хватает параметров суммы или типа' });
  }

  // Секретный токен берем из переменных окружения Vercel
  const token = process.env.YANDEX_TOKEN;
  
  // ВНИМАНИЕ: Здесь нужно указать точный путь к твоему файлу сохранений на Диске
  const filePath = 'disk:/app_data.json'; 

  try {
    // 1. Получаем ссылку на скачивание текущей базы
    const getUrlResponse = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`, {
      headers: { Authorization: `OAuth ${token}` }
    });
    const getUrlData = await getUrlResponse.json();
    
    // 2. Скачиваем сам файл
    const fileResponse = await fetch(getUrlData.href);
    let data = await fileResponse.json();

    // 3. Инициализируем массив, если он пуст, и пушим новую транзакцию
    if (!data.flow_transactions) data.flow_transactions = [];
    data.flow_transactions.push({
      id: Date.now(),
      type: type,
      category: cat || (type === 'income' ? 'Заработок' : 'Прочее'),
      amount: parseFloat(amount),
      note: note || 'С телефона',
      date: new Date().toISOString().split('T')[0]
    });

    // 4. Запрашиваем ссылку для перезаписи файла
    const uploadUrlResponse = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`, {
      headers: { Authorization: `OAuth ${token}` }
    });
    const uploadUrlData = await uploadUrlResponse.json();

    // 5. Загружаем обновленный JSON обратно на Диск
    await fetch(uploadUrlData.href, {
      method: 'PUT',
      body: JSON.stringify(data)
    });

    // Отдаем айфону успешный ответ
    res.status(200).json({ success: true, message: 'Транзакция записана' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
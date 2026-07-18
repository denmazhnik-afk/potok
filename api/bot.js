export default async function handler(req, res) {
  // Получаем параметры с телефона
  const { amount, type, cat, note } = req.query;

  if (!amount || !type) {
    return res.status(400).json({ error: 'Не хватает параметров суммы или типа' });
  }

  // Секретный токен от Яндекса
  const token = process.env.YANDEX_TOKEN;
  
  // Правильный путь к твоему файлу на Яндекс Диске
  const filePath = 'disk:/potok-data.json'; 

  try {
    // 1. Получаем ссылку на скачивание актуальной базы
    const getUrlResponse = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`, {
      headers: { Authorization: `OAuth ${token}` }
    });
    const getUrlData = await getUrlResponse.json();
    
    // 2. Скачиваем файл (твою переменную localStore)
    const fileResponse = await fetch(getUrlData.href);
    let data = await fileResponse.json();

    // 3. Выбираем правильный массив: fin:income для доходов, fin:balance для расходов
    const targetKey = type === 'income' ? 'fin:income' : 'fin:balance';
    
    if (!data[targetKey]) {
      data[targetKey] = [];
    }

    // 4. Добавляем новую транзакцию
    data[targetKey].push({
      id: Date.now(),
      type: type,
      category: cat || (type === 'income' ? 'Заработок' : 'Прочее'),
      amount: parseFloat(amount),
      note: note || 'С телефона',
      date: new Date().toISOString().split('T')[0]
    });

    // 5. Запрашиваем ссылку для перезаписи файла
    const uploadUrlResponse = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`, {
      headers: { Authorization: `OAuth ${token}` }
    });
    const uploadUrlData = await uploadUrlResponse.json();

    // 6. Загружаем обновленный JSON обратно на Диск
    await fetch(uploadUrlData.href, {
      method: 'PUT',
      body: JSON.stringify(data)
    });

    // Отдаем айфону успешный ответ
    res.status(200).json({ success: true, message: `Транзакция записана в ${targetKey}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
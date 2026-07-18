export default async function handler(req, res) {
  // Бот реагирует только на POST-запросы от Telegram
  if (req.method !== 'POST') return res.status(200).send('OK');

  const message = req.body.message;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id.toString();
  const text = message.text.trim();

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const MY_CHAT_ID = process.env.TG_CHAT_ID;
  const YA_TOKEN = process.env.YANDEX_TOKEN;
  const FILE_PATH = process.env.YANDEX_FILE_PATH;

  // Функция для отправки ответа в ТГ
  const reply = async (msg) => {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg })
    });
  };

  // Проверка: отвечаем только тебе
  if (chatId !== MY_CHAT_ID) {
    await reply('⛔️ Доступ запрещен.');
    return res.status(200).send('OK');
  }

  // Разбираем текст. Формат: "Категория Сумма Комментарий" (например, "Еда 500 Макдак")
  const match = text.match(/^([а-яА-Яa-zA-Z]+)\s+(\d+(?:\.\d+)?)(.*)$/);
  if (!match) {
    await reply('❌ Неверный формат.\nПиши так: Категория Сумма [Комментарий]\nПример: Еда 500 Обед');
    return res.status(200).send('OK');
  }

  const category = match[1];
  const amount = parseFloat(match[2]);
  const note = match[3].trim() || 'Через Telegram';

  // Определяем тип (доход или расход) по категории
  const incomeCategories = ['Заработок', 'Переводы', 'Проекты'];
  const type = incomeCategories.includes(category) ? 'income' : 'expense';

  try {
    // 1. Скачиваем текущий файл с Яндекс Диска
    const dlRes = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(FILE_PATH)}`, {
      headers: { Authorization: `OAuth ${YA_TOKEN}` }
    });
    const dlData = await dlRes.json();
    const fileRes = await fetch(dlData.href);
    let appState = await fileRes.json();

    // 2. Добавляем транзакцию в массив flow_transactions
    if (!appState.flow_transactions) appState.flow_transactions = [];
    appState.flow_transactions.push({
      id: Date.now(),
      type: type,
      category: category,
      amount: amount,
      note: note,
      date: new Date().toISOString().split('T')[0]
    });

    // 3. Получаем ссылку для перезаписи файла
    const ulRes = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(FILE_PATH)}&overwrite=true`, {
      headers: { Authorization: `OAuth ${YA_TOKEN}` }
    });
    const ulData = await ulRes.json();

    // 4. Заливаем обновленный файл обратно на Диск
    await fetch(ulData.href, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appState)
    });

    await reply(`✅ Записано: ${category} ${amount} ₽\n(${type === 'income' ? '🟢 Доход' : '🔴 Расход'})`);

  } catch (error) {
    await reply(`⚠️ Ошибка сохранения на Яндекс Диск: ${error.message}`);
  }

  return res.status(200).send('OK');
}
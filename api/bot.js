try {
    // 1. Запрашиваем ссылку на скачивание файла
    const dlRes = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(FILE_PATH)}`, {
      headers: { Authorization: `OAuth ${YA_TOKEN}` }
    });
    const dlData = await dlRes.json();

    // Если Яндекс вернул ошибку, прерываем выполнение и пишем её в Телеграм
    if (!dlRes.ok || dlData.error) {
      throw new Error(`Яндекс: ${dlData.description || dlData.message || 'Файл не найден или нет доступа'}`);
    }

    // 2. Скачиваем сам файл
    const fileRes = await fetch(dlData.href);
    let appState = await fileRes.json();

    // 3. Добавляем транзакцию
    if (!appState.flow_transactions) appState.flow_transactions = [];
    appState.flow_transactions.push({
      id: Date.now(),
      type: type,
      category: category,
      amount: amount,
      note: note,
      date: new Date().toISOString().split('T')[0]
    });

    // 4. Получаем ссылку для перезаписи файла
    const ulRes = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(FILE_PATH)}&overwrite=true`, {
      headers: { Authorization: `OAuth ${YA_TOKEN}` }
    });
    const ulData = await ulRes.json();
    
    if (!ulRes.ok || ulData.error) {
      throw new Error(`Яндекс (Загрузка): ${ulData.description || ulData.message}`);
    }

    // 5. Заливаем обновленный файл обратно на Диск
    await fetch(ulData.href, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appState)
    });

    await reply(`✅ Записано: ${category} ${amount} ₽\n(${type === 'income' ? '🟢 Доход' : '🔴 Расход'})`);

  } catch (error) {
    await reply(`⚠️ Ошибка: ${error.message}`);
  }

  return res.status(200).send('OK');
}
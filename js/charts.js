function drawSparkline(id, data, color) {
  const canvas = document.getElementById(id);
  if (!canvas || data.length < 2) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 140;
  const H = canvas.offsetHeight || 50;
  canvas.width = W; canvas.height = H;

  // Если это график финансов на главной — жестко задаем синий цвет в стиле Apple
  let strokeColor = color;
  let fillBase = color;
  if (id === 'homeSparkline') {
    strokeColor = 'rgba(59, 130, 246, 1)'; // Ярко-синий цвет линии
    fillBase = 'rgba(59, 130, 246, 0.5)';  // База для нижнего градиента
  } else {
    fillBase = color.replace(')', ',0.4)').replace('rgb','rgba');
  }

  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length-1)) * W,
    H - ((v - min) / range) * H * 0.85 - H*0.05
  ]);

  ctx.clearRect(0,0,W,H);
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, fillBase);
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  // Заливка под графиком
  ctx.beginPath();
  ctx.moveTo(points[0][0], H);
  ctx.lineTo(points[0][0], points[0][1]);
  points.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(points[points.length-1][0], H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Сама линия
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = id === 'homeSparkline' ? 2.5 : 1.5; // Делаем линию чуть жирнее
  ctx.stroke();
}
function drawChart(id, data, field, color, unit) {
  if (data.length < 1) return;
  drawSparkline(id, data.map(e => e[field]), color);
}

function drawIncomeChart() {
  const inc = getFinIncome();
  if (inc.length === 0) return;

  const byDate = {};
  inc.forEach(e => {
    byDate[e.date] = (byDate[e.date] || 0) + e.amount;
  });
  const dates = Object.keys(byDate).sort().slice(-15);
  const values = dates.map(d => byDate[d]);

  const canvas = document.getElementById('incChart');
  if (!canvas || values.length < 1) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400;
  const H = canvas.offsetHeight || 160;
  canvas.width = W; canvas.height = H;

  if (values.length === 1) {
    ctx.fillStyle = 'rgba(107,227,164,0.3)';
    ctx.fillRect(W/2 - 10, 20, 20, H - 40);
    return;
  }

  const max = Math.max(...values) * 1.1 || 1;
  const barW = Math.max((W / values.length) * 0.6, 4);
  const gap = W / values.length;

  ctx.clearRect(0,0,W,H);

  values.forEach((v, i) => {
    const bH = (v / max) * (H - 20);
    const x = i * gap + gap/2 - barW/2;
    const y = H - bH;

    const grad = ctx.createLinearGradient(0, y, 0, H);
    grad.addColorStop(0, 'rgba(107,227,164,0.8)');
    grad.addColorStop(1, 'rgba(107,227,164,0.1)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, bH, 3);
    ctx.fill();
  });
}

function drawSleepChart(id, data) {
  const canvas = document.getElementById(id);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400;
  const H = canvas.offsetHeight || 160;
  canvas.width = W;
  canvas.height = H;

  ctx.clearRect(0, 0, W, H);

  const validData = data.filter(d => d.mins > 0);
  if (validData.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Нет данных о сне', W / 2, H / 2);
    return;
  }

  const maxH = 12;
  const barW = Math.max((W / data.length) * 0.65, 6);
  const gap = W / data.length;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let h = 6; h <= 12; h += 2) {
    const y = H - (h / maxH) * (H - 30);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(h + 'ч', 24, y + 3);
  }

  // Bars
  data.forEach((d, i) => {
    if (d.mins <= 0) return;
    const hours = d.mins / 60;
    const bH = (hours / maxH) * (H - 30);
    const x = i * gap + gap / 2 - barW / 2;
    const y = H - bH - 14;

    const quality = d.quality || 0;
    const grad = ctx.createLinearGradient(0, y, 0, H - 14);
    
    if (quality > 0) {
      if (quality <= 2) {
        // 1-2: Красный
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.15)');
      } else if (quality <= 5) {
        // 3-5: Оранжевый/Желтый
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0.15)');
      } else if (quality <= 8) {
        // 6-8: Синий
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
      } else {
        // 9-10: Зеленый
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');
      }
    } else {
      // Нет оценки: Серый
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, bH, 3);
    ctx.fill();

    // Day label
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.date, i * gap + gap / 2, H - 2);
  });

  // Reference line at 8 hours
  const refY = H - (8 / maxH) * (H - 30) - 14;
  ctx.strokeStyle = 'rgba(107,227,164,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(30, refY);
  ctx.lineTo(W, refY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(107,227,164,0.5)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('8ч', W - 20, refY - 4);
}

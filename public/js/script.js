const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const outputText = document.getElementById('outputText');
const extractTextBtn = document.getElementById('extractTextBtn');
const loading = document.getElementById('loading');

let imageDataUrl = null;

imageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

  if (!file || !allowedTypes.includes(file.type)) {
    alert('Por favor, selecione uma imagem válida (PNG, JPG ou JPEG).');
    imageInput.value = '';
    imagePreview.innerHTML = '';
    imageDataUrl = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    imageDataUrl = e.target.result;
    imagePreview.innerHTML = `<img src="${imageDataUrl}" alt="Preview da Imagem" />`;
  };
  reader.readAsDataURL(file);
});

extractTextBtn.addEventListener('click', () => {
  if (!imageDataUrl) {
    alert('Nenhuma imagem válida foi selecionada.');
    return;
  }

  loading.style.display = 'block';
  outputText.textContent = '';

  Tesseract.recognize(
    imageDataUrl,
    'por', // Português
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    loading.style.display = 'none';
    const json = parseOcrToJson(text);
    outputText.textContent = JSON.stringify(json, null, 2); // Exibe o JSON formatado
  }).catch(err => {
    loading.style.display = 'none';
    outputText.textContent = 'Erro ao processar a imagem.';
    console.error('Erro do Tesseract:', err);
  });
});

// 🔽 Função que transforma texto OCR em JSON estruturado
function parseOcrToJson(rawText) {
  const json = {
    nome: '',
    amostra: false,
    ingredientes: [],
    nutrientes: {},
    vitaminas: {},
    observacoes: []
  };

  const cleanText = rawText
    .replace(/[\|”“–—•·]+/g, '')
    .replace(/’/g, "'")
    .replace(/(\r\n|\n|\r)/gm, '\n')
    .trim();

  const lines = cleanText.split('\n').map(line => line.trim()).filter(Boolean);

  json.nome = lines.find(line => line.length > 10 && !/\d/.test(line)) || 'Produto desconhecido';
  if (rawText.toLowerCase().includes('amostra')) {
    json.amostra = true;
  }

  const ingredientesLine = lines.find(l => l.toLowerCase().includes('ingredientes:'));
  if (ingredientesLine) {
    const ingRaw = ingredientesLine.split(':')[1];
    if (ingRaw) {
      json.ingredientes = ingRaw
        .split(/[,;()]/)
        .map(i => i.trim())
        .filter(i => i.length > 0);
    }
  }

  const nutrientesMap = {
    energia: /energia\s+(\d+)\s*kcal/i,
    proteinas: /prote[ií]nas?\s+(\d+[\.,]?\d*)/i,
    hidratos: /hidratos.*?(\d+[\.,]?\d*)/i,
    acucares: /a[cç]úcares\s+(\d+[\.,]?\d*)/i,
    lactose: /lactose\s+(\d+[\.,]?\d*)/i,
    lipidos: /l[ií]pidos?\s+(\d+[\.,]?\d*)/i,
    saturados: /saturados\s+(\d+[\.,]?\d*)/i,
    colesterol: /colesterol\s+(\d+[\.,]?\d*)/i,
    fibra: /fibra\s+(\d+[\.,]?\d*)/i,
    sodio: /s[oó]dio\s+(\d+[\.,]?\d*)/i,
    calcio: /c[aá]lcio\s+(\d+[\.,]?\d*)/i
  };

  for (const [key, regex] of Object.entries(nutrientesMap)) {
    const match = rawText.match(regex);
    if (match) {
      let value = match[1].replace(',', '.');
      value = key === 'energia' || key === 'colesterol' || key === 'calcio' ? parseInt(value) : parseFloat(value);
      json.nutrientes[`${key}_g`] = value;
    }
  }

  const vitaminasRegex = /(B\d|E|D\d).{0,10}?(\d+[\.,]?\d*)\s*(mg|µg|ug|po|uo)?/gi;
  let match;
  while ((match = vitaminasRegex.exec(rawText)) !== null) {
    const nome = match[1];
    const valor = `${match[2].replace(',', '.')}${match[3] ? ' ' + match[3] : ''}`;
    json.vitaminas[nome] = valor;
  }

  const obs = lines.filter(line =>
    /(consumir|depois de aberto|frigor[ií]fico|validade|prefer[eê]ncia)/i.test(line)
  );
  json.observacoes = obs;

  return json;
}

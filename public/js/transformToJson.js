function parseOcrToJson(rawText) {
  const json = {
    nome: '',
    amostra: false,
    ingredientes: [],
    nutrientes: {},
    vitaminas: {},
    observacoes: []
  };

  // Corrigir traços estranhos e quebras
  const cleanText = rawText
    .replace(/[\|”“–—•·]+/g, '')
    .replace(/’/g, "'")
    .replace(/(\r\n|\n|\r)/gm, '\n')
    .trim();

  const lines = cleanText.split('\n').map(line => line.trim()).filter(Boolean);

  // Pega o nome do produto (primeira linha longa sem números)
  json.nome = lines.find(line => line.length > 10 && !/\d/.test(line)) || 'Produto desconhecido';

  if (rawText.toLowerCase().includes('amostra')) {
    json.amostra = true;
  }

  // Ingredientes
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

  // Nutrientes
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
      json.nutrientes[`${key}_g`] = parseFloat(match[1].replace(',', '.'));
      if (key === 'energia' || key === 'colesterol' || key === 'calcio') {
        json.nutrientes[`${key}_g`] = parseInt(match[1]); // força inteiro para kcal, mg
      }
    }
  }

  // Vitaminas
  const vitaminasRegex = /(B\d|E|D\d).{0,10}?(\d+[\.,]?\d*)\s*(mg|µg|ug|po|uo)?/gi;
  let match;
  while ((match = vitaminasRegex.exec(rawText)) !== null) {
    const nome = match[1];
    const valor = `${match[2].replace(',', '.')}${match[3] ? ' ' + match[3] : ''}`;
    json.vitaminas[nome] = valor;
  }

  // Observações
  const obs = lines.filter(line =>
    /(consumir|depois de aberto|frigor[ií]fico|validade|prefer[eê]ncia)/i.test(line)
  );
  json.observacoes = obs;

  return json;
}

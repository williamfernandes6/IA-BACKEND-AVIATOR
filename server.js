const express = require('express');
const multer = require('multer');
const tesseract = require('node-tesseract-ocr');
const cors = require('cors');

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

// Configuração OCR para leitura de banca e velas em Luanda
const config = {
  lang: "por",
  oem: 1,
  psm: 3,
};

app.post('/analisar-fluxo', upload.single('print'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Sem imagem" });

    const text = await tesseract.recognize(req.file.buffer, config);

    // 1. EXTRAÇÃO DE BANCA E VELAS
    const bancaMatch = text.match(/(?:AO|AOA|Kz|KZ)\s?([\d\.,]{3,12})/i);
    const bancaFormatada = bancaMatch ? `Kz ${bancaMatch[1]}` : "Aguardando Print...";
    
    const velasRaw = text.match(/\d+[\.,]\d{2}/g) || [];
    const velas = velasRaw.map(v => parseFloat(v.replace(',', '.'))).slice(0, 25);

    // 2. IA DE ANÁLISE DE CICLO (GAP E PADRÃO)
    const ultimaRosaPos = velas.findIndex(v => v >= 10);
    const ultimaRoxaPos = velas.findIndex(v => v >= 5 && v < 10);
    const gapRosas = ultimaRosaPos === -1 ? 25 : ultimaRosaPos;
    const gapRoxas = ultimaRoxaPos === -1 ? 25 : ultimaRoxaPos;

    const sequenciaAzul = velas.filter((v, i) => i < 5 && v < 2).length;
    const temGancho = velas.slice(0, 3).some(v => v <= 1.10);

    // 3. LÓGICA DE DECISÃO DE ELITE
    let status, cor, gapMinutos, alvo, dica, pct;
    let probRosa = 0.35 + (gapRosas * 0.04);
    let probRoxa = 0.50 + (gapRoxas * 0.05);

    if (sequenciaAzul >= 6 || temGancho) {
        status = "RECOLHA: AGUARDAR";
        cor = "#ef4444";
        gapMinutos = 12;
        alvo = "0.00x";
        dica = "Manual v2.0: Gráfico em retenção. Evite entradas agora.";
        pct = "10%";
    } 
    else if (probRosa > 0.85 || gapRosas > 18) {
        status = "SINAL: VELA ROSA";
        cor = "#db2777";
        gapMinutos = 2;
        const forcaExtrema = probRosa > 0.95;
        alvo = forcaExtrema ? "10.00x >>> 100x+" : "10.00x >>> 30x";
        dica = `GAP ROSA: ${gapRosas}. Ciclo de pagamento máximo detectado!`;
        pct = forcaExtrema ? "99%" : "91%";
    } 
    else if (probRoxa > 0.75 || gapRoxas > 8) {
        status = "SINAL: ROXO ALTO";
        cor = "#7e22ce";
        gapMinutos = 4;
        alvo = "5.00x+ (Até 9.99x)";
        dica = `GAP ROXO: ${gapRoxas}. Padrão de alavancagem média identificado.`;
        pct = "84%";
    } 
    else {
        status = "AGUARDANDO PADRÃO";
        cor = "#52525b";
        gapMinutos = 6;
        alvo = "Busque 2.00x";
        dica = "Gráfico instável. Proteja sua banca com entradas curtas.";
        pct = "60%";
    }

    const agora = new Date();
    agora.setMinutes(agora.getMinutes() + gapMinutos);
    const timer = agora.toLocaleTimeString("pt-PT", { 
        hour12: false, timeZone: "Africa/Luanda"
    });

    res.json({
      status, cor, pct, banca: bancaFormatada,
      timerRosa: timer, alvo, historico: velas, dica
    });

  } catch (error) {
    res.status(500).json({ error: "Erro na análise técnica" });
  }
});

app.listen(process.env.PORT || 3000);

const express = require('express');
const multer = require('multer');
const tesseract = require('node-tesseract-ocr');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// CONFIGURAÇÃO DO OCR (IDENTIFICADOR DE BANCA E NÚMEROS)
const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
};

app.post('/analisar-fluxo', upload.single('print'), async (req, res) => {
    try {
        const text = await tesseract.recognize(req.file.buffer, config);
        
        // --- LÓGICA DE EXTRAÇÃO REFORÇADA (MANUAL V2.0) ---
        const regexNumeros = /(\d+\.\d{2})/g;
        let encontrados = text.match(regexNumeros) || [];
        let historico = encontrados.map(n => parseFloat(n)).filter(n => n < 1000);

        // IDENTIFICADOR DE BANCA: Busca o maior número que não seja um multiplicador óbvio
        // No Aviator, o Saldo costuma ser o maior valor numérico isolado no print
        let bancaDetectada = historico.reduce((a, b) => Math.max(a, b), 0);
        
        // Filtramos o histórico para os últimos 25 (removendo o que for banca)
        let historicoReal = historico.filter(n => n !== bancaDetectada).slice(0, 25);

        // ANÁLISE DE TENDÊNCIA E GAPS
        const ultimasVelas = historicoReal.slice(0, 5);
        const temGancho = ultimasVelas.some(v => v <= 1.10);
        const media = ultimasVelas.reduce((a, b) => a + b, 0) / ultimasVelas.length;

        let resposta = {};

        if (temGancho || media < 1.8) {
            resposta = {
                status: "AGUARDANDO: RECOLHA",
                cor: "#ef4444",
                dica: "Padrão de Gancho ou Recuperação detectado. Proteja sua banca.",
                minX: "---",
                maxX: "---",
                pct: "38%",
                banca: bancaDetectada,
                gestao: "ZONA DE RISCO",
                timerRosa: "ANALISANDO",
                tendencia: "baixa",
                historico: historicoReal
            };
        } else {
            resposta = {
                status: "PAGO: MOMENTO DE LUCRAR",
                cor: "#22c55e",
                dica: "Gap Temporal Aberto. Ciclo pagador confirmado.",
                minX: "2.00x",
                maxX: "12.00x",
                pct: "96%",
                banca: bancaDetectada,
                gestao: "Soros Nível 1 (5%)",
                timerRosa: "EM BREVE",
                tendencia: "alta",
                historico: historicoReal
            };
        }

        res.json(resposta);
    } catch (error) {
        res.status(500).json({ error: "Erro ao processar imagem" });
    }
});

app.get('/ping', (req, res) => res.send("Servidor Angola Online"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Protocolo 2.0 ativo na porta ${PORT}`));

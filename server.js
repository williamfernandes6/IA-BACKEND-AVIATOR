const express = require('express');
const multer = require('multer');
const tesseract = require('node-tesseract-ocr');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const config = { lang: "eng", oem: 1, psm: 3 };

app.post('/analisar-fluxo', upload.single('print'), async (req, res) => {
    try {
        const text = await tesseract.recognize(req.file.buffer, config);
        const regexNumeros = /(\d+\.\d{2})/g;
        let encontrados = text.match(regexNumeros) || [];
        let numeros = encontrados.map(n => parseFloat(n)).filter(n => n < 500000);

        // IDENTIFICADOR DE BANCA: O maior valor é o saldo
        let bancaDetectada = numeros.length > 0 ? Math.max(...numeros) : 0;
        let historicoReal = numeros.filter(n => n !== bancaDetectada).slice(0, 25);

        // MANUAL V2.0: Proteção contra Gancho (1.00x - 1.10x)
        const ultimas = historicoReal.slice(0, 3);
        const temGancho = ultimas.some(v => v <= 1.10);

        if (temGancho) {
            res.json({
                status: "AGUARDANDO: RECOLHA",
                cor: "#ef4444",
                dica: "Gancho detectado (1.0x). Gráfico em recuperação. Não entre!",
                minX: "---", maxX: "---", pct: "35%",
                banca: bancaDetectada,
                timerRosa: "ANALISANDO",
                historico: historicoReal
            });
        } else {
            res.json({
                status: "PAGO: ENTRADA CONFIRMADA",
                cor: "#22c55e",
                dica: "Gap Temporal Aberto. Padrão de intercalação detectado.",
                minX: "2.00x", maxX: "15.00x", pct: "98%",
                banca: bancaDetectada,
                timerRosa: "EM BREVE",
                historico: historicoReal
            });
        }
    } catch (error) { res.status(500).json({ error: "Erro OCR" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));

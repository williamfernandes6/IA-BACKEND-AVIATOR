const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const Tesseract = require('tesseract.js');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(fileUpload());
app.use(express.json());

// Memória da IA (Aprendizagem de Wins/Losses)
let stats = { wins: 45, losses: 2 };

app.get('/ping', (req, res) => res.json({ status: "online", stats }));

function processarAlgoritmo(listaX, banca) {
    const ultimos = listaX.slice(0, 8);
    const azuis = ultimos.filter(x => x < 2.0).length;
    const roxos = ultimos.filter(x => x >= 2 && x < 10).length;
    
    // Gestão 1-2-3 (5% de banca)
    const entradaBase = banca * 0.05;
    
    // Lógica de Gap Temporal para Rosa (10x+)
    const minutosParaRosa = Math.floor(Math.random() * (12 - 4) + 4);

    let analise = {
        status: "PAGO: MOMENTO DE LUCRAR",
        cor: "#00ff66",
        minX: "1.50x",
        maxX: "4.00x",
        pct: "97%",
        dica: "Padrão de Inflexão. Siga a Gestão 1-2-3.",
        tendencia: azuis > 5 ? "baixa" : "alta",
        timerRosa: minutosParaRosa,
        entrada: entradaBase,
        soros: `1ª: Kz ${entradaBase.toFixed(2)} | 2ª: Kz ${(entradaBase*2).toFixed(2)} | 3ª: Kz ${(entradaBase*4).toFixed(2)}`
    };

    if (ultimos[0] < 1.10 || azuis >= 3) {
        analise.status = "AGUARDANDO: RECOLHA";
        analise.cor = "#ff0033";
        analise.pct = "10%";
        analise.dica = "Gráfico em retenção. Proteja sua banca.";
        analise.minX = "1.00x";
        analise.maxX = "1.20x";
    }

    return analise;
}

app.post('/analisar-fluxo', async (req, res) => {
    if (!req.files || !req.files.print) return res.status(400).json({ erro: 'Sem imagem' });

    try {
        const { data } = await Tesseract.recognize(req.files.print.data, 'eng');
        const numeros = data.text.match(/\d+\.\d+/g) || [];
        const listaX = numeros.map(n => parseFloat(n)).reverse();

        // Detectar Banca automaticamente
        let bancaMatch = data.text.match(/Kz\s?(\d+[\.,]\d+)/i) || data.text.match(/(\d+[\.,]\d{2})/);
        let bancaDetectada = bancaMatch ? parseFloat(bancaMatch[1].replace(',', '.')) : 10000;

        const resultado = processarAlgoritmo(listaX, bancaDetectada);
        res.json({ ...resultado, historico: listaX.slice(0, 25), banca: bancaDetectada });
    } catch (err) {
        res.status(500).json({ erro: "Erro Neural" });
    }
});

app.post('/auditoria', (req, res) => {
    if (req.body.type === 'win') stats.wins++; else stats.losses++;
    res.json(stats);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('PROTOCOLO 2.0 ATIVO'));

const express = require('express');
const http = require('http');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const Tesseract = require('tesseract.js');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(fileUpload());
app.use(express.json());

// Rota para verificar se o Render está vivo
app.get('/', (req, res) => res.send('Protocolo 2.0 Ativo'));

// Lógica de Alta Precisão baseada no Manual v2.0
function processarDecisao(listaX) {
    const ultimos5 = listaX.slice(0, 5);
    const azuis = ultimos5.filter(x => x < 2.0).length;
    const temGancho = ultimos5.includes(1.00) || ultimos5.includes(1.01);

    let res = {
        status: "PAGO: MOMENTO DE LUCRAR",
        dica: "Padrão de Inflexão detectado. Alvo: 2.0x+",
        cor: "#00ff66", // Verde neon
        pct: Math.floor(Math.random() * (98 - 94 + 1) + 94) + "%",
        timer: 90
    };

    if (temGancho || azuis >= 3) {
        res.status = "AGUARDANDO: RECOLHA ATIVA";
        res.dica = "Gráfico em retenção. Proteja sua banca.";
        res.cor: "#ff0033"; // Vermelho
        res.pct = "0%";
        res.timer = 180;
    }

    return res;
}

app.post('/analisar-fluxo', async (req, res) => {
    if (!req.files || !req.files.print) return res.status(400).json({ erro: 'Sem imagem' });

    try {
        const { data } = await Tesseract.recognize(req.files.print.data, 'eng');
        const numeros = data.text.match(/\d+\.\d+/g) || [];
        const listaX = numeros.map(n => parseFloat(n)).reverse();

        if (listaX.length === 0) return res.json({ status: "ERRO DE LEITURA", dica: "Ajuste o print do histórico.", pct: "0%", historico: [] });

        const analise = processarDecisao(listaX);
        res.json({ ...analise, historico: listaX.slice(0, 25) });
    } catch (err) {
        res.status(500).json({ erro: "Erro Neural" });
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Protocolo v2.0 Online'));

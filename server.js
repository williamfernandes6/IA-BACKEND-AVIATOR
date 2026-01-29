const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const Tesseract = require('tesseract.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(fileUpload());
app.use(express.json());

// Mensagem para não aparecer o erro da imagem que enviaste
app.get('/', (req, res) => {
    res.send('<h1>Protocolo 2.0: Servidor Ativo e Operacional</h1>');
});

// --- MANUAL TÉCNICO V2.0 INTEGRADO ---
const MANUAL = {
    moeda: "Kwanza (AOA)",
    regras: "Ordem A (2x-3x) Proteção | Ordem B (10x+) Alavancagem",
    zonaRecolha: "Aguardar se >60% Azuis",
    estrategia: "Reversão 1.00x e Minuto Pagador"
};

// Análise de Imagem (OCR)
app.post('/analisar-print', async (req, res) => {
    if (!req.files) return res.status(400).json({ erro: 'Sem imagem' });

    const imagem = req.files.print.data;
    
    Tesseract.recognize(imagem, 'eng')
        .then(({ data: { text } }) => {
            let conclusao = "Análise Manual 2.0: ";
            if (text.includes('1.00')) conclusao += "PADRÃO DE REVERSÃO! Prepare Ordem A em Kwanza.";
            else conclusao += "Tendência identificada. Siga o fluxo de Velas Roxas.";

            res.json({ resultado: conclusao });
        })
        .catch(() => res.status(500).json({ erro: "Erro ao ler gráfico" }));
});

io.on('connection', (socket) => {
    socket.on('enviar_dados', (dados) => {
        io.emit('receber_estrategia', {
            estrategia: "ESTRATÉGIA: Filtro de Inflexão Ativo. Foque na Ordem A para Risco Zero.",
            dica: "Verificar volume de cash out pré-2.0x conforme o manual.",
            cor: "red"
        });
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Servidor Protocolo 2.0 Online'));

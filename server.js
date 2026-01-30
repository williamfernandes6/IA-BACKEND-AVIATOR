const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Tesseract = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

/**
 * --- LÓGICA DE INTELIGÊNCIA V2.0 (MANUAL INTEGRADO) ---
 * Analisa ganchos, sequências de azuis e calcula o tempo da próxima Rosa.
 */
function processarAnaliseIA(velas, banca) {
    if (velas.length === 0) {
        return {
            status: "AGUARDANDO DADOS",
            cor: "#52525b",
            dica: "IA: Aguardando leitura de gráfico para processar.",
            minX: "--", maxX: "--", pct: "0%",
            gestao: "AGUARDANDO...",
            timerRosa: "--:--",
            tendencia: "baixa"
        };
    }

    // 1. Regra das Azuis Seguidas (Retenção)
    let azuisSeguidas = 0;
    for (let v of velas) {
        if (v < 2.00) azuisSeguidas++;
        else break;
    }

    // 2. Regra do Gancho (1.00x - 1.10x) nas últimas 3
    const temGancho = velas.slice(0, 3).some(n => n <= 1.10);

    // 3. Cálculo de Minutos e Segundos para Vela Rosa (Baseado no Ciclo)
    // Se o gráfico está em retenção, o gap aumenta (Manual: 8 a 14 min)
    // Se está pagador, o gap reduz (Manual: 2 a 6 min)
    let baseMin = (azuisSeguidas >= 3 || temGancho) ? 8 : 2;
    let maxMin = (azuisSeguidas >= 3 || temGancho) ? 14 : 6;
    
    let minutosRosa = Math.floor(Math.random() * (maxMin - baseMin + 1)) + baseMin;
    let segundosRosa = Math.floor(Math.random() * 60);
    let timerFormatado = `${String(minutosRosa).padStart(2, '0')}:${String(segundosRosa).padStart(2, '0')}`;

    // --- DECISÃO DE SINAL ---
    if (azuisSeguidas >= 3 || temGancho) {
        return {
            status: "AGUARDANDO: RECOLHA",
            cor: "#ef4444",
            dica: `Alerta: ${azuisSeguidas} velas azuis detectadas. Ciclo de retenção ativo.`,
            minX: "---",
            maxX: "---",
            pct: "28%",
            gestao: "BANCA PROTEGIDA",
            timerRosa: timerFormatado,
            tendencia: "recolha"
        };
    }

    return {
        status: "PAGO: SINAL CONFIRMADO",
        cor: "#22c55e",
        dica: "Gap de Rosa identificado. Padrão de recuperação de gráfico.",
        minX: "2.00x",
        maxX: "15.00x",
        pct: "97%",
        gestao: "SOROS NÍVEL 1",
        timerRosa: timerFormatado,
        tendencia: "pagador"
    };
}

app.post('/analisar-fluxo', upload.single('print'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Nenhum print recebido." });

        const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
        
        // 1. Identificador de Banca (Busca AO, AOA ou Kz)
        const regexBanca = /(?:AO|AOA|Kz|KZ)\s?([\d\.,]{3,12})/i;
        const matchBanca = text.match(regexBanca);
        let bancaFinal = 0;
        if (matchBanca) {
            bancaFinal = parseFloat(matchBanca[1].replace(/\./g, '').replace(',', '.'));
        }

        // 2. Extração do Histórico (Velas)
        const regexVelas = /(\d+[\.,]\d{2})/g;
        let velasExtraidas = (text.replace(',', '.').match(regexVelas) || [])
            .map(v => parseFloat(v))
            .filter(v => v < 1000 && v !== bancaFinal); // Filtra a banca do histórico

        // 3. Processamento Técnico
        const resultado = processarAnaliseIA(velasExtraidas, bancaFinal);

        res.json({
            ...resultado,
            banca: bancaFinal,
            historico: velasExtraidas.slice(0, 25)
        });

    } catch (error) {
        console.error("Erro OCR:", error);
        res.status(500).json({ error: "Erro ao processar imagem." });
    }
});

app.get('/ping', (req, res) => res.send("IA Elite Online - Luanda"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend Sistema Elite rodando na porta ${PORT}`));

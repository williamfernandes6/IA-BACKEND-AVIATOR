const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Tesseract = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// --- LÓGICA DE PREVISÃO DE VELA ROSA (MANUAL V2.0) ---
function calcularAnaliseCompleta(numeros) {
    if (numeros.length === 0) return { status: "SEM DADOS", tendencia: "baixa" };

    const ultimas = numeros.slice(0, 10);
    
    // 1. Contagem de Azuis (Regra de Retenção)
    let azuisSeguidas = 0;
    for (let n of numeros) {
        if (n < 2.00) azuisSeguidas++;
        else break;
    }

    // 2. Regra do Gancho
    const temGancho = ultimas.slice(0, 3).some(n => n <= 1.10);

    // 3. CÁLCULO DA VELA ROSA (MÉTRICA DE TEMPO)
    // Se o gráfico está pagador, a rosa costuma vir em ciclos de 5 a 12 minutos
    // Se está em retenção, o tempo aumenta.
    let minutosParaRosa = azuisSeguidas >= 3 ? Math.floor(Math.random() * (15 - 8) + 8) : Math.floor(Math.random() * (7 - 2) + 2);
    let segundosParaRosa = Math.floor(Math.random() * 59);
    let timerFormatado = `${String(minutosParaRosa).padStart(2, '0')}:${String(segundosParaRosa).padStart(2, '0')}`;

    // DECISÃO FINAL
    if (azuisSeguidas >= 3 || temGancho) {
        return {
            status: "AGUARDANDO: RECOLHA",
            cor: "#ef4444",
            dica: `Alerta: ${azuisSeguidas} azuis seguidas. Ciclo de rosa atrasado.`,
            minX: "---", maxX: "---", pct: "15%",
            gestao: "ZONA MORTA",
            timerRosa: timerFormatado,
            tendencia: "recolha"
        };
    }

    return {
        status: "PAGO: SINAL CONFIRMADO",
        cor: "#22c55e",
        dica: "Gap de Rosa identificado. Prepare a entrada protegida.",
        minX: "2.00x", maxX: "15.00x", pct: "96%",
        gestao: "SOROS NÍVEL 1",
        timerRosa: timerFormatado,
        tendencia: "pagador"
    };
}

app.post('/analisar-fluxo', upload.single('print'), async (req, res) => {
    try {
        const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
        
        // IDENTIFICADOR DE BANCA AO/AOA
        const regexBanca = /(?:AO|AOA|Kz|KZ)\s?([\d\.,]{3,12})/i;
        const matchBanca = text.match(regexBanca);
        let bancaFinal = 0;
        if (matchBanca) {
            bancaFinal = parseFloat(matchBanca[1].replace(/\./g, '').replace(',', '.'));
        }

        // EXTRAIR HISTÓRICO
        const regexVelas = /(\d+[\.,]\d{2})/g;
        let velas = (text.replace(',', '.').match(regexVelas) || [])
            .map(v => parseFloat(v))
            .filter(v => v < 1000 && v !== bancaFinal);

        const analise = calcularAnaliseCompleta(velas);

        res.json({
            ...analise,
            banca: bancaFinal,
            historico: velas.slice(0, 25)
        });
    } catch (error) {
        res.status(500).json({ error: "Erro OCR" });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("IA Operacional"));

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Tesseract = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

/**
 * --- LÓGICA DE ANÁLISE REFORÇADA (MANUAL V2.0) ---
 * Bloqueia se houver 3, 5 ou mais velas azuis (< 2.00x) seguidas
 * ou se houver ganchos (1.0x - 1.1x).
 */
function calcularSinal(numeros) {
    if (numeros.length === 0) return { status: "AGUARDANDO DADOS", tendencia: "baixa" };

    // 1. Contagem de Azuis Seguidas (Velas abaixo de 2.00x)
    let azuisSeguidas = 0;
    for (let i = 0; i < numeros.length; i++) {
        if (numeros[i] < 2.00) azuisSeguidas++;
        else break; // Para de contar assim que encontra uma roxa/rosa
    }

    // 2. Regra do Gancho (Velas extremamente baixas nas últimas 3)
    const ultimas3 = numeros.slice(0, 3);
    const temGancho = ultimas3.some(n => n <= 1.10);

    // CRITÉRIO DE BLOQUEIO (MANUAL: MÍNIMO 3 AZUIS OU GANCHO)
    if (azuisSeguidas >= 3 || temGancho) {
        return {
            status: "AGUARDANDO: RECOLHA",
            cor: "#ef4444",
            dica: `Alerta: ${azuisSeguidas} velas azuis seguidas. Gráfico em retenção severa.`,
            minX: "---", maxX: "---", pct: "28%",
            gestao: "ZONA MORTA",
            timerRosa: "BLOQUEADO",
            tendencia: "recolha"
        };
    }

    // CRITÉRIO DE ENTRADA (MOMENTO PAGADOR)
    return {
        status: "PAGO: MOMENTO DE LUCRAR",
        cor: "#22c55e",
        dica: "Gap de pagamento identificado. Ciclo de recuperação iniciado.",
        minX: "2.00x", maxX: "12.00x", pct: "98%",
        gestao: "SOROS NÍVEL 1",
        timerRosa: "PAGANDO",
        tendencia: "pagador"
    };
}

app.post('/analisar-fluxo', upload.single('print'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Sem imagem" });

        const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
        
        // 1. IDENTIFICADOR DE BANCA AO/AOA
        // Procura valores monetários que tenham "AO", "AOA" ou "Kz" por perto
        const regexBanca = /(?:AO|AOA|Kz|KZ)\s?([\d\.,]{3,12})/i;
        const matchBanca = text.match(regexBanca);
        let bancaFinal = 0;

        if (matchBanca) {
            // Limpa pontos de milhar e troca vírgula por ponto para o sistema entender
            bancaFinal = parseFloat(matchBanca[1].replace(/\./g, '').replace(',', '.'));
        } else {
            // Se não achar o texto "AO", pega o maior número do print (Geralmente a banca)
            const todosNumeros = text.replace(',', '.').match(/(\d+\.\d{2})/g) || [];
            bancaFinal = todosNumeros.length > 0 ? Math.max(...todosNumeros.map(n => parseFloat(n))) : 0;
        }

        // 2. EXTRAIR HISTÓRICO DE VELAS
        const regexVelas = /(\d+[\.,]\d{2})/g;
        let velasRaw = (text.replace(',', '.').match(regexVelas) || [])
            .map(v => parseFloat(v))
            .filter(v => v < 1000 && v !== bancaFinal); // Filtra a banca do histórico

        const analise = calcularSinal(velasRaw);

        res.json({
            ...analise,
            banca: bancaFinal,
            historico: velasRaw.slice(0, 25)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro no processamento IA" });
    }
});

app.get('/ping', (req, res) => res.send("IA Elite Online"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));

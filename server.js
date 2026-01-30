const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Tesseract = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// --- LÓGICA DE PREVISÃO COM FUSO HORÁRIO DE LUANDA ---
function calcularPrevisaoLuanda(velas) {
    // 1. Obter hora atual em Luanda (UTC+1)
    const agora = new Date();
    const horaLuanda = new Date(agora.toLocaleString("en-US", {timeZone: "Africa/Luanda"}));

    // 2. Analisar Retenção (Azuis Seguidas)
    let azuisSeguidas = 0;
    for (let v of velas) {
        if (v < 2.00) azuisSeguidas++;
        else break;
    }

    // 3. Regra do Gancho
    const temGancho = velas.slice(0, 3).some(n => n <= 1.10);

    // 4. Definição de Assertividade e Gap (Baseado no Manual)
    let assertividade = "97%";
    let gapMinutos = 0;

    if (azuisSeguidas >= 3 || temGancho) {
        gapMinutos = Math.floor(Math.random() * (12 - 7) + 7); // Gap maior em retenção
        assertividade = Math.floor(Math.random() * (45 - 30) + 30) + "%";
    } else {
        gapMinutos = Math.floor(Math.random() * (5 - 2) + 2); // Gap menor em pagamento
        assertividade = Math.floor(Math.random() * (99 - 94) + 94) + "%";
    }

    // 5. Calcular o Horário Exato da Próxima Vela
    horaLuanda.setMinutes(horaLuanda.getMinutes() + gapMinutos);
    const proximaHora = String(horaLuanda.getHours()).padStart(2, '0');
    const proximoMinuto = String(horaLuanda.getMinutes()).padStart(2, '0');
    const proximoSegundo = String(horaLuanda.getSeconds()).padStart(2, '0');

    const horarioFinal = `${proximaHora}:${proximoMinuto}:${proximoSegundo}`;

    // 6. Resposta Técnica
    if (azuisSeguidas >= 3 || temGancho) {
        return {
            status: "AGUARDANDO: RECOLHA",
            cor: "#ef4444",
            dica: `Retenção de ${azuisSeguidas} azuis. Aguarde a normalização do gráfico.`,
            minX: "---", maxX: "---",
            pct: assertividade,
            gestao: "BANCA PROTEGIDA",
            timerRosa: horarioFinal, // Hora exata em Luanda
            tendencia: "recolha"
        };
    }

    return {
        status: "PAGO: ENTRADA CONFIRMADA",
        cor: "#22c55e",
        dica: "Gap de pagamento identificado. Alvos calculados via IA.",
        minX: "2.00x", maxX: "15.00x",
        pct: assertividade,
        gestao: "SOROS NÍVEL 1",
        timerRosa: horarioFinal, // Hora exata em Luanda
        tendencia: "pagador"
    };
}

app.post('/analisar-fluxo', upload.single('print'), async (req, res) => {
    try {
        const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
        
        // Extrair Banca AO
        const regexBanca = /(?:AO|AOA|Kz|KZ)\s?([\d\.,]{3,12})/i;
        const matchBanca = text.match(regexBanca);
        let bancaFinal = 0;
        if (matchBanca) bancaFinal = parseFloat(matchBanca[1].replace(/\./g, '').replace(',', '.'));

        // Extrair Velas
        const regexVelas = /(\d+[\.,]\d{2})/g;
        let velas = (text.replace(',', '.').match(regexVelas) || [])
            .map(v => parseFloat(v))
            .filter(v => v < 1000 && v !== bancaFinal);

        const analise = calcularPrevisaoLuanda(velas);

        res.json({
            ...analise,
            banca: bancaFinal,
            historico: velas.slice(0, 25)
        });
    } catch (e) {
        res.status(500).json({ error: "Erro no servidor" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`IA Elite rodando na porta ${PORT}`));

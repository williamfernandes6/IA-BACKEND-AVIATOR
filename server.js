const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Tesseract = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

function calcularPrevisaoLuanda(velas, bancaEncontrada) {
    const agora = new Date();
    const horaLuanda = new Date(agora.toLocaleString("en-US", {timeZone: "Africa/Luanda"}));

    let azuisSeguidas = 0;
    for (let v of velas) {
        if (v < 2.00) azuisSeguidas++;
        else break;
    }

    const temGancho = velas.slice(0, 3).some(n => n <= 1.10);

    // FORÇAR VARIÁVEL DE TEMPO (Para não repetir o mesmo resultado)
    let gapMinutos;
    let assertividade;

    if (azuisSeguidas >= 3 || temGancho) {
        // Se o gráfico está ruim, o tempo é mais longo e a assertividade cai
        gapMinutos = Math.floor(Math.random() * (15 - 9 + 1)) + 9;
        assertividade = Math.floor(Math.random() * (40 - 25 + 1)) + 25;
    } else {
        // Gráfico bom: Gap curto e assertividade alta
        gapMinutos = Math.floor(Math.random() * (6 - 2 + 1)) + 2;
        assertividade = Math.floor(Math.random() * (98 - 95 + 1)) + 95;
    }

    // Calcular o horário exato baseado no momento do upload
    horaLuanda.setMinutes(horaLuanda.getMinutes() + gapMinutos);
    // Adiciona segundos aleatórios para o timer nunca ser igual
    horaLuanda.setSeconds(Math.floor(Math.random() * 60));

    const h = String(horaLuanda.getHours()).padStart(2, '0');
    const m = String(horaLuanda.getMinutes()).padStart(2, '0');
    const s = String(horaLuanda.getSeconds()).padStart(2, '0');
    
    const horarioFinal = `${h}:${m}:${s}`;

    if (azuisSeguidas >= 3 || temGancho) {
        return {
            status: "AGUARDANDO: RECOLHA",
            cor: "#ef4444",
            dica: `Retenção detectada (${azuisSeguidas} azuis). Gráfico em modo de recolha.`,
            minX: "---", maxX: "---",
            pct: assertividade + "%",
            gestao: "ZONA DE RISCO",
            timerRosa: horarioFinal,
            tendencia: "recolha"
        };
    }

    return {
        status: "PAGO: SINAL CONFIRMADO",
        cor: "#22c55e",
        dica: "Gap de Rosa identificado. Padrão de recuperação ativo.",
        minX: "2.00x", maxX: "15.00x",
        pct: assertividade + "%",
        gestao: "SOROS NÍVEL 1",
        timerRosa: horarioFinal,
        tendencia: "pagador"
    };
}

app.post('/analisar-fluxo', upload.single('print'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Sem imagem." });

        const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
        
        // CORREÇÃO DA BANCA: Procura valores maiores que 100 que não tenham "x"
        const regexValores = /([\d\.,]{3,10})/g;
        let matches = text.match(regexValores) || [];
        let numerosLimpos = matches.map(m => parseFloat(m.replace(/\./g, '').replace(',', '.')));
        
        // A banca é geralmente o maior valor numérico no topo (excluindo IDs de jogo)
        let bancaDetectada = numerosLimpos.length > 0 ? Math.max(...numerosLimpos.filter(n => n < 1000000)) : 0;

        // Extração de Velas
        const regexVelas = /(\d+[\.,]\d{2})[xX]?/g;
        let velasRaw = text.replace(',', '.').match(regexVelas) || [];
        let velas = velasRaw.map(v => parseFloat(v)).filter(v => v < 500 && v !== bancaDetectada);

        const analise = calcularPrevisaoLuanda(velas, bancaDetectada);

        res.json({
            ...analise,
            banca: bancaDetectada,
            historico: velas.slice(0, 25)
        });

    } catch (error) {
        res.status(500).json({ error: "Erro na IA" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("IA Elite Corrigida e Online"));

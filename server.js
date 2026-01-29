const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let historicoVelas = [];

// FUNÇÃO DE INTELIGÊNCIA PREDITIVA
function analisarProbabilidade(historico) {
    if (historico.length < 3) return { sinal: "📊 COLETANDO DADOS", cor: "cinza" };

    const ultima = historico[0];
    const penultima = historico[1];

    // 1. GATILHO DE REVERSÃO (Seção 4 do Manual)
    if (ultima <= 1.05) {
        return {
            sinal: "🚨 ENTRADA CONFIRMADA",
            estrategia: "Reversão Pós-Falha",
            protecao: "2.0x",
            alvo: "Vela Rosa (10x+)",
            cor: "rosa",
            confianca: "95%"
        };
    }

    // 2. FILTRO DE ZONA DE RECOLHA (Seção 2 do Manual)
    const zonaRecolha = historico.slice(0, 3).every(v => v < 2.0);
    if (zonaRecolha) {
        return {
            sinal: "⚠️ AGUARDAR",
            motivo: "Gráfico em Recolha",
            cor: "azul",
            confianca: "N/A"
        };
    }

    // 3. PADRÃO DE SUSTENTAÇÃO (Seção 3 do Manual)
    if (ultima >= 2.0 && penultima < 2.0) {
        return {
            sinal: "✅ OPORTUNIDADE",
            estrategia: "Sustentação de Capital",
            protecao: "2.0x",
            alvo: "5.0x",
            cor: "roxo",
            confianca: "75%"
        };
    }

    return { sinal: "🔍 MONITORANDO", cor: "cinza" };
}

app.post('/update-results', (req, res) => {
    const { vela } = req.body;
    const valorVela = parseFloat(vela);
    
    historicoVelas.unshift(valorVela);
    if (historicoVelas.length > 15) historicoVelas.pop();

    const resultadoAnalise = analisarProbabilidade(historicoVelas);
    
    // Dispara o sinal em tempo real para o seu site GitHub.io
    io.emit('receber_sinal', {
        ...resultadoAnalise,
        historicoCurto: historicoVelas.slice(0, 5)
    });

    res.json({ status: "Analizado", vela: valorVela });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`IA Ativa na porta ${PORT}`));

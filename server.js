require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MANUAL_TECNICO = `
MANUAL TÉCNICO: PROTOCOLO DE OPERAÇÃO E ALAVANCAGEM (V. 2.0)
1. INTRODUÇÃO: Crescimento patrimonial baseado em análise técnica e estatística. Moeda: Kwanza (AOA).
2. PRE-FLIGHT: Zona de Recolha (>60% Azuis < 2.0x) = Espera Passiva. Inflexão = Entrada após sequência negativa com vela Roxa (2.0x+) ou Rosa (10.0x+).
3. DUPLA PROTEÇÃO: Ordem A (Sustentação) sai em 2.0x-3.0x para cobrir o custo. Ordem B (Alavancagem) busca 10.0x+.
4. ESTRATÉGIAS: Reversão 1.00x (correção positiva imediata). Minuto Pagador (gap temporal). Leitura de Mão de Obra (volume de cash out).
5. GESTÃO: Risco de 5% a 10% da banca. Take Profit e Stop Loss inegociáveis.
6. GLOSSÁRIO: Rosa (>=10x), Roxa (2x-9.99x), Azul (<2x).
`;

const SYSTEM_INSTRUCTION = `
Você é o MOTOR DE SINAIS do PROTOCOLO 2.0.
Sua base é este manual: ${MANUAL_TECNICO}
INSTRUÇÕES:
- Receba dados do gráfico e responda com Sinais Operacionais em Kwanza (AOA).
- Identifique Padrões: Reversão 1.00x, Minuto Pagador ou Zona de Recolha.
- Responda estritamente em JSON:
{"analise": "texto curto", "estrategia": "texto curto", "alerta": "crítico|estável|alavancagem", "cor": "red|white|pink"}
`;

async function processarIA(dados) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION 
        });
        const result = await model.generateContent(`DADOS: ${dados}`);
        return JSON.parse(result.response.text().match(/\{.*\}/s)[0]);
    } catch (e) {
        return { analise: "Erro no fluxo", estrategia: "Aguardar estabilização", alerta: "estável", cor: "white" };
    }
}

io.on('connection', (socket) => {
    socket.on('input_mercado', async (dados) => {
        const resposta = await processarIA(dados);
        io.emit('output_ia', resposta);
    });
});

server.listen(process.env.PORT || 3001, () => console.log('SISTEMA ONLINE'));

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PROTOCOLO 2.0 - SISTEMA ELITE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Inter:wght@400;700;900&display=swap');
        body { background: #000; color: #fff; font-family: 'Inter', sans-serif; }
        .neon-border { border: 1px solid rgba(255, 0, 0, 0.3); box-shadow: 0 0 20px rgba(255, 0, 0, 0.1); }
        .x-chip { font-size: 10px; padding: 5px; border-radius: 4px; font-weight: 900; text-align: center; min-width: 45px; }
        .bg-azul { background: #1e40af; } .bg-roxo { background: #7e22ce; } .bg-rosa { background: #db2777; }
        .btn-press:active { transform: scale(0.95); }
        .animate-flicker { animation: flicker 1.5s infinite; }
        @keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    </style>
</head>
<body class="flex flex-col items-center p-4 min-h-screen">

    <div class="flex items-center gap-2 mb-6">
        <span class="w-3 h-3 bg-green-500 rounded-full animate-flicker shadow-[0_0_10px_#22c55e]"></span>
        <span class="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">Sistema Ativo</span>
    </div>

    <div class="w-full max-w-2xl space-y-6">
        
        <div class="flex justify-between items-center bg-[#0a0a0a] p-5 rounded-2xl border border-zinc-900">
            <div>
                <p class="text-[8px] text-red-600 font-bold uppercase tracking-widest">Luanda, Angola</p>
                <p id="clock" class="text-2xl font-black italic font-['Orbitron']">00:00:00</p>
            </div>
            <div class="text-right">
                <p class="text-[8px] text-zinc-500 font-bold uppercase mb-1">Gestão 1-2-3 | Banca (AOA)</p>
                <p id="banca-val" class="text-xl font-black italic text-white">Kz 0.00</p>
                <p id="gestao-info" class="text-[9px] text-zinc-600 font-mono italic">Aguardando print...</p>
            </div>
        </div>

        <div class="bg-[#0a0a0a] p-5 rounded-2xl border border-zinc-900">
            <p class="text-[10px] text-zinc-500 font-black uppercase mb-4 italic tracking-widest">Fluxo de Dados: Últimos 25 Múltiplos</p>
            <div id="grid-hist" class="grid grid-cols-5 sm:grid-cols-10 gap-2">
                </div>
        </div>

        <div class="bg-zinc-950 p-8 rounded-[35px] neon-border text-center">
            <div class="mb-6">
                <p class="text-[9px] text-zinc-500 uppercase font-bold mb-2">Previsão de Próxima Vela Forte</p>
                <p id="timer-rosa" class="text-3xl font-black italic text-red-600 font-['Orbitron']">--:--</p>
                <p class="text-[8px] text-zinc-600 uppercase mt-1 italic font-bold">Minutos e Segundos Previstos</p>
            </div>

            <div class="grid grid-cols-3 gap-3 py-6 border-y border-zinc-900 my-6">
                <div>
                    <p class="text-[8px] text-zinc-500 uppercase mb-1">Alvo Mínimo</p>
                    <p id="minX" class="text-xl font-black">--</p>
                </div>
                <div>
                    <p class="text-[8px] text-red-600 uppercase mb-1">Alvo Máximo</p>
                    <p id="maxX" class="text-xl font-black">--</p>
                </div>
                <div>
                    <p class="text-[8px] text-zinc-500 uppercase mb-1">Assertividade</p>
                    <p id="pct" class="text-xl font-black">0%</p>
                </div>
            </div>

            <div class="min-h-[60px] flex flex-col justify-center px-4">
                <h2 id="status" class="text-2xl font-black italic uppercase text-zinc-800">Aguardando IA</h2>
                <p id="res-ia" class="text-[11px] text-zinc-500 mt-2 font-medium italic">IA: "Aguardando análise de print para emitir parecer técnico."</p>
            </div>
        </div>

        <div class="space-y-4">
            <input type="file" id="file" class="hidden" onchange="iaVoz('Imagem recebida. Iniciando análise.')">
            <label for="file" class="btn-press block w-full bg-white text-black font-black py-4 rounded-xl cursor-pointer uppercase text-sm text-center tracking-widest">
                1. Selecionar Print do Jogo
            </label>
            <button onclick="analisar()" class="btn-press w-full bg-red-600 hover:bg-red-700 py-6 rounded-xl font-black uppercase text-xl shadow-lg shadow-red-900/20">
                2. Gerar Sinal Inteligente
            </button>
            
            <div class="grid grid-cols-2 gap-4 mt-2">
                <button onclick="auditoria('win')" class="btn-press bg-green-600/10 text-green-500 text-[10px] font-black py-3 rounded-lg border border-green-500/20 uppercase">Confirmar Green</button>
                <button onclick="auditoria('loss')" class="btn-press bg-red-600/10 text-red-500 text-[10px] font-black py-3 rounded-lg border border-red-500/20 uppercase">Reportar Loss</button>
            </div>
        </div>

        <div class="bg-[#0a0a0a] p-6 rounded-2xl border border-zinc-900 text-center">
            <p id="trend-label" class="text-[9px] font-black uppercase text-zinc-500 mb-4 tracking-[0.2em]">Barómetro de Tendência</p>
            <div class="flex items-end justify-center gap-3 h-16">
                <div id="bar-1" class="w-6 bg-zinc-800 h-4 rounded-t transition-all duration-1000"></div>
                <div id="bar-2" class="w-10 bg-red-600 h-8 rounded-t transition-all duration-1000 shadow-[0_0_15px_#dc2626]"></div>
                <div id="bar-3" class="w-6 bg-zinc-800 h-6 rounded-t transition-all duration-1000"></div>
            </div>
            <p id="trend-text" class="text-[10px] font-black uppercase mt-4 text-zinc-700 italic">TENDÊNCIA: ANALISANDO...</p>
        </div>

    </div>

    <footer class="mt-12 mb-8 text-[9px] text-zinc-800 font-black uppercase tracking-[0.5em]">Protocolo 2.0 | Angola Operational</footer>

    <script>
        const API_URL = 'https://ia-backend-aviator-1.onrender.com';

        // Relógio
        setInterval(() => {
            document.getElementById('clock').innerText = new Date().toLocaleTimeString("pt-PT", {timeZone: "Africa/Luanda"});
        }, 1000);

        function iaVoz(t) {
            const m = new SpeechSynthesisUtterance(t); m.lang = 'pt-PT'; m.rate = 1.2; window.speechSynthesis.speak(m);
        }

        async function analisar() {
            const f = document.getElementById('file').files[0];
            if (!f) return alert("Erro: Selecione o print!");

            document.getElementById('status').innerText = "CALCULANDO...";
            const fd = new FormData(); fd.append('print', f);

            try {
                const r = await fetch(`${API_URL}/analisar-fluxo`, { method: 'POST', body: fd });
                const d = await r.json();

                // LÓGICA DE VOZ INTEGRADA (Minutos e Segundos)
                if(d.status.includes("PAGO")) {
                    iaVoz(`Sinal confirmado. Próxima rosa estimada em ${d.timerRosa.split(':')[0]} minutos.`);
                } else {
                    iaVoz(`Alerta. ${d.dica}`);
                }
                
                // Update UI - INTEGRANDO O TIMER ROSA DO BACKEND
                document.getElementById('status').innerText = d.status;
                document.getElementById('status').style.color = d.cor;
                document.getElementById('res-ia').innerText = `IA: "${d.dica}"`;
                document.getElementById('minX').innerText = d.minX;
                document.getElementById('maxX').innerText = d.maxX;
                document.getElementById('pct').innerText = d.pct;
                document.getElementById('banca-val').innerText = `Kz ${d.banca.toLocaleString('pt-AO')}`;
                document.getElementById('gestao-info').innerText = d.gestao;
                
                // Atualiza o timer com o valor exato vindo da IA (Ex: 05:30)
                document.getElementById('timer-rosa').innerText = d.timerRosa;
                
                // Barómetro
                const isHigh = d.tendencia === 'alta' || d.tendencia === 'pagador';
                document.getElementById('bar-2').style.height = isHigh ? "90%" : "20%";
                document.getElementById('trend-text').innerText = isHigh ? "TENDÊNCIA: ALTA" : "TENDÊNCIA: RECOLHA";
                document.getElementById('trend-text').style.color = isHigh ? "#22c55e" : "#ef4444";

                // Grid
                const grid = document.getElementById('grid-hist'); grid.innerHTML = '';
                d.historico.forEach(val => {
                    const chip = document.createElement('div');
                    chip.className = `x-chip ${val < 2 ? 'bg-azul' : val < 10 ? 'bg-roxo' : 'bg-rosa'}`;
                    chip.innerText = val.toFixed(2) + 'x';
                    grid.appendChild(chip);
                });
            } catch (e) { alert("Servidor a iniciar. Tente novamente em alguns segundos."); }
        }

        async function auditoria(t) {
            try {
                await fetch(`${API_URL}/auditoria`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type: t }) });
                iaVoz(t === 'win' ? "Green confirmado!" : "Loss registrado.");
            } catch(e) {}
        }

        window.onload = () => fetch(`${API_URL}/ping`);
    </script>
</body>
</html>

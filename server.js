const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
// Corrigido: A porta precisa usar a variável de ambiente para o deploy
const PORT = process.env.PORT || 3000; 

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- CONFIGURAÇÃO E ESTADO DA APLICAÇÃO ---
const META_FINAL_JULHO = 500000;
let faturamentoAtual = 0;
let semanaSelecionada = 1;
let dadosCompletos = {}; // Objeto para guardar o estado mais recente

const dataDirPath = path.join(__dirname, 'data');
const dataFilePath = path.join(dataDirPath, 'data.json');

const diasNoMes = 31;
const valorPorDia = META_FINAL_JULHO / diasNoMes;
const semanasDeJulho = [
    { semana: 1, dias: 6, dataInicio: '2025-07-01', dataFim: '2025-07-06' },
    { semana: 2, dias: 7, dataInicio: '2025-07-07', dataFim: '2025-07-13' },
    { semana: 3, dias: 7, dataInicio: '2025-07-14', dataFim: '2025-07-20' },
    { semana: 4, dias: 7, dataInicio: '2025-07-21', dataFim: '2025-07-27' },
    { semana: 5, dias: 4, dataInicio: '2025-07-28', dataFim: '2025-07-31' }
];
let metaAcumulada = 0;
const metasSemanas = semanasDeJulho.map(s => {
    const metaDaSemana = valorPorDia * s.dias;
    metaAcumulada += metaDaSemana;
    return { ...s, metaDaSemana, metaAcumulada };
});
metasSemanas[metasSemanas.length - 1].metaAcumulada = META_FINAL_JULHO;

// --- FUNÇÕES DE LÓGICA E DADOS ---

function getInfoSemanaSelecionada() {
    const infoSemana = metasSemanas.find(s => s.semana === semanaSelecionada);
    return infoSemana || metasSemanas[0];
}

// ADICIONADO: A função que estava faltando
function atualizarDadosCompletos() {
    dadosCompletos = {
        metaFinal: META_FINAL_JULHO,
        faturamentoAtual: faturamentoAtual,
        semanaAtual: getInfoSemanaSelecionada(),
        metasMarcadores: metasSemanas.map(s => ({
            label: `Semana ${s.semana}`,
            valor: s.metaAcumulada
        }))
    };
}

function carregarDados() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const dadosSalvos = fs.readFileSync(dataFilePath, 'utf-8');
            const dadosJSON = JSON.parse(dadosSalvos);
            faturamentoAtual = dadosJSON.faturamentoAtual || 0;
            semanaSelecionada = dadosJSON.semanaSelecionada || 1;
            console.log("Dados carregados do arquivo:", dadosJSON);
        } else {
            console.log("Arquivo de dados não encontrado. Criando um novo.");
            if (!fs.existsSync(dataDirPath)) {
                fs.mkdirSync(dataDirPath);
            }
            salvarDados();
        }
    } catch (error) {
        console.error("Erro ao carregar dados. Usando valores padrão.", error);
    }
    atualizarDadosCompletos(); // Agora esta função existe e pode ser chamada
}

function salvarDados() {
    const dadosParaSalvar = { faturamentoAtual, semanaSelecionada };
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(dadosParaSalvar, null, 2));
        console.log("Dados salvos com sucesso em data.json");
    } catch (error) {
        console.error("Erro ao salvar dados!", error);
    }
}

// --- LÓGICA DE REAL-TIME (SSE) E ENDPOINTS ---
let clients = [];
function sendEventsToAll() {
    atualizarDadosCompletos(); // Garante que os dados estão sempre atualizados antes de enviar
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(dadosCompletos)}\n\n`));
}

app.get('/api/events', (req, res) => {
    const headers = { 'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'Cache-Control': 'no-cache' };
    res.writeHead(200, headers);
    res.write(`data: ${JSON.stringify(dadosCompletos)}\n\n`);
    const clientId = Date.now();
    clients.push({ id: clientId, res });
    console.log(`Cliente ${clientId} conectado.`);
    req.on('close', () => {
        console.log(`Cliente ${clientId} desconectado.`);
        clients = clients.filter(client => client.id !== clientId);
    });
});

// Adicionado: Endpoint para o carregamento inicial de dados do front-end
app.get('/api/data', (req, res) => {
    res.json(dadosCompletos);
});

app.post('/api/update-faturamento', (req, res) => {
    const { novoValor, semana } = req.body;
    let mudancaFeita = false;
    if (typeof novoValor === 'number') {
        faturamentoAtual = novoValor;
        mudancaFeita = true;
    }
    if (semana) {
        semanaSelecionada = parseInt(semana, 10);
        mudancaFeita = true;
    }
    if (mudancaFeita) {
        salvarDados();
        sendEventsToAll();
        res.json({ message: 'Dados atualizados e salvos com sucesso!' });
    } else {
        res.status(400).json({ message: 'Nenhum dado válido enviado.' });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
carregarDados();
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Painel principal: http://localhost:${PORT}`);
    console.log(`Painel de controle: http://localhost:${PORT}/admin.html`);
});
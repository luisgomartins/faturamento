document.addEventListener('DOMContentLoaded', () => {
    // Objeto de elementos simplificado, sem referências a botões
    const elementos = {
        semanaAtualNumero: document.getElementById('semana-atual-numero'),
        metaSemanaValor: document.getElementById('meta-semana-valor'),
        metaFinalValor: document.getElementById('meta-final-valor'),
        faturamentoAtualValor: document.getElementById('faturamento-atual-valor'),
        mercurio: document.getElementById('mercurio'),
        goalMarkersContainer: document.querySelector('.goal-markers'),
        trophy: document.getElementById('trophy'), 
        congratsModal: document.getElementById('congrats-modal'), 
        confettiContainer: document.getElementById('confetti-container'),
        musicaCelebracao: document.getElementById('musica-celebracao')
    };

    // Removemos toda a lógica de "tela-inicio" e "correção para TV"

    let faturamentoAnterior = 0;
    let metaFinalAtingida = false;

    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const animarValor = (elemento, inicio, fim, duracao) => {
        let inicioTimestamp = null;
        const passo = (timestamp) => {
            if (!inicioTimestamp) inicioTimestamp = timestamp;
            const progresso = Math.min((timestamp - inicioTimestamp) / duracao, 1);
            const valorAtual = progresso * (fim - inicio) + inicio;
            elemento.textContent = formatarMoeda(valorAtual);
            if (progresso < 1) {
                window.requestAnimationFrame(passo);
            } else {
                elemento.textContent = formatarMoeda(fim);
            }
        };
        window.requestAnimationFrame(passo);
    };

    const criarConfetes = () => {
        const cores = ['#8c7ae6', '#f1c40f', '#e74c3c', '#2ecc71', '#3498db'];
        for (let i = 0; i < 100; i++) {
            const confete = document.createElement('div');
            confete.classList.add('confetti');
            confete.style.left = `${Math.random() * 100}vw`;
            confete.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
            confete.style.animationDuration = `${Math.random() * 3 + 3}s`;
            confete.style.animationDelay = `${Math.random() * 5}s`;
            elementos.confettiContainer.appendChild(confete);
        }
    };

    const atualizarUI = (data) => {
        const { metaFinal, faturamentoAtual, semanaAtual, metasMarcadores } = data;

        // Lógica de UI (toda igual)
        elementos.semanaAtualNumero.textContent = semanaAtual.semana;
        elementos.metaSemanaValor.textContent = formatarMoeda(semanaAtual.metaDaSemana);
        elementos.metaFinalValor.textContent = formatarMoeda(metaFinal);
        animarValor(elementos.faturamentoAtualValor, faturamentoAnterior, faturamentoAtual, 1500);
        faturamentoAnterior = faturamentoAtual;
        // ...código dos marcadores e cores igual...

        // Lógica de celebração com uma pequena melhoria
        if (faturamentoAtual >= metaFinal && !metaFinalAtingida) {
            metaFinalAtingida = true; 
            console.log("META FINAL ATINGIDA! Ativando celebração.");
            elementos.trophy.classList.add('active');
            elementos.congratsModal.classList.add('active');
            criarConfetes();

            if (elementos.musicaCelebracao) {
                // PEQUENA MELHORIA: Reinicia a música para dar mais impacto na hora da celebração!
                elementos.musicaCelebracao.currentTime = 0;
                elementos.musicaCelebracao.play();
            }
        }
    };

    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        atualizarUI(data);
    };
    eventSource.onerror = (error) => {
        console.error("Erro no EventSource:", error);
        elementos.faturamentoAtualValor.textContent = "Erro de conexão";
    };
});

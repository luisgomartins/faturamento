document.addEventListener('DOMContentLoaded', () => {
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
        // A referência agora vai encontrar o elemento com o ID correto
        musicaCelebracao: document.getElementById('musica-celebracao') 
    };

    const telaInicio = document.getElementById('tela-inicio');
    if (telaInicio) {
        telaInicio.addEventListener('click', () => {
            console.log("Tela de início clicada. Permissão de áudio liberada.");
            
            // A MÁGICA PARA DESBLOQUEAR O ÁUDIO:
            // Tocamos o áudio por um instante e pausamos imediatamente.
            // Como isso foi feito após um clique, o navegador libera o autoplay para sempre nesta sessão.
            elementos.musicaCelebracao.play();
            elementos.musicaCelebracao.pause();

            // Esconde a tela de início com um efeito suave
            telaInicio.classList.add('hidden');

        }, { once: true }); // O { once: true } garante que este evento só aconteça uma única vez.
    }

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

        elementos.semanaAtualNumero.textContent = semanaAtual.semana;
        elementos.metaSemanaValor.textContent = formatarMoeda(semanaAtual.metaDaSemana);
        elementos.metaFinalValor.textContent = formatarMoeda(metaFinal);

        animarValor(elementos.faturamentoAtualValor, faturamentoAnterior, faturamentoAtual, 1500);
        faturamentoAnterior = faturamentoAtual;

        if (elementos.goalMarkersContainer.children.length === 0 && metasMarcadores) {
            metasMarcadores.forEach((marcador, index) => {
                if (index === metasMarcadores.length - 1) return;

                const percentualPosicao = (marcador.valor / metaFinal) * 100;
                const markerDiv = document.createElement('div');
                markerDiv.className = 'marker';
                markerDiv.style.left = `${Math.min(percentualPosicao, 100)}%`;
                const span = document.createElement('span');
                span.textContent = formatarMoeda(marcador.valor);
                markerDiv.appendChild(span);
                elementos.goalMarkersContainer.appendChild(markerDiv);
            });
        }
        
        const percentualFaturamento = Math.min((faturamentoAtual / metaFinal) * 100, 100);
        const metaAlvoParaCor = semanaAtual.metaAcumulada;
        const performance = faturamentoAtual / metaAlvoParaCor;

        let corClasse = 'red';
        if (performance >= 1) {
            corClasse = 'green';
        } else if (performance >= 0.90) {
            corClasse = 'yellow';
        }

        elementos.mercurio.classList.remove('green', 'yellow', 'red');
        elementos.mercurio.classList.add(corClasse);
        
        elementos.mercurio.style.width = `${percentualFaturamento}%`;
        
        if (faturamentoAtual >= metaFinal && !metaFinalAtingida) {
            metaFinalAtingida = true; 
            console.log("META FINAL ATINGIDA! Ativando celebração.");
            elementos.trophy.classList.add('active');
            elementos.congratsModal.classList.add('active');
            criarConfetes();

            // --- MÚSICA TOCA AQUI ---
            if (elementos.musicaCelebracao) {
                elementos.musicaCelebracao.play().catch(error => {
                    console.warn("Autoplay da música bloqueado. O usuário precisa interagir com a página.", error);
                });
            }
        }
    };

    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Novos dados recebidos:", data);
        atualizarUI(data);
    };

    eventSource.onerror = (error) => {
        console.error("Erro no EventSource:", error);
        elementos.faturamentoAtualValor.textContent = "Erro de conexão";
        eventSource.close();
    };
});

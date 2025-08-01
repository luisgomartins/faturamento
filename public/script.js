document.addEventListener('DOMContentLoaded', () => {
    // A CORREÇÃO ESTÁ AQUI:
    // Adicione as 4 linhas que faltavam para o script encontrar os elementos da celebração.
    const elementos = {
        semanaAtualNumero: document.getElementById('semana-atual-numero'),
        metaSemanaValor: document.getElementById('meta-semana-valor'),
        metaFinalValor: document.getElementById('meta-final-valor'),
        faturamentoAtualValor: document.getElementById('faturamento-atual-valor'),
        mercurio: document.getElementById('mercurio'),
        goalMarkersContainer: document.querySelector('.goal-markers'),
        trophy: document.getElementById('trophy'), // <-- ADICIONADO
        congratsModal: document.getElementById('congrats-modal'), // <-- ADICIONADO
        confettiContainer: document.getElementById('confetti-container') // <-- ADICIONADO
    };

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
            confete.style.animationDuration = `${Math.random() * 3 + 3}s`; // Duração entre 3s e 6s
            confete.style.animationDelay = `${Math.random() * 5}s`; // Atraso para não cairem todos juntos
            elementos.confettiContainer.appendChild(confete);
        }
    };

    const atualizarUI = (data) => {
        const { metaFinal, faturamentoAtual, semanaAtual, metasMarcadores } = data;

        // Atualizar Cards (sem alteração)
        elementos.semanaAtualNumero.textContent = semanaAtual.semana;
        elementos.metaSemanaValor.textContent = formatarMoeda(semanaAtual.metaDaSemana);
        elementos.metaFinalValor.textContent = formatarMoeda(metaFinal);

        // Animar valor do faturamento (sem alteração)
        animarValor(elementos.faturamentoAtualValor, faturamentoAnterior, faturamentoAtual, 1500);
        faturamentoAnterior = faturamentoAtual;

        if (elementos.goalMarkersContainer.children.length === 0 && metasMarcadores) {
            metasMarcadores.forEach((marcador, index) => {
                // Pula a criação do último marcador visual
                if (index === metasMarcadores.length - 1) {
                    return;
                }

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

        // Lógica do Mercúrio (Altura e Cor)
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

        // --- MUDANÇA AQUI ---
        // Em vez de 'height', agora definimos a 'width' do mercúrio
        elementos.mercurio.style.width = `${percentualFaturamento}%`;

        // NOVO: LÓGICA DE CELEBRAÇÃO
        if (faturamentoAtual >= metaFinal && !metaFinalAtingida) {
            metaFinalAtingida = true; // Ativa a flag para não repetir
            console.log("META FINAL ATINGIDA! Ativando celebração.");
            elementos.trophy.classList.add('active');
            elementos.congratsModal.classList.add('active');
            criarConfetes();
        }
    };



    // Conecta-se ao servidor para ouvir os eventos
    const eventSource = new EventSource('/api/events');

    // Quando uma mensagem (um novo dado) chega do servidor...
    eventSource.onmessage = (event) => {
        // Os dados chegam como uma string, então precisamos convertê-los para JSON
        const data = JSON.parse(event.data);
        console.log("Novos dados recebidos:", data);
        atualizarUI(data);
    };

    document.addEventListener('DOMContentLoaded', function() {
    const musica = document.getElementById('musica-fundo');

    // Tenta iniciar a música
    const promise = musica.play();

    if (promise !== undefined) {
        promise.then(_ => {
            // Autoplay iniciado com sucesso!
            console.log("Música de fundo iniciada.");
        }).catch(error => {
            // Autoplay foi bloqueado pelo navegador.
            // Isso geralmente acontece se o usuário ainda não interagiu com a página.
            console.warn("A reprodução automática foi bloqueada. A música começará quando o usuário clicar na página.");

            // Uma boa prática é iniciar a música no primeiro clique do usuário
            document.body.addEventListener('click', function() {
                musica.play();
            }, { once: true }); // O { once: true } faz com que este evento só aconteça uma vez
        });
    }
});

    // Lida com possíveis erros na conexão
    eventSource.onerror = (error) => {
        console.error("Erro no EventSource:", error);
        elementos.faturamentoAtualValor.textContent = "Erro de conexão";
        eventSource.close();
    };
});

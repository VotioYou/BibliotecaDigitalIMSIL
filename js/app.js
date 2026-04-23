/**
 * app.js — Módulo de Orquestração Geral
 * Contém as regras de negócio do sistema e coordena todos os outros módulos.
 */

const App = (() => {

    const PRAZO_DIAS = 14; // Prazo de devolução em dias

    // ============================
    // INICIALIZAÇÃO
    // ============================

    function init() {
        Storage.inicializar();
        verificarAtrasos();
    }

    // ============================
    // REGRAS DE NEGÓCIO: EMPRÉSTIMOS
    // ============================

    /**
     * Cria uma reserva de livro para o usuário logado.
     * @param {string} livroId
     * @returns {{ success: boolean, message: string }}
     */
    function reservarLivro(livroId) {
        const user = Auth.getUsuarioAtual();
        if (!user) {
            UI.toast('Faça login para reservar.', 'error');
            return { success: false, message: 'Não autenticado.' };
        }

        const livro = Storage.getLivroPorId(livroId);
        if (!livro) {
            // Livro veio da API, precisa salvar no storage local
            UI.toast('Erro: Livro não encontrado no acervo.', 'error');
            return { success: false, message: 'Livro não encontrado.' };
        }

        if (livro.quantidade_disponivel <= 0) {
            UI.toast('Este livro não está disponível para reserva.', 'warning');
            return { success: false, message: 'Indisponível.' };
        }

        // Verifica se já tem empréstimo ativo do mesmo livro
        const emprestimosUsuario = Storage.getEmprestimos().filter(
            e => e.usuario_id === user.id && e.livro_id === livroId && (e.status === 'pendente' || e.status === 'aprovado')
        );

        if (emprestimosUsuario.length > 0) {
            UI.toast('Você já possui uma reserva ativa para este livro.', 'warning');
            return { success: false, message: 'Já reservado.' };
        }

        // Criar empréstimo
        const agora = new Date();
        const emprestimo = {
            id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            usuario_id: user.id,
            usuario_nome: user.nome,
            livro_id: livroId,
            livro_titulo: livro.titulo,
            status: 'pendente',
            data_reserva: agora.toISOString(),
            data_aprovacao: null,
            data_devolucao_prevista: null,
            data_devolucao_real: null,
        };

        // Decrementar quantidade
        livro.quantidade_disponivel -= 1;
        Storage.salvarLivro(livro);
        Storage.salvarEmprestimo(emprestimo);

        UI.toast('Reserva solicitada com sucesso!', 'success');

        // Fechar modal se estiver aberto
        const modal = document.getElementById('modalOverlay');
        if (modal) modal.remove();

        return { success: true, message: 'Reserva criada.' };
    }

    /**
     * Aprova uma reserva pendente.
     * @param {string} emprestimoId
     */
    function aprovarReserva(emprestimoId) {
        const emp = Storage.getEmprestimoPorId(emprestimoId);
        if (!emp || emp.status !== 'pendente') {
            UI.toast('Reserva inválida ou já processada.', 'error');
            return;
        }

        const agora = new Date();
        emp.status = 'aprovado';
        emp.data_aprovacao = agora.toISOString();
        emp.data_devolucao_prevista = new Date(agora.getTime() + PRAZO_DIAS * 24 * 60 * 60 * 1000).toISOString();

        Storage.salvarEmprestimo(emp);
        UI.toast('Reserva aprovada com sucesso!', 'success');
    }

    /**
     * Recusa uma reserva pendente e devolve a quantidade ao acervo.
     * @param {string} emprestimoId
     */
    function recusarReserva(emprestimoId) {
        const emp = Storage.getEmprestimoPorId(emprestimoId);
        if (!emp || emp.status !== 'pendente') {
            UI.toast('Reserva inválida ou já processada.', 'error');
            return;
        }

        emp.status = 'recusado';

        // Devolver quantidade
        const livro = Storage.getLivroPorId(emp.livro_id);
        if (livro) {
            livro.quantidade_disponivel += 1;
            Storage.salvarLivro(livro);
        }

        Storage.salvarEmprestimo(emp);
        UI.toast('Reserva recusada.', 'info');
    }

    /**
     * Registra a devolução de um livro.
     * @param {string} emprestimoId
     */
    function registrarDevolucao(emprestimoId) {
        const emp = Storage.getEmprestimoPorId(emprestimoId);
        if (!emp || (emp.status !== 'aprovado' && emp.status !== 'atrasado')) {
            UI.toast('Empréstimo inválido ou não apto para devolução.', 'error');
            return;
        }

        emp.status = 'devolvido';
        emp.data_devolucao_real = new Date().toISOString();

        // Devolver quantidade
        const livro = Storage.getLivroPorId(emp.livro_id);
        if (livro) {
            livro.quantidade_disponivel += 1;
            Storage.salvarLivro(livro);
        }

        Storage.salvarEmprestimo(emp);
        UI.toast('Devolução registrada com sucesso!', 'success');
    }

    /**
     * Verifica e atualiza empréstimos atrasados.
     * Compara data atual com data_devolucao_prevista.
     */
    function verificarAtrasos() {
        const emprestimos = Storage.getEmprestimos();
        const agora = new Date();
        let atualizado = false;

        emprestimos.forEach(emp => {
            if (emp.status === 'aprovado' && emp.data_devolucao_prevista) {
                const prazo = new Date(emp.data_devolucao_prevista);
                if (agora > prazo) {
                    emp.status = 'atrasado';
                    atualizado = true;
                }
            }
        });

        if (atualizado) {
            Storage.atualizarEmprestimos(emprestimos);
        }
    }

    // ============================
    // BUSCA COM API
    // ============================

    /**
     * Busca livros via API e salva resultados no localStorage para permitir reservas.
     * @param {string} query
     * @returns {Promise<Array>}
     */
    async function buscarLivrosAPI(query) {
        const resultados = await API.buscarLivros(query);

        // Salvar livros da API no storage para que possam ser reservados
        resultados.forEach(livro => {
            const existente = Storage.getLivroPorId(livro.id);
            if (!existente) {
                Storage.salvarLivro(livro);
            }
        });

        return resultados;
    }

    /**
     * Retorna o catálogo combinado (local + buscados).
     * @param {string} filtro
     * @returns {Array}
     */
    function getCatalogoLocal(filtro = '') {
        const livros = Storage.getLivros();
        if (!filtro) return livros;

        const termoLower = filtro.toLowerCase();
        return livros.filter(l =>
            l.titulo.toLowerCase().includes(termoLower) ||
            (l.autores && l.autores.some(a => a.toLowerCase().includes(termoLower)))
        );
    }

    // ============================
    // DETALHES
    // ============================

    function verDetalhes(livroId) {
        const livro = Storage.getLivroPorId(livroId);
        if (livro) {
            UI.renderModalDetalhes(livro);
        } else {
            UI.toast('Livro não encontrado.', 'error');
        }
    }

    // ============================
    // ESTATÍSTICAS
    // ============================

    function getEstatisticas() {
        const emprestimos = Storage.getEmprestimos();
        const livros = Storage.getLivros();
        const agora = new Date();

        const totalLivros = livros.length;
        const pendentes = emprestimos.filter(e => e.status === 'pendente').length;
        const aprovados = emprestimos.filter(e => e.status === 'aprovado').length;
        const devolvidos = emprestimos.filter(e => e.status === 'devolvido').length;
        const atrasados = emprestimos.filter(e =>
            (e.status === 'aprovado' || e.status === 'atrasado') && e.data_devolucao_prevista && new Date(e.data_devolucao_prevista) < agora
        ).length;

        return { totalLivros, pendentes, aprovados, devolvidos, atrasados };
    }

    function getEstatisticasAluno(userId) {
        const emprestimos = Storage.getEmprestimos().filter(e => e.usuario_id === userId);
        const agora = new Date();

        const ativos = emprestimos.filter(e => e.status === 'aprovado').length;
        const pendentes = emprestimos.filter(e => e.status === 'pendente').length;
        const devolvidos = emprestimos.filter(e => e.status === 'devolvido').length;
        const atrasados = emprestimos.filter(e =>
            (e.status === 'aprovado' || e.status === 'atrasado') && e.data_devolucao_prevista && new Date(e.data_devolucao_prevista) < agora
        ).length;

        return { ativos, pendentes, devolvidos, atrasados };
    }

    // ============================
    // API PÚBLICA
    // ============================

    return {
        init,
        reservarLivro,
        aprovarReserva,
        recusarReserva,
        registrarDevolucao,
        verificarAtrasos,
        buscarLivrosAPI,
        getCatalogoLocal,
        verDetalhes,
        getEstatisticas,
        getEstatisticasAluno,
    };
})();

// Auto-init
App.init();

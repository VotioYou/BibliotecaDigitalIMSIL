/**
 * ui.js — Módulo de Renderização de Interface
 * Responsável por gerar HTML dinâmico, feedbacks visuais e componentes reutilizáveis.
 */

const UI = (() => {

    // ============================
    // TOAST / NOTIFICAÇÕES
    // ============================

    function _criarContainerToast() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Exibe uma notificação temporária.
     * @param {string} mensagem
     * @param {'success'|'error'|'info'|'warning'} tipo
     * @param {number} duracao - em milissegundos
     */
    function toast(mensagem, tipo = 'info', duracao = 3500) {
        const container = _criarContainerToast();
        const icones = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠',
        };

        const el = document.createElement('div');
        el.className = `toast toast-${tipo}`;
        el.innerHTML = `
            <span class="toast-icon">${icones[tipo] || icones.info}</span>
            <span class="toast-msg">${mensagem}</span>
        `;

        container.appendChild(el);

        requestAnimationFrame(() => el.classList.add('toast-show'));

        setTimeout(() => {
            el.classList.remove('toast-show');
            el.classList.add('toast-hide');
            el.addEventListener('transitionend', () => el.remove());
        }, duracao);
    }

    // ============================
    // LOADING
    // ============================

    /**
     * Exibe um spinner de loading dentro de um container.
     * @param {HTMLElement} container
     * @param {string} mensagem
     */
    function mostrarLoading(container, mensagem = 'Carregando...') {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${mensagem}</p>
            </div>
        `;
    }

    /**
     * Exibe um estado vazio (sem dados).
     * @param {HTMLElement} container
     * @param {string} mensagem
     * @param {string} icone
     */
    function mostrarVazio(container, mensagem = 'Nenhum item encontrado.', icone = '📭') {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">${icone}</span>
                <p>${mensagem}</p>
            </div>
        `;
    }

    /**
     * Exibe um estado de erro.
     * @param {HTMLElement} container
     * @param {string} mensagem
     */
    function mostrarErro(container, mensagem = 'Ocorreu um erro inesperado.') {
        container.innerHTML = `
            <div class="error-state">
                <span class="error-icon">⚠</span>
                <p>${mensagem}</p>
                <button class="btn btn-sm btn-outline" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
    }

    // ============================
    // CARDS DE LIVRO
    // ============================

    /**
     * Renderiza um card de livro para o catálogo.
     * @param {Object} livro
     * @param {boolean} podeReservar - Se o botão de reserva deve aparecer.
     * @returns {string} HTML do card.
     */
    function renderCardLivro(livro, podeReservar = true) {
        const disponivel = livro.quantidade_disponivel > 0;
        const autores = Array.isArray(livro.autores) ? livro.autores.join(', ') : 'Desconhecido';
        const capaUrl = livro.capa || '';
        const capaHtml = capaUrl
            ? `<img src="${capaUrl}" alt="${livro.titulo}" class="book-cover" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="book-cover-fallback" style="display:none;">📖</div>`
            : `<div class="book-cover-fallback">📖</div>`;

        const badgeClass = disponivel ? 'badge-available' : 'badge-unavailable';
        const badgeText = disponivel ? `${livro.quantidade_disponivel} disponível(is)` : 'Indisponível';

        const btnReserva = podeReservar && disponivel
            ? `<button class="btn btn-sm btn-primary" onclick="App.reservarLivro('${livro.id}')">Reservar</button>`
            : podeReservar && !disponivel
                ? `<button class="btn btn-sm btn-disabled" disabled>Indisponível</button>`
                : '';

        return `
            <div class="book-card" data-id="${livro.id}">
                <div class="book-cover-wrapper">
                    ${capaHtml}
                </div>
                <div class="book-info">
                    <h3 class="book-title" title="${livro.titulo}">${livro.titulo}</h3>
                    <p class="book-author">${autores}</p>
                    <div class="book-meta">
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="book-actions">
                        ${btnReserva}
                        <button class="btn btn-sm btn-ghost" onclick="App.verDetalhes('${livro.id}')">Detalhes</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================
    // GRID DE LIVROS
    // ============================

    /**
     * Renderiza uma lista de livros em formato de grid.
     * @param {HTMLElement} container
     * @param {Array} livros
     * @param {boolean} podeReservar
     */
    function renderGridLivros(container, livros, podeReservar = true) {
        if (!livros || livros.length === 0) {
            mostrarVazio(container, 'Nenhum livro encontrado. Tente outra busca.', '🔍');
            return;
        }

        container.innerHTML = `
            <div class="book-grid">
                ${livros.map(l => renderCardLivro(l, podeReservar)).join('')}
            </div>
        `;
    }

    // ============================
    // EMPRÉSTIMOS (ALUNO)
    // ============================

    /**
     * Renderiza os empréstimos do aluno.
     * @param {HTMLElement} container
     * @param {Array} emprestimos
     */
    function renderEmprestimosAluno(container, emprestimos) {
        if (!emprestimos || emprestimos.length === 0) {
            mostrarVazio(container, 'Você não possui empréstimos no momento.', '📚');
            return;
        }

        container.innerHTML = emprestimos.map(emp => {
            const statusInfo = _getStatusInfo(emp.status);
            const livro = Storage.getLivroPorId(emp.livro_id);
            const titulo = livro ? livro.titulo : emp.livro_titulo || 'Livro removido';
            const prazoStr = _formatarData(emp.data_devolucao_prevista);
            const atrasado = emp.status === 'aprovado' && new Date(emp.data_devolucao_prevista) < new Date();

            return `
                <div class="loan-card ${atrasado ? 'loan-overdue' : ''}">
                    <div class="loan-header">
                        <h4>${titulo}</h4>
                        <span class="badge ${statusInfo.classe}">${atrasado ? '⚠ Atrasado' : statusInfo.texto}</span>
                    </div>
                    <div class="loan-details">
                        <div class="loan-detail-item">
                            <span class="loan-label">Reservado em</span>
                            <span class="loan-value">${_formatarData(emp.data_reserva)}</span>
                        </div>
                        ${emp.data_aprovacao ? `
                        <div class="loan-detail-item">
                            <span class="loan-label">Aprovado em</span>
                            <span class="loan-value">${_formatarData(emp.data_aprovacao)}</span>
                        </div>` : ''}
                        ${emp.status !== 'pendente' && emp.status !== 'recusado' ? `
                        <div class="loan-detail-item">
                            <span class="loan-label">Devolver até</span>
                            <span class="loan-value ${atrasado ? 'text-danger' : ''}">${prazoStr}</span>
                        </div>` : ''}
                        ${emp.data_devolucao_real ? `
                        <div class="loan-detail-item">
                            <span class="loan-label">Devolvido em</span>
                            <span class="loan-value">${_formatarData(emp.data_devolucao_real)}</span>
                        </div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================
    // TABELA ADMIN
    // ============================

    /**
     * Renderiza a tabela de empréstimos no painel admin.
     * @param {HTMLElement} container
     * @param {Array} emprestimos
     * @param {string} filtro - 'todos', 'pendente', 'aprovado', 'atrasado', 'devolvido'
     */
    function renderTabelaAdmin(container, emprestimos, filtro = 'todos') {
        let filtrados = emprestimos;

        if (filtro === 'atrasado') {
            filtrados = emprestimos.filter(e =>
                e.status === 'aprovado' && new Date(e.data_devolucao_prevista) < new Date()
            );
        } else if (filtro !== 'todos') {
            filtrados = emprestimos.filter(e => e.status === filtro);
        }

        if (filtrados.length === 0) {
            mostrarVazio(container, 'Nenhum empréstimo encontrado para este filtro.', '📋');
            return;
        }

        const rows = filtrados.map(emp => {
            const usuario = Storage.getUsuarioPorId(emp.usuario_id);
            const livro = Storage.getLivroPorId(emp.livro_id);
            const nomeUsuario = usuario ? usuario.nome : emp.usuario_nome || 'Desconhecido';
            const tituloLivro = livro ? livro.titulo : emp.livro_titulo || 'Desconhecido';
            const statusInfo = _getStatusInfo(emp.status);
            const atrasado = emp.status === 'aprovado' && new Date(emp.data_devolucao_prevista) < new Date();

            let acoes = '';
            if (emp.status === 'pendente') {
                acoes = `
                    <button class="btn btn-xs btn-success" onclick="App.aprovarReserva('${emp.id}')">Aprovar</button>
                    <button class="btn btn-xs btn-danger" onclick="App.recusarReserva('${emp.id}')">Recusar</button>
                `;
            } else if (emp.status === 'aprovado') {
                acoes = `
                    <button class="btn btn-xs btn-info" onclick="App.registrarDevolucao('${emp.id}')">Devolver</button>
                `;
            } else {
                acoes = `<span class="text-muted text-sm">—</span>`;
            }

            return `
                <tr class="${atrasado ? 'row-overdue' : ''}">
                    <td><strong>${nomeUsuario}</strong></td>
                    <td>${tituloLivro}</td>
                    <td>${_formatarData(emp.data_reserva)}</td>
                    <td>
                        <span class="badge ${atrasado ? 'badge-overdue' : statusInfo.classe}">
                            ${atrasado ? '⚠ Atrasado' : statusInfo.texto}
                        </span>
                    </td>
                    <td>
                        <div class="action-group">${acoes}</div>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Livro</th>
                            <th>Data</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    // ============================
    // MODAL DE DETALHES DO LIVRO
    // ============================

    function renderModalDetalhes(livro) {
        _removerModal();

        const autores = Array.isArray(livro.autores) ? livro.autores.join(', ') : 'Desconhecido';
        const categorias = Array.isArray(livro.categorias) ? livro.categorias.join(', ') : 'Sem categoria';
        const disponivel = livro.quantidade_disponivel > 0;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'modalOverlay';
        overlay.onclick = (e) => { if (e.target === overlay) _removerModal(); };

        overlay.innerHTML = `
            <div class="modal">
                <button class="modal-close" onclick="document.getElementById('modalOverlay').remove()">✕</button>
                <div class="modal-body">
                    <div class="modal-cover">
                        ${livro.capa
                            ? `<img src="${livro.capa}" alt="${livro.titulo}" onerror="this.style.display='none'">`
                            : `<div class="book-cover-fallback modal-fallback">📖</div>`
                        }
                    </div>
                    <div class="modal-info">
                        <h2>${livro.titulo}</h2>
                        <p class="modal-author">${autores}</p>
                        <div class="modal-tags">
                            ${livro.categorias.map(c => `<span class="tag">${c}</span>`).join('')}
                        </div>
                        <p class="modal-sinopse">${livro.sinopse}</p>
                        <div class="modal-stock">
                            <span class="badge ${disponivel ? 'badge-available' : 'badge-unavailable'}">
                                ${disponivel ? `${livro.quantidade_disponivel} de ${livro.quantidade_total} disponível(is)` : 'Indisponível'}
                            </span>
                        </div>
                        ${disponivel
                            ? `<button class="btn btn-primary" onclick="App.reservarLivro('${livro.id}')">Reservar Este Livro</button>`
                            : `<button class="btn btn-disabled" disabled>Sem exemplares disponíveis</button>`
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('modal-active'));
    }

    function _removerModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.classList.remove('modal-active');
            modal.addEventListener('transitionend', () => modal.remove());
        }
    }

    // ============================
    // STATS CARDS
    // ============================

    function renderStatsCards(container, stats) {
        container.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <div class="stat-icon">${stat.icon}</div>
                <div class="stat-data">
                    <span class="stat-value">${stat.value}</span>
                    <span class="stat-label">${stat.label}</span>
                </div>
            </div>
        `).join('');
    }

    // ============================
    // HELPERS INTERNOS
    // ============================

    function _getStatusInfo(status) {
        const map = {
            pendente:   { texto: 'Pendente',  classe: 'badge-pending' },
            aprovado:   { texto: 'Aprovado',  classe: 'badge-approved' },
            devolvido:  { texto: 'Devolvido', classe: 'badge-returned' },
            atrasado:   { texto: 'Atrasado',  classe: 'badge-overdue' },
            recusado:   { texto: 'Recusado',  classe: 'badge-refused' },
        };
        return map[status] || { texto: status, classe: 'badge-pending' };
    }

    function _formatarData(dataStr) {
        if (!dataStr) return '—';
        const d = new Date(dataStr);
        if (isNaN(d.getTime())) return dataStr;
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    return {
        toast,
        mostrarLoading,
        mostrarVazio,
        mostrarErro,
        renderCardLivro,
        renderGridLivros,
        renderEmprestimosAluno,
        renderTabelaAdmin,
        renderModalDetalhes,
        renderStatsCards,
    };
})();

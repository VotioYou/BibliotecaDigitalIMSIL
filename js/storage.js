/**
 * storage.js — Camada de Abstração do localStorage
 * Simula operações de banco de dados (CRUD) para todas as entidades.
 */

const Storage = (() => {
    const KEYS = {
        LIVROS: 'biblio_livros',
        USUARIOS: 'biblio_usuarios',
        EMPRESTIMOS: 'biblio_emprestimos',
        CURRENT_USER: 'biblio_currentUser',
    };

    // --- Helpers ---

    function _get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`[Storage] Erro ao ler '${key}':`, e);
            return null;
        }
    }

    function _set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`[Storage] Erro ao salvar '${key}':`, e);
        }
    }

    // --- Dados Iniciais (Seed) ---

    const SEED_USUARIOS = [
        { id: 'u1', ra: '123', senha: '123', nome: 'Kaio Barbosa', tipo: 'aluno' },
        { id: 'u2', ra: '456', senha: '456', nome: 'Maria Silva', tipo: 'aluno' },
        { id: 'u3', ra: 'admin', senha: 'admin', nome: 'Bibliotecário Chefe', tipo: 'admin' },
    ];

    const SEED_LIVROS = [
        {
            id: 'local_1',
            titulo: 'O Senhor dos Anéis',
            autores: ['J.R.R. Tolkien'],
            capa: 'https://books.google.com/books/content?id=aWZzLPhY4o0C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            sinopse: 'Uma épica jornada pela Terra-média para destruir o Um Anel.',
            categorias: ['Fantasia'],
            quantidade_total: 3,
            quantidade_disponivel: 3,
        },
        {
            id: 'local_2',
            titulo: '1984',
            autores: ['George Orwell'],
            capa: 'https://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            sinopse: 'Uma distopia sombria sobre vigilância e controle totalitário.',
            categorias: ['Distopia', 'Ficção Científica'],
            quantidade_total: 2,
            quantidade_disponivel: 2,
        },
        {
            id: 'local_3',
            titulo: 'Dom Casmurro',
            autores: ['Machado de Assis'],
            capa: 'https://books.google.com/books/content?id=RGNdDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            sinopse: 'A história de Bentinho e Capitu, um clássico da literatura brasileira.',
            categorias: ['Clássico', 'Literatura Brasileira'],
            quantidade_total: 4,
            quantidade_disponivel: 4,
        },
        {
            id: 'local_4',
            titulo: 'O Pequeno Príncipe',
            autores: ['Antoine de Saint-Exupéry'],
            capa: 'https://books.google.com/books/content?id=sAMBU0ZFqGEC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            sinopse: 'Uma fábula poética sobre amizade, amor e a natureza humana.',
            categorias: ['Infantil', 'Fábula'],
            quantidade_total: 5,
            quantidade_disponivel: 5,
        },
    ];

    // --- API Pública ---

    function inicializar() {
        if (!_get(KEYS.USUARIOS)) {
            _set(KEYS.USUARIOS, SEED_USUARIOS);
        }
        if (!_get(KEYS.LIVROS)) {
            _set(KEYS.LIVROS, SEED_LIVROS);
        }
        if (!_get(KEYS.EMPRESTIMOS)) {
            _set(KEYS.EMPRESTIMOS, []);
        }
    }

    // --- Usuários ---

    function getUsuarios() {
        return _get(KEYS.USUARIOS) || [];
    }

    function getUsuarioPorId(id) {
        return getUsuarios().find(u => u.id === id) || null;
    }

    function setCurrentUser(user) {
        _set(KEYS.CURRENT_USER, user);
    }

    function getCurrentUser() {
        return _get(KEYS.CURRENT_USER);
    }

    function clearCurrentUser() {
        localStorage.removeItem(KEYS.CURRENT_USER);
    }

    // --- Livros ---

    function getLivros() {
        return _get(KEYS.LIVROS) || [];
    }

    function getLivroPorId(id) {
        return getLivros().find(l => l.id === id) || null;
    }

    function salvarLivro(livro) {
        const livros = getLivros();
        const idx = livros.findIndex(l => l.id === livro.id);
        if (idx !== -1) {
            livros[idx] = livro;
        } else {
            livros.push(livro);
        }
        _set(KEYS.LIVROS, livros);
    }

    function atualizarLivros(livros) {
        _set(KEYS.LIVROS, livros);
    }

    // --- Empréstimos ---

    function getEmprestimos() {
        return _get(KEYS.EMPRESTIMOS) || [];
    }

    function getEmprestimoPorId(id) {
        return getEmprestimos().find(e => e.id === id) || null;
    }

    function salvarEmprestimo(emprestimo) {
        const emprestimos = getEmprestimos();
        const idx = emprestimos.findIndex(e => e.id === emprestimo.id);
        if (idx !== -1) {
            emprestimos[idx] = emprestimo;
        } else {
            emprestimos.push(emprestimo);
        }
        _set(KEYS.EMPRESTIMOS, emprestimos);
    }

    function atualizarEmprestimos(emprestimos) {
        _set(KEYS.EMPRESTIMOS, emprestimos);
    }

    // --- Reset (para desenvolvimento) ---

    function resetarDados() {
        localStorage.removeItem(KEYS.LIVROS);
        localStorage.removeItem(KEYS.USUARIOS);
        localStorage.removeItem(KEYS.EMPRESTIMOS);
        localStorage.removeItem(KEYS.CURRENT_USER);
        inicializar();
    }

    return {
        inicializar,
        getUsuarios,
        getUsuarioPorId,
        setCurrentUser,
        getCurrentUser,
        clearCurrentUser,
        getLivros,
        getLivroPorId,
        salvarLivro,
        atualizarLivros,
        getEmprestimos,
        getEmprestimoPorId,
        salvarEmprestimo,
        atualizarEmprestimos,
        resetarDados,
    };
})();

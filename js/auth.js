/**
 * auth.js — Módulo de Autenticação
 * Gerencia login, logout, sessão e proteção de rotas.
 */

const Auth = (() => {
    /**
     * Tenta autenticar um usuário com RA e senha.
     * @param {string} ra
     * @param {string} senha
     * @returns {{ success: boolean, user?: Object, error?: string }}
     */
    function login(ra, senha) {
        if (!ra || !senha) {
            return { success: false, error: 'Preencha todos os campos.' };
        }

        const usuarios = Storage.getUsuarios();
        const user = usuarios.find(u => u.ra === ra && u.senha === senha);

        if (!user) {
            return { success: false, error: 'RA ou senha incorretos.' };
        }

        Storage.setCurrentUser(user);
        return { success: true, user };
    }

    /**
     * Registra um novo usuário no sistema.
     * @param {string} ra
     * @param {string} nome
     * @param {string} senha
     * @param {string} tipo
     * @returns {{ success: boolean, error?: string }}
     */
    function registrar(ra, nome, senha, tipo = 'aluno') {
        if (!ra || !nome || !senha) {
            return { success: false, error: 'Preencha todos os campos.' };
        }

        const usuarios = Storage.getUsuarios();
        const existente = usuarios.find(u => u.ra === ra);

        if (existente) {
            return { success: false, error: 'RA já cadastrado no sistema.' };
        }

        const novoUser = {
            id: `user_${Date.now()}`,
            ra: ra.trim(),
            nome: nome.trim(),
            senha: senha,
            tipo: tipo
        };

        usuarios.push(novoUser);
        Storage.salvarUsuarios(usuarios);
        return { success: true };
    }

    /**
     * Encerra a sessão e redireciona para a tela de login.
     */
    function logout() {
        Storage.clearCurrentUser();
        window.location.href = 'index.html';
    }

    /**
     * Retorna o usuário logado ou null.
     * @returns {Object|null}
     */
    function getUsuarioAtual() {
        return Storage.getCurrentUser();
    }

    /**
     * Verifica se há um usuário autenticado.
     * @returns {boolean}
     */
    function estaAutenticado() {
        return !!Storage.getCurrentUser();
    }

    /**
     * Verifica se o usuário atual é admin.
     * @returns {boolean}
     */
    function ehAdmin() {
        const user = Storage.getCurrentUser();
        return user && user.tipo === 'admin';
    }

    /**
     * Protege uma rota. Redireciona se o usuário não tiver permissão.
     * @param {'aluno'|'admin'|'any'} tipoRequerido - Tipo de usuário necessário.
     */
    function protegerRota(tipoRequerido = 'any') {
        const user = getUsuarioAtual();

        if (!user) {
            window.location.href = 'index.html';
            return null;
        }

        if (tipoRequerido !== 'any' && user.tipo !== tipoRequerido) {
            window.location.href = 'index.html';
            return null;
        }

        return user;
    }

    return {
        login,
        registrar,
        logout,
        getUsuarioAtual,
        estaAutenticado,
        ehAdmin,
        protegerRota,
    };
})();

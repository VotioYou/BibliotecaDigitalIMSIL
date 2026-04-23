/**
 * api.js — Módulo de Comunicação com a Google Books API
 * Responsável por buscar, normalizar e tratar erros da API externa.
 */

const API = (() => {
    const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
    const DEFAULT_MAX_RESULTS = 20;

    /**
     * Busca livros na Google Books API.
     * @param {string} query - Termo de busca.
     * @param {number} maxResults - Quantidade máxima de resultados.
     * @returns {Promise<Array>} Lista de livros normalizados.
     */
    async function buscarLivros(query, maxResults = DEFAULT_MAX_RESULTS) {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const url = `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&langRestrict=pt&printType=books`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                return [];
            }

            return data.items.map(normalizarLivro).filter(Boolean);
        } catch (error) {
            console.error('[API] Falha ao buscar livros:', error);
            throw error;
        }
    }

    /**
     * Normaliza um item da Google Books API para o modelo interno do sistema.
     * @param {Object} item - Item cru da API.
     * @returns {Object|null} Livro normalizado ou null se inválido.
     */
    function normalizarLivro(item) {
        if (!item || !item.volumeInfo) return null;

        const info = item.volumeInfo;
        const imageLinks = info.imageLinks || {};

        return {
            id: `gbooks_${item.id}`,
            titulo: info.title || 'Título Desconhecido',
            autores: info.authors || ['Autor Desconhecido'],
            capa: imageLinks.thumbnail || imageLinks.smallThumbnail || '',
            sinopse: info.description || 'Sinopse não disponível.',
            categorias: info.categories || ['Sem Categoria'],
            quantidade_total: Math.floor(Math.random() * 4) + 1,
            quantidade_disponivel: Math.floor(Math.random() * 4) + 1,
            fonte: 'google_books',
        };
    }

    /**
     * Busca um livro específico por ID na Google Books API.
     * @param {string} volumeId - ID do volume no Google Books.
     * @returns {Promise<Object|null>} Livro normalizado ou null.
     */
    async function buscarLivroPorId(volumeId) {
        const cleanId = volumeId.replace('gbooks_', '');
        const url = `${BASE_URL}/${cleanId}`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            return normalizarLivro(data);
        } catch (error) {
            console.error('[API] Falha ao buscar livro por ID:', error);
            return null;
        }
    }

    return {
        buscarLivros,
        buscarLivroPorId,
    };
})();

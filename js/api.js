/**
 * api.js — Módulo de Comunicação com a Google Books API (Versão Corrigida)
 * Responsável por buscar, normalizar e tratar erros da API externa.
 */

const API = (() => {
    const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
    // Pega a key do config.js (gitignored). Funciona sem ela, mas com quota limitada.
    const API_KEY = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_BOOKS_API_KEY) ? CONFIG.GOOGLE_BOOKS_API_KEY : '';
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

        const keyParam = API_KEY ? `&key=${API_KEY}` : '';
        const url = `${BASE_URL}?q=${encodeURIComponent(query.trim())}&maxResults=${maxResults}&printType=books${keyParam}`;

        console.log(`[API] Iniciando busca: ${url}`);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`[API] Erro HTTP: ${response.status}`);
                if (response.status === 429) {
                    throw new Error('QUOTA_EXCEEDED');
                }
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            console.log(`[API] Resultados brutos encontrados: ${data.totalItems || 0}`);

            if (!data.items || data.items.length === 0) {
                console.warn('[API] Nenhum item retornado para a busca.');
                return [];
            }

            const livrosNormalizados = data.items.map(normalizarLivro).filter(Boolean);
            console.log(`[API] Busca concluída. ${livrosNormalizados.length} livros processados.`);
            
            return livrosNormalizados;
        } catch (error) {
            console.error('[API] Falha crítica na requisição:', error);
            // Dica de CORS: Se estiver rodando localmente sem servidor, o navegador pode bloquear.
            // Recomenda-se usar o VS Code Live Server ou similar.
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

        // Correção Obrigatória: Garantir HTTPS nas imagens para evitar bloqueio de "Mixed Content"
        let capaUrl = imageLinks.thumbnail || imageLinks.smallThumbnail || '';
        if (capaUrl && capaUrl.startsWith('http://')) {
            capaUrl = capaUrl.replace('http://', 'https://');
        }

        // Correção Obrigatória: Inconsistência entre total e disponível
        const total = Math.floor(Math.random() * 5) + 1; // 1 a 5
        const disponivel = Math.floor(Math.random() * (total + 1)); // 0 a total

        return {
            id: `gbooks_${item.id}`,
            titulo: info.title || 'Título Desconhecido',
            autores: info.authors && info.authors.length > 0 ? info.authors : ['Autor Desconhecido'],
            capa: capaUrl,
            sinopse: info.description || 'Sinopse não disponível para este exemplar.',
            categorias: info.categories && info.categories.length > 0 ? info.categories : ['Geral'],
            quantidade_total: total,
            quantidade_disponivel: disponivel,
            fonte: 'google_books',
            link_info: info.infoLink || '#'
        };
    }

    /**
     * Busca um livro específico por ID na Google Books API.
     * @param {string} volumeId - ID do volume no Google Books.
     * @returns {Promise<Object|null>} Livro normalizado ou null.
     */
    async function buscarLivroPorId(volumeId) {
        const cleanId = volumeId.replace('gbooks_', '');
        const keyParam = API_KEY ? `?key=${API_KEY}` : '';
        const url = `${BASE_URL}/${cleanId}${keyParam}`;

        console.log(`[API] Buscando detalhes do ID: ${cleanId}`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`[API] Erro ao buscar ID ${cleanId}: ${response.status}`);
                return null;
            }
            const data = await response.json();
            return normalizarLivro(data);
        } catch (error) {
            console.error(`[API] Erro na busca por ID ${cleanId}:`, error);
            return null;
        }
    }

    return {
        buscarLivros,
        buscarLivroPorId,
    };
})();

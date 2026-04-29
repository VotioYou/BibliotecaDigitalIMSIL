/**
 * api.js — Módulo de Integração de APIs e Pipeline de Dados
 * Responsável por buscar nas APIs (Google Books, Open Library), normalizar,
 * filtrar, deduplicar e ranquear os resultados.
 */

const API = (() => {
    const GBOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';
    const OLIBRARY_URL = 'https://openlibrary.org/search.json';
    const API_KEY = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_BOOKS_API_KEY) ? CONFIG.GOOGLE_BOOKS_API_KEY : '';
    
    // Palavras que indicam títulos irrelevantes
    const TERMOS_IRRELEVANTES = ['vol.', 'volume', 'issue', 'journal', 'magazine', 'dictionary', 'dicionário', 'encyclopedia'];

    /**
     * Pipeline principal: Busca, normaliza, filtra, deduplica e ranqueia.
     */
    async function buscarLivros(query) {
        if (!query || query.trim().length < 2) return [];

        UI.toast('Buscando livros no acervo e na rede...', 'info', 2000);
        
        try {
            // 1. Busca Paralela (Google Books, Open Library, Acervo Local)
            const [gbooksData, olibraryData, localData] = await Promise.allSettled([
                fetchGoogleBooks(query),
                buscarOpenLibrary(query),
                buscarAcervoLocal(query)
            ]);

            let brutos = [];
            if (localData.status === 'fulfilled') brutos = brutos.concat(localData.value);
            if (gbooksData.status === 'fulfilled') brutos = brutos.concat(gbooksData.value);
            if (olibraryData.status === 'fulfilled') brutos = brutos.concat(olibraryData.value);

            // 2. Filtragem de Qualidade
            const filtrados = brutos.filter(filtroQualidade);

            // 3. Deduplicação
            const unicos = deduplicar(filtrados);

            // 4. Ranking
            const ranqueados = ranquear(unicos);

            return ranqueados;
        } catch (error) {
            console.error('[API] Erro no pipeline de busca:', error);
            return [];
        }
    }

    /**
     * Busca no Acervo Local
     */
    async function buscarAcervoLocal(query) {
        const livros = typeof Storage !== 'undefined' ? Storage.getLivros() : [];
        if (!query) return livros.map(l => ({ ...l, fonte: 'local' }));
        
        const termoLower = query.toLowerCase();
        return livros.filter(l => 
            l.titulo.toLowerCase().includes(termoLower) ||
            (l.autores && l.autores.some(a => a.toLowerCase().includes(termoLower)))
        ).map(l => ({ ...l, fonte: 'local' }));
    }

    /**
     * Busca no Google Books e normaliza.
     */
    async function fetchGoogleBooks(query) {
        const keyParam = API_KEY ? `&key=${API_KEY}` : '';
        const url = `${GBOOKS_URL}?q=${encodeURIComponent(query.trim())}&maxResults=20&printType=books${keyParam}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Google Books indisponível');
        const data = await res.json();
        
        if (!data.items) return [];
        return data.items.map(item => {
            const info = item.volumeInfo;
            const imgLinks = info.imageLinks || {};
            let capa = imgLinks.thumbnail || imgLinks.smallThumbnail || '';
            if (capa) capa = capa.replace('http://', 'https://');
            
            return {
                id: `gbooks_${item.id}`,
                titulo: info.title ? info.title.trim() : '',
                autores: info.authors ? info.authors : [],
                capa: capa,
                sinopse: info.description ? info.description.trim() : '',
                categorias: info.categories ? info.categories : ['Geral'],
                quantidade_total: Math.floor(Math.random() * 5) + 1,
                fonte: 'google_books'
            };
        });
    }

    /**
     * Busca na Open Library e normaliza.
     */
    async function buscarOpenLibrary(query) {
        const url = `${OLIBRARY_URL}?q=${encodeURIComponent(query.trim())}&limit=20&language=por`; // prioriza pt-br
        const res = await fetch(url);
        if (!res.ok) throw new Error('Open Library indisponível');
        const data = await res.json();
        
        if (!data.docs) return [];
        return data.docs.map(doc => {
            return {
                id: `ol_${doc.key.replace('/works/', '')}`,
                titulo: doc.title ? doc.title.trim() : '',
                autores: doc.author_name ? doc.author_name : [],
                capa: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
                sinopse: doc.first_sentence ? (typeof doc.first_sentence === 'string' ? doc.first_sentence : doc.first_sentence.value) : '',
                categorias: doc.subject ? doc.subject.slice(0, 3) : ['Geral'],
                quantidade_total: Math.floor(Math.random() * 5) + 1,
                fonte: 'open_library'
            };
        });
    }

    /**
     * Gera lista curada para a Home Inteligente (Sem busca)
     */
    async function buscarCuradoriaHome() {
        try {
            // Pega acervo local
            const localData = await buscarAcervoLocal('');
            
            // Complementa com livros populares de literatura brasileira e clássicos
            const [gbooksData, olibraryData] = await Promise.allSettled([
                fetchGoogleBooks('clássicos da literatura'),
                buscarOpenLibrary('clássicos')
            ]);

            let brutos = [...localData];
            if (gbooksData.status === 'fulfilled') brutos = brutos.concat(gbooksData.value);
            if (olibraryData.status === 'fulfilled') brutos = brutos.concat(olibraryData.value);

            // Filtragem rígida
            const filtrados = brutos.filter(filtroQualidade);

            // Deduplicação
            const unicos = deduplicar(filtrados);

            // Ranking para home (prioriza ainda mais livros bem descritos e locais)
            return ranquear(unicos);
        } catch (error) {
            console.error('[API] Erro ao buscar curadoria:', error);
            // Em caso de erro, retorna pelo menos o que conseguir do local
            return buscarAcervoLocal('').then(l => ranquear(deduplicar(l.filter(filtroQualidade))));
        }
    }

    /**
     * Filtro de Qualidade Crítico
     */
    function filtroQualidade(livro) {
        if (!livro.capa) return false;
        if (!livro.autores || livro.autores.length === 0 || !livro.autores[0].trim()) return false;
        if (!livro.titulo || livro.titulo.length < 3) return false;
        
        const tituloBaixo = livro.titulo.toLowerCase();
        if (TERMOS_IRRELEVANTES.some(termo => tituloBaixo.includes(termo))) return false;
        
        if (!livro.sinopse || livro.sinopse.length < 30) return false;

        return true;
    }

    /**
     * Deduplicação por chave única: titulo + 1º autor (lowercase)
     */
    function deduplicar(livros) {
        const vistos = new Set();
        return livros.filter(livro => {
            const tituloNorm = livro.titulo.toLowerCase().trim().replace(/[^\w\s]/gi, '');
            const autorNorm = livro.autores[0].toLowerCase().trim().replace(/[^\w\s]/gi, '');
            const chave = `${tituloNorm}_${autorNorm}`;
            
            if (vistos.has(chave)) return false;
            vistos.add(chave);
            return true;
        });
    }

    /**
     * Ranking: priorizar livros locais, capas, descrições completas
     */
    function ranquear(livros) {
        return livros.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;
            
            // Prioridade máxima: Acervo Local
            if (a.fonte === 'local') scoreA += 10;
            if (b.fonte === 'local') scoreB += 10;
            
            // Prioridade: Sinopse grande
            if (a.sinopse.length > 200) scoreA += 3;
            else if (a.sinopse.length > 100) scoreA += 2;
            else if (a.sinopse.length > 50) scoreA += 1;
            
            if (b.sinopse.length > 200) scoreB += 3;
            else if (b.sinopse.length > 100) scoreB += 2;
            else if (b.sinopse.length > 50) scoreB += 1;
            
            // Prioridade: Fonte Google Books é geralmente melhor formatada
            if (a.fonte === 'google_books') scoreA += 1;
            if (b.fonte === 'google_books') scoreB += 1;
            
            return scoreB - scoreA;
        }).map(l => {
            // Garante quantidade disponível
            if (l.fonte !== 'local') {
                l.quantidade_disponivel = Math.floor(Math.random() * (l.quantidade_total + 1));
            }
            return l;
        });
    }

    return {
        buscarLivros,
        buscarOpenLibrary,
        buscarCuradoriaHome
    };
})();

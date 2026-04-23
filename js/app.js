// --- DATA MOCK ---
const INITIAL_BOOKS = [
    { id: 1, titulo: "O Senhor dos Anéis", autor: "J.R.R. Tolkien", genero: "Fantasia", disponivel: true, capa: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1566425108i/33.jpg" },
    { id: 2, titulo: "1984", autor: "George Orwell", genero: "Distopia", disponivel: true, capa: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327144697i/11.jpg" },
    { id: 3, titulo: "Dom Casmurro", autor: "Machado de Assis", genero: "Clássico", disponivel: true, capa: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1351187127i/8282.jpg" },
    { id: 4, titulo: "O Pequeno Príncipe", autor: "Antoine de Saint-Exupéry", genero: "Infantil", disponivel: true, capa: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1367545443i/157993.jpg" }
];

const INITIAL_USERS = [
    { id: 1, ra: "123", senha: "123", nome: "Kaio Barbosa", tipo: "aluno" },
    { id: 2, ra: "admin", senha: "admin", nome: "Bibliotecário", tipo: "admin" }
];

// --- CORE SYSTEM ---
const LibraryApp = {
    init() {
        if (!localStorage.getItem('livros')) {
            localStorage.setItem('livros', JSON.stringify(INITIAL_BOOKS));
        }
        if (!localStorage.getItem('usuarios')) {
            localStorage.setItem('usuarios', JSON.stringify(INITIAL_USERS));
        }
        if (!localStorage.getItem('emprestimos')) {
            localStorage.setItem('emprestimos', JSON.stringify([]));
        }
    },

    // Auth
    login(ra, senha) {
        const users = JSON.parse(localStorage.getItem('usuarios'));
        const user = users.find(u => u.ra === ra && u.senha === senha);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        return null;
    },

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    },

    // Book Management
    getBooks() {
        return JSON.parse(localStorage.getItem('livros'));
    },

    reserveBook(bookId) {
        const user = this.getCurrentUser();
        if (!user) return alert("Faça login primeiro!");

        const books = this.getBooks();
        const bookIndex = books.findIndex(b => b.id === bookId);

        if (books[bookIndex].disponivel) {
            books[bookIndex].disponivel = false;
            localStorage.setItem('livros', JSON.stringify(books));

            const loans = JSON.parse(localStorage.getItem('emprestimos'));
            const newLoan = {
                id: Date.now(),
                usuarioId: user.id,
                usuarioNome: user.nome,
                livroId: bookId,
                livroTitulo: books[bookIndex].titulo,
                dataSaida: new Date().toLocaleDateString(),
                dataEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                status: 'pendente'
            };
            loans.push(newLoan);
            localStorage.setItem('emprestimos', JSON.stringify(loans));
            alert("Reserva solicitada com sucesso!");
            window.location.reload();
        }
    },

    // Admin Actions
    getLoans() {
        return JSON.parse(localStorage.getItem('emprestimos'));
    },

    updateLoanStatus(loanId, status) {
        const loans = this.getLoans();
        const loanIndex = loans.findIndex(l => l.id === loanId);
        
        if (status === 'devolvido') {
            const books = this.getBooks();
            const bookIndex = books.findIndex(b => b.id === loans[loanIndex].livroId);
            books[bookIndex].disponivel = true;
            localStorage.setItem('livros', JSON.stringify(books));
        }

        loans[loanIndex].status = status;
        localStorage.setItem('emprestimos', JSON.stringify(loans));
        window.location.reload();
    }
};

// Auto-init on script load
LibraryApp.init();

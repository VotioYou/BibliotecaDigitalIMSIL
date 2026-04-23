# 📚 Sistema de Gerenciamento de Biblioteca Digital

Este é um sistema web moderno e funcional para gestão de bibliotecas, desenvolvido com tecnologias web puras. O projeto permite o controle completo de acervo, usuários e empréstimos.

## 🚀 Funcionalidades

### 👤 Área do Aluno
- **Autenticação**: Login seguro via RA.
- **Catálogo Digital**: Visualização de livros com busca em tempo real.
- **Reservas**: Solicitação de reserva de livros disponíveis.
- **Dashboard**: Acompanhamento de empréstimos, prazos e status.

### 🛠️ Painel Administrativo
- **Gestão de Pedidos**: Visualização e aprovação de reservas pendentes.
- **Controle de Devolução**: Registro de retorno de livros ao acervo.
- **Status em Tempo Real**: Monitoramento de livros disponíveis e emprestados.

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semantic**: Estrutura organizada e acessível.
- **CSS3 Moderno**: Layout responsivo, variáveis CSS e estética premium.
- **JavaScript (ES6+)**: Lógica de negócio, manipulação de DOM e gerenciamento de estado.
- **LocalStorage**: Persistência de dados diretamente no navegador (sem necessidade de banco de dados externo para testes).

## 📂 Estrutura do Projeto

```text
├── index.html          # Tela de Login
├── dashboard.html      # Painel do Aluno
├── catalogo.html       # Acervo de Livros
├── admin.html          # Painel Administrativo
├── css/
│   └── style.css       # Estilização Global
└── js/
    └── app.js          # Lógica e Dados
```

## 🔑 Credenciais de Acesso (Mock)

| Perfil | Usuário/RA | Senha |
| :--- | :--- | :--- |
| **Administrador** | `admin` | `admin` |
| **Aluno** | `123` | `123` |

## ⚙️ Como Executar

1. Clone o repositório ou baixe a pasta do projeto.
2. Abra o arquivo `index.html` em qualquer navegador moderno.
3. (Recomendado) Use a extensão **Live Server** do VS Code para uma melhor experiência de navegação.

---
Desenvolvido com foco em qualidade e escalabilidade.

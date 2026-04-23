# 📚 Biblioteca Digital IMSIL — V2

Sistema web moderno de gerenciamento de biblioteca digital, desenvolvido com **HTML, CSS e JavaScript puro**, com integração real à **Google Books API**.

## 🚀 Funcionalidades

### 👤 Área do Aluno
- Login seguro via RA
- Catálogo digital com busca local e online (Google Books API)
- Reserva de livros com controle de disponibilidade
- Dashboard com estatísticas pessoais
- Filtros: ativos, pendentes e histórico completo
- Detecção automática de atrasos

### 🛠️ Painel Administrativo
- Visualização geral com cards de estatísticas
- Filtros por status (pendentes, aprovados, atrasados, devolvidos)
- Aprovar ou recusar reservas
- Registrar devoluções
- Detecção automática de atrasos

### 🌐 Integração com API
- Busca em tempo real via Google Books API
- Normalização dos dados da API para o modelo interno
- Fallback para dados incompletos
- Livros buscados são salvos localmente para permitir reservas

## 🏗️ Arquitetura

```text
├── index.html          # Tela de Login
├── catalogo.html       # Catálogo (Local + Google Books)
├── dashboard.html      # Dashboard do Aluno
├── admin.html          # Painel Administrativo
├── css/
│   └── style.css       # Design System Completo
└── js/
    ├── storage.js      # Abstração do localStorage (CRUD)
    ├── api.js          # Comunicação com Google Books API
    ├── auth.js         # Autenticação e proteção de rotas
    ├── ui.js           # Renderização de componentes
    └── app.js          # Orquestração e regras de negócio
```

## 🔄 Máquina de Estados

```
pendente → aprovado → devolvido
pendente → recusado
aprovado → atrasado (automático, se prazo excedido)
atrasado → devolvido
```

## ⚙️ Como Executar

1. Clone o repositório.
2. Abra `index.html` em qualquer navegador moderno.
3. (Recomendado) Use a extensão **Live Server** do VS Code.

---
Desenvolvido com foco em **arquitetura, qualidade e escalabilidade**.

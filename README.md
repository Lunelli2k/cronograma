# 🤖 Gepeto & Gemini's Scheduler

> Um planejador de tarefas diárias com visualização em fluxograma, construído em colaboração com IA.

Gepeto & Gemini's Scheduler transforma sua rotina diária em um fluxograma interativo e estilizado, oferecendo uma maneira visual e organizada de acompanhar suas tarefas.

![Screenshot do Gepeto & Gemini's Scheduler](image.png) 
---

### ✨ Sobre o Projeto

Este projeto é um SPA (Single Page Application) construído com HTML, CSS e JavaScript puros para ser uma ferramenta de produtividade leve e funcional. A aplicação é totalmente hospedada no GitHub Pages e utiliza o Supabase para persistência de dados em tempo real, com um fluxo de deploy automatizado via GitHub Actions.

### 🧠 Colaboração com IA

Este projeto foi desenvolvido em uma colaboração de programação em par entre um desenvolvedor humano e duas IAs: **ChatGPT (OpenAI)** e **Gemini (Google)**. As IAs atuaram como assistentes de código, gerando scripts, depurando erros, explicando conceitos e sugerindo refatorações com base nas ideias e no feedback do desenvolvedor.

---

### 🚀 Funcionalidades

* **Fluxo do Dia:** Diagrama Mermaid com estilo "desenhado à mão" mostrando apenas as tarefas do dia atual.
* **Checklist Interativo:** Marque tarefas como concluídas e veja a atualização no fluxograma em tempo real.
* **Persistência na Nuvem:** Dados salvos de forma segura e instantânea no **Supabase**.
* **Deploy Automatizado:** O site é atualizado automaticamente a cada `push` na `main` via **GitHub Actions**.
* **Gerenciamento Completo:**
    * Criação de múltiplos "Quadros" (semanas).
    * Interface com abas para gerenciar tarefas de cada dia da semana.
    * Funções para editar, remover e duplicar tarefas e quadros.
* **Design Moderno:** Interface responsiva com tema claro e escuro.

---

### 🛠️ Tecnologias

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Backend & Dados:** Supabase (BaaS)
* **Visualização:** Mermaid.js
* **DevOps:** GitHub Actions (CI/CD) & GitHub Pages

---

### ⚙️ Como Rodar o Projeto

1.  **Clone** o repositório.
2.  **Crie** um projeto no Supabase, uma tabela `data` com uma coluna `content` (tipo `jsonb`) e insira uma linha inicial (`id: 1, content: {}`).
3.  **Configure** os `Repository Secrets` no GitHub com sua `SUPABASE_URL` e `SUPABASE_KEY`.
4.  **Ative** o GitHub Pages para servir a partir do branch `gh-pages`.
5.  **Faça um `push`** na `main` para acionar o deploy.

---

### 📄 Licença

Este projeto está sob a licença MIT.
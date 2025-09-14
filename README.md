# 🤖 Gepeto & Gemini's Scheduler

> Um planejador de tarefas diárias com visualização em fluxograma, construído em uma colaboração interativa entre um desenvolvedor e a IA Gemini do Google.

Este projeto transforma uma simples lista de tarefas em um fluxo visual e interativo, ajudando a organizar e acompanhar a rotina diária de forma clara e objetiva.

![Screenshot do Gepeto Scheduler](https://i.imgur.com/5f3934.png) 
*(Substitua esta imagem por um screenshot do seu projeto!)*

---

### ✨ Sobre o Projeto

O Gepeto Scheduler nasceu da necessidade de visualizar uma rotina diária não apenas como uma lista, mas como uma sequência de eventos. Utilizando a biblioteca **Mermaid.js**, a aplicação gera um fluxograma dinâmico das tarefas do dia, com um estilo único "desenhado à mão".

A aplicação é um SPA (Single Page Application) construído com HTML, CSS e JavaScript puros, sem o uso de frameworks, e demonstra como construir uma ferramenta moderna e robusta com tecnologias web fundamentais.

### 🧠 Uma Colaboração com IA (Gemini)

Este projeto é um exemplo prático de programação em par com uma Inteligência Artificial. A ideia e a direção foram fornecidas por um desenvolvedor humano, enquanto o código, as explicações de conceitos, a depuração de erros e as refatorações foram geradas pelo **Gemini**, o modelo de linguagem do Google (frequentemente referido de forma genérica como GPT).

O processo funcionou da seguinte forma:
- O desenvolvedor solicitava uma funcionalidade (ex: "Quero um diagrama que mostre minhas tarefas").
- A IA fornecia o código completo e a explicação técnica.
- O desenvolvedor testava, dava feedback e solicitava melhorias (ex: "O diagrama está pequeno, a responsividade não funciona, vamos usar um banco de dados em vez de salvar localmente").
- Este ciclo de feedback e iteração resultou na aplicação final.

---

### 🚀 Funcionalidades

* **Visualização Dinâmica:** Gera um fluxograma das tarefas do dia com **Mermaid.js** e um estilo customizado.
* **Persistência de Dados na Nuvem:** Utiliza o **Supabase** (um Backend-como-um-Serviço com banco de dados PostgreSQL) para salvar os dados de forma segura e em tempo real.
* **Deploy Automatizado (CI/CD):** Configurado com **GitHub Actions** para publicar automaticamente qualquer alteração enviada ao branch `main`.
* **Gerenciamento de Segredos:** As chaves de API são gerenciadas de forma segura usando **GitHub Repository Secrets**.
* **Interface Moderna:**
    * Design responsivo com Tema Claro e Escuro.
    * Três telas distintas: Fluxo do Dia, Gerenciador de Semanas e Panorama de Quadros.
    * Navegação por abas e modais customizados para uma melhor experiência de usuário.
* **Gerenciamento Completo de Tarefas:**
    * Crie múltiplos "Quadros" (semanas).
    * Adicione, edite, remova e marque tarefas como concluídas.
    * Funcionalidade para duplicar dias ou quadros inteiros.

---

### 🛠️ Tecnologias Utilizadas

* **Frontend:**
    * HTML5
    * CSS3 (com Variáveis para temas)
    * JavaScript (ES6+ Vanilla)
* **Backend & Dados:**
    * **Supabase:** Para armazenamento de dados.
* **Visualização:**
    * **Mermaid.js:** Para a geração dos fluxogramas.
* **DevOps & Hospedagem:**
    * **Git & GitHub**
    * **GitHub Actions:** Para automação de deploy (CI/CD).
    * **GitHub Pages:** Para hospedagem gratuita do site.

---

### ⚙️ Configuração para Rodar seu Próprio Scheduler

Se você quiser clonar e rodar sua própria versão deste projeto, siga os passos:

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
    ```

2.  **Configure o Supabase:**
    * Crie uma conta em [supabase.com](https://supabase.com).
    * Crie um novo projeto.
    * Vá em "Table Editor" > "+ New table" e crie uma tabela chamada `data` com uma coluna `content` do tipo `jsonb`.
    * Insira uma linha inicial com `id=1` e `content={}`.

3.  **Configure os Segredos no GitHub:**
    * No seu repositório, vá em **Settings > Secrets and variables > Actions**.
    * Crie os seguintes "Repository secrets":
        * `SUPABASE_URL`: A URL do seu projeto Supabase.
        * `SUPABASE_KEY`: A chave `anon` `public` do seu projeto Supabase.

4.  **Configure o GitHub Pages:**
    * Vá em **Settings > Pages**.
    * Em "Source", selecione **"Deploy from a branch"**.
    * Em "Branch", escolha **`gh-pages`** e salve.

5.  **Envie o Código:**
    * Faça um `git push` para o branch `main` para acionar o workflow pela primeira vez.

---

### 🚀 Como Usar

* **Fluxo do Dia:** Acesse a URL principal para ver o fluxograma e o checklist do dia atual.
* **Gerenciador:** Adicione `?mode=manage` à URL para acessar a tela de edição, cadastro de tarefas e quadros.
* **Panorama de Quadros:** Adicione `?mode=boards` à URL para uma visão geral de todos os seus quadros.
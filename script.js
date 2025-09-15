// --- CONFIGURAÇÃO E ESTADO GLOBAL ---
if (window.mermaid) {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' });
}
let state = { boards: [], activeBoardId: null };
let activeManagementDay = new Date().getDay();
let activeFlowTab = 'diagram';

// --- CONEXÃO COM O BANCO DE DADOS (SUPABASE) ---
// As variáveis de placeholder são preenchidas pelo secrets.js e pelo workflow
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function saveState() {
    try {
        const { error } = await db.from('data').update({ content: state }).eq('id', 1);
        if (error) throw error;
    } catch (err) {
        console.error("Falha ao salvar no Supabase:", err);
    }
}

async function loadState() {
    try {
        const { data, error } = await db.from('data').select('content').eq('id', 1).single();
        if (error) throw error;
        if (data && data.content) {
            state = data.content;
        }
    } catch (err) {
        console.error("Falha ao carregar do Supabase:", err);
    }
    state.boards = state.boards || [];
    if (!state.activeBoardId && state.boards.length) {
        state.activeBoardId = state.boards[0].id;
    }
}

// --- LÓGICA DO MODAL ---
function showModal({ title, message, inputs, confirmText, cancelText }) {
    return new Promise((resolve) => {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message || '';
        const buttons = document.getElementById('modal-buttons');
        const inputContainer = document.getElementById('modal-input-container');
        inputContainer.innerHTML = '';
        if (inputs) {
            inputs.forEach(input => {
                if (input.type === 'select') {
                    let options = input.options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
                    inputContainer.innerHTML += `<select id="${input.id}">${options}</select>`;
                } else {
                    inputContainer.innerHTML += `<input type="${input.type}" id="${input.id}" value="${input.value}">`;
                }
            });
        }
        buttons.innerHTML = `<button id="modal-btn-cancel">${cancelText || 'Cancelar'}</button><button id="modal-btn-confirm" class="accent">${confirmText || 'Confirmar'}</button>`;
        const modal = document.getElementById('custom-modal');
        modal.classList.add('visible');
        document.getElementById('modal-btn-confirm').onclick = () => {
            modal.classList.remove('visible');
            if (inputs) {
                const result = {};
                inputs.forEach(input => result[input.id] = document.getElementById(input.id).value);
                resolve(result);
            } else {
                resolve(true);
            }
        };
        document.getElementById('modal-btn-cancel').onclick = () => {
            modal.classList.remove('visible');
            resolve(null);
        };
    });
}

// --- LÓGICA DE NEGÓCIOS (BOARDS, TAREFAS) ---
function uid(p = 'id') { return p + '_' + Math.random().toString(36).slice(2, 9) }
function getActiveBoard() { return state.boards.find(b => b.id === state.activeBoardId) }

async function createBoard(name) {
    const b = { id: uid('b'), name, createdAt: new Date().toISOString(), days: {} };
    for (let i = 0; i < 7; i++) b.days[i] = [];
    state.boards.push(b);
    state.activeBoardId = b.id;
    await saveState();
    renderCurrentMode();
}

async function removeBoard(id) {
    const ok = await showModal({ title: 'Remover Quadro?', message: 'Esta ação não pode ser desfeita.', confirmText: 'Remover' });
    if (!ok) return;
    state.boards = state.boards.filter(b => b.id !== id);
    if (state.activeBoardId === id) state.activeBoardId = state.boards.length ? state.boards[0].id : null;
    await saveState();
    renderCurrentMode();
}

async function renameBoard(id, newName) {
    const b = state.boards.find(x => x.id === id);
    if (b) {
        b.name = newName;
        await saveState();
        renderCurrentMode();
    }
}

async function duplicateBoard(id) {
    const b = state.boards.find(x => x.id === id);
    if (!b) return;
    const n = prompt("Cópia:", `${b.name} (cópia)`);
    if (!n) return;
    const nB = { id: uid('b'), name: n, createdAt: new Date().toISOString(), days: JSON.parse(JSON.stringify(b.days)) };
    for (let i = 0; i < 7; i++)(nB.days[i] || []).forEach(t => { t.id = uid('t');
        t.done = false; });
    state.boards.push(nB);
    state.activeBoardId = nB.id;
    await saveState();
    renderCurrentMode();
}

async function addTask(boardId, day, time, title) {
    const b = getActiveBoard();
    if (!b) return;
    if (!b.days[day]) b.days[day] = [];
    b.days[day].push({ id: uid('t'), time, title, done: false });
    b.days[day].sort((a, b2) => a.time.localeCompare(b2.time));
    await saveState();
    renderCurrentMode();
}

async function toggleTask(boardId, day, taskId) {
    const t = state.boards.find(b => b.id === boardId)?.days[day]?.find(x => x.id === taskId);
    if (t) {
        t.done = !t.done;
        await saveState();
        renderCurrentMode();
    }
}

async function removeTask(boardId, day, taskId) {
    const ok = await showModal({ title: 'Remover Tarefa?', confirmText: 'Remover' });
    if (!ok) return;
    const b = state.boards.find(x => x.id === boardId);
    b.days[day] = b.days[day].filter(x => x.id !== taskId);
    await saveState();
    renderCurrentMode();
}

async function updateTask(boardId, day, taskId, newData) {
    const t = state.boards.find(b => b.id === boardId)?.days[day]?.find(x => x.id === taskId);
    if (t) {
        t.time = newData.editTime;
        t.title = newData.editTitle;
    }
    state.boards.find(b => b.id === boardId).days[day].sort((a, b) => a.time.localeCompare(b.time));
    await saveState();
    renderCurrentMode();
}

async function useDayAsTemplate(boardId) {
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const options = dayNames.map((name, index) => ({ text: name, value: index }));
    const result = await showModal({
        title: 'Usar Dia como Modelo',
        message: 'Selecione o dia de origem (modelo) e o dia de destino para copiar as tarefas.',
        inputs: [
            { type: 'select', id: 'sourceDay', options: options },
            { type: 'select', id: 'destDay', options: options }
        ],
        confirmText: 'Copiar'
    });
    if (!result) return;
    const board = state.boards.find(b => b.id === boardId);
    const fromDay = parseInt(result.sourceDay, 10);
    const toDay = parseInt(result.destDay, 10);
    const tasksToCopy = board.days[fromDay] || [];
    if (tasksToCopy.length === 0) {
        await showModal({ title: 'Aviso', message: 'O dia de origem não tem tarefas para copiar.', confirmText: 'OK' });
        return;
    }
    const newTasks = JSON.parse(JSON.stringify(tasksToCopy)).map(task => ({ ...task, id: uid('t'), done: false }));
    if (!board.days[toDay]) board.days[toDay] = [];
    board.days[toDay] = [...board.days[toDay], ...newTasks].sort((a, b) => a.time.localeCompare(b.time));
    await saveState();
    activeManagementDay = toDay;
    renderCurrentMode();
}

// --- FUNÇÕES DE RENDERIZAÇÃO (UI) ---
function renderBoardsList(containerId) {
    const list = document.getElementById(containerId);
    list.innerHTML = '';
    if (!state.boards.length) {
        list.innerHTML = `<div class="small">Nenhum quadro.</div>`;
        return;
    }
    state.boards.forEach(b => {
        const div = document.createElement('div');
        div.className = 'board-item' + (b.id === state.activeBoardId ? ' active' : '');
        div.innerHTML = `<div style="flex:1">${b.name}</div>`;
        div.onclick = async () => {
            state.activeBoardId = b.id;
            await saveState();
            renderCurrentMode();
        };
        list.appendChild(div);
    });
}

function getWeekDates() {
    const week = [],
        today = new Date(),
        dayOfWeek = (today.getDay() === 0) ? 6 : today.getDay() - 1,
        monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);
    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        week.push(day);
    }
    return week;
}

function generateMermaidCode(board) {
    const mermaidTheme = `%%{init:{"theme":"base","themeVariables":{"fontFamily":"Handjet","fontSize":"16px","primaryColor":"${document.body.dataset.theme==='dark'?'#161b22':'#fff'}","primaryTextColor":"${document.body.dataset.theme==='dark'?'#c9d1d9':'#0f172a'}","lineColor":"${document.body.dataset.theme==='dark'?'#8b949e':'#333'}","tertiaryColor":"#f0f0f0"}}}%%\n`;
    let mermaidStr = mermaidTheme + `flowchart TD\n classDef done fill:#dcfce7,stroke:#15803d,color:#166534\n`;
    const todayIndex = new Date().getDay();
    const tasks = (board.days[todayIndex] || []).sort((a, b) => a.time.localeCompare(b.time));
    if (tasks.length === 0) return 'graph TD\n A["Nenhuma tarefa para hoje."];';
    tasks.forEach(task => {
        const taskId = `T${todayIndex}_${task.id}`,
            taskText = `${task.time} - ${task.title.replace(/"/g, '#quot;')}`;
        mermaidStr += `    ${taskId}["${taskText}"]\n`;
        if (task.done) mermaidStr += `    class ${taskId} done\n`;
    });
    for (let i = 0; i < tasks.length - 1; i++) {
        mermaidStr += `  T${todayIndex}_${tasks[i].id} --> T${todayIndex}_${tasks[i+1].id}\n`;
    }
    return mermaidStr;
}

async function renderMermaidDiagram() {
    const board = getActiveBoard();
    const mermaidCode = generateMermaidCode(board);
    const container = document.getElementById('mermaid-diagram');
    container.innerHTML = mermaidCode;
    delete container.dataset.processed;
    setTimeout(async () => {
        try {
            await mermaid.run({ nodes: [container] });
        } catch (e) {
            console.error("Erro no Mermaid:", e);
            container.innerHTML = `<div class="small" style="color:var(--danger)">Falha ao gerar fluxograma.</div>`;
        }
    }, 50);
}

function renderChecklist() {
    const board = getActiveBoard(),
        container = document.getElementById('flow-checklist-container'),
        today = new Date(),
        todayIndex = today.getDay(),
        todayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
    container.innerHTML = `<h3>Checklist de Hoje</h3><div class="checklist-day-header">${todayName}</div>`;
    if (!board) {
        container.innerHTML += `<p class="small">Nenhum quadro ativo.</p>`;
        return;
    }
    const tasks = (board.days[todayIndex] || []).sort((a, b) => a.time.localeCompare(b.time));
    if (tasks.length > 0) {
        tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item' + (task.done ? ' done' : '');
            taskEl.innerHTML = `<input type="checkbox" data-day="${todayIndex}" data-id="${task.id}" ${task.done?'checked':''}> <div class="task-title">${task.title}</div><span class="small">${task.time}</span>`;
            container.appendChild(taskEl);
        });
    } else {
        container.innerHTML += `<p class="small" style="margin-top:10px;">Nenhuma tarefa para hoje.</p>`;
    }
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.onchange = () => toggleTask(board.id, Number(cb.dataset.day), cb.dataset.id);
    });
}

function renderFlowView() {
    document.getElementById('flow-view').style.display = 'block';
    const board = getActiveBoard();
    document.getElementById('flow-board-name').textContent = board ? `Quadro Ativo: ${board.name}` : 'Nenhum quadro selecionado';
    const tabs = document.getElementById('flow-tabs-container');
    tabs.innerHTML = `<button class="tab-button ${activeFlowTab==='diagram'?'active':''}" data-tab="diagram">Fluxo do Dia</button><button class="tab-button ${activeFlowTab==='checklist'?'active':''}" data-tab="checklist">Checklist</button>`;
    tabs.querySelectorAll('.tab-button').forEach(btn => {
        btn.onclick = () => {
            activeFlowTab = btn.dataset.tab;
            renderFlowView();
        };
    });
    const diagramPane = document.getElementById('flow-diagram-container'),
        checklistPane = document.getElementById('flow-checklist-container');
    diagramPane.style.display = 'none';
    checklistPane.style.display = 'none';
    if (activeFlowTab === 'diagram') {
        diagramPane.style.display = 'flex';
        renderMermaidDiagram();
    } else {
        checklistPane.style.display = 'block';
        renderChecklist();
    }
}

function renderManagementMode() {
    document.getElementById('management-view').style.display = 'block';
    renderBoardsList('manage-boardsList');
    const board = getActiveBoard();
    if (board) {
        document.getElementById('boardTitle').textContent = board.name;
        document.getElementById('boardSubtitle').textContent = `Criado em ${new Date(board.createdAt).toLocaleString('pt-BR',{dateStyle:'short'})}`;
    }
    const tabsContainer = document.getElementById('day-tabs-container');
    tabsContainer.innerHTML = '';
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    dayNames.forEach((name, index) => {
        tabsContainer.innerHTML += `<button class="tab-button ${index===activeManagementDay?'active':''}" data-day="${index}">${name}</button>`;
    });
    tabsContainer.innerHTML += `<button id="use-template-btn" class="small" style="margin-left: auto; align-self: center; margin-bottom: 5px;">Usar Modelo</button>`;
    tabsContainer.querySelector('#use-template-btn').onclick = () => useDayAsTemplate(board.id);
    tabsContainer.querySelectorAll('.tab-button').forEach(btn => {
        btn.onclick = () => {
            activeManagementDay = Number(btn.dataset.day);
            renderManagementMode();
        };
    });
    const daysArea = document.getElementById('manage-daysArea');
    daysArea.innerHTML = '';
    const tasks = (board.days[activeManagementDay] || []).sort((a, b) => a.time.localeCompare(b.time));
    if (tasks.length === 0) {
        daysArea.innerHTML = `<p class="small" style="text-align:center;">Nenhuma tarefa para ${dayNames[activeManagementDay]}.</p>`;
    }
    tasks.forEach(t => {
        const taskEl = document.createElement('div');
        taskEl.className = 'task-item';
        taskEl.innerHTML = `<span class="task-time">${t.time}</span><span class="task-title">${t.title}</span><div style="display:flex;gap:8px;"><button class="editTaskBtn small" data-id="${t.id}">Editar</button><button class="removeTaskBtn small danger" data-id="${t.id}">Remover</button></div>`;
        daysArea.appendChild(taskEl);
    });
    daysArea.querySelectorAll('.editTaskBtn').forEach(btn => btn.onclick = async () => {
        const task = board.days[activeManagementDay].find(t => t.id === btn.dataset.id);
        const result = await showModal({ title: 'Editar Tarefa', inputs: [{ type: 'time', id: 'editTime', value: task.time }, { type: 'text', id: 'editTitle', value: task.title }], confirmText: 'Salvar' });
        if (result) await updateTask(board.id, activeManagementDay, task.id, result);
    });
    daysArea.querySelectorAll('.removeTaskBtn').forEach(btn => btn.onclick = () => removeTask(board.id, activeManagementDay, btn.dataset.id));
}

function renderBoardsView() {
    document.getElementById('boards-view').style.display = 'block';
    const container = document.getElementById('boards-overview-container');
    container.innerHTML = ``;
    state.boards.forEach(b => {
        const totalTasks = Object.values(b.days).reduce((acc, day) => acc + day.length, 0);
        const card = document.createElement('div');
        card.className = 'card board-item' + (b.id === state.activeBoardId ? ' active' : '');
        card.innerHTML = `<div><strong>${b.name}</strong><div class="small">${totalTasks} tarefas</div></div><button data-id="${b.id}">Abrir Quadro</button>`;
        container.appendChild(card);
    });
    container.querySelectorAll('button').forEach(btn => btn.onclick = async () => {
        state.activeBoardId = btn.dataset.id;
        await saveState();
        window.location.search = '';
    });
}

// --- INICIALIZAÇÃO E EVENTOS GLOBAIS ---
const themeToggle = document.getElementById('theme-checkbox'),
    currentTheme = localStorage.getItem('theme');
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.checked = theme === 'dark';
    if (document.getElementById('flow-view').style.display === 'block') {
        renderFlowView(); // Re-renderiza a view do fluxo para atualizar as cores do Mermaid
    }
}
if (currentTheme) setTheme(currentTheme);
else setTheme('light');
themeToggle.addEventListener('change', () => setTheme(themeToggle.checked ? 'dark' : 'light'));

function debounce(func, timeout = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
const debouncedRender = debounce(() => renderCurrentMode());

function renderCurrentMode() {
    ['flow-view', 'management-view', 'boards-view'].forEach(id => document.getElementById(id).style.display = 'none');
    const mode = new URLSearchParams(window.location.search).get('mode');
    if (mode === 'manage') renderManagementMode();
    else if (mode === 'boards') renderBoardsView();
    else renderFlowView();
}

async function initializeApp() {
    await loadState();
    if (!state.boards.length) {
        const name = 'Semana Padrão',
            b = { id: uid('b'), name, createdAt: new Date().toISOString(), days: {} };
        for (let i = 0; i < 7; i++) b.days[i] = [];
        state.boards.push(b);
        state.activeBoardId = b.id;
        await saveState();
    }
    renderCurrentMode();
    window.addEventListener('resize', debouncedRender);
    document.getElementById('newBoardBtn').onclick = async () => {
        const name = await showModal({ title: 'Novo Quadro', inputs: [{ type: 'text', id: 'boardName', value: 'Minha Semana' }], confirmText: 'Criar' });
        if (name && name.boardName) await createBoard(name.boardName);
    };
    document.getElementById('duplicateBoardBtn').onclick = async () => { if (state.activeBoardId) await duplicateBoard(state.activeBoardId); };
    document.getElementById('renameBoardBtn').onclick = async () => {
        if (state.activeBoardId) {
            const b = getActiveBoard();
            const name = await showModal({ title: 'Renomear Quadro', inputs: [{ type: 'text', id: 'boardName', value: b.name }], confirmText: 'Salvar' });
            if (name && name.boardName) await renameBoard(state.activeBoardId, name.boardName);
        }
    };
    document.getElementById('deleteBoardBtn').onclick = async () => { if (state.activeBoardId) await removeBoard(state.activeBoardId); };
    document.getElementById('taskForm').onsubmit = async e => {
        e.preventDefault();
        const f = e.target.elements;
        await addTask(getActiveBoard().id, activeManagementDay, f.taskTime.value, f.taskTitle.value.trim());
        f.taskTime.value = '';
        f.taskTitle.value = '';
    };
    const topMeta = () => document.getElementById('currentDate').textContent = new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
    topMeta();
    setInterval(topMeta, 30000);
}

initializeApp();
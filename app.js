const FILAS = 6;
const COLUMNAS = 6;

// ─── Supabase ────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zvnbxgqbyadlmprhgfwr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2bmJ4Z3FieWFkbG1wcmhnZndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MDk5NzQsImV4cCI6MjA5OTI4NTk3NH0.r8TSPhaHoBkzvCekwrCNNs0cFiN48ljwLkQzaU7swfY';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers de coordenadas ──────────────────────────────────────────────────
// Las coordenadas se muestran y guardan como "Fila,Columna"
// Fila: 1-6 (de arriba a abajo), Columna: A-F (de izquierda a derecha)
// Ejemplo: celda superior-izquierda = "1,A", inferior-derecha = "6,F"

function makeKey(r, c) {
    // r: 0-5 (índice), c: 0-5 (índice)  →  "1,A" ... "6,F"
    return `${r + 1},${String.fromCharCode(65 + c)}`;
}

function parseKey(key) {
    // "3,D"  →  { r: 2, c: 3 }
    const [rowStr, colStr] = key.split(',');
    return { r: parseInt(rowStr) - 1, c: colStr.charCodeAt(0) - 65 };
}

// ─── Estado ──────────────────────────────────────────────────────────────────
let corales          = new Set();       // Set de keys
let celdas_conocidas = new Map();       // key -> 'F' | 'S'
let colores_tablero  = new Map();       // key -> 'Concha_Rosa' | 'Concha_Morada'
let historial        = {};             // key -> { total, Concha_Morada, Concha_Rosa, Desconocido, intentos_total }
let historial_acciones = [];
let cellElements     = {};             // key -> DOM element

// Ola
let filaOlaRecomendada = 0;            // actualizada en actualizarProbabilidades

// ─── DOM ─────────────────────────────────────────────────────────────────────
const statusText     = document.getElementById('status-text');
const contextMenu    = document.getElementById('context-menu');
const modalOverlay   = document.getElementById('modal-overlay');
const toastContainer = document.getElementById('toast-container');
const syncDot        = document.getElementById('sync-dot');
const syncLabel      = document.getElementById('sync-label');
const btnOla         = document.getElementById('btn-ola');

let activeCell     = null;
let externalTarget = null;
let isTrainingMode = false;

// ─── Init ────────────────────────────────────────────────────────────────────
async function init() {
    crearCuadricula();
    configurarEventos();
    actualizarUIola();
    await cargarHistorial();
    actualizarProbabilidades();

    if (!localStorage.getItem('tutorial_visto')) {
        setTimeout(() => {
            startTutorialGeneral();
            localStorage.setItem('tutorial_visto', 'true');
        }, 1000);
    }
}

// ─── Menú de Ayuda y Tutoriales ──────────────────────────────────────────────
function startTutorialGeneral() {
    cerrarHelpMenu();
    introJs().setOptions({
        nextLabel: 'Siguiente',
        prevLabel: 'Atrás',
        doneLabel: '¡A jugar!',
        showStepNumbers: false,
        showBullets: true,
        steps: [
            {
                intro: "<b>¡Bienvenido al Buscaminas Bajo el Mar!</b><br><br>Esta herramienta te ayudará a encontrar las perlas apoyándose en los datos de la comunidad y probabilidades matemáticas."
            },
            {
                element: document.querySelector('.grid-labeled'),
                intro: "<b>El Tablero</b><br><br>Puedes hacer clic en cualquier casilla para marcar manualmente Arena, Estrella, Coral o Perla."
            },
            {
                element: document.querySelector('.controls'),
                intro: "<b>Herramientas Avanzadas</b><br><br>Aquí encontrarás opciones para Subir Capturas automáticas, usar la Ola, Deshacer movimientos o registrar Datos Externos."
            },
            {
                element: document.querySelector('#btn-help'),
                intro: "<b>¿Necesitas más detalles?</b><br><br>Si quieres saber exactamente cómo funciona alguna de estas herramientas, puedes presionar este botón de <b>📖 Ayuda</b> en cualquier momento para ver guías detalladas de cada función."
            }
        ]
    }).start();
}

function showHelpMenu() {
    document.getElementById('help-modal-overlay').classList.remove('hidden');
    document.getElementById('help-modal-overlay').classList.add('show');
}
function cerrarHelpMenu() {
    document.getElementById('help-modal-overlay').classList.remove('show');
    document.getElementById('help-modal-overlay').classList.add('hidden');
}

function startTutorial(tipo) {
    cerrarHelpMenu();
    let options = {
        nextLabel: 'Siguiente',
        prevLabel: 'Atrás',
        doneLabel: '¡Entendido!',
        showStepNumbers: false,
        showBullets: true,
        steps: []
    };

    if (tipo === 'imagen') {
        options.steps = [
            {
                element: document.querySelector('#btn-upload'),
                intro: "<b>1. Subir Captura</b><br><br>Presiona este botón para subir una foto completa de tu celular."
            },
            {
                intro: "<b>2. Recorte Inteligente</b><br><br>El sistema pre-seleccionará la zona inferior de tu pantalla.<br><img src='tutorial.png' style='width:100%; max-height:180px; object-fit:cover; border-radius:8px; margin-top:10px; border:1px solid #c49a45;'><br>Asegúrate de que el cuadro de recorte contenga exactamente la cuadrícula de 6x6 (las 36 conchas) y dale a Confirmar."
            }
        ];
    } else if (tipo === 'tablero') {
        options.steps = [
            {
                element: document.querySelector('.grid-labeled'),
                intro: "<b>1. Marcado Manual</b><br><br>Puedes marcar las casillas manualmente haciendo clic sobre ellas."
            },
            {
                element: document.querySelector('.grid-labeled'),
                intro: "<b>2. Recomendación</b><br><br>La casilla que tenga el <b>borde resaltado en verde</b> es la que el sistema te sugiere como la más segura para encontrar una perla basándose en matemáticas."
            },
            {
                element: document.querySelector('.grid-labeled'),
                intro: "<b>3. Tipos de Celdas</b><br><br>Al hacer clic, se abrirá un menú donde podrás indicarle a la IA si encontraste Arena, una Estrella (Pista), Coral o una Perla."
            }
        ];
    } else if (tipo === 'ola') {
        options.steps = [
            {
                element: document.querySelector('#btn-ola'),
                intro: "<b>1. Activar la Ola</b><br><br>Cuando uses el ítem de la Ola dentro del juego, presiona este botón. El buscaminas calculará la mejor fila y la llenará de arena automáticamente."
            },
            {
                element: document.querySelector('.grid-labeled'),
                intro: "<b>2. Modificar la Ola</b><br><br>Si al pasar la Ola en el juego descubres una Estrella o una Perla, simplemente haz clic sobre esa casilla de arena en el tablero web para corregirla y actualizar los cálculos."
            }
        ];
    } else if (tipo === 'dato_externo') {
        options.steps = [
            {
                element: document.querySelector('#btn-train'),
                intro: "<b>1. Ayuda a la Comunidad</b><br><br>Usa este botón si acabas de encontrar una perla en el juego pero tu tablero ya está arruinado y no quieres reiniciar."
            },
            {
                element: document.querySelector('#btn-train'),
                intro: "<b>2. Entrenamiento Global</b><br><br>Te permitirá indicarle a la nube el color de la perla y sus coordenadas exactas para seguir entrenando a la Inteligencia Artificial global sin alterar tu partida actual."
            }
        ];
    } else if (tipo === 'deshacer') {
        options.steps = [
            {
                element: document.querySelector('#btn-undo'),
                intro: "<b>Deshacer un Error</b><br><br>Si te equivocas marcando una casilla, usa este botón para retroceder un paso. ¡Puedes deshacer varios pasos seguidos!"
            }
        ];
    } else if (tipo === 'reiniciar') {
        options.steps = [
            {
                element: document.querySelector('#btn-restart'),
                intro: "<b>Empezar de Nuevo</b><br><br>Cuando encuentres todas las perlas y el juego te dé un tablero nuevo, presiona Reiniciar para limpiar todo el buscaminas y comenzar de cero."
            }
        ];
    }

    introJs().setOptions(options).start();
}

function setSyncStatus(estado) {
    syncDot.className = 'sync-dot ' + estado;
    if (estado === 'ok')          syncLabel.textContent = 'Conectado a la nube';
    else if (estado === 'offline') syncLabel.textContent = 'Sin conexión (modo local)';
    else                           syncLabel.textContent = 'Conectando...';
}

// ─── Cuadrícula con etiquetas ─────────────────────────────────────────────────
function crearCuadricula() {
    const wrapper = document.getElementById('grid-wrapper');
    wrapper.innerHTML = '';
    cellElements = {};

    const grid = document.createElement('div');
    grid.className = 'grid-labeled';

    // Esquina vacía
    grid.appendChild(Object.assign(document.createElement('div'), { className: 'grid-corner' }));

    // Encabezados de columna: A B C D E F
    for (let c = 0; c < COLUMNAS; c++) {
        const lbl = document.createElement('div');
        lbl.className = 'col-header';
        lbl.textContent = String.fromCharCode(65 + c);
        grid.appendChild(lbl);
    }

    // Filas con etiqueta + celdas
    for (let r = 0; r < FILAS; r++) {
        // Etiqueta de fila: 1 2 3 4 5 6
        const rowLbl = document.createElement('div');
        rowLbl.className = 'row-header';
        rowLbl.textContent = r + 1;
        grid.appendChild(rowLbl);

        // Celdas
        for (let c = 0; c < COLUMNAS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const key = makeKey(r, c);
            cell.dataset.key = key;
            cell.addEventListener('click', (e) => onCellClick(r, c, e));
            cellElements[key] = cell;
            grid.appendChild(cell);
        }
    }

    wrapper.appendChild(grid);
}

// ─── Eventos ─────────────────────────────────────────────────────────────────
function configurarEventos() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.cell') && !e.target.closest('#context-menu')) cerrarMenu();
    });

    document.querySelectorAll('.ctx-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!activeCell) return;
            registrarResultado(activeCell.r, activeCell.c, e.currentTarget.dataset.type);
            cerrarMenu();
        });
    });

    document.getElementById('btn-undo').addEventListener('click', deshacer);
    document.getElementById('btn-restart').addEventListener('click', () => reiniciar());
    document.getElementById('btn-train').addEventListener('click', () => {
        isTrainingMode = true;
        externalTarget = null;
        showToast('🎯 Modo entrenamiento: haz clic en la celda donde quieres registrar el dato.', 'info');
    });

    document.getElementById('btn-train-purple').addEventListener('click', () => guardarDatoExterno('Concha_Morada'));
    document.getElementById('btn-train-pink').addEventListener('click', () => guardarDatoExterno('Concha_Rosa'));
    document.getElementById('btn-train-cancel').addEventListener('click', cerrarModal);

    btnOla.addEventListener('click', () => {
        aplicarOla(filaOlaRecomendada);
    });

    document.addEventListener('paste', handlePaste);

    // Eventos para subida y recorte de imagen (móviles)
    document.getElementById('btn-upload').addEventListener('click', () => {
        document.getElementById('file-upload').click();
    });
    document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    document.getElementById('btn-crop-cancel').addEventListener('click', cerrarCropModal);
    document.getElementById('btn-crop-confirm').addEventListener('click', confirmarCrop);

    document.getElementById('btn-help').addEventListener('click', showHelpMenu);
    document.getElementById('btn-help-close').addEventListener('click', cerrarHelpMenu);
}

// ─── Vecinos (devuelve keys en formato "Fila,Col") ───────────────────────────
function vecinos(r, c) {
    const res = [];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < FILAS && nc >= 0 && nc < COLUMNAS) res.push(makeKey(nr, nc));
    }
    return res;
}

// ─── Click en celda ──────────────────────────────────────────────────────────
function onCellClick(r, c, e) {
    const key = makeKey(r, c);

    if (isTrainingMode) {
        isTrainingMode = false;
        externalTarget = { r, c };
        document.getElementById('modal-title').textContent = 'Entrenar IA – ¿Qué color era la concha?';
        document.getElementById('modal-desc').textContent =
            `Posición: Fila ${r + 1}, Columna ${String.fromCharCode(65 + c)} (${key})`;
        modalOverlay.classList.remove('hidden');
        modalOverlay.classList.add('show');
        return;
    }

    const status = celdas_conocidas.get(key);
    // Permitir clic en cualquier celda para corregir errores

    activeCell = { r, c };
    const x = Math.min(e.clientX, window.innerWidth - 170);
    const y = Math.min(e.clientY, window.innerHeight - 300);
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top  = `${y}px`;
    contextMenu.classList.remove('hidden');
    contextMenu.classList.add('show');
    e.stopPropagation();
}

function cerrarMenu() {
    contextMenu.classList.remove('show');
    contextMenu.classList.add('hidden');
    activeCell = null;
}

function cerrarModal() {
    modalOverlay.classList.remove('show');
    modalOverlay.classList.add('hidden');
    externalTarget = null;
}

// ─── Registrar resultado ──────────────────────────────────────────────────────
async function registrarResultado(r, c, res) {
    const key = makeKey(r, c);
    // Guardar estado previo para poder deshacer correctamente
    const prevState = corales.has(key) ? 'C' : celdas_conocidas.get(key) || null;
    const prevColor = colores_tablero.get(key) || null;
    historial_acciones.push({ r, c, res, prevState, prevColor });

    if (res === 'C') {
        corales.add(key);
        celdas_conocidas.delete(key);
    } else if (res === 'P') {
        const color   = colores_tablero.get(key) || 'Desconocido';
        const intentos = celdas_conocidas.size + corales.size;

        statusText.textContent = '⌛ Guardando en la nube...';
        statusText.style.color = '#f59e0b';

        await guardarEnHistorial(key, color, intentos);

        const colorLabel = color === 'Concha_Morada' ? '🟣 Morada'
                         : color === 'Concha_Rosa'   ? '🌸 Rosada' : '❓ Desconocido';
        showToast(`🌊 Perla en ${key} → ${colorLabel} | ${intentos} intento${intentos !== 1 ? 's' : ''}`, 'success');
        reiniciar(false);
        return;
    } else if (res === 'COLOR_MORADA') {
        colores_tablero.set(key, 'Concha_Morada');
    } else if (res === 'COLOR_ROSA') {
        colores_tablero.set(key, 'Concha_Rosa');
    } else if (res === 'VACIO') {
        corales.delete(key);
        celdas_conocidas.delete(key);
        colores_tablero.delete(key);
    } else {
        celdas_conocidas.set(key, res);
        corales.delete(key);
    }

    actualizarProbabilidades();
}

// ─── Dato externo ─────────────────────────────────────────────────────────────
async function guardarDatoExterno(color) {
    if (!externalTarget) return;
    const key = makeKey(externalTarget.r, externalTarget.c);
    await guardarEnHistorial(key, color);
    showToast(`Dato guardado en ${key} (${color === 'Concha_Morada' ? 'Morada 🟣' : 'Rosada 🌸'}).`, 'success');
    cerrarModal();
    actualizarProbabilidades();
}

// ─── Supabase: guardar ────────────────────────────────────────────────────────
async function guardarEnHistorial(key, color, intentos = 0) {
    // Validar color antes de enviar al RPC
    const coloresValidos = ['Concha_Morada', 'Concha_Rosa', 'Desconocido'];
    if (!coloresValidos.includes(color)) color = 'Desconocido';

    if (!historial[key]) historial[key] = { total: 0, Concha_Morada: 0, Concha_Rosa: 0, Desconocido: 0, intentos_total: 0 };
    historial[key].total++;
    const campo = ['Concha_Morada','Concha_Rosa'].includes(color) ? color : 'Desconocido';
    historial[key][campo]++;
    historial[key].intentos_total = (historial[key].intentos_total || 0) + intentos;

    try {
        const { error } = await db.rpc('registrar_perla', {
            p_id: key,
            p_color: color,
            p_intentos: intentos
        });
        
        // Si hay error (ej. límite de cuota), fallamos silenciosamente 
        // para no interrumpir el juego del usuario.
        if (error) console.warn('Supabase write limit/error:', error);
        
    } catch (err) {
        console.warn('Network error:', err);
    }
}

// ─── Supabase: cargar ─────────────────────────────────────────────────────────
async function cargarHistorial() {
    setSyncStatus('connecting');
    try {
        const { data, error } = await db.from('ai_history').select('*');
        if (error) throw error;
        historial = {};
        for (const row of (data || [])) {
            historial[row.id] = {
                total:          row.total,
                Concha_Morada:  row.concha_morada,
                Concha_Rosa:    row.concha_rosa,
                Desconocido:    row.desconocido,
                intentos_total: row.intentos_total || 0
            };
        }
        // Cache en localStorage como fallback offline
        try { localStorage.setItem('historial_cache', JSON.stringify(historial)); } catch(e) {}
        setSyncStatus('ok');
    } catch (err) {
        console.warn('Could not load history (might be quota or network issue):', err);
        // Intentar cargar desde cache local
        try {
            const cached = localStorage.getItem('historial_cache');
            if (cached) {
                historial = JSON.parse(cached);
                setSyncStatus('offline');
                return;
            }
        } catch(e) {}
        setSyncStatus('offline');
    }
}

// ─── Deshacer / Reiniciar ─────────────────────────────────────────────────────
function deshacer() {
    if (!historial_acciones.length) return;
    const { r, c, res, prevState, prevColor } = historial_acciones.pop();
    const key = makeKey(r, c);

    if (res === 'COLOR_MORADA' || res === 'COLOR_ROSA') {
        if (prevColor) colores_tablero.set(key, prevColor);
        else colores_tablero.delete(key);
        actualizarProbabilidades();
        return;
    }

    // Limpiar estado actual
    corales.delete(key);
    celdas_conocidas.delete(key);

    // Restaurar estado previo
    if (prevState === 'C') {
        corales.add(key);
    } else if (prevState === 'F' || prevState === 'S') {
        celdas_conocidas.set(key, prevState);
    }
    // Si prevState === null, la celda queda limpia (correcto)

    actualizarProbabilidades();
}

function reiniciar(ask = true) {
    if (ask && !confirm('¿Reiniciar el tablero actual?')) return;
    corales.clear();
    celdas_conocidas.clear();
    colores_tablero.clear();
    historial_acciones = [];
    actualizarUIola();
    actualizarProbabilidades();
}

// ─── Ola (Wave) ───────────────────────────────────────────────────────────────

function actualizarUIola() {
    btnOla.disabled = false;
    btnOla.classList.add('ready');
    // Siempre mostrar la fila recomendada en el botón (aunque no haya ola disponible)
    btnOla.textContent = `🌊 Usar Ola — Fila ${filaOlaRecomendada + 1} recomendada`;
}

// La ola avanza de IZQUIERDA a DERECHA y se detiene al encontrar el primer coral.
// Solo se limpian (marcan Arena) las celdas antes del primer coral en la fila.
// Score de la fila = candidatos que sería posible limpiar con la ola.
function calcularMejorFilaOla(candidatos, pesos) {
    let mejorFila = 0, mejorVE = Infinity;
    for (let r = 0; r < FILAS; r++) {
        // Encontrar hasta dónde llega la ola (se detiene en el primer coral)
        let limiteCol = COLUMNAS;
        for (let c = 0; c < COLUMNAS; c++) {
            if (corales.has(makeKey(r, c))) { limiteCol = c; break; }
        }

        const celdasOla = new Set();
        for (let c = 0; c < limiteCol; c++) {
            celdasOla.add(makeKey(r, c));
        }

        let ve = 0;
        for (const perla of candidatos) {
            const prob = pesos[perla];
            let restantes = 0;

            if (celdasOla.has(perla)) {
                restantes = 0; // La ola descubre la perla
            } else {
                const vecPerla = new Set(vecinos(parseKey(perla).r, parseKey(perla).c));
                const reveloEstrella = [...celdasOla].some(x => vecPerla.has(x));

                if (reveloEstrella) {
                    // Reveló al menos una estrella. Las estrellas son las casillas de la ola vecinas a la perla.
                    const estrellas = [...celdasOla].filter(x => vecPerla.has(x));
                    const arenas = [...celdasOla].filter(x => !vecPerla.has(x));
                    let validos = new Set(candidatos);
                    // La perla debe ser vecina de TODAS las estrellas reveladas
                    for (const s of estrellas) {
                        const sVecinos = new Set(vecinos(parseKey(s).r, parseKey(s).c));
                        validos = new Set([...validos].filter(x => sVecinos.has(x)));
                    }
                    // La perla no puede ser vecina de la arena revelada
                    for (const a of arenas) {
                        const aVecinos = new Set(vecinos(parseKey(a).r, parseKey(a).c));
                        aVecinos.add(a); // ni la arena misma
                        validos = new Set([...validos].filter(x => !aVecinos.has(x)));
                    }
                    restantes = validos.size;
                } else {
                    // Reveló pura Arena
                    let validos = new Set(candidatos);
                    for (const a of celdasOla) {
                        const aVecinos = new Set(vecinos(parseKey(a).r, parseKey(a).c));
                        aVecinos.add(a);
                        validos = new Set([...validos].filter(x => !aVecinos.has(x)));
                    }
                    restantes = validos.size;
                }
            }
            ve += prob * restantes;
        }

        if (ve < mejorVE) {
            mejorVE = ve;
            mejorFila = r;
        }
    }
    return mejorFila;
}

function aplicarOla(fila) {
    // Encontrar primer coral desde la izquierda (la ola se bloquea ahí)
    let limiteCol = COLUMNAS;
    for (let c = 0; c < COLUMNAS; c++) {
        if (corales.has(makeKey(fila, c))) { limiteCol = c; break; }
    }

    let limpiadas = 0;
    for (let c = 0; c < limiteCol; c++) {
        const key = makeKey(fila, c);
        if (!celdas_conocidas.has(key)) {
            celdas_conocidas.set(key, 'F');
            historial_acciones.push({ r: fila, c, res: 'F', prevState: null });
            limpiadas++;
        }
    }

    actualizarUIola();
    actualizarProbabilidades();

    const bloqueadaEn = limiteCol < COLUMNAS
        ? ` (bloqueada por coral en col ${String.fromCharCode(65 + limiteCol)})`
        : '';
    showToast(`🌊 Ola en Fila ${fila + 1}: ${limpiadas} celdas limpiadas${bloqueadaEn}.`, 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// MODELO DE PREDICCIÓN
// Combina: restricciones lógicas + frecuencia bayesiana (Beta) + eficiencia
// (intentos promedio) + estrategia óptima (minimiza candidatos esperados).
// ─────────────────────────────────────────────────────────────────────────────

function actualizarProbabilidades() {
    // 1. Candidatos iniciales (todas menos corales)
    let candidatos = new Set();
    for (let r = 0; r < FILAS; r++)
        for (let c = 0; c < COLUMNAS; c++) {
            const key = makeKey(r, c);
            if (!corales.has(key)) candidatos.add(key);
        }

    // 2. Restricciones lógicas
    for (const [key, res] of celdas_conocidas) {
        const { r, c } = parseKey(key);
        if (res === 'F') {
            const excluir = new Set(vecinos(r, c));
            excluir.add(key);
            for (const e of excluir) candidatos.delete(e);
        } else if (res === 'S') {
            const vecValidos = new Set(vecinos(r, c).filter(v => !corales.has(v)));
            const nuevos = new Set();
            for (const cand of candidatos) if (vecValidos.has(cand)) nuevos.add(cand);
            candidatos = nuevos;
        }
    }

    // 3. Pesos bayesianos con eficiencia
    const totalPartidas = Object.values(historial).reduce((s, v) => s + v.total, 0);
    const prior = {};
    for (const key of candidatos) {
        const reg = historial[key];
        const perlas = reg?.total || 0;
        const alpha = perlas + 1;
        const beta  = (totalPartidas - perlas) + 1;
        const probFrecuencia = alpha / (alpha + beta);
        let bonusEficiencia = 1.0;
        if (reg && reg.total > 0 && reg.intentos_total > 0) {
            bonusEficiencia = 1 / (1 + reg.intentos_total / reg.total);
        }
        prior[key] = probFrecuencia * (0.7 + 0.3 * bonusEficiencia);
    }
    const sumaPrior = [...candidatos].reduce((s, k) => s + prior[k], 0);
    const pesos = {};
    for (const cand of candidatos) pesos[cand] = sumaPrior > 0 ? prior[cand] / sumaPrior : 0;

    // 4. Estrategia óptima: minimizar candidatos esperados tras revelar
    let mejorCelda = null, mejorVE = Infinity, mejorProb = -1;
    for (const jugada of candidatos) {
        const { r: jr, c: jc } = parseKey(jugada);
        const vecJ = new Set(vecinos(jr, jc));
        let ve = 0;
        for (const perla of candidatos) {
            const prob = pesos[perla];
            let restantes;
            if (perla === jugada) {
                restantes = 0;
            } else if (vecJ.has(perla)) {
                // Sería estrella: perla en vecinos de jugada
                const vv = new Set(vecinos(jr, jc).filter(v => !corales.has(v)));
                restantes = [...candidatos].filter(c => vv.has(c)).length;
            } else {
                // Sería arena: excluir jugada + vecinos
                const excluir = new Set(vecJ);
                excluir.add(jugada);
                restantes = [...candidatos].filter(c => !excluir.has(c)).length;
            }
            ve += prob * restantes;
        }
        if (ve < mejorVE || (ve === mejorVE && pesos[jugada] > mejorProb)) { 
            mejorVE = ve; 
            mejorCelda = jugada; 
            mejorProb = pesos[jugada];
        }
    }

    // 5. Mejor fila para ola (actualizar estado y UI)
    filaOlaRecomendada = calcularMejorFilaOla(candidatos, pesos);
    actualizarUIola();

    renderGrid(candidatos, pesos, mejorCelda);
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderGrid(candidatos, pesos, mejorCelda) {
    for (let r = 0; r < FILAS; r++) {
        for (let c = 0; c < COLUMNAS; c++) {
            const key  = makeKey(r, c);
            const cell = cellElements[key];
            if (!cell) continue;

            cell.className = 'cell';
            cell.innerHTML = '';

            // La fila resaltada es SIEMPRE la recomendada para la ola (independiente de si hay disponible)
            const esFilaOla      = (r === filaOlaRecomendada);
            const colorDetectado = colores_tablero.get(key);

            if (corales.has(key)) {
                // Coral: bloquea la ola y excluye probabilidad
                // Mostrar indicador de bloqueo si es la fila recomendada
                cell.classList.add('coral');
                const bloqueLabel = esFilaOla ? '<span class="coral-block-icon" title="Bloquea la ola">🚫</span>' : '';
                cell.innerHTML = `🪸${bloqueLabel}<br><small>Coral</small>`;

            } else if (celdas_conocidas.has(key)) {
                const res = celdas_conocidas.get(key);
                if (res === 'F') { cell.classList.add('arena'); cell.innerHTML = '🏖️<br><small>Arena</small>'; }
                if (res === 'S') { cell.classList.add('pista'); cell.innerHTML = '⭐<br><small>Pista</small>'; }
                // Las celdas ya reveladas en la fila recomendada también se resaltan
                if (esFilaOla) cell.classList.add('ola-sugerida');

            } else if (candidatos.has(key)) {
                const prob = (pesos[key] || 0) * 100;
                let dot = '';
                if (colorDetectado === 'Concha_Morada') dot = '<span class="color-dot dot-morada"></span>';
                else if (colorDetectado === 'Concha_Rosa') dot = '<span class="color-dot dot-rosa"></span>';
                cell.innerHTML = `<span class="prob-num">${prob.toFixed(1)}%</span>${dot}`;
                if (key === mejorCelda) cell.classList.add('best-choice');
                else if (esFilaOla) cell.classList.add('ola-sugerida');

            } else {
                cell.classList.add('disabled');
                let dot = '';
                if (colorDetectado === 'Concha_Morada') dot = '<span class="color-dot dot-morada"></span>';
                else if (colorDetectado === 'Concha_Rosa') dot = '<span class="color-dot dot-rosa"></span>';
                cell.innerHTML = `<span style="font-size:0.7rem;opacity:0.4">✕</span>${dot}`;
                if (esFilaOla) cell.classList.add('ola-sugerida');
            }
        }
    }

    // Status text
    if (candidatos.size === 1) {
        statusText.textContent = '🎯 ¡La perla ESTÁ en la celda verde!';
        statusText.style.color = '#4ade80';
    } else if (candidatos.size === 0) {
        statusText.textContent = '⚠️ Conflicto: ningún candidato. ¿Te equivocaste?';
        statusText.style.color = '#f87171';
    } else {
        const colMsg = colores_tablero.size > 0 ? ` · ${colores_tablero.size} colores detectados` : '';
        // Siempre mostrar la recomendación de ola
        const olaMsg = ` · 🌊 Ola → Fila ${filaOlaRecomendada + 1}`;
        statusText.textContent = `${candidatos.size} posibles. Verde = mejor jugada${colMsg}${olaMsg}`;
        statusText.style.color = '#93c5fd';
    }
}

// ─── Portapapeles / Imagen y Recorte ───────────────────────────────────────────
function openCropForUrl(url) {
    // Liberar blob URL anterior si existe
    if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = url;

    const cropImg = document.getElementById('crop-image');
    cropImg.src = url;
    
    document.getElementById('crop-modal-overlay').classList.remove('hidden');
    document.getElementById('crop-modal-overlay').classList.add('show');
    
    if (cropperInstance) cropperInstance.destroy();
    
    cropperInstance = new Cropper(cropImg, {
        aspectRatio: 1,
        viewMode: 1,
        background: false,
        guides: false,
        ready: function () {
            const imgData = this.cropper.getImageData();
            if (imgData.naturalHeight > imgData.naturalWidth) {
                const size = imgData.naturalWidth; 
                const bottomMargin = imgData.naturalHeight * 0.16; 
                let y = imgData.naturalHeight - size - bottomMargin;
                
                this.cropper.setData({
                    x: 0,
                    y: y > 0 ? y : 0,
                    width: size,
                    height: size
                });
            }
        }
    });
}

function handlePaste(e) {
    if (!e.clipboardData) return;
    const items = e.clipboardData.items;
    const imageItem = [...items].find(it => it.type.startsWith('image'));
    if (!imageItem) { showToast('No hay imagen en el portapapeles. Usa Win+Shift+S.', 'error'); return; }
    const blob = imageItem.getAsFile();
    const url  = URL.createObjectURL(blob);
    openCropForUrl(url);
}

let cropperInstance = null;
let currentBlobUrl = null; // Para liberar blob URLs y evitar memory leaks

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    openCropForUrl(url);
    
    // Reset file input para permitir subir la misma foto otra vez si se cancela
    e.target.value = '';
}

function cerrarCropModal() {
    document.getElementById('crop-modal-overlay').classList.remove('show');
    document.getElementById('crop-modal-overlay').classList.add('hidden');
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    // Liberar blob URL para evitar memory leak
    if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = null;
    }
}

function confirmarCrop() {
    if (!cropperInstance) return;
    const canvas = cropperInstance.getCroppedCanvas();
    if (!canvas) return;
    
    // Limpiar el tablero sin pedir confirmación (el usuario ya confirmó al dar Procesar)
    reiniciar(false);

    // Pasar el canvas directamente en vez de convertir a dataURL y recargar (evita race condition)
    procesarImagen(canvas);
    
    cerrarCropModal();
}

function procesarImagen(source) {
    // source puede ser un Image o un Canvas directamente
    const canvas = document.createElement('canvas');
    canvas.width = source.width; canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0);

    const cellW = canvas.width  / COLUMNAS;
    const cellH = canvas.height / FILAS;
    const conteo = { Arena: 0, Coral: 0, Estrella: 0, Concha_Rosa: 0, Concha_Morada: 0 };
    const resultados = {};

    for (let r = 0; r < FILAS; r++) {
        for (let c = 0; c < COLUMNAS; c++) {
            // Muestreo más pequeño (20%) y centrado para evitar el fondo de arena
            const x = Math.floor(c * cellW + cellW * 0.4);
            const y = Math.floor(r * cellH + cellH * 0.4);
            const w = Math.max(1, Math.floor(cellW * 0.2));
            const h = Math.max(1, Math.floor(cellH * 0.2));
            const data = ctx.getImageData(x, y, w, h).data;
            let R = 0, G = 0, B = 0;
            const n = w * h;
            
            for (let i = 0; i < data.length; i += 4) { 
                R += data[i]; G += data[i+1]; B += data[i+2];
            }
            
            let tipo = clasificarColor([R/n, G/n, B/n]);
            
            const key  = makeKey(r, c);
            resultados[key] = tipo;
            conteo[tipo] = (conteo[tipo] || 0) + 1;
        }
    }

    const totalCeldas     = FILAS * COLUMNAS;
    // Consideramos tablero inicial SÓLO si no hay absolutamente ninguna celda revelada
    const reveladasTotales = (conteo.Arena || 0) + (conteo.Estrella || 0) + (conteo.Coral || 0);
    const esTableroInicial = reveladasTotales === 0;
    let reveladasNuevas   = 0;

    for (const [key, tipo] of Object.entries(resultados)) {
        if (tipo === 'Concha_Rosa' || tipo === 'Concha_Morada') {
            colores_tablero.set(key, tipo);
        }
        if (!celdas_conocidas.has(key) && !corales.has(key)) {
            const { r, c } = parseKey(key);
            if (tipo === 'Arena')    { celdas_conocidas.set(key, 'F'); historial_acciones.push({r,c,res:'F',prevState:null}); reveladasNuevas++; }
            if (tipo === 'Coral')    { corales.add(key); historial_acciones.push({r,c,res:'C',prevState:null}); reveladasNuevas++; }
            if (tipo === 'Estrella') { celdas_conocidas.set(key, 'S'); historial_acciones.push({r,c,res:'S',prevState:null}); reveladasNuevas++; }
        }
    }

    actualizarProbabilidades();
    if (esTableroInicial) {
        showToast(`🎨 Tablero registrado: ${conteo.Concha_Morada||0} moradas 🟣, ${conteo.Concha_Rosa||0} rosadas 🌸`, 'success');
    } else if (reveladasNuevas > 0) {
        showToast(`✅ ${reveladasNuevas} celdas reveladas detectadas.`, 'success');
    } else {
        showToast('Imagen procesada. Sin cambios detectados.', 'info');
    }
}

function clasificarColor(rgb) {
    const prototipos = {
        Arena:         [238, 222, 160],
        Coral:         [232, 146, 84],
        Concha_Rosa:   [243, 178, 195],
        Concha_Morada: [225, 170, 240]
    };
    const MAX_DIST = 80; // Umbral de confianza: si la distancia es mayor, no clasificar
    let best = null, bestDist = Infinity;
    for (const [clase, proto] of Object.entries(prototipos)) {
        const dist = Math.sqrt(proto.reduce((s, v, i) => s + (rgb[i] - v) ** 2, 0));
        if (dist < bestDist) { bestDist = dist; best = clase; }
    }
    // Si la distancia al mejor prototipo es demasiado grande, no clasificar
    if (bestDist > MAX_DIST) return 'Desconocido';
    return best;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
    // Limitar a 5 toasts simultáneos para no desbordar la pantalla
    while (toastContainer.children.length >= 5) {
        toastContainer.removeChild(toastContainer.firstChild);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderLeft = `4px solid ${type === 'success' ? '#4ade80' : type === 'error' ? '#f87171' : '#60a5fa'}`;
    t.textContent = msg;
    toastContainer.appendChild(t);
    setTimeout(() => {
        t.style.cssText += 'opacity:0;transform:translateX(100%);transition:all 0.3s';
        setTimeout(() => t.remove(), 300);
    }, 3500);
}

// ─── Arrancar ─────────────────────────────────────────────────────────────────
init();

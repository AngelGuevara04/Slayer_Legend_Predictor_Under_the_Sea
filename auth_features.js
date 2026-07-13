// ─── Variables Globales ────────────────────────────────────────────────────────
let currentUser = null;

// ─── Autenticación ─────────────────────────────────────────────────────────────
async function checkAuth() {
    const { data: { session } } = await db.auth.getSession();
    currentUser = session ? session.user : null;
    
    const authOverlay = document.getElementById('auth-overlay');
    const userProfile = document.getElementById('user-profile');
    
    if (!currentUser) {
        // Bloquear con Muro de Pago/Login
        authOverlay.classList.remove('hidden');
        authOverlay.classList.add('show');
        userProfile.classList.add('hidden');
    } else {
        // Desbloquear
        authOverlay.classList.add('hidden');
        authOverlay.classList.remove('show');
        userProfile.classList.remove('hidden');
        
        // Cargar perfil
        const { data: profile } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
        if (profile) {
            document.getElementById('user-name').innerText = profile.name || 'Buscador';
            document.getElementById('user-avatar').src = profile.avatar_url || 'https://www.svgrepo.com/show/5125/avatar.svg';
            document.getElementById('user-pearls').innerText = profile.pearls_found;
        }
        
        // Cargar partida en la nube (Feature 2)
        cargarPartidaEnLaNube();
    }
}

async function loginConGoogle() {
    const { error } = await db.auth.signInWithOAuth({ provider: 'google' });
    if (error) mostrarToast('Error al iniciar sesión: ' + error.message, true);
}

async function logout() {
    await db.auth.signOut();
    window.location.reload();
}

// ─── Guardado en la Nube (Cross-play) ──────────────────────────────────────
async function guardarPartidaEnLaNube() {
    if (!currentUser) return;
    
    // Convertir el estado a un objeto serializable
    const state = {
        celdas_conocidas: Array.from(celdas_conocidas.entries()),
        corales: Array.from(corales),
        colores_tablero: Array.from(colores_tablero.entries()),
        historial_acciones: historial_acciones
    };
    
    await db.from('saved_games').upsert({
        user_id: currentUser.id,
        game_state: state,
        updated_at: new Date().toISOString()
    });
}

async function cargarPartidaEnLaNube() {
    const { data } = await db.from('saved_games').select('game_state').eq('user_id', currentUser.id).single();
    if (data && data.game_state) {
        try {
            // Restaurar estado
            celdas_conocidas.clear();
            corales.clear();
            colores_tablero.clear();
            
            data.game_state.celdas_conocidas.forEach(([k, v]) => celdas_conocidas.set(k, v));
            data.game_state.corales.forEach(k => corales.add(k));
            data.game_state.colores_tablero.forEach(([k, v]) => colores_tablero.set(k, v));
            
            // Re-render
            actualizarProbabilidades();
            mostrarToast('Partida restaurada de la nube ☁️');
        } catch (e) {
            console.error('Error cargando partida:', e);
        }
    }
}

// ─── Sistema de Logros e Insignias ──────────────────────────────────────────
async function registrarLogro(achievement_id, nombre_logro) {
    if (!currentUser) return;
    
    const { error } = await db.from('user_achievements').insert({
        user_id: currentUser.id,
        achievement_id: achievement_id
    });
    
    // Si no hubo error, significa que no lo tenía repetido (por el UNIQUE constraint)
    if (!error) {
        mostrarToast('🏆 ¡LOGRO DESBLOQUEADO! ' + nombre_logro);
        
        // Confeti especial
        if (typeof confetti === 'function') {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 } });
        }
    }
}

async function checkAchievementsOnPearlFound(intentosPrevios) {
    if (!currentUser) return;
    
    // Sumar 1 perla al perfil
    await db.rpc('increment_pearls', { user_id_param: currentUser.id });
    
    const { data: profile } = await db.from('profiles').select('pearls_found').eq('id', currentUser.id).single();
    const total = profile ? profile.pearls_found : 0;
    
    // Actualizar UI
    document.getElementById('user-pearls').innerText = total;
    
    // Checar logros
    if (total === 1) registrarLogro('FIRST_PEARL', 'Buzo Novato (Primera perla)');
    if (total === 10) registrarLogro('TEN_PEARLS', 'Buscador Frecuente (10 perlas)');
    if (total === 50) registrarLogro('FIFTY_PEARLS', 'Buscaminas Maestro (50 perlas)');
    
    if (intentosPrevios === 0) registrarLogro('ONE_SHOT', 'Francotirador (A la primera)');
}

// ─── Tablas de Clasificación (Leaderboards) ─────────────────────────────────
async function mostrarLeaderboards() {
    const modal = document.getElementById('leaderboard-modal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = 'Cargando...';
    
    const { data, error } = await db.from('profiles').select('name, pearls_found').order('pearls_found', { ascending: false }).limit(10);
    
    if (error || !data) {
        list.innerHTML = 'Error al cargar los marcadores.';
        return;
    }
    
    let html = '<ol style="padding-left: 20px; font-size: 1.1rem; color: #e2e8f0; line-height: 1.8;">';
    data.forEach((p, i) => {
        const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : ''));
        html += `<li>${medal} <strong>${p.name || 'Jugador'}</strong>: <span style="color:#a855f7;">${p.pearls_found} perlas</span></li>`;
    });
    html += '</ol>';
    list.innerHTML = html;
}

// ─── Temas Visuales (Skins) ─────────────────────────────────────────────────
function mostrarTemas() {
    const modal = document.getElementById('themes-modal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
}

function aplicarTema(tema) {
    const root = document.documentElement;
    if (tema === 'abyss') {
        root.style.setProperty('--bg-color', '#020617');
        root.style.setProperty('--panel-bg', '#0f172a');
        root.style.setProperty('--panel-border', '#1e293b');
        root.style.setProperty('--cell-bg', '#1e293b');
    } else if (tema === 'neon') {
        root.style.setProperty('--bg-color', '#000000');
        root.style.setProperty('--panel-bg', '#111');
        root.style.setProperty('--panel-border', '#f0f');
        root.style.setProperty('--cell-bg', '#222');
        root.style.setProperty('--cell-border', '#f0f');
    } else {
        // Default
        root.style.setProperty('--bg-color', '#0a0a0f');
        root.style.setProperty('--panel-bg', '#13131a');
        root.style.setProperty('--panel-border', '#1f1f2e');
        root.style.setProperty('--cell-bg', '#1a1a24');
        root.style.setProperty('--cell-border', '#2a2a35');
    }
    // Guardar preferencia
    localStorage.setItem('user_theme', tema);
}

// ─── Listeners y Setup ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Auth listeners
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) btnLogin.addEventListener('click', loginConGoogle);
    
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', logout);
    
    // Leaderboards
    const btnLeaderboards = document.getElementById('btn-leaderboards');
    if (btnLeaderboards) btnLeaderboards.addEventListener('click', mostrarLeaderboards);
    
    const btnCloseLeaderboards = document.getElementById('btn-close-leaderboard');
    if (btnCloseLeaderboards) btnCloseLeaderboards.addEventListener('click', () => {
        document.getElementById('leaderboard-modal').classList.add('hidden');
        document.getElementById('leaderboard-modal').classList.remove('show');
    });
    
    // Themes
    const btnThemes = document.getElementById('btn-themes');
    if (btnThemes) btnThemes.addEventListener('click', mostrarTemas);
    
    const btnCloseThemes = document.getElementById('btn-close-themes');
    if (btnCloseThemes) btnCloseThemes.addEventListener('click', () => {
        document.getElementById('themes-modal').classList.add('hidden');
        document.getElementById('themes-modal').classList.remove('show');
    });
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            aplicarTema(e.target.getAttribute('data-theme'));
            mostrarToast('Tema aplicado ✨');
        });
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('user_theme');
    if (savedTheme) aplicarTema(savedTheme);
    
    // Start auth check
    // Listen for auth state changes
    db.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            checkAuth();
        }
    });
    checkAuth();
});

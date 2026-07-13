// Variables Globales
let currentUser = null;

// Autenticacin
async function checkAuth() {
    const { data: { session } } = await db.auth.getSession();
    currentUser = session ? session.user : null;
    
    const authOverlay = document.getElementById('auth-overlay');
    const userProfile = document.getElementById('user-profile');
    window.freeClicks = parseInt(localStorage.getItem('freeClicks') || '0', 10);
    
    if (!currentUser) {
        if (window.freeClicks >= 4) {
            // Bloquear con Muro de Pago/Login
            authOverlay.classList.remove('hidden');
            authOverlay.classList.add('show');
            const msgEl = document.getElementById('auth-wall-msg');
            if (msgEl) msgEl.innerText = 'Â¡Se acabaron tus tiradas de prueba! Inicia sesiÃ³n con Google para guardar tus partidas, desbloquear temas visuales y competir en el Ranking Global.';
        } else {
            // Aún tiene pruebas
            authOverlay.classList.add('hidden');
            authOverlay.classList.remove('show');
        }
        document.getElementById('profile-logged-in').classList.add('hidden');
        document.getElementById('profile-logged-out').classList.remove('hidden');
    } else {
        // Desbloquear
        authOverlay.classList.add('hidden');
        authOverlay.classList.remove('show');
        document.getElementById('profile-logged-out').classList.add('hidden');
        document.getElementById('profile-logged-in').classList.remove('hidden');
        
        // Cargar perfil
        const { data: profile } = await db.from('profiles').select('*').eq('id', currentUser.id).single();
        if (profile) {
            const displayName = profile.slayer_name ? profile.slayer_name + (profile.slayer_level ? ' (Lv.' + profile.slayer_level + ')' : '') : (profile.name || 'Buscador');
            document.getElementById('user-name').innerText = displayName;
            document.getElementById('user-avatar').src = profile.avatar_url || 'https://www.svgrepo.com/show/5125/avatar.svg';
            document.getElementById('user-pearls').innerText = profile.pearls_found;
            const streakEl = document.getElementById('user-streak');
            if (streakEl) streakEl.innerText = profile.current_streak || 0;
            
            // Verificar Onboarding de Slayer Legend
            checkSlayerProfile();
        }
    }
}

async function loginConGoogle() {
    const { error } = await db.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
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

// Sistema de Logros e Insignias
async function registrarLogro(achievement_id, nombre_logro) {
    if (!currentUser) return;
    
    const { error } = await db.from('user_achievements').insert({
        user_id: currentUser.id,
        achievement_id: achievement_id
    });
    
    // Si no hubo error, significa que no lo tenÃƒÂ­a repetido (por el UNIQUE constraint)
    if (!error) {
        mostrarToast('🏆 ¡LOGRO DESBLOQUEADO! ' + nombre_logro);
        
        // Confeti especial
        if (typeof confetti === 'function') {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 } });
        }
    }
}

async function checkAchievementsOnPearlFound(intentosPrevios) {
    updateGlobalPearls();
    if (!currentUser) return;
    
    // Sumar 1 perla y aumentar racha
    await db.rpc('increment_pearls_and_streak', { user_id_param: currentUser.id });
    
    const { data: profile } = await db.from('profiles').select('pearls_found, current_streak').eq('id', currentUser.id).single();
    const total = profile ? profile.pearls_found : 0;
    const streak = profile ? profile.current_streak : 0;
    
    // Actualizar UI
    document.getElementById('user-pearls').innerText = total;
    const streakEl = document.getElementById('user-streak');
    if (streakEl) streakEl.innerText = streak;
    
    // Checar logros
    if (total === 1) registrarLogro('FIRST_PEARL', 'Buzo Novato (Primera perla)');
    if (total === 10) registrarLogro('TEN_PEARLS', 'Buscador Frecuente (10 perlas)');
    if (total === 50) registrarLogro('FIFTY_PEARLS', 'Buscaminas Maestro (50 perlas)');
    
    if (intentosPrevios === 0) registrarLogro('ONE_SHOT', 'Francotirador (A la primera)');
}

// Tablas de Clasificacin Leaderboards
async function mostrarLeaderboards() {
    const modal = document.getElementById('leaderboard-modal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
    
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = 'Cargando...';
    
    const { data, error } = await db.from('profiles').select('name, slayer_name, slayer_level, pearls_found, highest_streak, avatar_url').order('pearls_found', { ascending: false }).limit(10);
    
    if (error || !data) {
        list.innerHTML = 'Error al cargar los marcadores.';
        return;
    }
    
    list.innerHTML = '';
    data.forEach((p, index) => {
        const displayName = p.slayer_name ? p.slayer_name + (p.slayer_level ? ' (Lv.' + p.slayer_level + ')' : '') : (p.name || 'Buscador AnÃ³nimo');
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);';
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; color: ${index === 0 ? '#fcd34d' : index === 1 ? '#e2e8f0' : index === 2 ? '#b45309' : '#94a3b8'}; width: 20px;">#${index + 1}</span>
                <img src="${p.avatar_url || 'https://www.svgrepo.com/show/5125/avatar.svg'}" style="width:30px; height:30px; border-radius:50%; border: 1px solid #a855f7;">
                <span style="color: #f8fafc; font-weight: ${p.id === currentUser?.id ? 'bold' : 'normal'};">${displayName}</span>
            </div>
            <div style="text-align: right;">
                <span style="color: #a855f7; font-weight: bold;">${p.pearls_found} 🔮</span><br>
                <span style="color: #ef4444; font-size: 0.8rem;">🔥 ${p.highest_streak} racha</span>
            </div>
        `;
        list.appendChild(div);
    });
}

// Temas Visuales Skins
function mostrarTemas() {
    const modal = document.getElementById('themes-modal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
}

function aplicarTema(tema) {
    const root = document.documentElement;
    if (tema === 'abyss') {
        root.style.setProperty('--bg-color', '#020617');
        root.style.setProperty('--panel-bg', 'rgba(15, 23, 42, 0.45)');
        root.style.setProperty('--panel-border', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--cell-bg', 'rgba(30, 41, 59, 0.4)');
        root.style.setProperty('--cell-border', 'rgba(255, 255, 255, 0.05)');
    } else if (tema === 'neon') {
        root.style.setProperty('--bg-color', '#000000');
        root.style.setProperty('--panel-bg', 'rgba(17, 17, 17, 0.55)');
        root.style.setProperty('--panel-border', 'rgba(255, 0, 255, 0.4)');
        root.style.setProperty('--cell-bg', 'rgba(34, 34, 34, 0.5)');
        root.style.setProperty('--cell-border', 'rgba(255, 0, 255, 0.3)');
    } else {
        // Default
        root.style.setProperty('--bg-color', '#0a0a0f');
        root.style.setProperty('--panel-bg', 'rgba(19, 19, 26, 0.5)');
        root.style.setProperty('--panel-border', 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--cell-bg', 'rgba(26, 26, 36, 0.5)');
        root.style.setProperty('--cell-border', 'rgba(255, 255, 255, 0.05)');
    }
    // Guardar preferencia
    localStorage.setItem('user_theme', tema);
}

// Listeners y Setup
document.addEventListener('DOMContentLoaded', () => {
    // Auth listeners
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) btnLogin.addEventListener('click', loginConGoogle);
    
    const btnLoginSidebar = document.getElementById('btn-login-sidebar');
    if (btnLoginSidebar) btnLoginSidebar.addEventListener('click', loginConGoogle);
    
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
            mostrarToast('Tema aplicado Ã¢Å“Â¨');
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
    updateGlobalPearls();
});

window.resetUserStreak = async () => {
    if (!currentUser) return;
    try {
        await db.rpc('reset_streak', { user_id_param: currentUser.id });
        const streakEl = document.getElementById('user-streak');
        if (streakEl) streakEl.innerText = "0";
    } catch(e) {}
};
// Onboarding de Slayer Legend
async function checkSlayerProfile() {
    if (!currentUser) return;
    const { data: profile } = await db.from('profiles').select('slayer_name, slayer_level, name').eq('id', currentUser.id).single();
    if (profile && !profile.slayer_name) {
        document.getElementById('onboarding-modal').classList.remove('hidden');
        document.getElementById('onboarding-modal').style.display = 'flex';
        // Auto-llenar con el nombre de google para ahorrarles tiempo
        document.getElementById('input-slayer-name').value = profile.name || '';
    }
}

document.getElementById('btn-save-onboarding').addEventListener('click', async () => {
    const sName = document.getElementById('input-slayer-name').value.trim();
    const sLevel = parseInt(document.getElementById('input-slayer-level').value, 10);
    
    if (!sName) {
                mostrarToast('⚠️ Por favor ingresa un nombre y nivel válido.');
        return;
    }
    
    const { error } = await db.from('profiles').update({ 
        slayer_name: sName,
        slayer_level: isNaN(sLevel) ? null : sLevel
    }).eq('id', currentUser.id);
    
    if (!error) {
        document.getElementById('onboarding-modal').classList.add('hidden');
        document.getElementById('onboarding-modal').style.display = 'none';
        mostrarToast('Ã°Å¸Å½Â® Ã‚Â¡Perfil de Slayer Legend guardado!');
        document.getElementById('user-name').innerText = sName + (isNaN(sLevel) ? '' : ' (Lv.' + sLevel + ')');
    } else {
            mostrarToast('❌ Error guardando el perfil');
    }
});
async function updateGlobalPearls() {
    const { data, error } = await db.from('ai_history').select('total');
    if (!error && data) {
        const sum = data.reduce((acc, row) => acc + (row.total || 0), 0);
        const globalPearlsEl = document.getElementById('global-pearls');
        if (globalPearlsEl) globalPearlsEl.innerText = sum;
    }
}


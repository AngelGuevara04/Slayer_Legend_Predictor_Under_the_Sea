const fs = require('fs');

// 1. INDEX.HTML
let index = fs.readFileSync('index.html', 'utf8');

const modalOnboarding = 
    <!-- Modal Onboarding -->
    <div id="onboarding-modal" class="modal-overlay hidden" style="z-index: 10000; flex-direction: column; justify-content: center; align-items: center; background-color: rgba(15, 23, 42, 0.95); text-align: center;">
        <div class="modal-content glass-panel" style="max-width: 400px; padding: 30px; text-align: center;">
            <h2 style="color: #fcd34d; margin-top: 0;">¡Bienvenido Buscador! 🌊</h2>
            <p style="color: #cbd5e1; font-size: 0.95rem; margin-bottom: 20px;">
                Para entrar al Ranking Global necesitamos saber quién eres en <strong>Slayer Legend</strong>.
            </p>
            <div style="margin-bottom: 15px; text-align: left;">
                <label style="color: #94a3b8; font-size: 0.85rem; display: block; margin-bottom: 5px;">Nombre de tu Personaje</label>
                <input type="text" id="input-slayer-name" placeholder="Ej. SlayerPro99" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; box-sizing: border-box;" />
            </div>
            <div style="margin-bottom: 20px; text-align: left;">
                <label style="color: #94a3b8; font-size: 0.85rem; display: block; margin-bottom: 5px;">Tu Nivel Actual</label>
                <input type="number" id="input-slayer-level" placeholder="Ej. 1250" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; box-sizing: border-box;" />
            </div>
            <button id="btn-save-onboarding" class="btn accent" style="width: 100%;">Comenzar Aventura 🚀</button>
        </div>
    </div>

    <!-- Muro de Login -->;

index = index.replace('<!-- Muro de Login -->', modalOnboarding);
index = index.replace('<p style="font-size: 1.2rem; color: #e2e8f0; max-width: 400px; padding: 0 20px; line-height: 1.5; margin-bottom: 30px;">', '<p id="auth-wall-msg" style="font-size: 1.2rem; color: #e2e8f0; max-width: 400px; padding: 0 20px; line-height: 1.5; margin-bottom: 30px;">');

fs.writeFileSync('index.html', index, 'utf8');

// 2. APP.JS
let app = fs.readFileSync('app.js', 'utf8');

const onCellClickReplacement = unction onCellClick(e) {
    if (e.target.tagName === 'BUTTON') return;
    
    // Bloquear al invitado si ya no tiene tiradas
    if (!window.currentUser && window.freeClicks >= 4) {
        document.getElementById('auth-wall-msg').innerText = "¡Has agotado tus 4 tiradas de prueba gratis! Inicia sesión para guardar tu progreso y seguir jugando sin límites.";
        document.getElementById('auth-overlay').classList.remove('hidden');
        document.getElementById('auth-overlay').style.display = 'flex';
        return;
    };

app = app.replace('function onCellClick(e) {\n    if (e.target.tagName === \'BUTTON\') return;', onCellClickReplacement);

const confirmReplacement =     const force = isNaN(r) || isNaN(c);

    // Confirmación
    if (!force) {
        const typeName = type === 'P' ? 'una Perla' : type === 'M' ? 'una Concha Morada' : 'una Concha Rosa';
        if (!confirm(\¿Estás seguro que quieres registrar \ en esta casilla?\)) {
            return; // El usuario canceló
        }
    }
    
    if (!force) {
        // Reducir tirada gratis
        if (!window.currentUser) {
            window.freeClicks++;
            localStorage.setItem('freeClicks', window.freeClicks);
        };

app = app.replace('    const force = isNaN(r) || isNaN(c);\n\n    if (!force) {', confirmReplacement);

fs.writeFileSync('app.js', app, 'utf8');

// 3. AUTH_FEATURES.JS
let auth = fs.readFileSync('auth_features.js', 'utf8');

const onboardLogic = window.freeClicks = parseInt(localStorage.getItem('freeClicks') || '0', 10);

// Verificar perfil
async function checkSlayerProfile() {
    if (!currentUser) return;
    const { data: profile } = await db.from('profiles').select('slayer_name, slayer_level').eq('id', currentUser.id).single();
    
    if (!profile || !profile.slayer_name) {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnSaveOnboarding = document.getElementById('btn-save-onboarding');
    if (btnSaveOnboarding) {
        btnSaveOnboarding.addEventListener('click', async () => {
            const name = document.getElementById('input-slayer-name').value.trim();
            const level = parseInt(document.getElementById('input-slayer-level').value, 10);
            
            if (!name || isNaN(level)) {
                alert('Por favor ingresa un nombre y un nivel válido.');
                return;
            }
            
            await db.from('profiles').update({ slayer_name: name, slayer_level: level }).eq('id', currentUser.id);
            document.getElementById('onboarding-modal').classList.add('hidden');
            document.getElementById('onboarding-modal').style.display = 'none';
        });
    }
});;

auth = auth.replace('// --- Variables Globales ---', '// --- Variables Globales ---\n' + onboardLogic);

const checkAuthReplacement =         if (user) {
            currentUser = user;
            const profile = document.getElementById('user-profile');
            if (profile) profile.classList.remove('hidden');
            const authOverlay = document.getElementById('auth-overlay');
            if (authOverlay) authOverlay.classList.add('hidden');
            await checkSlayerProfile(); // <-- AÑADIDO
        } else {
            currentUser = null;
            if (window.freeClicks >= 4) {
                const authOverlay = document.getElementById('auth-overlay');
                if (authOverlay) {
                    authOverlay.classList.remove('hidden');
                    authOverlay.style.display = 'flex';
                }
            }
        };
auth = auth.replace(/        if \(user\) \{[\s\S]*?currentUser = null;\n        \}/, checkAuthReplacement);

const updateGlobalPearls = sync function updateGlobalPearls() {
    const { data, error } = await db.from('ai_history').select('total');
    if (!error && data) {
        const sum = data.reduce((acc, row) => acc + (row.total || 0), 0);
        const globalPearlsEl = document.getElementById('global-pearls');
        if (globalPearlsEl) globalPearlsEl.innerText = sum;
    }
};

auth = auth + '\n' + updateGlobalPearls;

const checkAchievementsReplacement = sync function checkAchievementsOnPearlFound(intentosPrevios) {
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
};

auth = auth.replace(/async function checkAchievementsOnPearlFound\(intentosPrevios\) \{[\s\S]*?updateGlobalPearls\(\);\n\}/, checkAchievementsReplacement);

const leaderbdReplacement =     const { data, error } = await db.from('profiles')
        .select('slayer_name, slayer_level, pearls_found, current_streak')
        .order('pearls_found', { ascending: false })
        .limit(10);
        
    if (error) {
        list.innerHTML = 'Error al cargar';
        return;
    }
    
    list.innerHTML = '';
    data.forEach((p, index) => {
        const name = p.slayer_name || 'Desconocido';
        const lvl = p.slayer_level ? \ (Lv.\)\ : '';
        const item = document.createElement('div');
        item.style = 'display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); align-items: center;';
        item.innerHTML = \
            <div style="display: flex; align-items: center; gap: 10px;">
                <strong style="color: #fcd34d; font-size: 1.2rem;">#\</strong>
                <div>
                    <div style="font-weight: bold; color: white;">\\</div>
                    <div style="font-size: 0.8rem; color: #ef4444;">🔥 Racha: \</div>
                </div>
            </div>
            <div style="font-weight: bold; color: #a855f7;">\ 🔮</div>
        \;
        list.appendChild(item);
    });;

auth = auth.replace(/    const { data, error } = await db\.from\('profiles'\)[\s\S]*?list\.appendChild\(item\);\n    \}\);/, leaderbdReplacement);

// Fix call in DOMContentLoaded
auth = auth.replace('    checkAuth();\n});', '    checkAuth();\n    updateGlobalPearls();\n});');


fs.writeFileSync('auth_features.js', auth, 'utf8');

console.log("Patched correctly!");

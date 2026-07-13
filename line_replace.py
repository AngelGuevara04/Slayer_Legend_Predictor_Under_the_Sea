import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '\ufffd' in line:
        if 'M\xe1s Opciones' in line or 'Más Opciones' in line:
            lines[i] = '                <summary class="btn outline" style="margin-top: 10px; border-color: #3b82f6; color: #3b82f6;">⚙️ Más Opciones</summary>\n'
        elif 'Clasificaci\xf3n' in line or 'Clasificación' in line:
            lines[i] = '                    <button id="btn-leaderboards" class="btn outline" style="border-color: #fcd34d; color: #fcd34d;">🏆 Clasificación</button>\n'
        elif 'Vac' in line and 'Arena' in line and 'F' in line:
            lines[i] = '        <button class="ctx-btn" data-type="F">🏖️ Vacío (Arena)</button>\n'
        elif 'Pista' in line and 'Estrella' in line and 'S' in line:
            lines[i] = '        <button class="ctx-btn" data-type="S">⭐ Pista (Estrella)</button>\n'
        elif 'color era la concha' in line:
            lines[i] = '            <h2 id="modal-title">¿Qué color era la concha?</h2>\n'
        elif 'En Mantenimiento' in line and '<h1' in line:
            lines[i] = '        <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: #f87171;">🛠️ En Mantenimiento</h1>\n'
        elif 'Bienvenido Buscador!' in line:
            lines[i] = '            <h2 style="color: #fcd34d; margin-top: 0;">¡Bienvenido Buscador! 🌊</h2>\n'
        elif 'Comenzar Aventura' in line:
            lines[i] = '            <button id="btn-save-onboarding" class="btn accent" style="width: 100%;">Comenzar Aventura 🚀</button>\n'
        elif 'Top 10 Buscadores' in line:
            lines[i] = '            <h2 style="color: #fcd34d;">🏆 Top 10 Buscadores</h2>\n'
        elif 'Buscaminas Bajo el Mar' in line and '<h1' in line:
            lines[i] = '                    <h1>🌊 Buscaminas Bajo el Mar</h1>\n'
        elif 'Subir Imagen' in line and '<button' in line:
            lines[i] = '                    <strong>Ctrl+V</strong> o <button id="btn-upload" class="btn secondary" style="padding:4px 8px; font-size:12px; vertical-align:middle;">📸 Subir Imagen</button> para auto-completar.</p>\n'
        elif 'Tutoriales' in line and '<h2' in line:
            lines[i] = '            <h2 style="color: #fcd34d; margin-bottom: 15px; font-size: 1.4rem;">📖 Guías y Tutoriales</h2>\n'
        elif 'Estad' in line and 'Global' in line and '<p' in line:
            lines[i] = '            <p style="color: #cbd5e1; font-size: 0.9rem; margin-bottom: 10px;">\n                🌟 <strong style="color: #fcd34d;">Estadística Global:</strong> La IA ha encontrado <span id="global-pearls" style="font-weight: bold; color: #a855f7;">86</span> perlas para la comunidad.\n            </p>\n'
        elif 'La IA ha encontrado' in line:
            lines[i] = '                🌟 <strong style="color: #fcd34d;">Estadística Global:</strong> La IA ha encontrado <span id="global-pearls" style="font-weight: bold; color: #a855f7;">86</span> perlas para la comunidad.\n'
        elif 'Inv' in line and 'Caf' in line:
            lines[i] = '                ☕ Invítame un Café\n'
        elif 'Coral' in line:
            lines[i] = '        <button class="ctx-btn" data-type="C">🪸 Coral</button>\n'
        elif 'Perla' in line:
            lines[i] = '        <button class="ctx-btn" data-type="P">🔮 ¡Perla!</button>\n'
        elif 'Concha Morada' in line:
            lines[i] = '        <button class="ctx-btn" data-type="COLOR_MORADA">🟣 Concha Morada</button>\n'
        elif 'Concha Rosa' in line:
            lines[i] = '        <button class="ctx-btn" data-type="COLOR_ROSA">🌸 Concha Rosa</button>\n'
        elif 'Desmarcar' in line:
            lines[i] = '        <button class="ctx-btn" data-type="VACIO" style="border-top: 1px solid #334155; margin-top: 4px; padding-top: 8px;">🧹 Desmarcar</button>\n'
        elif 'cargar el tablero' in line:
            lines[i] = '                <button class="btn outline" onclick="startTutorial(\'imagen\')">📸 Cómo cargar el tablero</button>\n'
        elif 'marcar en el tablero' in line:
            lines[i] = '                <button class="btn outline" onclick="startTutorial(\'tablero\')">👆 Cómo marcar en el tablero</button>\n'
        elif 'usar la Ola' in line:
            lines[i] = '                <button class="btn outline" onclick="startTutorial(\'ola\')">🌊 Cómo usar la Ola</button>\n'
        elif 'registrar Dato Externo' in line:
            lines[i] = '                <button class="btn outline" onclick="startTutorial(\'dato_externo\')">➕ Cómo registrar Dato Externo</button>\n'
        elif 'Uso de Deshacer' in line:
            lines[i] = '                <button class="btn outline" onclick="startTutorial(\'deshacer\')">↩ Uso de Deshacer</button>\n'
        elif 'Uso de Reiniciar' in line:
            lines[i] = '                <button class="btn outline" onclick="startTutorial(\'reiniciar\')">🔄 Uso de Reiniciar</button>\n'
        elif 'Procesar' in line:
            lines[i] = '                <button id="btn-crop-confirm" class="btn accent">✅ Procesar</button>\n'
        elif 'Temas Desbloqueables' in line:
            lines[i] = '            <h2 style="color: #a855f7;">🎨 Temas Desbloqueables</h2>\n'
        elif 'Bienvenido' in line and '<h1' in line:
            lines[i] = '        <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: #fcd34d;">🌊 Bienvenido</h1>\n'
        elif 'saber qui' in line:
            lines[i] = '                Para entrar al Ranking Global necesitamos saber quién eres en <strong>Slayer Legend</strong>.\n'

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '\ufffd' in line:
        if 'Guardando en la nube' in line:
            lines[i] = line.replace('\ufffd', '').replace('Guardando', '🔄 Guardando')
            # Clean any random leftovers
            lines[i] = re.sub(r'([\'"])[^\'"]*?🔄', r'\1🔄', lines[i]) 
        elif 'Morada' in line and 'ctx-btn' not in line:
            lines[i] = line.replace('\ufffd', '').replace('Morada', '🟣 Morada')
            lines[i] = re.sub(r'([\'"])[^\'"]*?🟣', r'\1🟣', lines[i])
        elif 'Rosada' in line and 'ctx-btn' not in line:
            lines[i] = line.replace('\ufffd', '').replace('Rosada', '🌸 Rosada')
            lines[i] = re.sub(r'([\'"])[^\'"]*?🌸', r'\1🌸', lines[i])
        elif 'Dato guardado' in line:
            lines[i] = line.replace('\ufffd', '').replace('Dato guardado', '✅ Dato guardado')
            lines[i] = re.sub(r'([\'"])[^\'"]*?✅', r'\1✅', lines[i])
        elif 'Desconocido' in line:
            lines[i] = line.replace('\ufffd', '').replace('Desconocido', '❓ Desconocido')
            lines[i] = re.sub(r'([\'"])[^\'"]*?❓', r'\1❓', lines[i])

with open('app.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('auth_features.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '\ufffd' in line:
        if 'Racha:' in line:
            lines[i] = line.replace('\ufffd', '').replace('Racha:', '🔥 Racha:')
            lines[i] = re.sub(r'>[^\<]*?🔥', r'>🔥', lines[i])
        if '<div style="font-weight: bold; color: #a855f7;">' in line and '</div>' in line:
            lines[i] = re.sub(r'>[^<]*?(\$\{p\.pearls_found)', r'>🔮 \1', line)

with open('auth_features.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

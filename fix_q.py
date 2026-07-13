with open('index.html', 'r', encoding='utf-8') as f:
    idx = f.read()

idx = idx.replace('<h1>? Buscaminas Bajo el Mar</h1>', '<h1>🌊 Buscaminas Bajo el Mar</h1>')
idx = idx.replace('">?"? Subir Imagen</button>', '">📸 Subir Imagen</button>')
idx = idx.replace('">?? Más Opciones</summary>', '">⚙️ Más Opciones</summary>')
idx = idx.replace('">?? Clasificación</button>', '">🏆 Clasificación</button>')
idx = idx.replace('">?? Temas</button>', '">🎨 Temas</button>')
idx = idx.replace('">? Guías y Tutoriales</h2>', '">📖 Guías y Tutoriales</h2>')
idx = idx.replace('">? Cómo cargar el tablero</button>', '">📸 Cómo cargar el tablero</button>')
idx = idx.replace('">? Cómo marcar en el tablero</button>', '">👆 Cómo marcar en el tablero</button>')
idx = idx.replace('">? Cómo usar la Ola</button>', '">🌊 Cómo usar la Ola</button>')
idx = idx.replace('">? Cómo registrar Dato Externo</button>', '">➕ Cómo registrar Dato Externo</button>')
idx = idx.replace('">? Uso de Deshacer</button>', '">↩ Uso de Deshacer</button>')
idx = idx.replace('">? Uso de Reiniciar</button>', '">🔄 Uso de Reiniciar</button>')
idx = idx.replace('">? Procesar</button>', '">✅ Procesar</button>')
idx = idx.replace('">?? En Mantenimiento</h1>', '">🛠️ En Mantenimiento</h1>')
idx = idx.replace('>? Estadística Global:', '>🌟 Estadística Global:')
idx = idx.replace('? Invítame un Café', '☕ Invítame un Café')
idx = idx.replace('>? Vacío (Arena)</button>', '>🏖️ Vacío (Arena)</button>')
idx = idx.replace('>? Pista (Estrella)</button>', '>⭐ Pista (Estrella)</button>')
idx = idx.replace('>? Coral</button>', '>🪸 Coral</button>')
idx = idx.replace('>? ¡Perla!</button>', '>🔮 ¡Perla!</button>')
idx = idx.replace('>? Concha Morada</button>', '>🟣 Concha Morada</button>')
idx = idx.replace('>? Concha Rosa</button>', '>🌸 Concha Rosa</button>')
idx = idx.replace('>? Desmarcar</button>', '>🧹 Desmarcar</button>')

# For the strange \ufffd ones, let's just do blind replacements of common mangled prefixes if they exist
idx = idx.replace('YOS Buscaminas Bajo el Mar', '🌊 Buscaminas Bajo el Mar')
idx = idx.replace('Y" Subir Imagen', '📸 Subir Imagen')
idx = idx.replace('⚙️ Más Opciones', '⚙️ Más Opciones')
idx = idx.replace('Y Clasificación', '🏆 Clasificación')
idx = idx.replace('Y Top 10 Buscadores', '🏆 Top 10 Buscadores')
idx = idx.replace('Y Temas Desbloqueables', '🎨 Temas Desbloqueables')
idx = idx.replace('Y Guías y Tutoriales', '📖 Guías y Tutoriales')
idx = idx.replace('Y En Mantenimiento', '🛠️ En Mantenimiento')
idx = idx.replace('Y Cómo cargar el tablero', '📸 Cómo cargar el tablero')
idx = idx.replace('Y Cómo marcar en el tablero', '👆 Cómo marcar en el tablero')
idx = idx.replace('YOS Cómo usar la Ola', '🌊 Cómo usar la Ola')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx)

with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

app = app.replace('? Guardando en la nube...', '🔄 Guardando en la nube...')
app = app.replace('? Dato guardado!', '✅ Dato guardado!')
app = app.replace('? Morada', '🟣 Morada')
app = app.replace('? Rosada', '🌸 Rosada')
app = app.replace('? Desconocido', '❓ Desconocido')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)

with open('auth_features.js', 'r', encoding='utf-8') as f:
    auth = f.read()

auth = auth.replace('? Racha:', '🔥 Racha:')
auth = auth.replace('</div>\\n            <div style="font-weight: bold; color: #a855f7;">? ', '</div>\\n            <div style="font-weight: bold; color: #a855f7;">🔮 ')

with open('auth_features.js', 'w', encoding='utf-8') as f:
    f.write(auth)

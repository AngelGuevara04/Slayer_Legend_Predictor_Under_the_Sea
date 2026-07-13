import re

# Emojis were deleted, so we just have the words without emojis.
# Let's restore them by searching for the words.

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'([>"\']|^)[^>"\']*?Buscaminas Bajo el Mar', r'\1🌊 Buscaminas Bajo el Mar', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Subir Imagen', r'\1📸 Subir Imagen', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Más Opciones', r'\1⚙️ Más Opciones', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Clasificación', r'\1🏆 Clasificación', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Estadística Global', r'\1🌟 Estadística Global', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Invítame un Café', r'\1☕ Invítame un Café', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Guías y Tutoriales', r'\1📖 Guías y Tutoriales', text)
text = re.sub(r'([>"\']|^)[^>"\']*?En Mantenimiento', r'\1🛠️ En Mantenimiento', text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

app = re.sub(r'([\'"])[^\'"]*?Guardando en la nube', r'\1🔄 Guardando en la nube', app)
app = re.sub(r'([>"\']|^)[^>"\']*?Morada', r'\1🟣 Morada', app)
app = re.sub(r'([>"\']|^)[^>"\']*?Rosada', r'\1🌸 Rosada', app)
app = re.sub(r'([\'"])[^\'"]*?Dato guardado', r'\1✅ Dato guardado', app)
app = re.sub(r'([\'"])[^\'"]*?Desconocido', r'\1❓ Desconocido', app)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)

with open('auth_features.js', 'r', encoding='utf-8') as f:
    auth = f.read()

auth = re.sub(r'([>"\']|^)[^>"\']*?Racha:', r'\1🔥 Racha:', auth)
auth = re.sub(r'>[^\<]*?<\/div>\s*<\/div>\s*<div[^>]*?>[^\<]*?<\/div>', lambda m: m.group(0).replace('</div>\n            <div style="font-weight: bold; color: #a855f7;">', '</div>\n            <div style="font-weight: bold; color: #a855f7;">🔮 '), auth)

with open('auth_features.js', 'w', encoding='utf-8') as f:
    f.write(auth)

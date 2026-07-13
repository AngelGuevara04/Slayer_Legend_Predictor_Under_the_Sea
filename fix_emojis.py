import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix index.html
text = re.sub(r'([>"\']|^)[^>"\']*?Buscaminas Bajo el Mar', r'\1🌊 Buscaminas Bajo el Mar', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Subir Imagen', r'\1📸 Subir Imagen', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Más Opciones', r'\1⚙️ Más Opciones', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Clasificación', r'\1🏆 Clasificación', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Estadística Global', r'\1🌟 Estadística Global', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Invítame un Café', r'\1☕ Invítame un Café', text)
text = re.sub(r'([>"\']|^)[^>"\']*?Guías y Tutoriales', r'\1📖 Guías y Tutoriales', text)
text = re.sub(r'([>"\']|^)[^>"\']*?En Mantenimiento', r'\1🛠️ En Mantenimiento', text)

# Fix literal string in HTML
text = text.replace('YOS Buscaminas Bajo el Mar', '🌊 Buscaminas Bajo el Mar')
text = text.replace('Y" Subir Imagen', '📸 Subir Imagen')
text = text.replace('? Más Opciones', '⚙️ Más Opciones')
text = text.replace('? Clasificación', '🏆 Clasificación')

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

import re

with open('auth_features.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'mostrarToast' in line and 'Por favor ingresa' in line:
        lines[i] = "                mostrarToast('⚠️ Por favor ingresa un nombre y nivel válido.');\n"
    elif 'mostrarToast' in line and 'Error guardando' in line:
        lines[i] = "            mostrarToast('❌ Error guardando el perfil');\n"
    elif '//' in line and '\ufffd' in line:
        # Just clean up mangled comments
        lines[i] = re.sub(r'//.*', '// ' + re.sub(r'[^a-zA-Z0-9 ]', '', line).strip(), line)

with open('auth_features.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '//' in line and '\ufffd' in line:
        lines[i] = re.sub(r'//.*', '// ' + re.sub(r'[^a-zA-Z0-9 ]', '', line).strip(), line)

with open('app.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

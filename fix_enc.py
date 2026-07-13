import os

def fix_encoding(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Strip BOM if it got decoded as a character
        if text.startswith('\ufeff'):
            text = text[1:]
            
        # The text was double encoded, so we encode back to cp1252 ignoring lost bytes
        # Some characters might have been replaced by \x8f (undefined) or similar.
        original_bytes = text.encode('cp1252', errors='replace')
        
        # Now decode the bytes as utf-8
        correct_text = original_bytes.decode('utf-8', errors='replace')
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(correct_text)
        print(f"Fixed {filename}")
    except Exception as e:
        print(f"Error in {filename}: {e}")

fix_encoding('index.html')
fix_encoding('app.js')
fix_encoding('auth_features.js')

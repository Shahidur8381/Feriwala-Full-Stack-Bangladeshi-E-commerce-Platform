import os
import re

def update_files(directory, pattern, replacement):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = re.sub(pattern, replacement, content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")

# For Next.js client
client_pattern = r"`\$\{process\.env\.NEXT_PUBLIC_API_URL\}\$\{([^}]+)\.image\}`"
# Instead of a simple replacement string, we use a function
def client_repl(match):
    var_name = match.group(1)
    return f"({var_name}.image?.startsWith('http') ? {var_name}.image : `${{process.env.NEXT_PUBLIC_API_URL}}${{{var_name}.image}}`)"

update_files('client/src', client_pattern, client_repl)

# For Vite sellers
vite_pattern = r"`\$\{import\.meta\.env\.VITE_API_URL\}\$\{([^}]+)\.image\}`"
def vite_repl(match):
    var_name = match.group(1)
    return f"({var_name}.image?.startsWith('http') ? {var_name}.image : `${{import.meta.env.VITE_API_URL}}${{{var_name}.image}}`)"

update_files('seller/src', vite_pattern, vite_repl)
update_files('seller_admin/src', vite_pattern, vite_repl)

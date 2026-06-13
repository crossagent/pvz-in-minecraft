import os
import re
import sys

# JavaScript keywords that should not be treated as object names in bracket-to-dot notation
KEYWORDS = {
    'return', 'case', 'typeof', 'delete', 'throw', 'void', 'new', 'in', 
    'instanceof', 'yield', 'await', 'class', 'function', 'const', 'let', 'var',
    'static', 'get', 'set', 'async', 'super', 'export', 'import', 'default',
    'extends', 'package', 'interface', 'implements', 'private', 'public', 'protected'
}

def safe_decode_escape(match):
    val = int(match.group(1), 16)
    char = chr(val)
    # Avoid characters that will break string syntax or formatting in JS
    if char in ('\\', '\n', '\r', '"', "'", '`'):
        return match.group(0)
    # Decodes printable ASCII and all letters/numbers/other language chars
    if 32 <= val < 127 or val >= 128:
        return char
    return match.group(0)

def deobfuscate_text(content):
    # 1. Decode Unicode escapes (\uXXXX)
    content = re.sub(r'\\u([0-9a-fA-F]{4})', safe_decode_escape, content)
    
    # 2. Decode Hex escapes (\xXX)
    content = re.sub(r'\\x([0-9a-fA-F]{2})', safe_decode_escape, content)
    
    # 3. Reverse split-reversed strings
    # Restricted inner string to not cross statement boundaries (no ;, {, }, [, ], (, ), newline, etc.)
    pattern_rev = '([\'"])([^\'";{}()\\[\\]\\n\\r]*?)\\1\\.split\\(\\s*([\'\"])\\3\\s*\\)\\.reverse\\(\\)\\.join\\(\\s*([\'\"])\\4\\s*\\)'
    def repl_rev(match):
        quote = match.group(1)
        inner = match.group(2)
        return f"{quote}{inner[::-1]}{quote}"
    content = re.sub(pattern_rev, repl_rev, content)
    
    # 4. Evaluate XOR mathematical calculations
    pattern_xor = r'\b(0x[0-9a-fA-F]+|\d+)\s*\^\s*(0x[0-9a-fA-F]+|\d+)\b'
    def repl_xor(match):
        op1_str = match.group(1)
        op2_str = match.group(2)
        op1 = int(op1_str, 16) if op1_str.startswith('0x') else int(op1_str)
        op2 = int(op2_str, 16) if op2_str.startswith('0x') else int(op2_str)
        return str(op1 ^ op2)
    content = re.sub(pattern_xor, repl_xor, content)
    
    # 5. Clean class property modifiers (static["method"] -> static method, get["prop"] -> get prop, etc.)
    for keyword in ('static', 'get', 'set', 'async'):
        pattern = r'\b' + keyword + r'\s*\[\s*(["\'])([a-zA-Z_$][a-zA-Z0-9_$]*)\1\s*\]'
        content = re.sub(pattern, keyword + r' \2', content)

    # 6. Convert bracket notation access to dot notation where safe (avoiding keywords)
    pattern_bracket = r'\b([a-zA-Z0-9_$]+)\s*\[\s*(["\'])([a-zA-Z_$][a-zA-Z0-9_$]*)\2\s*\]'
    def repl_bracket(match):
        obj = match.group(1)
        prop = match.group(3)
        if obj in KEYWORDS:
            return match.group(0)
        return f"{obj}.{prop}"
        
    old_content = ""
    while old_content != content:
        old_content = content
        content = re.sub(pattern_bracket, repl_bracket, content)
        
    return content

def process_file(filepath):
    print(f"Deobfuscating: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = deobfuscate_text(content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

def main():
    scripts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "behavior_packs", "PvZ", "scripts"))
    print(f"Target Scripts Directory: {scripts_dir}")
    if not os.path.exists(scripts_dir):
        print(f"Error: directory {scripts_dir} not found!")
        sys.exit(1)
        
    for root, dirs, files in os.walk(scripts_dir):
        for file in files:
            if file.endswith('.js'):
                filepath = os.path.join(root, file)
                process_file(filepath)
                
    print("Deobfuscation complete!")

if __name__ == "__main__":
    main()

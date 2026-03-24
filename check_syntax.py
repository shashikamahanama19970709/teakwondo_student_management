import sys

def count_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = 0
    parens = 0
    brackets = 0
    in_string = None
    escaped = False
    
    for i, char in enumerate(content):
        if escaped:
            escaped = False
            continue
        if char == '\\':
            escaped = True
            continue
        
        if in_string:
            if char == in_string:
                in_string = None
            continue
        
        if char in ('"', "'", '`'):
            in_string = char
            continue
            
        if char == '{': braces += 1
        elif char == '}': braces -= 1
        elif char == '(': parens += 1
        elif char == ')': parens -= 1
        elif char == '[': brackets += 1
        elif char == ']': brackets -= 1
        
        if braces < 0: print(f"Negative braces at index {i}")
        if parens < 0: print(f"Negative parens at index {i}")
        if brackets < 0: print(f"Negative brackets at index {i}")

    print(f"Final counts: Braces={braces}, Parens={parens}, Brackets={brackets}")

count_braces(sys.argv[1])

import re

pattern = '([\'"])([^\'";{}()\\[\\]\\n\\r]*?)\\1\\.split\\(\\s*([\'\"])\\3\\s*\\)\\.reverse\\(\\)\\.join\\(\\s*([\'\"])\\4\\s*\\)'
text = 'const _0x493871=world["scoreboard"]["getObjective"]("nellop".split("").reverse().join(""));'

match = re.search(pattern, text)
if match:
    print("Match found!")
    print(f"Group 1 (quote): {match.group(1)}")
    print(f"Group 2 (inner): {match.group(2)}")
    print(f"Group 3 (split quote): {match.group(3)}")
    print(f"Group 4 (join quote): {match.group(4)}")
    print(f"Full Match: {match.group(0)}")
else:
    print("No match!")

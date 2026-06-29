import json
import re

data_file = "/home/sharif/this is test/market_observation_checklist/data.js"

with open(data_file, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'const marketData = (\[.*\]);', content, re.DOTALL)
if match:
    json_str = match.group(1).replace("NaN", "null")
    data = json.loads(json_str)
    
    # Filter out the duplicate IDs
    ids_to_remove = [795191378, 795195556]
    original_len = len(data)
    
    data = [m for m in data if m.get('id') not in ids_to_remove]
    
    new_json_str = json.dumps(data, indent=4, ensure_ascii=False)
    new_content = f"const marketData = {new_json_str};\n"
    
    with open(data_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Removed {original_len - len(data)} duplicate markets.")
else:
    print("Could not parse data.js")

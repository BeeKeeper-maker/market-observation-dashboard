import re
import json

data_file = "/home/sharif/this is test/market_observation_checklist/data.js"

with open(data_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the JSON array string
match = re.search(r'const marketData = (\[.*\]);', content, re.DOTALL)
if match:
    json_str = match.group(1)
    # The JSON string has some `NaN` values which are invalid JSON. We need to handle that.
    json_str = json_str.replace("NaN", "null")
    data = json.loads(json_str)

    # Generate the new photo array for Bou Bazar
    bou_bazar_photos = []
    for i in range(1, 14):
        bou_bazar_photos.append({
            "url": f"assets/images/bou_bazar/bou_bazar_{i}.jpeg",
            "desc": f"Bou Bazar Photo {i}"
        })

    # Update data for both Bou Bazars
    updated_count = 0
    for market in data:
        if market.get('id') in [795180497, 795191378]:
            market['photos'] = bou_bazar_photos
            updated_count += 1

    # Convert back to JSON and write
    new_json_str = json.dumps(data, indent=4, ensure_ascii=False)
    # Put `NaN` back if user wants, but `null` is actually better for JS and JSON.
    new_content = f"const marketData = {new_json_str};\n"

    with open(data_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Updated data.js! Modified {updated_count} markets.")
else:
    print("Could not parse data.js")

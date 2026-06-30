import json

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = content.replace('const marketData = ', '').strip().rstrip(';')
markets = json.loads(json_str)

new_photos = [
    {"url": f"assets/images/nonikhir_bazar/nonikhir_bazar_{i}.jpeg", "desc": f"Nonikhir Bazar Photo {i}"}
    for i in range(1, 5)
]

for m in markets:
    if m['name'] == 'ননিখীর বাজার':
        m['photos'] = new_photos
        break

with open('data.js', 'w', encoding='utf-8') as f:
    f.write('const marketData = ')
    f.write(json.dumps(markets, indent=4, ensure_ascii=False))
    f.write(';\n')

print("Updated data.js with Nonikhir Bazar photos")

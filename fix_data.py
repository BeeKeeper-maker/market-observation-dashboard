import csv
import json

csv_file = "/home/sharif/Downloads/Market_Observation_Checklist_-_all_versions_-_labels_-_2026-06-30-10-42-00.xlsx - Market Observation Checklist.csv"

# Load existing data.js
with open('/home/sharif/this is test/market_observation_checklist/data.js', 'r', encoding='utf-8') as f:
    content = f.read()
json_str = content.replace('const marketData = ', '').strip().rstrip(';')
markets = json.loads(json_str)
market_map = {m['name'].replace(' ', ''): m for m in markets}

translations = {
    "ডিম, মাংস বিক্রি হয়ে গেছে": "Eggs and meat have been sold out",
    "দুধ বিক্রি হয়না": "Milk is not sold here",
    "বাজার সংস্কার কাজ চলছে তাই দোকান গুলো অগোছালো": "Market renovation work is ongoing, so the shops are disorganized",
    "এই বাজারে দুধ বিক্রি হয়না": "Milk is not sold here",
    "দুধের বাজার নয়": "Not a milk market",
    "দুধ উঠেনা হাটে ,বৃষ্টির কারনে যাতায়াত সমস্যা": "Milk is not available in the market, transportation problem due to rain"
}

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        market_name_raw = row.get('Market Name (বাজারের নাম)', '').strip()
        if not market_name_raw: continue
        name_key = market_name_raw.replace(' ', '')
        
        if name_key in market_map:
            # Fix activities
            activities = []
            for k in row.keys():
                if 'Main Market Activities (প্রধান বাজার কার্যক্রম)/' in k and row[k] == '1':
                    act = k.split('/')[-1].split(' ')[0]
                    if act != 'Others':
                        activities.append(act)
            if activities:
                market_map[name_key]['activities'] = activities
            
            # Fix remarks
            remark_bn = row.get('Remarks (মন্তব্য)', '').strip()
            if remark_bn in translations:
                market_map[name_key]['remarks'] = translations[remark_bn]
            elif remark_bn:
                market_map[name_key]['remarks'] = remark_bn # Fallback to BN if unknown

with open('/home/sharif/this is test/market_observation_checklist/data.js', 'w', encoding='utf-8') as f:
    f.write('const marketData = ')
    f.write(json.dumps(markets, indent=4, ensure_ascii=False))
    f.write(';\n')

print("Fixed activities and remarks in data.js")

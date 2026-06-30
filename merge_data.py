import csv
import json
import re

csv_file = "/home/sharif/Downloads/Market_Observation_Checklist_-_all_versions_-_labels_-_2026-06-30-10-42-00.xlsx - Market Observation Checklist.csv"

# Load existing data.js
with open('/home/sharif/this is test/market_observation_checklist/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract json from data.js
json_str = content.replace('const marketData = ', '').strip().rstrip(';')
existing_markets = json.loads(json_str)

# Create a mapping of existing markets by name for quick lookup
market_map = {}
for m in existing_markets:
    name = m['name'].replace(' ', '')
    market_map[name] = m

new_markets = []

# Keep track of duplicates we've seen
seen_names = set()

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        market_name_raw = row.get('Market Name (বাজারের নাম)', '').strip()
        if not market_name_raw: continue
        
        name_key = market_name_raw.replace(' ', '')
        
        # If we've seen this name in the CSV already, it's a duplicate. We keep the one with a remark.
        is_dup = name_key in seen_names
        
        # Determine activities
        activities = []
        for k in row.keys():
            if 'Main Market Activities (প্রধান বাজার কার্যক্রম)/' in k and row[k] == 'True':
                act = k.split('/')[-1].split(' ')[0]
                if act != 'Others':
                    activities.append(act)

        new_market = {
            "id": int(row.get('_id', 0)) if row.get('_id') else 0,
            "name": market_name_raw,
            "union": row.get('Union (ইউনিয়ন)', '').strip(),
            "lat": float(row.get('_GPS Location (জিপিএস লোকেশন)_latitude', '0') or 0),
            "lng": float(row.get('_GPS Location (জিপিএস লোকেশন)_longitude', '0') or 0),
            "market_day": row.get('Market Day (হাটের দিন)', '').strip(),
            "market_type": row.get('Market Type (বাজারের ধরন)', '').strip(),
            "shops": int(row.get('Approximate Number of Shops (আনুমানিক দোকানের সংখ্যা)', '0') or 0),
            "road_type": row.get('Road Type (রাস্তার ধরন)', '').strip(),
            "road_condition": row.get('Road Condition (রাস্তার অবস্থা)', '').strip(),
            "women_presence_percent": float(row.get('Presence of Women (মহিলাদের উপস্থিতি) (শতকরা) ', '0') or 0),
            "women_vendors_percent": float(row.get('Women Vendors (নারী বিক্রেতা) (শতকরা) ', '0') or 0),
            "storage_facilities": [],
            "remarks": row.get('Remarks (মন্তব্য)', '').strip(),
            "activities": activities,
            "photos": []
        }
        
        # Merge with existing data if it exists
        if name_key in market_map:
            old_m = market_map[name_key]
            new_market['photos'] = old_m.get('photos', [])
            if not new_market['activities']:
                new_market['activities'] = old_m.get('activities', [])
            if not new_market['id']:
                new_market['id'] = old_m.get('id', 0)
                
        if is_dup:
            # We already have one. Compare with the last one added.
            for idx, existing in enumerate(new_markets):
                if existing['name'].replace(' ', '') == name_key:
                    # Keep the one with a longer remark or more shops
                    if len(new_market['remarks']) > len(existing['remarks']) or new_market['shops'] > existing['shops']:
                        new_markets[idx] = new_market
                        new_markets[idx]['name'] = market_name_raw # use latest spelling
                    break
        else:
            seen_names.add(name_key)
            new_markets.append(new_market)

# Now, we should write new_markets back to data.js
with open('/home/sharif/this is test/market_observation_checklist/data.js', 'w', encoding='utf-8') as f:
    f.write('const marketData = ')
    f.write(json.dumps(new_markets, indent=4, ensure_ascii=False))
    f.write(';\n')

print("Successfully merged and updated data.js")


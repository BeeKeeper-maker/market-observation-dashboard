import csv
import json

csv_file = "/home/sharif/Downloads/Market_Observation_Checklist_-_all_versions_-_labels_-_2026-06-30-10-42-00.xlsx - Market Observation Checklist.csv"

markets = []
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        market_name = row.get('Market Name (বাজারের নাম)', '').strip()
        if not market_name: continue
        
        # Determine activities
        activities = []
        for k in row.keys():
            if 'Main Market Activities (প্রধান বাজার কার্যক্রম)/' in k and row[k] == 'True':
                act = k.split('/')[-1].split(' ')[0]
                if act != 'Others':
                    activities.append(act)

        markets.append({
            "name": market_name,
            "union": row.get('Union (ইউনিয়ন)', '').strip(),
            "lat": row.get('_GPS Location (জিপিএস লোকেশন)_latitude', '0'),
            "lng": row.get('_GPS Location (জিপিএস লোকেশন)_longitude', '0'),
            "market_day": row.get('Market Day (হাটের দিন)', '').strip(),
            "market_type": row.get('Market Type (বাজারের ধরন)', '').strip(),
            "shops": row.get('Approximate Number of Shops (আনুমানিক দোকানের সংখ্যা)', '').strip(),
            "road_type": row.get('Road Type (রাস্তার ধরন)', '').strip(),
            "road_condition": row.get('Road Condition (রাস্তার অবস্থা)', '').strip(),
            "women_presence_percent": row.get('Presence of Women (মহিলাদের উপস্থিতি) (শতকরা) ', '0').strip(),
            "women_vendors_percent": row.get('Women Vendors (নারী বিক্রেতা) (শতকরা) ', '0').strip(),
            "remarks": row.get('Remarks (মন্তব্য)', '').strip(),
            "activities": activities
        })

print(json.dumps(markets, indent=2, ensure_ascii=False))


import os
import shutil
import time
import glob
import re
import json

# Paths
download_dir = os.path.expanduser("~/Downloads")
dest_dir = "/home/sharif/this is test/market_observation_checklist/assets/images/baby_bazar"
data_file = "/home/sharif/this is test/market_observation_checklist/data.js"

os.makedirs(dest_dir, exist_ok=True)

# Time 1 hour ago
one_hour_ago = time.time() - (60 * 60)

# Move images
all_files = glob.glob(os.path.join(download_dir, "*"))
moved_count = 0
for f in all_files:
    if os.path.isfile(f):
        ext = os.path.splitext(f)[1].lower()
        if ext in [".jpg", ".jpeg", ".png", ".webp"]:
            mtime = os.path.getmtime(f)
            if mtime >= one_hour_ago:
                moved_count += 1
                new_name = f"baby_bazar_{moved_count}{ext}"
                dest_path = os.path.join(dest_dir, new_name)
                shutil.move(f, dest_path)
                print(f"Moved: {os.path.basename(f)} -> {new_name}")

print(f"Total moved: {moved_count}")

# Generate photos array
baby_bazar_photos = []
for i in range(1, moved_count + 1):
    # we assume they are jpegs mostly, but we'll list the actual files in dir
    pass

actual_files = sorted(os.listdir(dest_dir))
for idx, f in enumerate(actual_files):
    baby_bazar_photos.append({
        "url": f"assets/images/baby_bazar/{f}",
        "desc": f"Baby Bazar Photo {idx + 1}"
    })

if len(baby_bazar_photos) == 0:
    print("No photos found to update in data.js")
else:
    # Update data.js
    with open(data_file, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'const marketData = (\[.*\]);', content, re.DOTALL)
    if match:
        json_str = match.group(1).replace("NaN", "null")
        data = json.loads(json_str)

        updated_count = 0
        for market in data:
            if market.get('id') in [795179441, 795195556]:
                market['photos'] = baby_bazar_photos
                updated_count += 1

        new_json_str = json.dumps(data, indent=4, ensure_ascii=False)
        new_content = f"const marketData = {new_json_str};\n"

        with open(data_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"Updated data.js! Modified {updated_count} markets.")
    else:
        print("Could not parse data.js")

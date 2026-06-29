import os
import shutil
import time
import glob
import re
import json

# Paths
download_dir = os.path.expanduser("~/Downloads")
dest_dir = "/home/sharif/this is test/market_observation_checklist/assets/images/goalgram_bazar"
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
                new_name = f"goalgram_bazar_{moved_count}{ext}"
                dest_path = os.path.join(dest_dir, new_name)
                shutil.move(f, dest_path)
                print(f"Moved: {os.path.basename(f)} -> {new_name}")

print(f"Total moved: {moved_count}")

# Generate photos array
goalgram_photos = []
actual_files = sorted(os.listdir(dest_dir))
for idx, f in enumerate(actual_files):
    goalgram_photos.append({
        "url": f"assets/images/goalgram_bazar/{f}",
        "desc": f"Goalgram Bazar Photo {idx + 1}"
    })

if len(goalgram_photos) == 0:
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
            if market.get('id') in [795179070]:
                market['photos'] = goalgram_photos
                updated_count += 1

        new_json_str = json.dumps(data, indent=4, ensure_ascii=False)
        new_content = f"const marketData = {new_json_str};\n"

        with open(data_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"Updated data.js! Modified {updated_count} markets.")
    else:
        print("Could not parse data.js")

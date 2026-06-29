import os
import shutil
import time
import glob

# Paths
download_dir = os.path.expanduser("~/Downloads")
dest_dir = "/home/sharif/this is test/market_observation_checklist/assets/images/bou_bazar"
os.makedirs(dest_dir, exist_ok=True)

# Time 1 hour ago
one_hour_ago = time.time() - (60 * 60)

# Get all images in Downloads (jpg, jpeg, png, webp)
all_files = glob.glob(os.path.join(download_dir, "*"))
valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".mkv"} # wait, skip mkv.

# We only want images downloaded in the last 1 hour
moved_count = 0
for f in all_files:
    if os.path.isfile(f):
        ext = os.path.splitext(f)[1].lower()
        if ext in [".jpg", ".jpeg", ".png"]:
            # Check modification time
            mtime = os.path.getmtime(f)
            if mtime >= one_hour_ago:
                moved_count += 1
                new_name = f"bou_bazar_{moved_count}{ext}"
                dest_path = os.path.join(dest_dir, new_name)
                shutil.move(f, dest_path)
                print(f"Moved: {os.path.basename(f)} -> {new_name}")

print(f"Total moved: {moved_count}")

import csv
csv_file = "/home/sharif/Downloads/Market_Observation_Checklist_-_all_versions_-_labels_-_2026-06-30-10-42-00.xlsx - Market Observation Checklist.csv"
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row.get('Main Market Activities (প্রধান বাজার কার্যক্রম)', ''))
        break

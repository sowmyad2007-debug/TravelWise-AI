import re

replacements = {
    'munnar_tea_museum': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Munnar_Tea_Museum_-_Model_Tea_Factory_-_3.jpg/960px-Munnar_Tea_Museum_-_Model_Tea_Factory_-_3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'munnar_top_station': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Munnar_Top_station.jpg/960px-Munnar_Top_station.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'munnar_blossom_park': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Blue_Jacaranda_blossom_in_Munnar_April_2009.jpg/960px-Blue_Jacaranda_blossom_in_Munnar_April_2009.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'munnar_pothamedu': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Pothamedu_Viewpoint%2C_Munnar.jpg/960px-Pothamedu_Viewpoint%2C_Munnar.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    'munnar_spice_market': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Munnar_-_Tea_Plantations.jpg/960px-Munnar_-_Tea_Plantations.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
}

with open('backend/destination_data.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
current_place_id = None

for line in lines:
    m_pid = re.search(r'"place_id":\s*"([^"]+)"', line)
    if m_pid:
        current_place_id = m_pid.group(1)

    m_img = re.search(r'"image_url":\s*"([^"]*)"', line)
    if m_img and current_place_id and current_place_id in replacements:
        line = re.sub(r'"image_url":\s*"[^"]*"', f'"image_url": "{replacements[current_place_id]}"', line)

    new_lines.append(line)

with open('backend/destination_data.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Updated Munnar destination data successfully!")

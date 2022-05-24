# load all json files in the current folder
import json
import os

# create a temporary output dir
path = os.getcwd()
output_dir = path + "/output"
if not os.path.exists(output_dir):
    os.mkdir(output_dir)

metadata_dir = '../Weapons/'

mapping_file = 'weapon.mapping.names.to.new.ids.json'
mapping_data_path = metadata_dir + mapping_file
with open(mapping_data_path, 'r') as f:
    mapping_data = json.load(f)

for filename in os.listdir(metadata_dir):
    if filename.endswith(".png"):
        weapon_name = filename.replace("_", " ").replace(".png", "")
        tokenId = mapping_data[weapon_name]
        tokenId += 20001
        new_filename = str(tokenId) + ".png"
        data = None
        # move the file to the output dir
        os.rename(metadata_dir + filename, output_dir + "/" + new_filename)
# load all json files in the current folder
import json
import os

def updateTroopMetaData(data):
    new_data = data
    new_data["description"] = "G4N9: Domination Origins - Gen 1 Troop Collection. This is the first generation of troops sent to the battlefield."
    new_data['programmer'] = 'Felix Ruzzoli'
    new_attributes = []
    for attribute in data["attributes"]:
        if attribute['trait_type'] == "Attributes Increase":
            attribute['trait_type'] = "Speed Boost"
        if attribute['trait_type'] == "Stamina Increase":
            attribute['trait_type'] = "Defense Boost"
        if attribute['trait_type'] == "Power Increase":
            attribute['trait_type'] = "Offense Boost"
        new_attributes.append(attribute)
    new_data["attributes"] = new_attributes

    return new_data


def updateWeaponMetaData(data):
    new_data = data
    new_data["description"] = "G4N9: Domination Origins - Gen 1 Weapons Collection. This is the first generation of weapons for our troops."
    return new_data

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
    # must end with .json
    if filename.endswith(".json") and filename != mapping_file:
        # load the json file
        # replace the underscores with spaces in the filename
        # and remove the .json extension
        weapon_name = filename.replace("_", " ").replace(".json", "")
        tokenId = mapping_data[weapon_name]
        tokenId += 20001
        new_filename = str(tokenId) + ".json"
        data = None
        with open(metadata_dir + filename) as f:
            data = json.load(f)
        # update the metadata
        data = updateWeaponMetaData(data)
        with open(output_dir + "/" + new_filename, 'w') as outfile:
            json.dump(data, outfile)
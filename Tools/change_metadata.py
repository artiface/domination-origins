# load all json files in the current folder
import json
import os
import sys

from pathlib import Path
# PYTHONPATH hack
sys.path.append(str(Path(__file__).parent.parent.absolute()))

from doserve.common.character import Character

weapon_map = None

def flattenAttributes(attributes):
    flat = {}
    for item in attributes:
        key = item['trait_type']
        value = item['value']
        flat[key] = value
    return flat

def troop_remap(x):
    return x + 10000

def weapon_remap(x):
    return x + 20001

def new_meta_troops(filename, tokenId):
    c = Character('None', tokenId)
    new_data = c.toTokenMetadata()
    new_data["description"] = "G4N9: Domination Origins - Gen 1 Troop Collection. This is the first generation of troops sent to the battlefield."
    new_data['name'] = '#' + str(tokenId)
    new_data['image'] = 'https://gateway.ipfs.io/ipfs/QmVQV1nQ4LYX3dKCtN3WWq4vabUYkWynu9D3c5PhVzQqwr/' + str(tokenId) + '.png'
    new_data['edition'] = 'Gen 1'
    return new_data, troop_remap(tokenId)


def new_meta_gen2_troops(filename, tokenId):
    data = None
    with open(filename) as f:
        data = json.load(f)
    data['attributes'] = flattenAttributes(data['attributes'])
    c = Character('None', tokenId)
    c.loadTokenData(data)
    c.startDNADerivation()
    new_data = c.toTokenMetadata()
    #new_data["description"] = "G4N9: Domination Origins - Gen 1 Troop Collection. This is the first generation of troops sent to the battlefield."
    #new_data['name'] = '#' + str(tokenId)
    #new_data['image'] = 'https://gateway.ipfs.io/ipfs/QmVQV1nQ4LYX3dKCtN3WWq4vabUYkWynu9D3c5PhVzQqwr/' + str(tokenId) + '.png'
    new_data['edition'] = 'Gen 2'
    return new_data, tokenId

def os_meta_troops(filename, tokenId):
    data = None
    with open(filename) as f:
        data = json.load(f)
    new_data = data
    new_data["description"] = "G4N9: Domination Origins - Gen 1 Troop Collection. This is the first generation of troops sent to the battlefield."
    new_attributes = []

    for attribute in data["attributes"]:
        if attribute['trait_type'] == "Stamina Increase":
            attribute['trait_type'] = "Speed Boost"

        if attribute['trait_type'] == "Attributes Increase":
            attribute['trait_type'] = "Defense Boost"

        if attribute['trait_type'] == "Power Increase":
            attribute['trait_type'] = "Power Boost"

        new_attributes.append(attribute)

    new_data["attributes"] = new_attributes
    return new_data, troop_remap(tokenId)


def os_meta_weapons(filename, tokenId):
    data = None
    with open(filename) as f:
        data = json.load(f)
    new_data = data
    new_data["description"] = "G4N9: Domination Origins - Gen 1 Weapons Collection. This is the first generation of weapons for our troops."
    return new_data, weapon_remap(weapon_map[data["name"]])

def new_meta_weapons(filename, tokenId):
    data = None
    with open(filename) as f:
        data = json.load(f)
    new_data = data
    new_data["description"] = "G4N9: Domination Origins - Gen 1 Weapons Collection. This is the first generation of weapons for our troops."
    new_data['attributes'] = flattenAttributes(data['attributes'])
    return new_data, weapon_remap(weapon_map[data["name"]])


def identity(x):
    return x


# read command line arguments, the first item is the metadata directory
def map_files_in_dir(input_dir, output_dir, mapFunc, tokenMapFunc=identity):
    # create a temporary output dir
    count = 0
    if not os.path.exists(output_dir):
        # create the output dir recursively
        os.makedirs(output_dir, exist_ok=True)
    for filename in os.listdir(input_dir):
        #if count > 10:
        #    return
        # must end with .json
        if filename.endswith(".json"):
            # load the json file
            # replace the underscores with spaces in the filename
            # and remove the .json extension
            map_file(filename, mapFunc, input_dir, output_dir)
            count += 1


def map_file(filename, mapFunc, input_dir, output_dir):
    #print("Mapping file: " + filename)
    tokenId = int(filename.replace(".json", ""))
    # update the metadata
    file_path = os.path.join(input_dir, filename)
    data, new_token_id = mapFunc(file_path, tokenId)
    new_filename = str(new_token_id) + ".json"
    with open(os.path.join(output_dir, new_filename), 'w') as outfile:
        json.dump(data, outfile)


if __name__ == "__main__":
    metadata_dir = 'original.metadata'

    with open(os.path.join(metadata_dir, 'weapon.mapping.names.to.new.ids.json')) as file:
        weapon_map = json.load(file)
    mode = sys.argv[1]
    if mode == "all":
        # get the output dir from the command line
        output_base_dir = sys.argv[2]
        opensea_dir = os.path.join(output_base_dir, 'opensea')
        newmeta_dir = os.path.join(output_base_dir, 'metadata')

        metadata_dir = os.path.join(os.getcwd(), metadata_dir)
        troops_metadata_dir = os.path.join(metadata_dir, 'troops')
        weapons_metadata_dir = os.path.join(metadata_dir, 'weapons')
        #print("Mapping troops from " + troops_metadata_dir + " to " + opensea_dir + " and " + newmeta_dir)
        #print("Mapping weapons from " + weapons_metadata_dir + " to " + opensea_dir + " and " + newmeta_dir)
        map_files_in_dir(troops_metadata_dir, newmeta_dir, new_meta_troops)
        map_files_in_dir(weapons_metadata_dir, newmeta_dir, new_meta_weapons)
        map_files_in_dir(troops_metadata_dir, opensea_dir, os_meta_troops)
        map_files_in_dir(weapons_metadata_dir, opensea_dir, os_meta_weapons)
    elif mode == "single":
        # we want to convert one opensea json file into a new metadata json file
        # get the token id from the command line
        tokenId = int(sys.argv[2])
        output_base_dir = sys.argv[3]
        newmeta_dir = os.path.join(output_base_dir, 'metadata')
        opensea_dir = os.path.join(output_base_dir, 'opensea')
        map_file(str(tokenId) + ".json", new_meta_gen2_troops, opensea_dir, newmeta_dir)

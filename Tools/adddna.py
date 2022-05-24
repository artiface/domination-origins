# load all json files in the current folder
import json
import os

for filename in os.listdir(os.getcwd()):
    # must end with .json
    if filename.endswith(".json"):
        # load the json file
        data = None
        with open(filename) as f:
            data = json.load(f)
        # hash the file
        #del data["dna"]
        # sha1 hash
        import hashlib
        data["dna"] = hashlib.sha1(json.dumps(data)).hexdigest()
        #hashed = hash(json.dumps(data))
        # add the hash to the json file as a hex string
        #data["dna"] = hex(hashed)
        # save the file
        with open(filename, "w") as f:
            json.dump(data, f)
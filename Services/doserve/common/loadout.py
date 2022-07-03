import json

class LoadOut:
    def __init__(self, troopselection):
        self.troopselection = troopselection

    def toString(self):
        return json.dumps(self.__dict__)

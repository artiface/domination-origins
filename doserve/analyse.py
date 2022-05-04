import json
from pathlib import Path

class Analyzer:
    def __init__(self):
        self.attributeValues = {}

    def startAnalyse(self):
        listOfTokens = []
        tokenValues = {'attributeSum': {'min': 9999, 'max': -9999, 'sum': 0, 'count': 0}}
        tokenCount = 0
        for i in range(10000):
            token = self.loadLocalNFT(i)
            if token:
                tokenCount += 1
                attributeSum = 0
                for name, strvalue in token['attributes'].items():
                    try:
                        value = int(strvalue)
                    except ValueError:
                        continue
                    attributeSum += value
                    if name not in tokenValues:
                        tokenValues[name] = {'min': 9999, 'max': -9999, 'sum': 0, 'count': 0}

                    if value < tokenValues[name]['min']:
                        tokenValues[name]['min'] = value
                    if value > tokenValues[name]['max']:
                        tokenValues[name]['max'] = value
                    tokenValues[name]['count'] += 1
                    tokenValues[name]['sum'] += value

                if tokenValues['attributeSum']['min'] > attributeSum:
                    tokenValues['attributeSum']['min'] = attributeSum
                if tokenValues['attributeSum']['max'] < attributeSum:
                    tokenValues['attributeSum']['max'] = attributeSum
                tokenValues['attributeSum']['count'] += 1
                tokenValues['attributeSum']['sum'] += attributeSum

        print('Total tokens: {}'.format(tokenCount))
        for name, values in tokenValues.items():
            values['avg'] = values['sum'] / tokenCount
            print('{}: min: {}, max: {}, avg: {}, count: {}'.format(name, values['min'], values['max'], values['avg'], values['count']))


    def flattenAttributes(self, attributes):
        flat = {}
        for item in attributes:
            key = item['trait_type']
            value = item['value']
            flat[key] = value
        return flat

    def loadLocalNFT(self, type, tokenId):
        dirmap = {
            'char': 'TroopNFTs',
            'weapon': 'WeaponNFTs',
        }
        dir = dirmap[type]
        try:
            with open('./{}/{}.json'.format(dir, tokenId), 'r') as f:
                data = json.load(f)
                # flatten attributes
                data['attributes'] = self.flattenAttributes(data['attributes'])
                return data
        except FileNotFoundError:
            return False


if __name__ == "__main__":
    analyzer = Analyzer()
    analyzer.startAnalyse()


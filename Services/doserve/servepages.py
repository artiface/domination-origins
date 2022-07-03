import json
import math
import os

import flask
from string import Template

from doserve.config import TEMPLATE_DIRECTORY
from doserve.config import BATTLE_DATA_DIRECTORY

from doserve.chain import loadLocalNFT
from storage import Storage

db_file = os.path.join(BATTLE_DATA_DIRECTORY, 'battles.sqlite')
db = Storage(db_file)

app = flask.Flask(__name__)
app.config["DEBUG"] = True

def render(template, data):
    filename = os.path.join(TEMPLATE_DIRECTORY, '{}.html'.format(template))
    with open(filename, 'r') as file:
        templateString = file.read()
        t = Template(templateString)
        return t.safe_substitute(data)

def prepareTroopData(generation, char):
    templateData = char.toObject()
    templateData['faction'] = str(templateData['faction']).replace('Faction.', '')
    # cast all skill to str
    to_str = lambda x: str(x['name'])
    templateData['generation'] = generation
    templateData['skillString'] = ', '.join(map(to_str, templateData['skills']))
    templateData = create_nav_links(char, generation, templateData)
    return templateData

def prepareTroopDataForAPI(generation, templateData):
    templateData['faction'] = str(templateData['faction']).replace('Faction.', '')
    # cast all skill to str
    templateData['generation'] = generation
    return templateData

def prepareSummaryData(battle_data):
    templateData = {}
    templateData['battleId'] = battle_data['battleId']
    walletOne = None
    walletTwo = None
    for wallet, index in battle_data['playerMap'].items():
        if index == 0:
            walletOne = wallet
        elif index == 1:
            walletTwo = wallet
        templateData['player{}'.format(index)] = '<a href="/player/{}">{}</a>'.format(wallet, wallet)
    templateData['winner'] = battle_data['winner']
    templateData['turnCount'] = battle_data['turnCount']
    troopsByPlayer = {
        walletOne: [],
        walletTwo: []
    }
    for char_data in battle_data['allCharacters']:
        tokenId = char_data['tokenId']
        generation = char_data['generation'] if 'generation' in char_data else 1
        troopsByPlayer[char_data['ownerWallet']].append((generation, tokenId))

    # wrap all troops in a href by using map-reduce
    player0TroopLinks = map(lambda x: '<a href="/troops/{}/{}">{}</a>'.format(x[0], x[1], x[1]), troopsByPlayer[walletOne])
    player1TroopLinks = map(lambda x: '<a href="/troops/{}/{}">{}</a>'.format(x[0], x[1], x[1]), troopsByPlayer[walletTwo])

    templateData['player0Troops'] = ', '.join(player0TroopLinks)
    templateData['player1Troops'] = ', '.join(player1TroopLinks)
    return templateData

def create_nav_links(char, generation, templateData):
    templateData['previousLink'] = ''
    templateData['nextLink'] = ''
    if char.tokenId > 1:
        prevUrl = '/troops/{}/{}'.format(generation, char.tokenId - 1)
        templateData['previousLink'] = '<a id="prev_link" href="{}">&lt;&lt;&lt;</a>'.format(prevUrl)
    if char.tokenId < 10000:
        nextUrl = '/troops/{}/{}'.format(generation, char.tokenId + 1)
        templateData['nextLink'] = '<a id="next_link" href="{}">&gt;&gt;&gt;</a>'.format(nextUrl)
    return templateData

@app.route('/health', methods=['GET'])
def health():
    return "Server is responding."


@app.route('/api/troop/<int:generation>/<int:tokenId>', methods=['GET'])
def troop_detail_json(generation, tokenId):
    tokenData = loadLocalNFT('troop', tokenId)
    if not tokenData:
        return False
    templateData = prepareTroopDataForAPI(generation, tokenData)
    return templateData


@app.route('/api/troops/<int:generation>/<int:page>', methods=['GET'])
def all_troop_detail_json(generation, page):
    alltroops = []
    itemsPerPage = 20
    pageCount = int(math.ceil(10000 / itemsPerPage))
    start = ((page - 1) * itemsPerPage) + 1
    end = start + itemsPerPage
    for tokenId in range(start, end):
        templateData = loadLocalNFT('troop', tokenId)
        alltroops.append(templateData)
    return {'troops': alltroops, 'page:': page, 'pageCount': pageCount}


@app.route('/troops/<int:generation>/<int:tokenId>', methods=['GET'])
def troop_detail(generation, tokenId):
    tokenData = troop_detail_json(generation, tokenId)
    if not tokenData:
        return "No data"
    return render('troops_detail', tokenData)


@app.route('/battle-summary/<int:battleId>', methods=['GET'])
def battle_summary(battleId):
    filepath = os.path.join(BATTLE_DATA_DIRECTORY, 'archive', 'bs_{}.json'.format(battleId))
    templateData = None
    with open(filepath, 'r') as file:
        battle_data = json.load(file)
        templateData = prepareSummaryData(battle_data)
    return render('battle_summary', templateData)


@app.route('/player/<player_wallet>', methods=['GET'])
def player_details(player_wallet):
    player_data = db.findPlayer(player_wallet)
    return render('player_details', player_data)


if __name__ == "__main__":
    app.run()
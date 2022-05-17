import json

import flask
from string import Template
import sys,os
sys.path.append('..')
from doserve.common.character import Character
from storage import Storage

db = Storage('battles.sqlite')

app = flask.Flask(__name__)
app.config["DEBUG"] = True

def render(template, data):
    with open('./templates/{}.html'.format(template), 'r') as file:
        templateString = file.read()
        t = Template(templateString)
        return t.safe_substitute(data)

def prepareTroopData(generation, char):
    templateData = char.toObject()
    templateData['faction'] = str(templateData['faction']).replace('Faction.', '')
    # cast all skill to str
    to_str = lambda x: str(x['name'])
    templateData['skills'] = templateData['skills']
    templateData['skillString'] = ', '.join(map(to_str, templateData['skills']))
    templateData = create_nav_links(char, generation, templateData)
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


@app.route('/api/troops/<int:generation>/<int:tokenId>', methods=['GET'])
def troop_detail_json(generation, tokenId):
    char = Character('NoOwner', tokenId)
    templateData = prepareTroopData(generation, char)
    return templateData


@app.route('/troops/<int:generation>/<int:tokenId>', methods=['GET'])
def troop_detail(generation, tokenId):
    return render('troops_detail', troop_detail_json(generation, tokenId))


@app.route('/battle-summary/<int:battleId>', methods=['GET'])
def battle_summary(battleId):
    filepath = './battles/archive/bs_{}.json'.format(battleId)
    templateData = None
    with open(filepath, 'r') as file:
        battle_data = json.load(file)
        templateData = prepareSummaryData(battle_data)
    return render('battle_summary', templateData)


@app.route('/player/<player_wallet>', methods=['GET'])
def player_details(player_wallet):
    player_data = db.findPlayer(player_wallet)
    return render('player_details', player_data)



app.run()
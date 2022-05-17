import json

import flask
from string import Template

from doserve.common.character import Character

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
    to_str = lambda x: str(x)
    templateData['skills'] = map(to_str, templateData['skills'])
    templateData['skillString'] = ', '.join(templateData['skills']) if templateData['skills'] else 'None'
    templateData = create_nav_links(char, generation, templateData)
    return templateData

def prepareSummaryData(battle_data):
    templateData = {}
    templateData['battleId'] = battle_data['battleId']
    for wallet, index in battle_data['playerMap'].items():
        templateData['player{}'.format(index)] = wallet
    templateData['winner'] = battle_data['winner']
    templateData['turnCount'] = battle_data['turnCount']
    troopsByPlayer = {
        templateData['player0']: [],
        templateData['player1']: []
    }
    for char_data in battle_data['allCharacters']:
        troopsByPlayer[char_data['ownerWallet']].append(char_data['tokenId'])

    templateData['player0Troops'] = ', '.join(troopsByPlayer[templateData['player0']])
    templateData['player1Troops'] = ', '.join(troopsByPlayer[templateData['player1']])
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


@app.route('/troops/<int:generation>/<int:tokenId>', methods=['GET'])
def troop_detail(generation, tokenId):
    char = Character('NoOwner', tokenId)
    templateData = prepareTroopData(generation, char)
    return render('troops_detail', templateData)


@app.route('/battle-summary/<int:battleId>', methods=['GET'])
def battle_summary(battleId):
    filepath = './battles/archive/bs_{}.json'.format(battleId)
    templateData = None
    with open(filepath, 'r') as file:
        battle_data = json.load(file)
        templateData = prepareSummaryData(battle_data)
    return render('battle_summary', templateData)

app.run()
import flask
from string import Template

from doserve.common.character import Character

app = flask.Flask(__name__)
app.config["DEBUG"] = True

def render(template, data):
    with open('./templates/{}.html'.format(template), 'r') as file:
        templateString = file.read()
        t = Template(templateString)
        return t.substitute(data)


def prepareTroopData(generation, char):
    templateData = char.toObject()
    templateData['faction'] = str(templateData['faction']).replace('Faction.', '')
    # cast all skill to str
    to_str = lambda x: str(x)
    templateData['skills'] = map(to_str, templateData['skills'])
    templateData['skillString'] = ', '.join(templateData['skills']) if templateData['skills'] else 'None'
    templateData = create_nav_links(char, generation, templateData)
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
def home(generation, tokenId):
    char = Character('NoOwner', tokenId)
    templateData = prepareTroopData(generation, char)
    return render('troops_detail', templateData)

app.run()
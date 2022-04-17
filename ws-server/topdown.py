def sendSiweMessage(wallet, loadout):
    pass

def verifySignature(wallet, signature):
    pass

def isInRunningBattle(wallet):
    pass

def reConnect(wallet):
    pass

def findOpenBattle(wallet, loadout):
    pass

def connectToOpenBattle(wallet, loadout):
    pass

def createBattle(wallet, loadout):
    pass

def broadcastBeginBattle(battle, wallet, loadout):
    pass

def sendWaitForPlayersInBattle(battle, wallet, loadout):
    pass

def sendLoadout(wallet, loadout):
    sendSiweMessage(wallet, loadout)

def siwe(wallet, loadout, signature):
    if not verifySignature(wallet, signature):
        return False

    if isInRunningBattle(wallet):
        reConnect(wallet)

    battle = findOpenBattle(wallet, loadout)
    if not battle:
        battle = createBattle(wallet, loadout)
        sendWaitForPlayersInBattle(battle, wallet, loadout)
    else:
        broadcastBeginBattle(battle, wallet, loadout)

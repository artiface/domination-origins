"use strict";
var Network = {
    requestEndTurn: function() {
        this.deselectCharacter();
        var request = {
            'message': 'endTurn',
        };
        var requestAsJson = JSON.stringify(request);
        this.socket.send(requestAsJson);
    },
    requestMovement: function(characterId, tileX, tileY){
        var request = {
            'message': 'movement',
            'characterId': characterId,
            'destination': {'x': tileX, 'y': tileY}
        };
        var requestAsJson = JSON.stringify(request);
        this.socket.send(requestAsJson);
    },

    requestAttack: function(characterId, tileX, tileY){
        var request = {
            'message': 'attack',
            'characterId': characterId,
            'target': {'x': tileX, 'y': tileY}
        };
        var requestAsJson = JSON.stringify(request);
        this.socket.send(requestAsJson);
    },

    handleRangedAttack: function(data) {
        const targetTile = data['defender_tile'];
        const damage = data['damage'];
        const defender = this.tilemap.tileOccupiedBy(targetTile.x, targetTile.y);
        this.spawnBulletImpacts(targetTile.x, targetTile.y, 3);
        defender.healthbar.changeHealth(-damage);
        const attacker = this.characterById(data['attacker']);
        attacker.hasAttacked(true);
        if (attacker === this.selectedCharacter)
        {
            this.selectNextActionableCharacter();
        }
    },
    
    handleServerResponse: async function(message) {
        if (message['error'])
        {
            alert(message['message'] + ': ' + message['error']);
            return;
        }
        switch (message['message'])
        {
            case 'rangedAttack':
                this.handleRangedAttack(message);
                break;
            case 'auth':
                const flatSig = await signer.signMessage(message['siwe_message']);

                const siweData = matchData;
                siweData['message'] = 'siwe';
                siweData['signature'] = flatSig;

                const siweString = JSON.stringify(siweData);

                window.localStorage.setItem('match_data', siweString);
                this.socket.send(siweString);
                break;
            case 'siwe':
                alert('Matchup created! You should wait for your opponent to accept the match.');
                break;
            case 'initialize':
                var mapData = message['map_data'];
                var charData = message['char_data'];
                var playerId = message['playerId'];

                var wallet = message['user_wallet'];
                if (!this.isInitialized)
                {
                    this.isInitialized = true;
                    this.playerId = playerId;
                    this.startSetup(mapData, charData);
                }
                else
                {
                    // we might need to update some data since the server is sending us a full state update
                    this.loadCharacters(charData);
                }
                break;
            case 'movement':
                var charIndex = message['characterId'];
                var destination = message['destination'];
                this.characters[charIndex].setStat('stepsTakenThisTurn', message['stepsTakenThisTurn']);
                this.characters[charIndex].player.moveTo(destination.x, destination.y);

                break;
            case 'death':
                var charIndex = message['characterId'];
                this.characters[charIndex].kill();
                break;
            case 'endTurn':
                var turnOfPlayer = message['turnOfPlayer'];
                var nextTurnText = 'It is now the turn of player ' + turnOfPlayer;
                if (turnOfPlayer === matchData['user_wallet'])
                {
                    nextTurnText = 'IT IS YOUR TURN!';
                }
                // reset the steps taken this turn stat for each character where the ownerWallet matches the turnOfPlayer
                for (var i = 0; i < this.characters.length; i++)
                {
                    if (this.characters[i].getStat('ownerWallet') === turnOfPlayer)
                    {
                        this.characters[i].nextTurn();
                    }
                }
                this.debugText.value(nextTurnText);
                this.selectNextActionableCharacter();
                break;
        }
    },
    sendBeginAuthMessage: function(socket) {
        const authMessage = {
            'message': 'auth',
            'troop_selection': matchData['troop_selection'],	// eg. {'1': {'troops': 111, 'weapons': 134}, '2': {'troops': 114, 'weapons': 1134}}
            'user_name': matchData['user_name'],
            'user_wallet': userAddress,
        };
        const requestAsJson = JSON.stringify(authMessage);
        socket.send(requestAsJson);
    },
    connectToServer: function() {
        const loc = window.location;
        let socket_uri = "ws:";
        if (loc.protocol === "https:") socket_uri = "wss:";

        socket_uri += "//" + userAddress + ":none@" + loc.host;
        socket_uri += "/socket/";
        var self = this;
        this.socket = new WebSocket(socket_uri);
        this.socket.onopen = function (event) {
            self.sendBeginAuthMessage(self.socket);
        };
        this.socket.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            self.handleServerResponse(msg);
        };
    }
};
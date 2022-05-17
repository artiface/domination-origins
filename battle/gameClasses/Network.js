"use strict";
var Network = {
    requestEndTurn: function() {
        this.deselectCharacter();
        const request = {
            'message': 'endTurn',
        };
        const requestAsJson = JSON.stringify(request);
        this.socket.send(requestAsJson);
    },
    requestMovement: function(characterId, tileX, tileY){
        const request = {
            'message': 'movement',
            'characterId': characterId,
            'destination': {'x': tileX, 'y': tileY}
        };
        const requestAsJson = JSON.stringify(request);
        this.socket.send(requestAsJson);
    },
    requestSprint: function(characterId, tileX, tileY){
        const request = {
            'message': 'sprint',
            'characterId': characterId,
            'destination': {'x': tileX, 'y': tileY}
        };
        const requestAsJson = JSON.stringify(request);
        this.socket.send(requestAsJson);
    },

    requestAttack: function(characterId, tileX, tileY){
        const request = {
            'message': 'attack',
            'characterId': characterId,
            'target': {'x': tileX, 'y': tileY}
        };
        const requestAsJson = JSON.stringify(request);
        this.socket.send(requestAsJson);
    },

    requestSkillActivation: function(characterId, skillId, targetTile) {
        const request = {
            'message': 'useSkill',
            'characterId': characterId,
            'skill_id': skillId,
            'target_tile': {'x': targetTile.x, 'y': targetTile.y}
        }
        const requestAsJson = JSON.stringify(request);
        this.socket.send(requestAsJson);
    },

    handleTileEffect: function(tileEffect) {
        const damage = tileEffect['damage'];
        const targetTile = tileEffect['tile'];
        const killed = tileEffect['killed'];
        const defender = this.tilemap.tileOccupiedBy(targetTile.x, targetTile.y);
        this.spawnBulletImpacts(targetTile.x, targetTile.y, 3);
        let damageText = damage > 0 ? damage.toString() : 'miss';
        this.spawnFloatingText(targetTile.x, targetTile.y, damageText, '#ff0000');
        defender.healthbar.changeHealth(-damage);
        if (killed) {
            defender.kill();
        }
    },
    handleRangedAttack: function(data) {
        const targetTiles = data['aoe'];
        for (let i = 0; i < targetTiles.length; i++) {
            const tileEffect = targetTiles[i];
            this.handleTileEffect(tileEffect);
        }

        const attacker = this.characterById(data['attacker']);
        attacker.hasAttacked(true);
        if (attacker === this.selectedCharacter)
        {
            this.selectNextActionableCharacter();
        }
    },
    handleUseSkill: function(effect) {
        const targetTiles = effect['aoe'];
        for (let i = 0; i < targetTiles.length; i++) {
            const tileEffect = targetTiles[i];
            this.handleTileEffect(tileEffect);
        }
        if (effect.hasOwnProperty('attacker')) {
            const attacker = this.characterById(effect['attacker']);
            if (effect.hasOwnProperty('focus_cost')) {
                const focusChange = effect['focus_cost'];
                attacker.focusbar.changeFocus(-focusChange);
            }
        }
    },
    handleStatusEffect: function(effect) {
        if (effect.hasOwnProperty('aoe')) {
            const targetTiles = effect['aoe'];
            for (let i = 0; i < targetTiles.length; i++) {
                const tileEffect = targetTiles[i];
                this.handleTileEffect(tileEffect);
            }
        }
        if (effect.hasOwnProperty('source')) {
            const source = this.characterById(effect['source']);
            if (effect.hasOwnProperty('stat_changes')) {
                const focusChange = effect['stat_changes'].focus || 0;
                if (focusChange !== 0) {
                    source.focusbar.changeFocus(focusChange);
                }
            }
        }
    },
    endBattle: function(summary_page) {
        window.location.href = summary_page;
    },
    handleServerResponse: async function(message) {
        if (message['error'])
        {
            alert(message['message'] + ': ' + message['error']);
            return;
        }
        switch (message['message'])
        {
            case 'battleEnd':
                this.endBattle(message['summary_page']);
                break;
            case 'rangedAttack':
                this.handleRangedAttack(message);
                break;
            case 'meleeAttack':
                this.handleRangedAttack(message);
                break;
            case 'useSkill':
                this.handleUseSkill(message['skill_effect']);
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
            case 'sprint':
                var charIndex = message['characterId'];
                var destination = message['destination'];
                this.characters[charIndex].setStat('stepsTakenThisTurn', message['stepsTakenThisTurn']);
                this.characters[charIndex].moveTo(destination.x, destination.y);

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

                const listOfEffects = message['effects'];
                for (var i = 0; i < listOfEffects.length; i++) {
                    const effect = listOfEffects[i];
                    this.handleStatusEffect(effect);
                }

                // reset the steps taken this turn stat for each character where the ownerWallet matches the turnOfPlayer
                for (var i = 0; i < this.characters.length; i++)
                {
                    this.characters[i].hideReachableTiles();
                    this.characters[i].hidePossibleTargets();
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
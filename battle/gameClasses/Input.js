"use strict";
var Input = {
    charTooltipDelay: 800,
    enemySelector: function(tile) {
        if (this.emptySelector(tile)) {
            return false;
        }
        const char = this.tilemap.tileOccupiedBy(tile.x, tile.y);
        const isOwner = char.clientIsOwner();
        return !isOwner;
    },
    allySelector: function(tile) {
        if (this.emptySelector(tile)) {
            return false;
        }
        const char = this.tilemap.tileOccupiedBy(tile.x, tile.y);
        const isOwner = char.clientIsOwner();
        return isOwner;
    },
    emptySelector: function(tile) {
        const isTileOccupied = this.tilemap.isTileOccupied(tile.x, tile.y);
        return !isTileOccupied;
    },
    attackMode: function() {
        var self = this;
        if (this.selectedCharacter) {
            this.selectedCharacter.hideReachableTiles();
            this.selectedCharacter.setRangedChanceToHit();
            this.isValidTarget = this.enemySelector;
            this.selectedCharacter.showPossibleTargets(function(tile){return self.enemySelector(tile)});
            this.currentAction = function(character, tile) {
                self.requestAttack(character.getCharId(), tile.x, tile.y);
            };

        }
    },
    moveMode: function() {
        var self = this;
        if (this.selectedCharacter) {
            this.currentAction = function(character, tile) {
                self.requestMovement(character.getCharId(), tile.x, tile.y);
            };
            this.isValidTarget = this.emptySelector;
        }
    },
    skillTargetMode: function(skillDefinition) {
        var self = this;
        var skillId = skillDefinition.identifier;
        if (this.selectedCharacter) {
            switch (skillDefinition.targetMode) {
                case 1: // enemies only
                    self.isValidTarget = this.enemySelector;
                    break;
                case 2: // allies only
                    self.isValidTarget = this.allySelector;
                    break;
                case 3: // empty tiles only
                    self.isValidTarget = this.emptySelector;
                    break;
            }
            this.selectedCharacter.hideReachableTiles();
            this.selectedCharacter.chanceToHit = function(otherChar){ return 100; };
            this.selectedCharacter.showPossibleTargets(function(tile){return self.isValidTarget(tile)});
            this.currentAction = function(character, tile) {
                self.requestSkillActivation(character.getCharId(), skillId, tile);
            };

        }
    },
    onMouseOnCharacter: function(char) {
        if (!char.highlight())
        {
            char.highlight(true);
            this.highlightedCharacter = char;
            // delay showing the tooltip
            var self = this;
            char._infoLabel._timeout = setTimeout(function() {
                // if the mouse is still over that character..
                const mouseTile = self.tilemap.mouseToTile();
                const charUnderMouse = self.tilemap.tileOccupiedBy(mouseTile.x, mouseTile.y);
                if (char === charUnderMouse)
                {
                    char._infoLabel.show();
                }
            }, this.charTooltipDelay);
        }
    },
	onMouseLeavingCharacter: function(char) {
        char.highlight(false);
        char._infoLabel.hide();
    },

    selectCharacter: function(char) {
        this.selectedCharacter = char;
        this.updateButtons();
        this.selectedCharacter.hidePossibleTargets();
        this.selectedCharacter.showReachableTiles();
        this.selectedCharacter._boardPiece.setSelected(true);
        this.moveMode();
    },

    deselectCharacter: function() {
        if (this.selectedCharacter) {
            this.debugText.value("Character Deselected");
            this.selectedCharacter.hideReachableTiles();
            this.selectedCharacter.hidePossibleTargets();
            this.selectedCharacter._boardPiece.setSelected(false);

            this.selectedCharacter = null;
        }
    },

    selectNextActionableCharacter: function() {
        let startIndex = 0;
        if (this.selectedCharacter)
        {
            startIndex = (this.getOwnCharIndex(this.selectedCharacter) + 1) % this.ownCharacters.length;
            this.deselectCharacter();
        }
        for (let i = 0; i < this.ownCharacters.length; i++)
        {
            let char = this.ownCharacters[(i + startIndex) % this.ownCharacters.length];
            if (char.canAct())
            {
                this.selectCharacter(char);
                return;
            }
        }
    },
    addListeners: function() {
        var self = this;
        ige.input.on('mouseMove', function (event, x, y, button) {
            const mouseTile = self.tilemap.mouseToTile();
        
            if (self.tilemap.isTileOccupied(mouseTile.x, mouseTile.y))
            {
                const char = self.tilemap.tileOccupiedBy(mouseTile.x, mouseTile.y);
                if (self.highlightedCharacter && self.highlightedCharacter !== char)
                {
                    self.onMouseLeavingCharacter(self.highlightedCharacter);
                }
                self.onMouseOnCharacter(char);
            }
            else
            {
                if (self.highlightedCharacter)
                {
                    self.onMouseLeavingCharacter(self.highlightedCharacter);
                }
            }
        });

        document.addEventListener("keyup", function onEvent(event) {
            if (event.key === "f") {
                // Toggle the stats
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            }
            // wait for "Escape"
            else if (event.key === "Escape") {
                // deselect the character
                self.selectCharacter(self.selectedCharacter);
                self.moveMode();
            }
            else if (event.key === " ") {
                self.selectNextActionableCharacter();
            }
        });

        ige.input.on('mouseUp', function (event, x, y, button) {
            const mouseTile = self.tilemap.mouseToTile();
            const char = self.tilemap.tileOccupiedBy(mouseTile.x, mouseTile.y);
            // debug tests..
            //self.spawnMessageText("123", '#f00');

            if (self.isValidTarget(mouseTile) && self.selectedCharacter) {
                self.currentAction(self.selectedCharacter, mouseTile);
            }
            else if (char && char.clientIsOwner() && char != self.selectedCharacter) {
                self.deselectCharacter();
                self.selectCharacter(char);
            }
        });
    },
};
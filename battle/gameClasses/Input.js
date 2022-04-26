"use strict";
var Input = {
    charTooltipDelay: 800,

    attackMode: function() {
        if (this.selectedCharacter) {
            this.selectedCharacter.hideReachableTiles();
            this.selectedCharacter.showPossibleTargets(this.characters);
            this.currentAction = Attack;
        }
    },
    onMouseOnCharacter: function(char) {
        if (!char.highlight())
        {
            char.highlight(true);
            this.highlightedCharacter = char;
            // delay showing the tooltip
            var self = this;
            char._tooltip._timeout = setTimeout(function() {
                // if the mouse is still over that character..
                const mouseTile = self.tilemap.mouseToTile();
                const charUnderMouse = self.tilemap.tileOccupiedBy(mouseTile.x, mouseTile.y);
                if (char === charUnderMouse)
                {
                    char._tooltip.show();
                }
            }, this.charTooltipDelay);
        }
    },
	onMouseLeavingCharacter: function(char) {
        char.highlight(false);
        char._tooltip.hide();
    },

    selectCharacter: function(char) {
        this.currentAction = Move;
        this.selectedCharacter = char;
        this.debugText.value("Character Selected: " + char.id());
        this.selectedCharacter.hidePossibleTargets();
        this.selectedCharacter.showReachableTiles();
    },

    deselectCharacter: function() {
        if (this.selectedCharacter) {
            this.debugText.value("Character Deselected");
            this.selectedCharacter.hideReachableTiles();
            this.selectedCharacter.hidePossibleTargets();
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
                self.currentAction = Move;
                self.selectCharacter(self.selectedCharacter);
            }
            else if (event.key === " ") {
                // deselect the character
                self.selectNextActionableCharacter();
            }
        });

        ige.input.on('mouseUp', function (event, x, y, button) {
            const mouseTile = self.tilemap.mouseToTile();

            if (self.tilemap.isTileOccupied(mouseTile.x, mouseTile.y))
            {
                const char = self.tilemap.tileOccupiedBy(mouseTile.x, mouseTile.y);
                if (self.currentAction == Move)
                {
                    if (self.selectedCharacter && char.clientIsOwner())
                    {
                        self.deselectCharacter();
                        self.selectCharacter(char);
                    }
                    else if (!self.selectedCharacter && char.clientIsOwner())
                    {
                        self.selectCharacter(char);
                    }
                }
                else if (self.currentAction == Attack && self.selectedCharacter)
                {
                    self.requestAttack(self.selectedCharacter.getCharId(), mouseTile.x, mouseTile.y);
                }
            }
            else
            {
                if (self.currentAction == Move && self.selectedCharacter)
                {
                    self.requestMovement(self.selectedCharacter.getCharId(), mouseTile.x, mouseTile.y);
                }
            }
        });
    },
};
"use strict";

const TileAnimationType = {
    Bullets: 0,
    Slash: 1,
    DeathAlly: 2,
    DeathEnemy: 3,
    Poison: 4,
};

var GameWorld = {
    spawnMessageText: function (text, color) {
        const float = new MessageText(text)
            .translateTo(100, 100, 0);
    },
    spawnFloatingText: function (tileX, tileY, text, color) {
        const float = new FloatingText(text)
            .mount(this.tilemap)
            .translateToTile(tileX, tileY);
    },
    spawnBulletHit: function (tileX, tileY, count) {
        var self = this;
        for (var i = 0; i < count; i++)
        {
            const randRange = 40;
            const randX = Math.floor(Math.random() * randRange) - (randRange / 2);
            const randY = Math.floor(Math.random() * randRange) - (randRange / 2);
            const randomTimer = Math.floor(Math.random() * 500);
            setTimeout(() => {
                self.spawnTileAnimation(tileX, tileY, TileAnimationType.Bullets, randX, randY);
            }, randomTimer);
        }
    },
    spawnMeleeSlash: function (tileX, tileY) {
        this.spawnTileAnimation(tileX, tileY, TileAnimationType.Slash, 0, 0);
    },
    spawnDeath: function (tileX, tileY) {
        this.spawnTileAnimation(tileX, tileY, TileAnimationType.DeathAlly, 0, 0);
    },
    spawnTileAnimation: function(tileX, tileY, effectIndex, xOffset, yOffset)
    {
        const anim = this.gameTexture.effects[effectIndex];
        const effect = new TileAnimation(anim.sheet, anim.frames)
                .layer(6)
                .isometric(true)
                .mount(this.tilemap)
                .translateToTile(tileX, tileY, 0)
                .translateBy(xOffset, yOffset, 0);
    },
    getOwnCharIndex: function(ownChar) {
        for (let i = 0; i < this.ownCharacters.length; i++)
        {
            let char = this.ownCharacters[i];
            if (char === ownChar)
            {
                return i;
            }
        }
        return -1;
    },
    characterById: function(charId) {
        for (var i = 0; i < this.characters.length; i++) {
            if (this.characters[i].getCharId() === charId) {
                return this.characters[i];
            }
        }
        return null;
    },

    loadCharacters: function(charData) {
        // call destroy() on all existing characters
        for (var i = 0; i < this.characters.length; i++) {
            this.characters[i].destroy();
        }
        for (var i = 0; i < charData.length; i++) {
            this.createCharacter(charData[i]);
        }
    },

    createCharacter: function(charData) {
        const pos = charData['pos'];
        const state = charData['state'];
        const troopTokenId = charData['tokenId'];
        const charId = charData['charId'];
        // check if we are the owner of the character
        const isOwner = charData['ownerWallet'] == userAddress;

        const char = new Character()
            .layer(2)
            .id('char_' + charId.toString())
            .setTokenId(troopTokenId)
            .clientIsOwner(isOwner)
            .mount(this.tilemap)
            .translateToTile(pos.x, pos.y, 0)
            .setCharId(charId)
            .setCharData(charData)
            .addComponent(HealthBarComponent)
            .drawBounds(false)
            .drawBoundsData(false)
            .setOnDeathCallback(function(char) {
                const pos = char.tilePosition();
                char.hide();
                this.spawnDeath(pos.x, pos.y);
            }.bind(this))

        this.tilemap.occupyTile(pos.x, pos.y, 1, 1, char);
        if (isOwner) {
            const boardPiece = new SelectableBoardPiece()
                .layer(2)
                .mount(char)
                .clientIsOwner(isOwner)
                .drawBounds(false)
                .drawBoundsData(false);
            char.setBoardPiece(boardPiece);
        }
        else {
            const boardPiece = new BoardPiece()
                .layer(2)
                .mount(char)
                .clientIsOwner(isOwner)
                .drawBounds(false)
                .drawBoundsData(false);
        }
        const infoLabel = new Label()
            .setTextFunction(function() {
                return char.getToolTipText();
            })
            .mount(char);
        char.setInfoLabel(infoLabel);

        const headLabel = new Label()
            .setFontSize(30)
            .setStrokeColor('#000')
            .mount(char);
        char.setHeadLabel(headLabel);

        if (state === 0)
            char.kill();
        if (isOwner){
            this.ownCharacters.push(char);
        }
        this.characters.push(char);
        var self = this;
        char.addComponent(IgePathComponent).path
            .finder(this.pathFinder)
            .tileMap(this.tilemap)
            .tileChecker(function (tileData, tileX, tileY, node, prevNodeX, prevNodeY, dynamic) {
                const bounds = self.tilemap._gridSize;
                // check if the tile is in bounds
                if (tileX < 0 || tileX >= bounds.x || tileY < 0 || tileY >= bounds.y) {
                    return false;
                }
                return tileData === null;
            })
            .lookAheadSteps(3)
            .dynamic(true)
            .allowSquare(true) // Allow north, south, east and west movement
            .allowDiagonal(false) // Allow north-east, north-west, south-east, south-west movement
            .drawPath(true) // Enable debug drawing the paths
            .drawPathGlow(true) // Enable path glowing (eye candy)
            .drawPathText(false); // Enable path text output

        char.path.on('pathComplete', function(){
            char.showReachableTiles();
            const pos = char.tilePosition();
            self.tilemap.occupyTile(pos.x, pos.y, 1, 1, this._entity);
        });
    },
    updateButtons: function() {
        if (!this.selectedCharacter) return;

        const char = this.selectedCharacter;
        //const noButtonVisible = char.isDead();

        const attackButtonVisible = !char.hasAttacked();
        //const moveButtonVisible = char.canMove();
        if (attackButtonVisible) {
            this.attackButton.show();
        }
        else {
            this.attackButton.hide();
        }

        const skills = char.getSkills();
        for (let i = 0; i < 3; i++) {
            if (i < skills.length) {
                const skillDef = skills[i];
                const name = skillDef.name;
                const passive = skillDef.type === 1;
                this.skillButtons[i].value(name);
                this.skillButtons[i].show();
                if (passive) {
                    this.skillButtons[i]._mouseEventsActive = false;
                }
                else {
                    this.skillButtons[i]._mouseEventsActive = true;
                }
            }
            else {
                this.skillButtons[i].hide();
            }
        }
    },
	createWorld: function(mapData, charData) {

	    let overFunc = function () {
            this.highlight(true);
            ige.input.stopPropagation();
        };

        let outFunc = function () {
            this.highlight(false);
            ige.input.stopPropagation();
        };

        const wallData = mapData['wall_data'];
        const mapSize = mapData['size'];
        const textureMapData = mapData['texture_data'];
        const tileWidth = 60;
        const tileHeight = 60;

        this.gridSize = mapSize;

        // Create the scene
        this.mainScene = new IgeScene2d()
            .id('mainScene')
            .autoSize(true)
            .drawBounds(false)
            .drawBoundsData(false);

        this.objectScene = new IgeScene2d()
            .id('objectScene')
            .depth(0)
            .autoSize(true)
            .drawBounds(false)
            .drawBoundsData(false)
            .depthSortMode(2)
            .mount(this.mainScene);

        this.uiScene = new IgeScene2d()
            .id('uiScene')
            .depth(1)
            .autoSize(true)
            .drawBounds(false)
            .drawBoundsData(false)
            .ignoreCamera(true) // We don't want the UI scene to be affected by the viewport's camera
            .mount(this.mainScene);

        // Create the main viewport
        this.vp1 = new IgeViewport()
            .id('vp1')
            .autoSize(true)
            .scene(this.mainScene)
            .drawMouse(true)
            .drawBounds(false)
            .drawBoundsData(false)
            .mount(ige);

        this.textureMap1 = new IgeTextureMap()
            .depth(-2)
//				.translateTo(200, 0, 0)
            .tileWidth(tileWidth)
            .tileHeight(tileHeight)
            .gridSize(this.gridSize.width, this.gridSize.height)
            .drawGrid(true)
            //.drawMouse(true)
            .drawBounds(false)
            .isometricMounts(true)
            .autoSection(3)
            .mount(this.objectScene);

        // Create an isometric tile map
        this.tilemap = new IgeTileMap2d()
            .id('tilemap')
            .isometricMounts(true)
            .tileWidth(tileWidth)
            .tileHeight(tileHeight)
            .gridSize(this.gridSize.width, this.gridSize.height)
//				.drawGrid(5)
            .loadMap(wallData)
            .highlightOccupied(false) // Draws a red tile wherever a tile is "occupied"
            .highlightTiles(true)
//				.backgroundPattern(this.gameTexture.grassTile, 'repeat', true, true)
            .drawMouse(true)
            .drawBounds(false)
            .drawBoundsData(false)
            .mount(this.objectScene);

        for (let i = 0; i < this.gameTexture.tiles.length; i++)
        {
            this.textureMap1.addTexture(this.gameTexture.tiles[i]);
        }

        for (let x = 0; x < this.gridSize.width; x++)
        {
            for (let y = 0; y < this.gridSize.height; y++)
            {
                var textureIndex = textureMapData[y][x];
                this.textureMap1.paintTile(x, y, textureIndex, 1);
            }
        }

        this.loadCharacters(charData);

        var self = this;

        this.endTurnButton = new IgeUiLabel()
            .id('endTurnButton')
            .depth(1)
            .paddingLeft(0)
            .bottom(3)
            .right(20)
            .width(60)
            .height(60)
            .texture(this.endTurnButtonTexture)
            .allowHover(true)
            .mouseOver(overFunc)
            .mouseOut(outFunc)
            .mouseMove(function () { ige.input.stopPropagation(); })
            .mouseUp(function () { self.requestEndTurn(); ige.input.stopPropagation(); })
            .mount(this.uiScene);

        this.attackButton = new IgeUiLabel()
            .id('attackButton')
            .depth(1)
            .paddingLeft(0)
            .bottom(3)
            .left(70)
            .width(60)
            .height(60)
            .texture(this.attackButonTexture)
            .allowHover(true)
            .mouseOver(overFunc)
            .mouseOut(outFunc)
            .mouseMove(function () { ige.input.stopPropagation(); })
            .mouseUp(function () {
                self.attackMode();
                ige.input.stopPropagation();
            })
            .mount(this.uiScene);

        this.sprintButton = new IgeUiLabel()
            .id('sprintButton')
            .depth(1)
            .paddingLeft(0)
            .bottom(3)
            .left(140)
            .width(60)
            .height(60)
            .texture(this.sprintButtonTexture)
            .allowHover(true)
            .mouseOver(overFunc)
            .mouseOut(outFunc)
            .mouseMove(function () { ige.input.stopPropagation(); })
            .mouseUp(function () {
                self.sprintMode();
                ige.input.stopPropagation();
            })
            .mount(this.uiScene);

        this.skillButtons = [];
        this.skillButtons.push(new IgeUiLabel()
            .id('skillOneButton')
            .depth(1)
            .paddingLeft(0)
            .bottom(3)
            .left(210)
            .width(60)
            .height(60)
            .texture(this.buttonTexture)
            .value('Skill 1')
            .color('white')
            .font('12px Verdana')
            .allowHover(true)
            .mouseOver(overFunc)
            .mouseOut(outFunc)
            .mouseMove(function () { ige.input.stopPropagation(); })
            .mouseUp(function () {
                self.debugText.value("Skill 1 Activated!");
                // depending on the targeting mode, we need to change the UI state first
                const skillDef = self.selectedCharacter.getSkillDefinition(0);
                self.skillTargetMode(skillDef);
                ige.input.stopPropagation();
            })
            .mount(this.uiScene));

        this.skillButtons.push(new IgeUiLabel()
            .id('skillTwoButton')
            .depth(1)
            .paddingLeft(0)
            .bottom(3)
            .left(280)
            .width(60)
            .height(60)
            .texture(this.buttonTexture)
            .value('Skill 2')
            .color('white')
            .font('12px Verdana')
            .allowHover(true)
            .mouseOver(overFunc)
            .mouseOut(outFunc)
            .mouseMove(function () { ige.input.stopPropagation(); })
            .mouseUp(function () {
                self.debugText.value("Skill 2 Activated!");
                const skillDef = self.selectedCharacter.getSkillDefinition(1);
                self.skillTargetMode(skillDef);
                ige.input.stopPropagation();
            })
            .mount(this.uiScene));

        this.skillButtons.push(new IgeUiLabel()
            .id('skillThreeButton')
            .depth(1)
            .paddingLeft(0)
            .bottom(3)
            .left(350)
            .width(60)
            .height(60)
            .texture(this.buttonTexture)
            .value('Skill 3')
            .color('white')
            .font('12px Verdana')
            .allowHover(true)
            .mouseOver(overFunc)
            .mouseOut(outFunc)
            .mouseMove(function () { ige.input.stopPropagation(); })
            .mouseUp(function () {
                self.debugText.value("Skill 3 Activated!");
                const skillDef = self.selectedCharacter.getSkillDefinition(2);
                self.skillTargetMode(skillDef);
                ige.input.stopPropagation();
            })
            .mount(this.uiScene));

        for (let i = 0; i < this.skillButtons.length; i++) {
            this.skillButtons[i]._fontEntity.textAlignX(1).textAlignY(1).left(5).top(1);
            this.skillButtons[i].hide();
        }


        ige.ui.style('#debugText', {
            'top': 0,
            'left': 0,
            'backgroundColor': '#ccc'
        });


        this.debugText = new IgeUiLabel()
            .cache(true)
            .id('debugText')
            .depth(1)
            .width(280)
            .height(50)
            .value('Verdana 10px and this is not a native font :)')
            .top(1)
            .drawBounds(false)
            .drawBoundsData(false)
            .mount(this.uiScene);
	}
};
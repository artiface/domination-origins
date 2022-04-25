var igeClientConfig = {
	include: [
		/* Your custom game JS scripts */
		'./gameClasses/GameWorld.js',
		'./gameClasses/Input.js',
		'./gameClasses/Network.js',
		'./gameClasses/Label.js',
		'./gameClasses/BulletImpact.js',
		'./gameClasses/HealthBarComponent.js',
		'./gameClasses/FocusBar.js',
		'./gameClasses/CharacterIso.js',
		'./gameClasses/IsoCharacterPiece.js',
		'./gameClasses/PlayerComponent.js',
		/* Standard game scripts */
		'./client.js',
		'./index.js'
	]
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = igeClientConfig; }
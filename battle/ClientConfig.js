var igeClientConfig = {
	include: [
		/* Your custom game JS scripts */
		'./gameClasses/FloatingText.js',
		'./gameClasses/MessageText.js',
		'./gameClasses/GameWorld.js',
		'./gameClasses/Input.js',
		'./gameClasses/Network.js',
		'./gameClasses/Label.js',
		'./gameClasses/TileAnimation.js',
		'./gameClasses/Highlighting.js',
		'./gameClasses/HealthBarComponent.js',
		'./gameClasses/FocusBarComponent.js',
		'./gameClasses/Character.js',
		'./gameClasses/BoardPiece.js',
		'./gameClasses/SelectableBoardPiece.js',
		/* Standard game scripts */
		'./client.js',
		'./index.js'
	]
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = igeClientConfig; }
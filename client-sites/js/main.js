import {getTokenCount, loadUserNFTs, loadNFT, signer} from "./chainload.js";
const userAddress = "0x049E97650A7D2Cc5EC0e17d414323d3b3255d33b"; //await signer.getAddress();

const walletLabel = document.getElementById("user_wallet");
walletLabel.innerHTML = userAddress;

const itemsPerPage = 10;

const numberOfTroops = await getTokenCount(userAddress, 'troops');
const numberOfWeapons = await getTokenCount(userAddress, 'weapons');

const tokens = {
	'troops':{
		'localCacheDir': '/TroopNFTs/',
		'pages': Math.floor(numberOfTroops / itemsPerPage),
		'lastPageCount': numberOfTroops % itemsPerPage,
		'cache': JSON.parse(window.localStorage.getItem('troops_cache') || "[]"),
		'currentPage': 0,
		'deploymentSet': new Set(),
		'listDisplay': function(tokenData) {
			var name = tokenData.name;
        	var level = tokenData.traits.Level;
        	return name + ' - Level: ' + level;
        },
        'detailDisplay': function(tokenData) {
        	var showData = {
				'Level': tokenData.traits.Level,
				'Strength': tokenData.traits.Strength,
				'Dexterity': tokenData.traits.Dexterity,
				'Intelligence': tokenData.traits.Intelligence,
				'Agility': tokenData.traits.Agility,
				'Attributes Increase': tokenData.traits['Attributes Increase'],
				'Stamina Increase': tokenData.traits['Stamina Increase'],
				'Power Increase': tokenData.traits['Power Increase'],
			};
			return showData;
        }
	},
	'weapons':{
		'localCacheDir': '/WeaponsNFTs/',
		'pages': Math.floor(numberOfWeapons / itemsPerPage),
		'lastPageCount': numberOfWeapons % itemsPerPage,
		'cache': JSON.parse(window.localStorage.getItem('weapons_cache') || "[]"),
		'currentPage': 0,
		'deploymentSet': new Set(),
		'listDisplay': function(tokenData) {
			var name = tokenData.name;
        	return name;
        },
        'detailDisplay': function(tokenData) {
        	var showData = {
				'data': JSON.stringify(tokenData),
			};
			return showData;
        }
	},
};

var currentTroopSelection = 0;
var currentTokenType = 'troops';
var troopSelection = {};

async function loadLocalNFT(type, tokenId) {
	const nftBaseUrl = 'http://localhost:8000' + tokens[type].localCacheDir;
	var data = await fetch(nftBaseUrl + tokenId + '.json')
	  	.then(response => {
		    if (!response.ok) {
		      	throw new Error(`Request failed with status ${reponse.status}`);
		    }
	    	return response.json();
  		});

  	var traits = {};
	data.attributes.forEach(pair => {
		traits[pair.trait_type] = pair.value;
	});
	
	const tokenData = {
		'traits': traits,
		'image': tokens[type].localCacheDir + tokenId + '.png',
		'name': data.name,
		'dna': data.dna,
		'edition': data.edition
	};  	
	return tokenData;
};

async function getTokenData(type, tokenId) {
	const cacheKey = type + '_' + tokenId;
	var tokenData = JSON.parse(window.localStorage.getItem(cacheKey) || "false");
	if (!tokenData)
	{
		tokenData = await loadNFT(type, tokenId);//await loadLocalNFT(type, tokenId);
		window.localStorage.setItem(cacheKey, JSON.stringify(tokenData));
	}
	return tokenData;
};

async function addTokenDataToList(type) {
	var tokenSelection = document.getElementById("token_selection");
	var children = tokenSelection.children;
    for(var i=0; i<children.length; i++){
        let option = children[i];
        const tokenId = option.value;
        getTokenData(type, tokenId).then(tokenData => {
        	option.innerHTML = tokens[type].listDisplay(tokenData);
        });
    }
};

async function loadTokenPage(type, page) {
	const startIndex = page * itemsPerPage;
	var count = itemsPerPage;
	if (page === tokens[type].pages - 1) count = tokens[type].lastPageCount;
	if (tokens[type].cache.length < page + 1) tokens[type].cache.push([]);

	var tokenIds = await loadUserNFTs(userAddress, type, startIndex, count);
	tokenIds.forEach(element => {
		tokens[type].cache[page].push(element);
	});
	window.localStorage.setItem(type + '_cache', JSON.stringify(tokens[type].cache));	
};

function tokenSelected(type) {
	var tokenSelect = document.getElementById("token_selection");
	var tokenId = tokenSelect.value;

	var nftDataField = document.getElementById("nft_data");
	var nftImageField = document.getElementById("nft_image");
	getTokenData(type, tokenId).then(tokenData => {
		var showData = tokens[type].detailDisplay(tokenData);		
		var simpleList = '<ul>';
		for (const [key, value] of Object.entries(showData)) {
		  simpleList += '<li>' + key + ': ' + value + '</li>';
		}
		simpleList += '</ul>';

		nftDataField.innerHTML = simpleList;
		var nftImageUrl = tokens[type].localCacheDir + tokenId + '.png';
		nftImageField.innerHTML = '<img class="portrait" src="'+nftImageUrl+'"/>'
	});	
};

async function showTokenList(type, page) {
	if (tokens[type].cache.length === 0 || !tokens[type].cache[page])
	{
		await loadTokenPage(type, page);
	}
	var listElement = document.getElementById("listview");

	var itemList = '<select id="token_selection" name="token_selection" size="10">';
	tokens[type].cache[page].forEach(element => {
		itemList += '<option value="'+element+'">' + element + "</option>";
	});
	itemList += "<select>";

	listElement.innerHTML = itemList;

	var pageInfo = page + ' of ' + tokens[type].pages;
	document.getElementById("paging_info").innerHTML = pageInfo;

	document.getElementById("token_selection").addEventListener('change', function(){
		let tokenType = type;
		tokenSelected(tokenType);
	});

	addTokenDataToList(type);
};

async function updateTroopDisplay() {
	for (var i = 1; i <= 5; i++)
	{
		if (troopSelection[i])
		{
			const charTokenId = troopSelection[i].troops;
			const charData = await getTokenData('troops', charTokenId);
			document.getElementById("image_" + i).src = charData['image'];
			document.getElementById("name_" + i).innerHTML = charTokenId;
		}
	}	
};

document.getElementById("pick_token").onclick = function () {
	var tokenSelect = document.getElementById("token_selection");
	var tokenId = tokenSelect.value;	
	
	if (!tokenId) return;

	if (tokens[currentTokenType].deploymentSet.has(tokenId)) return;

	if (!troopSelection[currentTroopSelection])
	{
		troopSelection[currentTroopSelection] = {};	
	}

	if (troopSelection[currentTroopSelection][currentTokenType]) 
		tokens[currentTokenType].deploymentSet.delete(troopSelection[currentTroopSelection][currentTokenType])

	troopSelection[currentTroopSelection][currentTokenType] = tokenId;

	tokens[currentTokenType].deploymentSet.add(tokenId);	
	updateTroopDisplay();
};

document.getElementById("paging_back").onclick = function () {	
	if (tokens[currentTokenType].currentPage > 0) tokens[currentTokenType].currentPage--;	
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("paging_forward").onclick = function () {
	if (tokens[currentTokenType].currentPage < numberOfTroopPages - 1) tokens[currentTokenType].currentPage++;
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_troop_1").onclick = function () {
	currentTroopSelection = 1;
	currentTokenType = 'troops';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_troop_2").onclick = function () {
	currentTroopSelection = 2;
	currentTokenType = 'troops';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_troop_3").onclick = function () {
	currentTroopSelection = 3;
	currentTokenType = 'troops';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_troop_4").onclick = function () {
	currentTroopSelection = 4;
	currentTokenType = 'troops';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_troop_5").onclick = function () {
	currentTroopSelection = 5;
	currentTokenType = 'troops';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_weapon_1").onclick = function () {
	currentTroopSelection = 1;
	currentTokenType = 'weapons';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_weapon_2").onclick = function () {
	currentTroopSelection = 2;
	currentTokenType = 'weapons';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_weapon_3").onclick = function () {
	currentTroopSelection = 3;
	currentTokenType = 'weapons';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_weapon_4").onclick = function () {
	currentTroopSelection = 4;
	currentTokenType = 'weapons';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};

document.getElementById("select_weapon_5").onclick = function () {
	currentTroopSelection = 5;
	currentTokenType = 'weapons';
	showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
};
/*
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const tokenType = urlParams.get('m');
const tokenId = urlParams.get('t');
*/
/*
var namePromise = loadNFT(tokenType, tokenId);
namePromise.then((info) => {
	var collectionName = info.collection_name;
	var uri = info.uri;
	var tokenId = info.id;
	var metaData = info['meta_data'];
	var name = metaData.name;
	var imageIpfs = metaData.image;
	var httpImage = imageIpfs.replace("ipfs://", "https://ipfs.io/ipfs/");
	var imgSrc = '<img class="portrait" src="'+httpImage+'"/><br/>';
	var attributes = metaData.attributes;
	var attributeList = "<ul>";
	attributes.forEach(element => {
		var key = element['trait_type'] || element['display_type'];
		var value = element.value;
		attributeList += "<li>"+ key + ": " + value +"</li>";
	});
	attributeList += "</ul>";
	document.getElementById("nft_data").innerHTML = imgSrc + name +" (#"+tokenId+")"+ " from " + collectionName + ": " + uri + attributeList;
});
*/

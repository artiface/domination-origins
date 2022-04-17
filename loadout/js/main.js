import { ethers } from "./ethers-5.1.esm.min.js";
import {getTokenCount, loadUserNFTs, loadNFT, signer, provider} from "./chainload.js";

const network = await provider.getNetwork();
const chainId = network.chainId;
const battleUrl = "http://localhost:9000/battle/"

if (chainId === 137)
{
    //window.localStorage.clear();

    var itemsPerPage = 10;
    var serverBaseUrl = 'http://localhost:9000/';
    var userAddress = await signer.getAddress();
    var numberOfTroops = await getTokenCount(userAddress, 'troops');
    var numberOfWeapons = await getTokenCount(userAddress, 'weapons');
    var findMatchPath = '/src/index.html';
    var tokens = {
        'troops':{
            'localCacheDir': '/TroopNFTs/',
            'pages': Math.ceil(numberOfTroops / itemsPerPage),
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
            'pages': Math.ceil(numberOfWeapons / itemsPerPage),
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
    const matchData = JSON.parse(window.localStorage.getItem('match_data'));
    // fetch the loadout data
    if (matchData)
    {
        troopSelection = matchData['troop_selection'];
        updateTroopDisplay(troopSelection);
    }

	startUp();
 
}
else
{
	alert("Please connect to the Polygon MainNet");
}



async function startUp() {
    
    const walletLabel = document.getElementById("user_wallet");
    walletLabel.innerHTML = userAddress;

    document.getElementById("pick_token").onclick = function () {
        var tokenSelect = document.getElementById("token_selection");

        if (!tokenSelect || !tokenSelect.value) return;

        var tokenId = tokenSelect.value;

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


    document.getElementById("find_match_button").onclick = async function () {
        if (!troopSelection.hasOwnProperty('1')) return;
        const matchData = {
            'troop_selection': troopSelection,	// eg. {'1': {'troops': 111, 'weapons': 134}, '2': {'troops': 114, 'weapons': 1134}}
            'user_name': 'TODO',
            'user_wallet': userAddress,
        };
        window.localStorage.setItem('match_data', JSON.stringify(matchData));
        window.open(battleUrl, "_self");
    };

    document.getElementById("paging_back").onclick = function () {
        if (tokens[currentTokenType].currentPage > 0) tokens[currentTokenType].currentPage--;
        showTokenList(currentTokenType, tokens[currentTokenType].currentPage);
    };

    document.getElementById("paging_forward").onclick = function () {
        if (tokens[currentTokenType].currentPage < tokens[currentTokenType].pages - 1) tokens[currentTokenType].currentPage++;
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
}

async function loadLocalNFT(type, tokenId) {
	const nftBaseUrl = serverBaseUrl + tokens[type].localCacheDir;
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
		tokenData = await loadLocalNFT(type, tokenId);//await loadLocalNFT(type, tokenId);
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

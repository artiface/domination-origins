"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import { getTokenCount, loadUserNFTs, loadNFT, connect, signer, provider} from "./chainload.js";

const battleUrl = "/battle/";

//window.localStorage.clear();

var itemsPerPage = 10;
try {
    var userAddress = await signer.getAddress();
    var numberOfTroops = await getTokenCount(userAddress, 'troops');
    var numberOfWeapons = await getTokenCount(userAddress, 'weapons');
}
catch (e) {
    alert("Error: " + e);
}
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
        'localCacheDir': '/WeaponNFTs/',
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
preloadLists();
startUp();


function createTroopListItem(index) {
    const html = `<div class="nft-list">
                    <div class="nft-list-img">
                        <img class="small_portrait" src="/assets/ui/browse.png" />
                    </div>
                    <div class="nft-list-name">
                        &lt;none&gt;
                    </div>
                    <div class="nft-list-label">
                        <p>Level</p>
                        <p>Health</p>
                    </div>
                    <div class="nft-list-progress-bar">
                        <progress class="lebel-progress-bar" value="950" max="1000">70 %</progress>
                        <progress class="health-progress-bar" value="950" max="1000">70 %</progress>
                    </div>
                    <div class="nft-list-propertise">
                        <p>Skills:</p>
                        <p>DragonHide</p>
                    </div>
                </div>`;
    return html;
};

async function preloadLists() {
    const tokenList = document.getElementById('token-list');

    const observer = new IntersectionObserver(onIntersection, {
      root: tokenList,   // default is the viewport (=null)
      threshold: .5 // percentage of taregt's visible area. Triggers "onIntersection"
    })

    // callback is called on intersection change
    function onIntersection(entries, opts) {
      entries.forEach(entry =>
        entry.target.classList.toggle('visible', entry.isIntersecting)
      )
    }

    const test = numberOfTroops.add(100);
    for (let i = 0; test.gt(i); i++) {
        tokenList.innerHTML += createTroopListItem(i);
    }
    observer.observe(document.querySelector('.nft-list'));
};

async function startUp() {
    
    const walletLabel = document.getElementById("user_wallet");
    walletLabel.innerHTML = userAddress;

    const modal = document.getElementById("myModal");

    // Get the <span> element that closes the modal
    const span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    for (let i = 0; i < 5; i++) {
        const col = document.getElementById("troop_container").children[i];
        const image = col.querySelector('img.small_portrait');
        image.onclick = function() {
            currentTroopSelection = col + 1;
            currentTokenType = 'troops';
            modal.style.display = "block";
        }
    }

    /*
    document.getElementById("pick_token").onclick = function () {
        var tokenSelect = document.getElementById("token_selection");

        if (!tokenSelect || !tokenSelect.value) return;

        var tokenId = tokenSelect.value;

        if (tokens[currentTokenType].deploymentSet.has(tokenId)) return;

        if (!troopSelection[currentTroopSelection])
        {
            troopSelection[currentTroopSelection] = {};
        }

        // replace
        if (troopSelection[currentTroopSelection][currentTokenType])
            tokens[currentTokenType].deploymentSet.delete(troopSelection[currentTroopSelection][currentTokenType])

        troopSelection[currentTroopSelection][currentTokenType] = tokenId;

        tokens[currentTokenType].deploymentSet.add(tokenId);
        updateTroopDisplay();
    };
    */
    /*
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
    */
}

async function loadLocalNFT(type, tokenId) {
	const nftBaseUrl = tokens[type].localCacheDir;
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
	if (tokens[type].cache.length === 0 || !tokens[type].cache[page] || tokens[type].cache[page].length === 0) {
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
		    const weaponTokenId = troopSelection[i].weapons;
			const charTokenId = troopSelection[i].troops;
			if (charTokenId)
			{
                const charData = await getTokenData('troops', charTokenId);
                const col = document.getElementById("troop_container").children[i-1];
                const image = col.querySelector('img.small_portrait');
                image.src = charData.image;
                const name = col.querySelector('div.nft-name');
                name.innerHTML = charTokenId;
			}
			if (weaponTokenId)
			{
			    /*
			    const tokenData = await getTokenData('weapons', charTokenId);
                document.getElementById("weapon_image_" + i).src = tokenData['image'];
                */
			}
		}
	}	
};

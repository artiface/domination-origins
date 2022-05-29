## The plan

All graphics need have a resolution that is divisible by the 2.

We will use 60x60 Tiles, meaning the isometric tiles are 120x60 pixels.
For Retina Displays, we need double that: 240x120 pixels.

So normal ground tiles will be needed in the following sizes 120x60 and 240x120.

## Bugs / Remarks

## Known minor issues
 - The mouse-over-effect is sometimes on the wrong depth layer
 - During my turn the reachable tiles of enemies are visible

## Needed for Alpha Battles
 - Weapon Slots - ITEM NFTs currently CANNOT BE ITERATED OVER
 - Battle Points System
 - Animations
    - Death
    - Melee & Ranged Attack
    - Mighty Melee Attack
    - Poison
    - Guard?
 - Skills
   - Claws of the pack
    - Additional damage for each nearby friendly unit
   - Protection of the pack
    - Additional protection for each nearby friendly unit
   - Dragon Strike
    - Massive melee attack
   - Dragon Hide
    - Poison resistance
   - Poison Cloud
    - Poison all nearby enemies a little bit
   - Snake Bite
    - Poison one nearby enemy a lot

 - Hit Chance & Damage Calculations
   - Base Chance to Hit:
     - Melee: Intelligence * Level [1, 80]
     - Ranged: 20 + (2 * attacker.dexterity * (attacker.level + 2)) - 5 * distance
   - Base Damage:
     - Melee: Weapon Damage + Strength [6, 80]
     - Ranged: Weapon Damage [5, 70]
 - Battle Fee

Attribute Range: [1, 10]
Weapon Damage Range: [5, 70]
Crit Chance Range: [5, 80]
Accuracy Range: [50, 100]
Level Range: [1, 8]

## Game Modes
 - Team Deathmatch
 - Kill the Leader


Ok, we should decide wether the scale of the game is fine as it is now. Because changing this after the fact could be some big trouble and would also mean re-creating most images.

I am thinking of going with 60x60px tiles on a non-retina display. The isometric tiles are then 120x60 pixels in size and for retina displays, we need double that so 240x120.




## Customer Journey

### 1 Buy Page

User can choose between two "card packs", either buying a "start kit" or a "booster pack".

The prices for these items can be changed on our erc1155 contract:

function setPrices(uint256 newstarter, uint256 newbooster) public onlyRole(DEFAULT_ADMIN_ROLE)

Choosing to buy a "card pack" will create on of these transactions:

 - function buyStarter(uint256 id, uint8 amount) public payable
 - function buyBooster(uint256 id, uint8 amount) public payable

That transaction includes payment for the "card pack" in MATIC.

The contract will distribute a part of the incoming money to the "gas_receiver" wallet.

The share and the destination wallet can be changed on the contract using

function setGasReceiver(address new_gas_receiver, uint8 part_of_thousand) public onlyRole(DEFAULT_ADMIN_ROLE)

The buy transaction will then mint a new "card pack" NFT (one of "Starter Kit" or "Booster Pack")
and give it to the sender of the transaction.

### 2 Open Page

A page to open either of the "card packs".

The open button will create a simple "safeTransferFrom" transaction, sending the "card pack" NFTs back to our contract.

We need to make sure the transaction id is prominently displayed to the user and remind him to take note of it for error cases.

The contract will further transfer the incoming "card pack" NFTs to the wallet defined under "token_receiver" and emit an event.

The "token_receiver" can be changed on the contract using

function setTokenReceiver(address new_token_receiver) public onlyRole(DEFAULT_ADMIN_ROLE)

### 3 Loadout Page

The user is now in possession of troops and items and can go to battle.

He opens the loadout screen and can select up to 5 troops with corresponding weapons.

The loadout selection is saved on the client's browser in local storage.

### 4 Battle Page

This is the matchmaking and battle page.

It will read the loadout selection from local storage and ask the user to sign a message confirming his identity.

A websocket connection is established from the clients browser to our python backend for the game.

The websocket server can be found in /doserve/server.py

After the battle has finished, the outcome will be saved to our database and a "battle summary" page becomes available
via an unique "battle id".

## Dynamic Websites infrastructure

Simple dynamic websites ("token details", "battle summary", etc.) are served by python based HTTP server.

It can be found under /doserver/servepages.py

## Open "card pack" infrastructure

The python script /Tools/minting/mintOnDemand.py should always run on our server.

It needs the private key of the "gas_receiver" for startup, so it can sign the minting transactions and pay for them.

The script will listen for "card packs" that are sent back to our contract and will trigger the "onOpenStarterKit()" method
in that class. We now choose some tokenIds at random, make sure the metadata exists, if not create it (at least for troops),
and finally create the minting transactions to the openers wallet.

## Minting infrastructure

All metadata for all tokens is stored in /metadata/{tokenId}.json
All opensea metadata for all tokens is stored in /opensea/{tokenId}.json
All the images for all tokens are stored in /images/{tokenId}.png

Troops:
 - Metadata and images are generated randomly by mintOnDemand.py using Hashlips

Items / "Card Packs", etc:
 - Metadata and images are created by us

Troops & Items Minting:
 - Needs files in /metadata and /images folders the respective token id
 - A minting transaction is generated and signed using the "gas_receiver" wallet
 - Gas fees are paid by us

"Card Pack" Minting:
 - Is initiated directly from the contracts "buy" transactions by the user
 - Gas fees are paid by the user


## Metadata mismatch

OpenSEA needs metadata in a completely different format than we do.
We need to be able to create metadata in two different formats.
 - OpenSea specific
 - Reduced in size for our own purposes

Original Metadata (Troops, Weapons)
-> change_metadata.py
-> New Metadata & OS Metadata



## The Migration Problem
Troops and Items on ERC721
Coins on ERC20

Has to work similarly to the on-demand minting for the troops and items.
They send us their old tokens and we send them new ones.
We'll have to pay the fees for these transactions.

## Tools for managing all this:
 - Item creation tool


## Token receive pages (Open page, Swap page)

Should listen for events on the client-side and immediately provide feedback when a transaction has
been received. We want visually feedback on the page and a "receipt area".

The "receipt area" is simple multiline textfield where copy & paste is easy.
We'll add the transaction ids there and the user can copy this to prove he sent us the tokens.
That will be useful for troubleshooting, should the sending transaction on our side fail.

## The enumeration problem

ERC1155 does not really allow for enumeration of tokens on the chain.
We track the token balances in our db, by listening for events on the chain.

### Smart Contract Deployments

Main Net

ERC1155 Contract on Polygon Mainnet
https://polygonscan.com/address/0xc6aC1a63fbD7a843cf4F364177CD16eB0112dC09#code

Old Items Contract on Polygon Mainnet
https://polygonscan.com/address/0x70242aAa2a2e97Fa71936C8ED0185110cA23B866#code

Old Troops Contract on Polygon Mainnet
https://polygonscan.com/address/0xb195991d16c1473bdF4b122A2eD0245113fCb2F9#code

Test Net

ERC1155 Contract on Polygon Testnet
https://mumbai.polygonscan.com/address/0x37FD34a131b07ce495f7D16275B6dc4Ed1Bbd8C5#code

ERC721 TEST Contract on Polygon Testnet
https://mumbai.polygonscan.com/address/0x430a7de60d42014d6e22064417a3d09634725367#code

ERC721 Batch Contract on Polygon Testnet
https://mumbai.polygonscan.com/address/0xf86a72c5d9245c43e9d13cbc4cb0b49a869571b5#code
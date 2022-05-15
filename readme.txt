## The plan

All graphics need have a resolution that is divisible by the 2.

We will use 60x60 Tiles, meaning the isometric tiles are 120x60 pixels.
For Retina Displays, we need double that: 240x120 pixels.

So normal ground tiles will be needed in the following sizes 120x60 and 240x120.

## Bugs / Remarks
 - It is possible to sprint forever :)
 - The mouse-over-effect is sometimes on the wrong depth layer
 - Chance to hit is displayer for dead characters

## Needed for Alpha Battles
 - Weapon Slots - ITEM NFTs currently CANNOT BE ITERATED OVER
 - Battle Points System
 - Test Sprinting
 - Melee and Ranged Attack Animation
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

This scale would
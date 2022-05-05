from enum import Enum, IntEnum


class Faction(IntEnum):
    Wolf = 1,
    Dragon = 2,
    Snake = 3,

class DamageType(IntEnum):
    Melee = 1,
    Ranged = 2,
    Poison = 3,

class CharacterState(IntEnum):
    Dead = 0
    Alive = 1


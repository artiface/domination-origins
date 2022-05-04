import sqlite3
import json


def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


class Storage:
    def __init__(self, sqlite_file):
        self.con = sqlite3.connect(sqlite_file)
        self.con.row_factory = dict_factory
        # create all the tables
        self.createBattleTable()
        self.createPlayerTable()
        self.createSiweCacheTable()

    def createBattleTable(self):
        cur = self.con.cursor()
        cur.execute(
            '''CREATE TABLE IF NOT EXISTS battles (id integer primary key, map text, p1_address, p2_address, turn integer, Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        self.con.commit()

    def createPlayerTable(self):
        cur = self.con.cursor()
        cur.execute(
            '''CREATE TABLE IF NOT EXISTS users (wallet text primary key, name text, wins integer, losses integer, draws integer)''')
        self.con.commit()

    def createBattle(self):
        cur = self.con.cursor()
        values = ('None',)
        cur.execute("insert into battles(map) values (?)", values)
        self.con.commit()
        return cur.lastrowid

    def addSecondPlayer(self, battleId, p2_address, p2_loadout):
        cur = self.con.cursor()
        cur.execute("update battles set p2_address = ?, p2_loadout = ? where id = ?", (p2_address, json.dumps(p2_loadout), battleId))
        cur.execute("update users set current_battle = ? where wallet = ?", (battleId, p2_address))
        self.con.commit()

    def findOpenBattle(self, wallet_address):
        cur = self.con.cursor()
        cur.execute("SELECT * FROM battles WHERE p2_address IS NULL and p1_address <> ? LIMIT 1", [wallet_address])
        result = cur.fetchone()
        return result

    def findBattle(self, id):
        cur = self.con.cursor()
        cur.execute("SELECT * FROM battles WHERE id = ?", [id])
        result = cur.fetchone()
        return result

    def insertPlayer(self, wallet_address, name):
        cur = self.con.cursor()
        cur.execute("insert or ignore into users(wallet, name) values (?, ?)", (wallet_address, name))
        self.con.commit()
        return cur.lastrowid

    def findPlayer(self, wallet_address):
        cur = self.con.cursor()
        cur.execute("SELECT * FROM users WHERE wallet = ?", [wallet_address])
        result = cur.fetchall()
        return result[0] if len(result) > 0 else False

    def isPlayerAuthenticated(self, wallet_address):
        cur = self.con.cursor()
        cur.execute("SELECT * FROM users WHERE wallet = ? AND authenticated = 1", [wallet_address])
        result = cur.fetchall()
        return len(result) > 0

    def createSiweCacheTable(self):
        cur = self.con.cursor()
        cur.execute(
            '''CREATE TABLE IF NOT EXISTS siwe (wallet text primary key, message text, Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        self.con.commit()

    def setSiweCache(self, wallet, message):
        cur = self.con.cursor()
        cur.execute("insert or replace into siwe(wallet, message) values (?, ?)", (wallet, json.dumps(message)))
        self.con.commit()

    def getSiweCache(self, wallet):
        cur = self.con.cursor()
        cur.execute("SELECT * FROM siwe WHERE wallet = ?", [wallet])
        fetchone = cur.fetchone()
        return json.loads(fetchone['message']) if fetchone else False

    def delSiweCache(self, wallet):
        cur = self.con.cursor()
        cur.execute("DELETE FROM siwe WHERE wallet = ?", [wallet])
        self.con.commit()

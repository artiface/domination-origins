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
        self.createPlayerTable()
        self.createSiweCacheTable()

    def createPlayerTable(self):
        cur = self.con.cursor()
        cur.execute(
            '''CREATE TABLE IF NOT EXISTS users (wallet text primary key, name text, wins integer, losses integer, draws integer)''')
        self.con.commit()

    def insertPlayer(self, wallet_address, name):
        cur = self.con.cursor()
        cur.execute("insert or ignore into users(wallet, name) values (?, ?)", (wallet_address, name))
        self.con.commit()
        return cur.lastrowid

    def addWinForPlayer(self, wallet_address):
        cur = self.con.cursor()
        cur.execute("UPDATE users SET wins = wins + 1 WHERE wallet = ?", [wallet_address])
        self.con.commit()

    def addLossForPlayer(self, wallet_address):
        cur = self.con.cursor()
        cur.execute("UPDATE users SET losses = losses + 1 WHERE wallet = ?", [wallet_address])
        self.con.commit()

    def findPlayer(self, wallet_address):
        cur = self.con.cursor()
        cur.execute("SELECT * FROM users WHERE wallet = ?", [wallet_address])
        result = cur.fetchall()
        return result[0] if len(result) > 0 else False

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

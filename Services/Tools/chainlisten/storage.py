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
        self.createTokenTable()
        self.createBalanceTable()

    # create a table that holds all the token types
    def createTokenTable(self):
        cur = self.con.cursor()
        cur.execute('''CREATE TABLE IF NOT EXISTS tokens (tokenId integer primary key, tokenName text, tokenSymbol text, tokenTotalSupply integer)''')
        self.con.commit()

    def createBalanceTable(self):
        cur = self.con.cursor()
        cur.execute('''CREATE TABLE IF NOT EXISTS balances (wallet text, tokenId integer, balance text, PRIMARY KEY (wallet, tokenId), FOREIGN KEY(tokenId) REFERENCES tokens(tokenId))''')
        self.con.commit()

    def createToken(self, tokenId, tokenName, tokenSymbol, tokenTotalSupply):
        cur = self.con.cursor()
        cur.execute(
            '''INSERT INTO tokens VALUES (?, ?, ?, ?)''', (tokenId, tokenName, tokenSymbol, tokenTotalSupply))
        self.con.commit()

    def mintToken(self, tokenId, wallet, amount):
        cur = self.con.cursor()
        # get the current balance
        cur.execute('SELECT balance FROM balances WHERE wallet = ? AND tokenId = ?', (wallet, tokenId))
        row = cur.fetchone()
        if row is None:
            cur.execute(
                '''INSERT INTO balances VALUES (?, ?, ?)''', (wallet, tokenId, str(amount)))
        else:
            new_balance = str(int(row['balance']) + amount)
            cur.execute('UPDATE balances SET balance = ? WHERE wallet = ? AND tokenId = ?', (new_balance, wallet, tokenId))

        self.con.commit()

    def transferToken(self, tokenId, fromWallet, toWallet, amount):
        cur = self.con.cursor()
        # get the current balance
        cur.execute('SELECT balance FROM balances WHERE wallet = ? AND tokenId = ?', (toWallet, tokenId))
        to_balance = cur.fetchone()
        to_balance_exists = to_balance is not None
        # decrement the from balance
        cur.execute('SELECT balance FROM balances WHERE wallet = ? AND tokenId = ?', (fromWallet, tokenId))
        from_balance = cur.fetchone()
        new_balance = str(int(from_balance['balance']) - amount)
        cur.execute('UPDATE balances SET balance = ? WHERE wallet = ? AND tokenId = ?', (new_balance, fromWallet, tokenId))

        # increment the to balance
        if to_balance_exists:
            new_balance = str(int(to_balance['balance']) + amount)
            cur.execute('UPDATE balances SET balance = ? WHERE wallet = ? AND tokenId = ?', (new_balance, toWallet, tokenId))
        else:
            cur.execute('INSERT INTO balances VALUES (?, ?, ?)', (toWallet, tokenId, str(amount)))

        self.con.commit()

    def getBalance(self, tokenId, wallet):
        cur = self.con.cursor()
        cur.execute('SELECT balance FROM balances WHERE wallet = ? AND tokenId = ?', (wallet, tokenId))
        row = cur.fetchone()
        if row is None:
            return 0
        else:
            return row['balance']

    def getAllBalances(self, wallet):
        cur = self.con.cursor()
        cur.execute('SELECT tokenId, balance FROM balances WHERE wallet = ?', (wallet,))
        rows = cur.fetchall()
        return rows


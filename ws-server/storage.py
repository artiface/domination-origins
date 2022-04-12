import sqlite3

class Storage:
	def __init__(self, sqlite_file):
		self.con = sqlite3.connect(sqlite_file)

	def createUserTable(self):
		cur = self.con.cursor()
		cur.execute('''CREATE TABLE IF NOT EXISTS users (wallet text primary key, name text, wins integer, losses integer, draws integer)''')
		self.con.commit()

	def insertUser(self, wallet_address, name):
		cur = self.con.cursor()
		cur.execute("insert into users values (?, ?, 0, 0, 0)", (wallet_address, name))
		self.con.commit()

	def getUserByWallet(self, wallet_address):
		cur = self.con.cursor()
		cur.execute("SELECT * FROM users WHERE wallet = ?", [wallet_address])
		result = cur.fetchall()
		return result[0] if len(result) > 0 else False



db = Storage('test.sqlite')
db.createUserTable()
#db.insertUser("1234", "alice")
#db.insertUser("1235", "bob")
#db.insertUser("1234", "charles")

user = db.getUserByWallet("12")
print(user)
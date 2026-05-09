from database.db_manager import DBManager

class OfferModel:
    @staticmethod
    def create_table():
        db = DBManager()
        db.execute('''
        CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            demande_id INTEGER,
            mecanicien_id INTEGER,
            price REAL,
            message TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(demande_id) REFERENCES demandes(id),
            FOREIGN KEY(mecanicien_id) REFERENCES users(id)
        )
        ''')

    @staticmethod
    def create_offer(data):
        db = DBManager()
        cursor = db.execute(
            '''INSERT INTO offers (demande_id, mecanicien_id, price, message, status)
               VALUES (?, ?, ?, ?, ?)''',
            (data['demande_id'], data['mecanicien_id'], data['price'], data.get('message'), data.get('status', 'pending'))
        )
        return cursor.lastrowid

from database.db_manager import DBManager

class LocationModel:
    @staticmethod
    def create_table():
        db = DBManager()
        db.execute('''
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            latitude REAL,
            longitude REAL,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        ''')

    @staticmethod
    def save_location(data):
        db = DBManager()
        cursor = db.execute(
            '''INSERT INTO locations (user_id, latitude, longitude, address)
               VALUES (?, ?, ?, ?)''',
            (data['user_id'], data['latitude'], data['longitude'], data.get('address'))
        )
        return cursor.lastrowid

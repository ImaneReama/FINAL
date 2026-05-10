from database.db_manager import DBManager

class RequestModel:
    @staticmethod
    def create_table():
        db = DBManager()
        db.execute('''
        CREATE TABLE IF NOT EXISTS demandes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            category TEXT,
            description TEXT,
            photo_path TEXT,
            lat REAL,
            lng REAL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(client_id) REFERENCES users(id)
        )
        ''')

    @staticmethod
    def create_request(data):
        db = DBManager()
        cursor = db.execute(
            '''INSERT INTO demandes (client_id, category, description, photo_path, lat, lng, status)
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (data['client_id'], data['category'], data['description'], data.get('photo_path'), data.get('lat'), data.get('lng'), data.get('status', 'pending'))
        )
        return cursor.lastrowid
    @staticmethod
    def update_status(request_id, status):
        db = DBManager()
        db.execute('UPDATE demandes SET status = ? WHERE id = ?', (status, request_id))

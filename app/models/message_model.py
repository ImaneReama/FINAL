from database.db_manager import DBManager

class MessageModel:
    @staticmethod
    def create_table():
        db = DBManager()
        db.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            demande_id INTEGER,
            sender_id INTEGER,
            content TEXT,
            message_type TEXT DEFAULT 'text',
            image_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(demande_id) REFERENCES demandes(id)
        )
        ''')

    @staticmethod
    def create_message(data):
        db = DBManager()
        cursor = db.execute(
            '''INSERT INTO messages (demande_id, sender_id, content, message_type, image_path)
               VALUES (?, ?, ?, ?, ?)''',
            (data['demande_id'], data['sender_id'], data['content'], data.get('message_type', 'text'), data.get('image_path'))
        )
        return cursor.lastrowid

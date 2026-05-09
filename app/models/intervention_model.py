from database.db_manager import DBManager

class InterventionModel:
    @staticmethod
    def create_table():
        db = DBManager()
        db.execute('''
        CREATE TABLE IF NOT EXISTS interventions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            demande_id INTEGER,
            mecanicien_id INTEGER,
            final_price REAL,
            status TEXT DEFAULT 'ongoing',
            date_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date_finished TIMESTAMP,
            FOREIGN KEY(demande_id) REFERENCES demandes(id),
            FOREIGN KEY(mecanicien_id) REFERENCES users(id)
        )
        ''')

    @staticmethod
    def create_intervention(data):
        db = DBManager()
        cursor = db.execute(
            '''INSERT INTO interventions (demande_id, mecanicien_id, final_price, status)
               VALUES (?, ?, ?, ?)''',
            (data['demande_id'], data['mecanicien_id'], data.get('final_price', 0.0), data.get('status', 'ongoing'))
        )
        return cursor.lastrowid

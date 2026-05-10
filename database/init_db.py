from database.db_manager import DBManager
from utils.auth import hash_password
import random

def init_db():
    db = DBManager()
    
    # Create Tables
    db.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT UNIQUE,
        role TEXT NOT NULL, -- 'automobiliste', 'mecanicien', 'admin'
        city TEXT,
        avatar TEXT,
        lat REAL,
        lng REAL,
        mecanicien_type TEXT, -- 'Particulier', 'Garage', 'Dépannage'
        specialties TEXT, -- Comma separated
        is_available INTEGER DEFAULT 1,
        rating REAL DEFAULT 0.0,
        approved INTEGER DEFAULT 0
    )
    ''')

    db.execute('''
    CREATE TABLE IF NOT EXISTS demandes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        category TEXT, -- 'Moteur', 'Batterie', etc.
        description TEXT,
        photo_path TEXT,
        lat REAL,
        lng REAL,
        status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(client_id) REFERENCES users(id)
    )
    ''')

    db.execute('''
    CREATE TABLE IF NOT EXISTS interventions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        demande_id INTEGER,
        mecanicien_id INTEGER,
        final_price REAL,
        status TEXT DEFAULT 'ongoing', -- 'ongoing', 'finished'
        date_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_finished TIMESTAMP,
        FOREIGN KEY(demande_id) REFERENCES demandes(id),
        FOREIGN KEY(mecanicien_id) REFERENCES users(id)
    )
    ''')

    db.execute('''
    CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        demande_id INTEGER,
        mecanicien_id INTEGER,
        price REAL,
        message TEXT,
        status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'refused'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        refused_at TIMESTAMP,
        FOREIGN KEY(demande_id) REFERENCES demandes(id),
        FOREIGN KEY(mecanicien_id) REFERENCES users(id)
    )
    ''')

    db.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        demande_id INTEGER,
        sender_id INTEGER,
        content TEXT,
        message_type TEXT DEFAULT 'text', -- 'text', 'offer', 'negotiation'
        image_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(demande_id) REFERENCES demandes(id)
    )
    ''')

    db.execute('''
    CREATE TABLE IF NOT EXISTS avis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        intervention_id INTEGER,
        client_id INTEGER,
        mecanicien_id INTEGER,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(intervention_id) REFERENCES interventions(id)
    )
    ''')

    # Seed Admin
    pwd = hash_password("admin123")
    db.execute("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", 
               ("Admin", "admin@wqaft.ma", pwd, "admin"))

    # Seed Mock Data
    cities = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir"]
    m_types = ["Particulier", "Garage", "Dépannage"]
    specs = ["Moteur", "Électricité", "Pneus", "Carrosserie", "Diagnostic"]
    
    # 2 Automobilistes
    for i in range(1, 3):
        name = f"Client {i}"
        email = f"client{i}@gmail.com"
        pwd = hash_password("client123")
        city = cities[i % len(cities)]
        db.execute("INSERT OR IGNORE INTO users (name, email, password, role, city, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                   (name, email, pwd, "automobiliste", city, 33.5731 + (random.random()-0.5)*0.1, -7.5898 + (random.random()-0.5)*0.1))

    # 4 Mecaniciens
    for i in range(1, 5):
        name = f"Mecanicien {i}"
        email = f"meca{i}@pro.ma"
        pwd = hash_password("meca123")
        city = cities[i % len(cities)]
        m_type = random.choice(m_types)
        spec = ", ".join(random.sample(specs, 2))
        rating = round(3 + random.random() * 2, 1)
        db.execute("INSERT OR IGNORE INTO users (name, email, password, role, city, mecanicien_type, specialties, rating, approved, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                   (name, email, pwd, "mecanicien", city, m_type, spec, rating, 1, 33.5731 + (random.random()-0.5)*0.1, -7.5898 + (random.random()-0.5)*0.1))

    print("Database initialized and seeded.")

if __name__ == "__main__":
    init_db()

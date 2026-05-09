import sqlite3
import os
from config import Config

class DBManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DBManager, cls).__new__(cls)
            if not os.path.exists('database'):
                os.makedirs('database')
            cls._instance.conn = sqlite3.connect(Config.DB_PATH, check_same_thread=False)
            cls._instance.conn.row_factory = sqlite3.Row
        return cls._instance

    def get_connection(self):
        return self.conn

    def execute(self, query, params=()):
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        self.conn.commit()
        return cursor

    def fetch_all(self, query, params=()):
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()

    def fetch_one(self, query, params=()):
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchone()

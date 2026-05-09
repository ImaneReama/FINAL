class Config:
    # App General
    APP_NAME = "Wqaft"
    VERSION = "1.0.0"
    
    # Database
    DB_PATH = "database/wqaft.db"
    
    # Simulation GPS (Casablanca)
    MOCK_LAT = 33.5731
    MOCK_LNG = -7.5898
    
    # Business Logic
    RADIUS_SEARCH_KM = 20.0
    COMMISSION_PERCENT = 0
    POLLING_INTERVAL = 3  # seconds
    
    # UI Colors
    COLOR_PRIMARY = "#0D9488" # Teal
    COLOR_SECONDARY = "#0F172A" # Midnight Blue
    COLOR_BG_SLATE = "#F1F5F9"
    COLOR_TEXT_MAIN = "#1E293B"
    COLOR_WHITE = "#FFFFFF"
    COLOR_ACCENT = "#EF4444" # Red for "Je suis en panne"

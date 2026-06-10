import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "socialmind.db")
db_path = os.path.abspath(db_path)

print(f"Connecting to database at {db_path}...")
if not os.path.exists(db_path):
    print("Database file does not exist. No migration needed.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column openai_api_key exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "openai_api_key" in columns and "gemini_api_key" not in columns:
        print("Renaming column openai_api_key to gemini_api_key...")
        cursor.execute("ALTER TABLE users RENAME COLUMN openai_api_key TO gemini_api_key;")
        conn.commit()
        print("Migration completed successfully!")
    elif "gemini_api_key" in columns:
        print("Column gemini_api_key already exists. Migration skipped.")
    else:
        print("No openai_api_key column found in users table.")
    
    conn.close()

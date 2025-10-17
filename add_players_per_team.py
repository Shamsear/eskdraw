import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
database_url = os.getenv('DATABASE_URL')

if not database_url:
    print("Error: DATABASE_URL not found in .env file")
    exit(1)

try:
    # Connect to the database
    print("Connecting to database...")
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='tournaments' AND column_name='playersPerTeam'
    """)
    
    if cursor.fetchone():
        print("Column 'playersPerTeam' already exists!")
    else:
        print("Adding 'playersPerTeam' column...")
        
        # Add the column with default value
        cursor.execute("""
            ALTER TABLE tournaments 
            ADD COLUMN "playersPerTeam" INTEGER NOT NULL DEFAULT 4
        """)
        
        # Update existing records to set playersPerTeam equal to numPots
        cursor.execute("""
            UPDATE tournaments 
            SET "playersPerTeam" = "numPots"
            WHERE "playersPerTeam" = 4
        """)
        
        conn.commit()
        print("✅ Successfully added 'playersPerTeam' column!")
        print("✅ Updated existing tournaments to use numPots as playersPerTeam")
    
    cursor.close()
    conn.close()
    print("\n🎉 Database update completed successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()

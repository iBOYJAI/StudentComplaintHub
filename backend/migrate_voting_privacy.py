"""
Migration script to add voting and privacy features
Run this to update the database schema
"""
from app.database import engine, Base
from app.models.models import ComplaintVote
from sqlalchemy import text

def migrate():
    print("Starting migration: Adding voting and privacy features...")
    
    with engine.connect() as conn:
        # Add privacy_mode column to complaints
        try:
            conn.execute(text("""
                ALTER TABLE complaints 
                ADD COLUMN privacy_mode VARCHAR(20) DEFAULT 'public'
            """))
            conn.commit()
            print("✓ Added privacy_mode column to complaints")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                print("  privacy_mode column already exists")
            else:
                print(f"  Error adding privacy_mode: {e}")
        
        # Add vote_count column to complaints
        try:
            conn.execute(text("""
                ALTER TABLE complaints 
                ADD COLUMN vote_count INT DEFAULT 0
            """))
            conn.commit()
            print("✓ Added vote_count column to complaints")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                print("  vote_count column already exists")
            else:
                print(f"  Error adding vote_count: {e}")
    
    # Create complaint_votes table
    try:
        Base.metadata.tables['complaint_votes'].create(engine, checkfirst=True)
        print("✓ Created complaint_votes table")
    except Exception as e:
        print(f"  Error creating complaint_votes table: {e}")
    
    print("\n✓ Migration completed successfully!")
    print("\nYou can now restart the application.")

if __name__ == "__main__":
    migrate()

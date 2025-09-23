# backend/app/seeds.py

from .models import User
from . import db, bcrypt

def seed_admin():
    """Membuat akun admin jika belum ada."""
    
    # Cek apakah admin sudah ada
    admin_user = User.query.filter_by(email="admin@admin.com").first()
    
    if not admin_user:
        print("Admin user not found, creating one...")
        
        hashed_password = bcrypt.generate_password_hash("12345678").decode('utf-8')
        
        new_admin = User(
            email="admin@admin.com",
            password_hash=hashed_password,
            nama_lengkap="Admin SIRICO",
            role="admin" # <-- Menetapkan peran sebagai admin
        )
        
        db.session.add(new_admin)
        db.session.commit()
        print("Admin user created successfully.")
    else:
        print("Admin user already exists.")
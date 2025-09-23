from . import db
from datetime import datetime
# Kita tidak perlu lagi werkzeug.security
# from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    """Model untuk tabel pengguna (users)"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    nama_lengkap = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')
    kris = db.relationship('KRI', backref='owner', lazy=True, cascade="all, delete-orphan")
    
    assessments = db.relationship('RiskAssessment', backref='assessor', lazy=True)

    def __repr__(self):
        return f'<User {self.email}>'
    
class KRI(db.Model):
    """Model untuk tabel Key Risk Indicators (KRI)"""

    __tablename__ = 'kri'

    id = db.Column(db.Integer, primary_key=True)
    nama_kri = db.Column(db.String(150), nullable=False)
    deskripsi = db.Column(db.Text, nullable=True)
    tipe_data = db.Column(db.String(50), nullable=False)
    ambang_batas_kritis = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<KRI {self.nama_kri}>'

class RiskAssessment(db.Model):
    """Model untuk proyek asesmen risiko."""
    __tablename__ = 'risk_assessments'

    id = db.Column(db.Integer, primary_key=True)
    nama_asesmen = db.Column(db.String(200), nullable=False)
    deskripsi = db.Column(db.Text, nullable=True)
    ruang_lingkup = db.Column(db.Text, nullable=True)
    tanggal_mulai = db.Column(db.Date, nullable=False)
    tanggal_selesai = db.Column(db.Date, nullable=True)
    
    # Foreign Key ke User yang melakukan asesmen
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationship ke RiskRegister (satu asesmen punya banyak risiko)
    risk_register_entries = db.relationship('RiskRegister', backref='assessment', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<RiskAssessment {self.nama_asesmen}>'


class RiskRegister(db.Model):
    """Model untuk setiap entri risiko dalam sebuah asesmen."""
    __tablename__ = 'risk_register'

    id = db.Column(db.Integer, primary_key=True)
    kode_risiko = db.Column(db.String(20), unique=True, nullable=False)
    deskripsi_risiko = db.Column(db.Text, nullable=False)
    
    # Level risiko bisa berupa angka (misal: 1-5) atau teks (misal: 'Rendah', 'Sedang', 'Tinggi')
    # Kita gunakan String untuk fleksibilitas
    level_risiko_inheren = db.Column(db.String(50), nullable=True)
    level_risiko_kontrol = db.Column(db.String(50), nullable=True)
    level_risiko_residual = db.Column(db.String(50), nullable=True)

    # Foreign Key ke proyek asesmen
    assessment_id = db.Column(db.Integer, db.ForeignKey('risk_assessments.id'), nullable=False)

    def __repr__(self):
        return f'<RiskRegister {self.kode_risiko}>'
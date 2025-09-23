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
    
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
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
    
class HorizonScanEntry(db.Model):
    """Model untuk menyimpan hasil ringkasan berita dari Horizon Scanner."""
    __tablename__ = 'horizon_scan_entries'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    source_url = db.Column(db.String(500), nullable=False, unique=True)
    published_date = db.Column(db.DateTime, nullable=False)
    original_summary = db.Column(db.Text, nullable=False)
    ai_summary = db.Column(db.Text, nullable=True) # Hasil dari Gemini
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<HorizonScanEntry {self.title}>'
    
# Tabel Asosiasi untuk relasi Many-to-Many antara Cycle dan Department
rsca_cycle_departments = db.Table('rsca_cycle_departments',
    db.Column('rsca_cycle_id', db.Integer, db.ForeignKey('rsca_cycles.id'), primary_key=True),
    db.Column('department_id', db.Integer, db.ForeignKey('departments.id'), primary_key=True)
)

class Department(db.Model):
    """Model untuk departemen perusahaan."""
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)

    def __repr__(self):
        return f'<Department {self.name}>'

class RscaCycle(db.Model):
    """Model untuk siklus/periode asesmen RSCA."""
    __tablename__ = 'rsca_cycles'
    id = db.Column(db.Integer, primary_key=True)
    nama_siklus = db.Column(db.String(200), nullable=False)
    tanggal_mulai = db.Column(db.Date, nullable=False)
    tanggal_selesai = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Draft') # Draft, In Progress, Completed

    # Relasi Many-to-Many ke Department
    departments = db.relationship('Department', secondary=rsca_cycle_departments, lazy='subquery',
                                  backref=db.backref('rsca_cycles', lazy=True))
    
    # Relasi One-to-Many ke Questionnaire
    questionnaires = db.relationship('RscaQuestionnaire', backref='cycle', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<RscaCycle {self.nama_siklus}>'

class RscaQuestionnaire(db.Model):
    """Model untuk pertanyaan-pertanyaan dalam kuesioner RSCA."""
    __tablename__ = 'rsca_questionnaires'
    id = db.Column(db.Integer, primary_key=True)
    pertanyaan = db.Column(db.Text, nullable=False)
    kategori = db.Column(db.String(100), nullable=True) # Misal: 'Risiko Operasional', 'Risiko Keuangan'
    
    cycle_id = db.Column(db.Integer, db.ForeignKey('rsca_cycles.id'), nullable=False)

    def __repr__(self):
        return f'<RscaQuestionnaire {self.id}>'

class RscaAnswer(db.Model):
    """Model untuk jawaban dari departemen atas sebuah pertanyaan."""
    __tablename__ = 'rsca_answers'
    id = db.Column(db.Integer, primary_key=True)
    jawaban = db.Column(db.Text, nullable=True)
    catatan = db.Column(db.Text, nullable=True)
    
    # Kunci asing yang menghubungkan jawaban ini ke semua elemen terkait
    cycle_id = db.Column(db.Integer, db.ForeignKey('rsca_cycles.id'), nullable=False)
    questionnaire_id = db.Column(db.Integer, db.ForeignKey('rsca_questionnaires.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    
    # Hubungan opsional ke Risk Register jika jawaban ini mengidentifikasi risiko baru
    risk_register_id = db.Column(db.Integer, db.ForeignKey('risk_register.id'), nullable=True)

    def __repr__(self):
        return f'<RscaAnswer {self.id}>'
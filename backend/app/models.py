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
    business_processes = db.relationship('BusinessProcess', backref='owner', lazy=True)
    critical_assets = db.relationship('CriticalAsset', backref='owner', lazy=True)
    impact_scenarios = db.relationship('ImpactScenario', backref='owner', lazy=True)

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
    tanggal_mulai = db.Column(db.Date, nullable=False)
    tanggal_selesai = db.Column(db.Date, nullable=True)
    
    # Company Information
    company_industry = db.Column(db.String(100))
    company_type = db.Column(db.String(100))
    company_assets = db.Column(db.String(50))
    currency = db.Column(db.String(10))
    risk_limit = db.Column(db.Float)
    
    # Risk Categories (disimpan sebagai string dipisahkan koma)
    risk_categories = db.Column(db.Text)
    
    # Project Context
    project_objective = db.Column(db.Text)
    relevant_regulations = db.Column(db.Text)
    involved_departments = db.Column(db.Text)
    completed_actions = db.Column(db.Text)
    
    # Additional Context
    additional_risk_context = db.Column(db.Text)
    
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
    ai_summary = db.Column(db.Text, nullable=True) # Untuk menyimpan hasil analisis AI

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
    
process_step_risks = db.Table('process_step_risks',
    db.Column('process_step_id', db.Integer, db.ForeignKey('process_steps.id'), primary_key=True),
    db.Column('risk_register_id', db.Integer, db.ForeignKey('risk_register.id'), primary_key=True)
)

class BusinessProcess(db.Model):
    """Model untuk proses bisnis."""
    __tablename__ = 'business_processes'

    id = db.Column(db.Integer, primary_key=True)
    nama_proses = db.Column(db.String(250), nullable=False)
    pemilik_proses = db.Column(db.String(150), nullable=True) # Misal: 'Kepala Divisi Keuangan'
    
    # Foreign Key ke User yang membuat/mengelola proses ini
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relasi One-to-Many ke ProcessStep
    steps = db.relationship('ProcessStep', backref='business_process', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<BusinessProcess {self.nama_proses}>'

class ProcessStep(db.Model):
    """Model untuk setiap langkah dalam sebuah proses bisnis."""
    __tablename__ = 'process_steps'

    id = db.Column(db.Integer, primary_key=True)
    nama_langkah = db.Column(db.String(250), nullable=False)
    deskripsi_langkah = db.Column(db.Text, nullable=True)
    urutan = db.Column(db.Integer, nullable=False) # Untuk mengurutkan langkah-langkah
    
    # Foreign Key ke proses bisnis induknya
    process_id = db.Column(db.Integer, db.ForeignKey('business_processes.id'), nullable=False)

    # Relasi Many-to-Many ke RiskRegister
    risks = db.relationship('RiskRegister', secondary=process_step_risks, lazy='subquery',
                            backref=db.backref('process_steps', lazy=True))
    
    def __repr__(self):
        return f'<ProcessStep {self.nama_langkah}>'
    
class CriticalAsset(db.Model):
    """Model untuk aset-aset kritis perusahaan."""
    __tablename__ = 'critical_assets'

    id = db.Column(db.Integer, primary_key=True)
    nama_aset = db.Column(db.String(200), nullable=False)
    tipe_aset = db.Column(db.String(100), nullable=False) # Cth: 'Aplikasi', 'Server', 'Tim', 'Gedung'
    deskripsi = db.Column(db.Text, nullable=True)
    
    # Foreign Key ke User yang membuat/mengelola aset ini
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<CriticalAsset {self.nama_aset}>'

class Dependency(db.Model):
    """Model untuk memetakan ketergantungan antar aset."""
    __tablename__ = 'dependencies'
    
    id = db.Column(db.Integer, primary_key=True)
    # Aset yang memiliki ketergantungan
    asset_id = db.Column(db.Integer, db.ForeignKey('critical_assets.id'), nullable=False)
    # Aset di mana ia bergantung
    depends_on_asset_id = db.Column(db.Integer, db.ForeignKey('critical_assets.id'), nullable=False)

    # Membangun relasi di Python
    asset = db.relationship('CriticalAsset', foreign_keys=[asset_id], backref='dependencies_on')
    depends_on = db.relationship('CriticalAsset', foreign_keys=[depends_on_asset_id], backref='depended_on_by')

    def __repr__(self):
        return f'<Dependency: Asset {self.asset_id} depends on {self.depends_on_asset_id}>'

class ImpactScenario(db.Model):
    """Model untuk skenario dampak yang akan disimulasikan."""
    __tablename__ = 'impact_scenarios'

    id = db.Column(db.Integer, primary_key=True)
    nama_skenario = db.Column(db.String(200), nullable=False)
    deskripsi = db.Column(db.Text, nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def __repr__(self):
        return f'<ImpactScenario {self.nama_skenario}>'
    
class MasterData(db.Model):
    __tablename__ = 'master_data'

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False, index=True)
    key = db.Column(db.String(100), nullable=False)
    value = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<MasterData {self.category} - {self.key}>'
    
class Regulation(db.Model):
    """Model untuk menyimpan data master regulasi."""
    __tablename__ = 'regulations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(300), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    filename = db.Column(db.String(300), nullable=True) # Nama file yang di-upload
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Regulation {self.name}>'
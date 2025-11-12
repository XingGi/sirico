from . import db
from datetime import datetime
# Kita tidak perlu lagi werkzeug.security
# from werkzeug.security import generate_password_hash, check_password_hash

user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True)
)

# Tabel penghubung Role dan Permission
role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permissions.id'), primary_key=True)
)

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    permissions = db.relationship('Permission', secondary=role_permissions, lazy='subquery',
                                backref=db.backref('roles', lazy=True))

    def __repr__(self):
        return f'<Role {self.name}>'

class Permission(db.Model):
    __tablename__ = 'permissions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False) # Contoh: 'view_risk_dasar', 'edit_risk_madya'
    description = db.Column(db.String(255)) # Penjelasan permission

    def __repr__(self):
        return f'<Permission {self.name}>'
    
class User(db.Model):
    """Model untuk tabel pengguna (users)"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    nama_lengkap = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(50), nullable=True)
    institution = db.Column(db.String(200), nullable=True)
    limit_dasar = db.Column(db.Integer, nullable=True, default=10)
    limit_madya = db.Column(db.Integer, nullable=True, default=5)
    limit_ai = db.Column(db.Integer, nullable=True, default=15)
    limit_template_peta = db.Column(db.Integer, nullable=True, default=5)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    department = db.relationship('Department', back_populates='users')
    
    kris = db.relationship('KRI', backref='owner', lazy=True, cascade="all, delete-orphan")
    assessments = db.relationship('RiskAssessment', backref='assessor', lazy=True, cascade="all, delete-orphan")
    business_processes = db.relationship('BusinessProcess', backref='owner', lazy=True, cascade="all, delete-orphan")
    critical_assets = db.relationship('CriticalAsset', backref='owner', lazy=True, cascade="all, delete-orphan")
    impact_scenarios = db.relationship('ImpactScenario', backref='owner', lazy=True, cascade="all, delete-orphan")
    
    main_risk_register_entries = db.relationship('MainRiskRegister', backref='owner', lazy=True, cascade="all, delete-orphan")
    organizational_contexts = db.relationship('OrganizationalContext', backref='owner', lazy=True, cascade="all, delete-orphan")
    basic_assessments = db.relationship('BasicAssessment', backref='owner', lazy=True, cascade="all, delete-orphan")
    risk_map_templates = db.relationship('RiskMapTemplate', backref='owner', lazy=True, cascade="all, delete-orphan")
    madya_assessments = db.relationship('MadyaAssessment', backref='owner', lazy=True, cascade="all, delete-orphan")
    
    roles = db.relationship('Role', secondary=user_roles, lazy='subquery',
                            backref=db.backref('users', lazy=True))

    def __repr__(self):
        return f'<User {self.email}>'
    
    # Helper untuk cek permission (opsional tapi berguna)
    def has_permission(self, permission_name):
        for role in self.roles:
            for permission in role.permissions:
                if permission.name == permission_name:
                    return True
        return False

    # Helper untuk cek role (opsional tapi berguna)
    def has_role(self, role_name):
         for role in self.roles:
             if role.name == role_name:
                 return True
         return False
    
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
    ai_executive_summary = db.Column(db.Text, nullable=True)
    ai_risk_profile_analysis = db.Column(db.Text, nullable=True) # Akan menyimpan JSON
    ai_immediate_priorities = db.Column(db.Text, nullable=True) # Akan menyimpan JSON
    ai_critical_risks_discussion = db.Column(db.Text, nullable=True) # Akan menyimpan JSON
    ai_implementation_plan = db.Column(db.Text, nullable=True) # Akan menyimpan JSON
    ai_next_steps = db.Column(db.Text, nullable=True)
    
    def __repr__(self):
        return f'<RiskAssessment {self.nama_asesmen}>'

class RiskRegister(db.Model):
    """Model untuk setiap entri risiko dalam sebuah asesmen."""
    __tablename__ = 'risk_register'

    id = db.Column(db.Integer, primary_key=True)
    kode_risiko = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.Text, nullable=True)
    
    # === KOLOM-KOLOM BARU YANG DETAIL SESUAI REFERENSI ===
    objective = db.Column(db.Text)
    risk_type = db.Column(db.String(50))
    deskripsi_risiko = db.Column(db.Text)
    risk_causes = db.Column(db.Text)
    risk_impacts = db.Column(db.Text)
    existing_controls = db.Column(db.Text)
    control_effectiveness = db.Column(db.String(50))
    mitigation_plan = db.Column(db.Text)
    
    # Inherent Risk (skor 1-5)
    inherent_likelihood = db.Column(db.Integer)
    inherent_impact = db.Column(db.Integer)
    
    # Residual Risk (skor 1-5)
    residual_likelihood = db.Column(db.Integer)
    residual_impact = db.Column(db.Integer)

    # Foreign Key
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
    institution = db.Column(db.String(255), nullable=True)
    
    users = db.relationship('User', back_populates='department')
    rsca_cycles = db.relationship('RscaCycle', secondary='rsca_cycle_departments', back_populates='departments')

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
    institution = db.Column(db.String(255), nullable=True)

    # Relasi Many-to-Many ke Department
    departments = db.relationship('Department', secondary=rsca_cycle_departments, back_populates='rsca_cycles')
    questionnaires = db.relationship('RscaQuestionnaire', backref='cycle', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<RscaCycle {self.nama_siklus}>'

class RscaQuestionnaire(db.Model):
    """Model untuk pertanyaan-pertanyaan dalam kuesioner RSCA."""
    __tablename__ = 'rsca_questionnaires'
    id = db.Column(db.Integer, primary_key=True)
    pertanyaan = db.Column(db.Text, nullable=False)
    kategori = db.Column(db.String(100), nullable=True) # Misal: 'Risiko Operasional', 'Risiko Keuangan'
    question_type = db.Column(db.String(50), nullable=False, default='text')
    
    cycle_id = db.Column(db.Integer, db.ForeignKey('rsca_cycles.id'), nullable=False)

    def __repr__(self):
        return f'<RscaQuestionnaire {self.id}>'

class RscaAnswer(db.Model):
    """Model untuk jawaban dari departemen atas sebuah pertanyaan."""
    __tablename__ = 'rsca_answers'
    id = db.Column(db.Integer, primary_key=True)
    jawaban = db.Column(db.Text, nullable=True)
    catatan = db.Column(db.Text, nullable=True)
    
    control_effectiveness_rating = db.Column(db.String(50), nullable=True)
    
    # Kunci asing yang menghubungkan jawaban ini ke semua elemen terkait
    cycle_id = db.Column(db.Integer, db.ForeignKey('rsca_cycles.id'), nullable=False)
    questionnaire_id = db.Column(db.Integer, db.ForeignKey('rsca_questionnaires.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    
    # Hubungan opsional ke Risk Register jika jawaban ini mengidentifikasi risiko baru
    risk_register_id = db.Column(db.Integer, db.ForeignKey('risk_register.id'), nullable=True)
    questionnaire = db.relationship('RscaQuestionnaire')
    department = db.relationship('Department')

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
    
class MainRiskRegister(db.Model):
    """Model untuk Risk Register terpusat."""
    __tablename__ = 'main_risk_register'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    title = db.Column(db.Text, nullable=True)
    
    # Data risiko yang disalin dari RiskRegister per asesmen
    kode_risiko = db.Column(db.String(50)) # Dibuat tidak unique agar bisa impor risiko yg sama dari asesmen berbeda
    objective = db.Column(db.Text)
    risk_type = db.Column(db.String(50))
    deskripsi_risiko = db.Column(db.Text)
    risk_causes = db.Column(db.Text)
    risk_impacts = db.Column(db.Text)
    existing_controls = db.Column(db.Text)
    control_effectiveness = db.Column(db.String(50))
    mitigation_plan = db.Column(db.Text)
    
    inherent_likelihood = db.Column(db.Integer)
    inherent_impact = db.Column(db.Integer)
    
    residual_likelihood = db.Column(db.Integer)
    residual_impact = db.Column(db.Integer)
    
    # Field tambahan untuk register utama
    status = db.Column(db.String(50), default='Open') # Cth: Open, In Progress, Closed
    treatment_option = db.Column(db.String(50), default='Reduce')

    # Foreign Key ke User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # Foreign key ke assessment asal (opsional, tapi bagus untuk traceability)
    source_assessment_id = db.Column(db.Integer, db.ForeignKey('risk_assessments.id'), nullable=True)

    def __repr__(self):
        return f'<MainRiskRegister {self.kode_risiko}>'

basic_assessment_contexts = db.Table('basic_assessment_contexts',
    db.Column('basic_assessment_id', db.Integer, db.ForeignKey('basic_assessments.id'), primary_key=True),
    db.Column('organizational_context_id', db.Integer, db.ForeignKey('organizational_contexts.id'), primary_key=True)
)

class OrganizationalContext(db.Model):
    """Model untuk menyimpan satu baris Konteks Organisasi."""
    __tablename__ = 'organizational_contexts'
    id = db.Column(db.Integer, primary_key=True)
    external_context = db.Column(db.Text, nullable=False)
    internal_context = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<OrganizationalContext {self.id}>'
    
class BasicRiskIdentification(db.Model):
    """Model untuk menyimpan satu baris Identifikasi Risiko Dasar."""
    __tablename__ = 'basic_risk_identifications'
    id = db.Column(db.Integer, primary_key=True)
    
    kode_risiko = db.Column(db.String(50), nullable=True)
    kategori_risiko = db.Column(db.String(100), nullable=False)
    unit_kerja = db.Column(db.String(200), nullable=False)
    sasaran = db.Column(db.Text, nullable=True)
    tanggal_identifikasi = db.Column(db.Date, nullable=False)
    deskripsi_risiko = db.Column(db.Text, nullable=False)
    akar_penyebab = db.Column(db.Text, nullable=True)
    indikator_risiko = db.Column(db.Text, nullable=True)
    internal_control = db.Column(db.Text, nullable=True)
    deskripsi_dampak = db.Column(db.Text, nullable=True)
    
    # Foreign Key ke BasicAssessment
    assessment_id = db.Column(db.Integer, db.ForeignKey('basic_assessments.id'), nullable=False)

    def __repr__(self):
        return f'<BasicRiskIdentification {self.kode_risiko}>'
    
class BasicRiskAnalysis(db.Model):
    """Model untuk menyimpan satu baris Analisis Risiko Dasar."""
    __tablename__ = 'basic_risk_analysis'
    id = db.Column(db.Integer, primary_key=True)
    
    # Kunci asing untuk menghubungkan kembali ke risiko yang diidentifikasi
    risk_identification_id = db.Column(db.Integer, db.ForeignKey('basic_risk_identifications.id'), nullable=False, unique=True)
    
    probabilitas = db.Column(db.Integer, nullable=True)
    dampak = db.Column(db.Integer, nullable=True)
    probabilitas_kualitatif = db.Column(db.Float, nullable=True) # Disimpan sebagai float (misal: 25.0 untuk 25%)
    dampak_finansial = db.Column(db.Float, nullable=True)
    
    assessment_id = db.Column(db.Integer, db.ForeignKey('basic_assessments.id'), nullable=False)

    # Relasi untuk mengambil deskripsi risiko dengan mudah
    risk_identification = db.relationship('BasicRiskIdentification', backref=db.backref("analysis", uselist=False))

    def __repr__(self):
        return f'<BasicRiskAnalysis for Risk ID: {self.risk_identification_id}>'
class BasicAssessment(db.Model):
    """Model untuk Asesmen Dasar tingkat unit kerja."""
    __tablename__ = 'basic_assessments'

    id = db.Column(db.Integer, primary_key=True)
    nama_unit_kerja = db.Column(db.String(200), nullable=False)
    nama_perusahaan = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    contexts = db.relationship('OrganizationalContext', secondary=basic_assessment_contexts, lazy='subquery',
                               backref=db.backref('basic_assessments', lazy=True))
    risks = db.relationship('BasicRiskIdentification', backref='assessment', lazy=True, cascade="all, delete-orphan")
    risk_analyses = db.relationship('BasicRiskAnalysis', backref='assessment', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<BasicAssessment {self.nama_unit_kerja}>'
    
# Template Peta Risiko
class RiskMapTemplate(db.Model):
    """Model untuk menyimpan template peta risiko."""
    __tablename__ = 'risk_map_templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    # Jika user_id null, berarti ini template default. Jika tidak, ini milik user.
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relasi ke label dan definisi level
    likelihood_labels = db.relationship('RiskMapLikelihoodLabel', backref='template', lazy=True, cascade="all, delete-orphan")
    impact_labels = db.relationship('RiskMapImpactLabel', backref='template', lazy=True, cascade="all, delete-orphan")
    level_definitions = db.relationship('RiskMapLevelDefinition', backref='template', lazy=True, cascade="all, delete-orphan")
    scores = db.relationship('RiskMapScore', backref='template', lazy=True, cascade="all, delete-orphan")
    madya_assessments = db.relationship('MadyaAssessment', back_populates='risk_map_template', lazy=True)

class RiskMapLikelihoodLabel(db.Model):
    """Menyimpan label untuk sumbu probabilitas (Y-axis)."""
    __tablename__ = 'risk_map_likelihood_labels'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('risk_map_templates.id'), nullable=False)
    level = db.Column(db.Integer, nullable=False) # Nilai 1 sampai 5
    label = db.Column(db.String(100), nullable=False)

class RiskMapImpactLabel(db.Model):
    """Menyimpan label untuk sumbu dampak (X-axis)."""
    __tablename__ = 'risk_map_impact_labels'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('risk_map_templates.id'), nullable=False)
    level = db.Column(db.Integer, nullable=False) # Nilai 1 sampai 5
    label = db.Column(db.String(100), nullable=False)

class RiskMapLevelDefinition(db.Model):
    """Menyimpan definisi setiap level risiko (warna, nama, rentang skor)."""
    __tablename__ = 'risk_map_level_definitions'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('risk_map_templates.id'), nullable=False)
    level_name = db.Column(db.String(100), nullable=False) # Contoh: "Tinggi", "Moderat"
    color_hex = db.Column(db.String(7), nullable=False)   # Contoh: "#FF0000"
    min_score = db.Column(db.Integer, nullable=False)
    max_score = db.Column(db.Integer, nullable=False)
    
class RiskMapScore(db.Model):
    """Menyimpan nilai skor kustom untuk setiap sel dalam matriks."""
    __tablename__ = 'risk_map_scores'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('risk_map_templates.id'), nullable=False)
    likelihood_level = db.Column(db.Integer, nullable=False) # Nilai 1-5
    impact_level = db.Column(db.Integer, nullable=False)     # Nilai 1-5
    score = db.Column(db.Integer, nullable=False)            # Skor kustom dari pengguna
    
class MadyaCriteriaProbability(db.Model):
    """Menyimpan satu baris kriteria probabilitas KHUSUS UNTUK ASESMEN INI."""
    __tablename__ = 'madya_criteria_probability'
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('madya_assessments.id'), nullable=False)
    level = db.Column(db.Integer, nullable=False)
    parameter = db.Column(db.String(255), nullable=True)
    kemungkinan = db.Column(db.Text, nullable=True)
    frekuensi = db.Column(db.Text, nullable=True)
    persentase = db.Column(db.Text, nullable=True)

class MadyaCriteriaImpact(db.Model):
    """Menyimpan satu baris kriteria dampak KHUSUS UNTUK ASESMEN INI."""
    __tablename__ = 'madya_criteria_impact'
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('madya_assessments.id'), nullable=False)
    level = db.Column(db.Integer, nullable=False)
    kriteriaDampak = db.Column(db.String(255), nullable=True)
    rangeFinansial = db.Column(db.Text, nullable=True)
    deskripsiDampak1 = db.Column(db.Text, nullable=True)
    stra_dampak = db.Column(db.Text, nullable=True)
    hukum_pelanggaran = db.Column(db.Text, nullable=True)
    kepat_pelanggaran = db.Column(db.Text, nullable=True)
    reput_keluhan = db.Column(db.Text, nullable=True)
    reput_berita = db.Column(db.Text, nullable=True)
    reput_saing = db.Column(db.Text, nullable=True)
    sdm_keluhan = db.Column(db.Text, nullable=True)
    sdm_turnover = db.Column(db.Text, nullable=True)
    sdm_regretted_turnover = db.Column(db.Text, nullable=True)
    sistem_gangguan = db.Column(db.Text, nullable=True)
    sistem_siber = db.Column(db.Text, nullable=True)
    sistem_platform = db.Column(db.Text, nullable=True)
    ops_sla = db.Column(db.Text, nullable=True)
    hsse_fatality_1 = db.Column(db.Text, nullable=True)
    hsse_fatality_2 = db.Column(db.Text, nullable=True)
    hsse_fatality_3 = db.Column(db.Text, nullable=True)
    hsse_kerusakan_lingkungan = db.Column(db.Text, nullable=True)
    hsse_penurunan_esg = db.Column(db.Text, nullable=True)
    pmn_tunda = db.Column(db.Text, nullable=True)
    bank_fraud = db.Column(db.Text, nullable=True)
    asuransi_aset_rating = db.Column(db.Text, nullable=True)
    asuransi_aset_peringkat = db.Column(db.Text, nullable=True)
    aktu_rasio = db.Column(db.Text, nullable=True)
    
# Fitur Madya Assessment
class MadyaAssessment(db.Model):
    """Model induk untuk Asesmen tingkat Madya."""
    __tablename__ = 'madya_assessments'
    id = db.Column(db.Integer, primary_key=True)
    nama_asesmen = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    risk_map_template_id = db.Column(db.Integer, db.ForeignKey('risk_map_templates.id'), nullable=True)
    risk_map_template = db.relationship('RiskMapTemplate', back_populates='madya_assessments')
    
    structure_image_filename = db.Column(db.String(300), nullable=True) # Nama file gambar struktur
    structure_entries = db.relationship('OrganizationalStructureEntry', backref='assessment', lazy=True, cascade="all, delete-orphan")
    sasaran_kpi_entries = db.relationship('SasaranOrganisasiKPI', back_populates='assessment', lazy=True, cascade="all, delete-orphan", order_by='SasaranOrganisasiKPI.id')
    risk_inputs = db.relationship('RiskInputMadya', back_populates='assessment', lazy=True, cascade="all, delete-orphan")
    
    probability_criteria = db.relationship('MadyaCriteriaProbability', backref='assessment', lazy=True, cascade="all, delete-orphan")
    impact_criteria = db.relationship('MadyaCriteriaImpact', backref='assessment', lazy=True, cascade="all, delete-orphan")
    
    filter_organisasi = db.Column(db.String(200), nullable=True)
    filter_direktorat = db.Column(db.String(200), nullable=True)
    filter_divisi = db.Column(db.String(200), nullable=True)
    filter_departemen = db.Column(db.String(200), nullable=True)
    
    def __repr__(self):
        return f'<MadyaAssessment {self.id} - {self.nama_asesmen}>'

class OrganizationalStructureEntry(db.Model):
    """Model untuk satu baris entri struktur organisasi."""
    __tablename__ = 'organizational_structure_entries'
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('madya_assessments.id'), nullable=False)
    direktorat = db.Column(db.String(200), nullable=True)
    divisi = db.Column(db.String(200), nullable=True)
    unit_kerja = db.Column(db.String(200), nullable=True)
    
class SasaranOrganisasiKPI(db.Model):
    """Model untuk menyimpan Sasaran Organisasi/KPI per Asesmen Madya."""
    __tablename__ = 'sasaran_organisasi_kpi'

    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('madya_assessments.id'), nullable=False)
    sasaran_kpi = db.Column(db.Text, nullable=False) # Kolom untuk teks Sasaran/KPI

    # Kolom untuk Risk Appetite (awalnya null, diisi/diedit nanti)
    target_level = db.Column(db.String(50), nullable=True) # Misal: 'R', 'L', 'M', 'H', 'E'
    inherent_risk_score = db.Column(db.Integer, nullable=True)
    residual_risk_score = db.Column(db.Integer, nullable=True)

    # Relasi balik ke MadyaAssessment
    assessment = db.relationship('MadyaAssessment', back_populates='sasaran_kpi_entries')
    risk_inputs = db.relationship('RiskInputMadya', back_populates='sasaran_organisasi', lazy=True)

    def __repr__(self):
        return f'<SasaranOrganisasiKPI {self.id} for Assessment {self.assessment_id}>'
    
class RiskInputMadya(db.Model):
    """Model untuk menyimpan detail Risk Input per baris pada Asesmen Madya."""
    __tablename__ = 'risk_input_madya'

    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('madya_assessments.id'), nullable=False)
    sasaran_id = db.Column(db.Integer, db.ForeignKey('sasaran_organisasi_kpi.id'), nullable=True) # Bisa null jika risiko tidak terkait langsung ke KPI

    # --- Identifikasi Risiko ---
    kode_risiko = db.Column(db.String(50), nullable=True)
    status_risiko = db.Column(db.String(50), default='Risiko Aktif') # Default 'Risiko Aktif'
    peluang_ancaman = db.Column(db.String(50), default='Ancaman')   # Default 'Ancaman'
    kategori_risiko = db.Column(db.String(100))
    kategori_risiko_lainnya = db.Column(db.String(200), nullable=True) # Untuk input 'Lainnya'
    unit_kerja = db.Column(db.String(200)) # Dari dropdown Card 1
    tanggal_identifikasi = db.Column(db.Date, default=datetime.utcnow)
    deskripsi_risiko = db.Column(db.Text)
    akar_penyebab = db.Column(db.Text, nullable=True)
    indikator_risiko = db.Column(db.Text, nullable=True)
    internal_control = db.Column(db.Text, nullable=True)
    deskripsi_dampak = db.Column(db.Text, nullable=True)

    # --- Analisis Risiko Inheren ---
    inherent_probabilitas = db.Column(db.Integer)
    inherent_dampak = db.Column(db.Integer)
    inherent_skor = db.Column(db.Integer, nullable=True) # Bisa dihitung, tapi disimpan agar mudah query
    inherent_prob_kualitatif = db.Column(db.Float, nullable=True) # Persentase
    inherent_dampak_finansial = db.Column(db.Float, nullable=True) # Rupiah
    inherent_nilai_bersih = db.Column(db.Float, nullable=True) # Hasil perhitungan

    # --- Pemilik Risiko ---
    pemilik_risiko = db.Column(db.String(150), nullable=True)
    jabatan_pemilik = db.Column(db.String(150), nullable=True)
    kontak_pemilik_hp = db.Column(db.String(50), nullable=True)
    kontak_pemilik_email = db.Column(db.String(120), nullable=True)

    # --- Evaluasi & Penanganan Risiko ---
    strategi = db.Column(db.String(100), nullable=True)
    rencana_penanganan = db.Column(db.Text, nullable=True)
    biaya_penanganan = db.Column(db.Float, nullable=True)
    penanganan_dilakukan = db.Column(db.Text, nullable=True) # Catatan penanganan yg sudah dilakukan
    status_penanganan = db.Column(db.String(50), nullable=True) # Misal: Open, In Progress, Done
    jadwal_mulai_penanganan = db.Column(db.Date, nullable=True)
    jadwal_selesai_penanganan = db.Column(db.Date, nullable=True)
    pic_penanganan = db.Column(db.String(150), nullable=True)

    # --- Analisis Risiko Residual ---
    residual_probabilitas = db.Column(db.Integer, nullable=True)
    residual_dampak = db.Column(db.Integer, nullable=True)
    residual_skor = db.Column(db.Integer, nullable=True)
    residual_prob_kualitatif = db.Column(db.Float, nullable=True)
    residual_dampak_finansial = db.Column(db.Float, nullable=True)
    residual_nilai_bersih = db.Column(db.Float, nullable=True)
    tanggal_review = db.Column(db.Date, nullable=True)

    # --- Relasi ---
    assessment = db.relationship('MadyaAssessment', back_populates='risk_inputs')
    sasaran_organisasi = db.relationship('SasaranOrganisasiKPI', back_populates='risk_inputs') # Relasi ke Sasaran/KPI

    def __repr__(self):
        return f'<RiskInputMadya {self.id} for Assessment {self.assessment_id}>'
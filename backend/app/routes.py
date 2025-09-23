from flask import request, jsonify, Blueprint
from .models import User, KRI, RiskAssessment, HorizonScanEntry, RiskRegister, Department, RscaCycle
from . import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime

# Membuat Blueprint untuk API
api_bp = Blueprint('api', __name__)

@api_bp.route('/register', methods=['POST'])
def register():
    """Endpoint untuk registrasi pengguna baru."""
    data = request.get_json()
    
    # Validasi input sederhana
    if not data or not data.get('email') or not data.get('password') or not data.get('nama_lengkap'):
        return jsonify({"msg": "Data yang dikirim tidak lengkap"}), 400

    # Cek apakah email sudah terdaftar
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email sudah terdaftar"}), 409

    # Buat user baru
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        email=data['email'],
        nama_lengkap=data['nama_lengkap'],
        password_hash=hashed_password
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "Registrasi berhasil"}), 201


@api_bp.route('/login', methods=['POST'])
def login():
    """Endpoint untuk login pengguna."""
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Email atau password tidak boleh kosong"}), 400

    user = User.query.filter_by(email=data['email']).first()

    # Cek user dan password
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        # Jika berhasil, buat token JWT
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token)

    return jsonify({"msg": "Email atau password salah"}), 401


@api_bp.route('/logout', methods=['POST'])
@jwt_required() # <-- Melindungi route ini
def logout():
    """Endpoint untuk logout."""
    # Di sisi backend, logout dengan JWT tidak memerlukan banyak hal.
    # Klien (frontend) cukup menghapus token yang disimpannya.
    return jsonify({"msg": "Logout berhasil"}), 200

# CREATE: Membuat KRI baru
@api_bp.route('/kri', methods=['POST'])
@jwt_required()
def create_kri():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('nama_kri') or not data.get('tipe_data') or data.get('ambang_batas_kritis') is None:
        return jsonify({"msg": "Data KRI tidak lengkap"}), 400

    new_kri = KRI(
        nama_kri=data['nama_kri'],
        deskripsi=data.get('deskripsi'),
        tipe_data=data['tipe_data'],
        ambang_batas_kritis=data['ambang_batas_kritis'],
        user_id=current_user_id
    )
    db.session.add(new_kri)
    db.session.commit()

    return jsonify({"msg": "KRI berhasil dibuat", "id": new_kri.id}), 201

# READ: Mendapatkan semua KRI milik pengguna
@api_bp.route('/kri', methods=['GET'])
@jwt_required()
def get_all_kris():
    current_user_id = get_jwt_identity()
    kris = KRI.query.filter_by(user_id=current_user_id).all()
    
    kri_list = []
    for kri in kris:
        kri_list.append({
            "id": kri.id,
            "nama_kri": kri.nama_kri,
            "deskripsi": kri.deskripsi,
            "tipe_data": kri.tipe_data,
            "ambang_batas_kritis": kri.ambang_batas_kritis,
            "created_at": kri.created_at.isoformat()
        })
        
    return jsonify(kri_list), 200

# READ: Mendapatkan satu KRI spesifik
@api_bp.route('/kri/<int:id>', methods=['GET'])
@jwt_required()
def get_kri(id):
    current_user_id = get_jwt_identity()
    kri = KRI.query.get(id)

    if not kri:
        return jsonify({"msg": "KRI tidak ditemukan"}), 404
    
    if kri.user_id != current_user_id:
        return jsonify({"msg": "Akses ditolak"}), 403 # Forbidden

    return jsonify({
        "id": kri.id,
        "nama_kri": kri.nama_kri,
        "deskripsi": kri.deskripsi,
        "tipe_data": kri.tipe_data,
        "ambang_batas_kritis": kri.ambang_batas_kritis,
        "created_at": kri.created_at.isoformat()
    }), 200

# UPDATE: Memperbarui KRI yang ada
@api_bp.route('/kri/<int:id>', methods=['PUT'])
@jwt_required()
def update_kri(id):
    current_user_id = get_jwt_identity()
    kri = KRI.query.get(id)

    if not kri:
        return jsonify({"msg": "KRI tidak ditemukan"}), 404

    if kri.user_id != current_user_id:
        return jsonify({"msg": "Akses ditolak"}), 403

    data = request.get_json()
    kri.nama_kri = data.get('nama_kri', kri.nama_kri)
    kri.deskripsi = data.get('deskripsi', kri.deskripsi)
    kri.tipe_data = data.get('tipe_data', kri.tipe_data)
    kri.ambang_batas_kritis = data.get('ambang_batas_kritis', kri.ambang_batas_kritis)
    
    db.session.commit()

    return jsonify({"msg": "KRI berhasil diperbarui"}), 200

# DELETE: Menghapus KRI
@api_bp.route('/kri/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_kri(id):
    current_user_id = get_jwt_identity()
    kri = KRI.query.get(id)

    if not kri:
        return jsonify({"msg": "KRI tidak ditemukan"}), 404

    if kri.user_id != current_user_id:
        return jsonify({"msg": "Akses ditolak"}), 403

    db.session.delete(kri)
    db.session.commit()

    return jsonify({"msg": "KRI berhasil dihapus"}), 200

# --- ↓↓↓ TAMBAHKAN ENDPOINT ASSESSMENT BARU DI SINI ↓↓↓ ---

@api_bp.route('/assessments', methods=['POST'])
@jwt_required()
def create_assessment():
    """Endpoint untuk membuat proyek risk assessment baru."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Validasi input
    if not data or not data.get('nama_asesmen') or not data.get('tanggal_mulai'):
        return jsonify({"msg": "Nama asesmen dan tanggal mulai wajib diisi"}), 400

    try:
        # Konversi string tanggal dari JSON ke objek Date Python
        tanggal_mulai_obj = datetime.strptime(data['tanggal_mulai'], '%Y-%m-%d').date()
        tanggal_selesai_obj = None
        if data.get('tanggal_selesai'):
            tanggal_selesai_obj = datetime.strptime(data['tanggal_selesai'], '%Y-%m-%d').date()

    except ValueError:
        return jsonify({"msg": "Format tanggal salah. Gunakan format YYYY-MM-DD."}), 400

    # Buat instance RiskAssessment baru
    new_assessment = RiskAssessment(
        nama_asesmen=data['nama_asesmen'],
        deskripsi=data.get('deskripsi'),
        ruang_lingkup=data.get('ruang_lingkup'),
        tanggal_mulai=tanggal_mulai_obj,
        tanggal_selesai=tanggal_selesai_obj,
        user_id=current_user_id
    )

    db.session.add(new_assessment)
    db.session.commit()

    return jsonify({
        "msg": "Risk assessment berhasil dibuat",
        "assessment_id": new_assessment.id
    }), 201
    
@api_bp.route('/assessments', methods=['GET'])
@jwt_required()
def get_assessments():
    """Mengambil semua proyek asesmen milik pengguna yang sedang login."""
    current_user_id = get_jwt_identity()
    assessments = RiskAssessment.query.filter_by(user_id=current_user_id).order_by(RiskAssessment.tanggal_mulai.desc()).all()
    
    assessment_list = []
    for assessment in assessments:
        assessment_list.append({
            "id": assessment.id,
            "nama_asesmen": assessment.nama_asesmen,
            "deskripsi": assessment.deskripsi,
            "tanggal_mulai": assessment.tanggal_mulai.isoformat(),
            "tanggal_selesai": assessment.tanggal_selesai.isoformat() if assessment.tanggal_selesai else None
        })
        
    return jsonify(assessment_list), 200
    
@api_bp.route('/horizon-scan', methods=['GET'])
@jwt_required()
def get_horizon_scan_entries():
    """Mengambil 5 entri terbaru dari Horizon Scanner."""
    
    # Ambil 5 berita terbaru, diurutkan dari yang paling baru
    entries = HorizonScanEntry.query.order_by(HorizonScanEntry.published_date.desc()).limit(5).all()
    
    results = []
    for entry in entries:
        results.append({
            "id": entry.id,
            "title": entry.title,
            "source_url": entry.source_url,
            "published_date": entry.published_date.isoformat(),
            "ai_summary": entry.ai_summary
        })
        
    return jsonify(results), 200

@api_bp.route('/departments', methods=['POST'])
@jwt_required()
def create_department():
    """Membuat departemen baru. (Hanya untuk Admin di masa depan)"""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"msg": "Nama departemen tidak boleh kosong"}), 400

    if Department.query.filter_by(name=data['name']).first():
        return jsonify({"msg": "Nama departemen sudah ada"}), 409

    new_dept = Department(name=data['name'])
    db.session.add(new_dept)
    db.session.commit()
    return jsonify({"msg": "Departemen berhasil dibuat", "id": new_dept.id}), 201

@api_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    """Mengambil daftar semua departemen."""
    depts = Department.query.all()
    dept_list = [{"id": dept.id, "name": dept.name} for dept in depts]
    return jsonify(dept_list), 200

@api_bp.route('/rsca-cycles', methods=['POST'])
@jwt_required()
def create_rsca_cycle():
    """Membuat siklus RSCA baru dan menugaskannya ke departemen."""
    data = request.get_json()
    
    # Validasi input utama
    required_fields = ['nama_siklus', 'tanggal_mulai', 'department_ids']
    if not all(field in data for field in required_fields):
        return jsonify({"msg": "Data tidak lengkap. Pastikan nama_siklus, tanggal_mulai, dan department_ids ada."}), 400

    # Validasi bahwa department_ids adalah sebuah list
    if not isinstance(data['department_ids'], list) or not data['department_ids']:
        return jsonify({"msg": "department_ids harus berupa list dan tidak boleh kosong."}), 400

    try:
        tanggal_mulai_obj = datetime.strptime(data['tanggal_mulai'], '%Y-%m-%d').date()
        tanggal_selesai_obj = None
        if data.get('tanggal_selesai'):
            tanggal_selesai_obj = datetime.strptime(data['tanggal_selesai'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"msg": "Format tanggal salah. Gunakan YYYY-MM-DD."}), 400

    # Buat objek RscaCycle terlebih dahulu
    new_cycle = RscaCycle(
        nama_siklus=data['nama_siklus'],
        tanggal_mulai=tanggal_mulai_obj,
        tanggal_selesai=tanggal_selesai_obj,
        status=data.get('status', 'Draft')
    )

    # Cari objek Departemen berdasarkan ID dan tambahkan ke siklus
    for dept_id in data['department_ids']:
        dept = Department.query.get(dept_id)
        if dept:
            new_cycle.departments.append(dept)
        else:
            # Jika ada ID departemen yang tidak valid, batalkan proses
            return jsonify({"msg": f"Departemen dengan ID {dept_id} tidak ditemukan."}), 404

    db.session.add(new_cycle)
    db.session.commit()

    return jsonify({"msg": "Siklus RSCA berhasil dibuat.", "cycle_id": new_cycle.id}), 201

# --- API untuk RSCA ---

@api_bp.route('/my-rsca-tasks', methods=['GET'])
@jwt_required()
def get_my_rsca_tasks():
    """Mengambil daftar siklus RSCA yang ditugaskan ke departemen pengguna."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.department_id:
        return jsonify({"msg": "Pengguna tidak terhubung ke departemen manapun."}), 404
    
    # Cari semua siklus yang melibatkan departemen pengguna
    tasks = RscaCycle.query.join(RscaCycle.departments).filter(Department.id == user.department_id).all()
    
    task_list = [{
        "id": task.id,
        "nama_siklus": task.nama_siklus,
        "status": task.status,
        "tanggal_mulai": task.tanggal_mulai.isoformat()
    } for task in tasks]
        
    return jsonify(task_list)

@api_bp.route('/rsca-cycles/<int:cycle_id>/questionnaire', methods=['GET'])
@jwt_required()
def get_rsca_questionnaire(cycle_id):
    """Mengambil daftar pertanyaan untuk siklus RSCA tertentu."""
    cycle = RscaCycle.query.get_or_404(cycle_id)
    questions = cycle.questionnaires
    
    question_list = [{
        "id": q.id,
        "pertanyaan": q.pertanyaan,
        "kategori": q.kategori
    } for q in questions]
        
    return jsonify(question_list)

@api_bp.route('/rsca-cycles/<int:cycle_id>/answers', methods=['POST'])
@jwt_required()
def submit_rsca_answers(cycle_id):
    """Menerima jawaban kuesioner dari departemen pengguna."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user.department_id:
        return jsonify({"msg": "Pengguna tidak terhubung ke departemen."}), 400
        
    data = request.get_json() # Data diharapkan berupa list jawaban
    
    for answer_data in data.get('answers', []):
        new_answer = RscaAnswer(
            jawaban=answer_data.get('jawaban'),
            catatan=answer_data.get('catatan'),
            cycle_id=cycle_id,
            questionnaire_id=answer_data.get('questionnaire_id'),
            department_id=user.department_id
        )
        db.session.add(new_answer)
    
    db.session.commit()
    return jsonify({"msg": "Jawaban berhasil disimpan."}), 201
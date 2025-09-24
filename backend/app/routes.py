import os
from flask import request, jsonify, Blueprint
from .models import User, KRI, RiskAssessment, HorizonScanEntry, RiskRegister, Department, RscaCycle, RscaQuestionnaire, RscaAnswer, BusinessProcess, ProcessStep, CriticalAsset, Dependency, ImpactScenario
from . import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from app.ai_services import summarize_text_with_gemini, analyze_rsca_answers_with_gemini, suggest_risks_for_process_step, analyze_bia_with_gemini

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
def get_all_assessments():
    """Mengambil semua proyek asesmen milik pengguna (hanya data ringkas)."""
    current_user_id = get_jwt_identity()
    assessments = RiskAssessment.query.filter_by(user_id=current_user_id).order_by(RiskAssessment.tanggal_mulai.desc()).all()
    
    assessment_list = [{
        "id": a.id,
        "nama_asesmen": a.nama_asesmen,
        "tanggal_mulai": a.tanggal_mulai.isoformat(),
        "tanggal_selesai": a.tanggal_selesai.isoformat() if a.tanggal_selesai else None
    } for a in assessments]
        
    return jsonify(assessment_list)

@api_bp.route('/assessments/<int:assessment_id>', methods=['GET'])
@jwt_required()
def get_assessment_details(assessment_id):
    """Mengambil data detail dari satu asesmen, termasuk risk register-nya."""
    current_user_id = get_jwt_identity()
    assessment = RiskAssessment.query.filter_by(id=assessment_id, user_id=current_user_id).first_or_404()
    
    risk_entries = [{
        "id": r.id,
        "kode_risiko": r.kode_risiko,
        "deskripsi_risiko": r.deskripsi_risiko,
        "level_risiko_inheren": r.level_risiko_inheren
    } for r in assessment.risk_register_entries]
    
    return jsonify({
        "id": assessment.id,
        "nama_asesmen": assessment.nama_asesmen,
        "deskripsi": assessment.deskripsi,
        "ruang_lingkup": assessment.ruang_lingkup,
        "tanggal_mulai": assessment.tanggal_mulai.isoformat(),
        "risks": risk_entries
    })
    
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

@api_bp.route('/rsca-cycles/<int:cycle_id>/analyze', methods=['POST'])
@jwt_required()
def analyze_rsca_cycle(cycle_id):
    """Memicu analisis AI pada semua jawaban dari sebuah siklus RSCA."""
    # Dapatkan API Key
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        return jsonify({"msg": "Konfigurasi API Key AI tidak ditemukan di server."}), 500

    # Cari siklus dan semua jawabannya
    cycle = RscaCycle.query.get_or_404(cycle_id)
    answers = RscaAnswer.query.filter_by(cycle_id=cycle.id).all()

    if not answers:
        return jsonify({"msg": "Tidak ada jawaban untuk dianalisis di siklus ini."}), 404

    # Format semua jawaban menjadi satu teks besar untuk dikirim ke AI
    full_text_for_ai = ""
    for ans in answers:
        question = RscaQuestionnaire.query.get(ans.questionnaire_id)
        department = Department.query.get(ans.department_id)
        full_text_for_ai += f"Pertanyaan: {question.pertanyaan}\n"
        full_text_for_ai += f"Departemen: {department.name}\n"
        full_text_for_ai += f"Jawaban: {ans.jawaban}\n"
        full_text_for_ai += f"Catatan: {ans.catatan}\n"
        full_text_for_ai += "---\n"

    # Panggil fungsi analisis AI
    ai_result = analyze_rsca_answers_with_gemini(full_text_for_ai, gemini_api_key)

    if not ai_result:
        return jsonify({"msg": "Gagal mendapatkan hasil analisis dari AI."}), 500

    # Simpan hasil analisis ke database
    cycle.ai_summary = ai_result
    db.session.commit()

    return jsonify({"msg": "Analisis AI berhasil diselesaikan dan disimpan.", "summary": ai_result})

# Membuat dan Membaca daftar Proses Bisnis
@api_bp.route('/business-processes', methods=['POST'])
@jwt_required()
def create_business_process():
    """Membuat proses bisnis baru."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data or not data.get('nama_proses'):
        return jsonify({"msg": "Nama proses wajib diisi."}), 400

    new_process = BusinessProcess(
        nama_proses=data['nama_proses'],
        pemilik_proses=data.get('pemilik_proses'),
        user_id=current_user_id
    )
    db.session.add(new_process)
    db.session.commit()
    return jsonify({"msg": "Proses bisnis berhasil dibuat.", "id": new_process.id}), 201

@api_bp.route('/business-processes', methods=['GET'])
@jwt_required()
def get_business_processes():
    """Mengambil semua proses bisnis milik pengguna."""
    current_user_id = get_jwt_identity()
    processes = BusinessProcess.query.filter_by(user_id=current_user_id).all()
    process_list = [{
        "id": p.id,
        "nama_proses": p.nama_proses,
        "pemilik_proses": p.pemilik_proses
    } for p in processes]
    return jsonify(process_list)

# Mengelola satu Proses Bisnis spesifik dan langkah-langkahnya
@api_bp.route('/business-processes/<int:process_id>', methods=['GET'])
@jwt_required()
def get_business_process_details(process_id):
    """Mengambil detail satu proses bisnis beserta langkah-langkahnya."""
    current_user_id = get_jwt_identity()
    process = BusinessProcess.query.filter_by(id=process_id, user_id=current_user_id).first_or_404()
    
    steps = sorted(process.steps, key=lambda x: x.urutan) # Urutkan langkah berdasarkan nomor urutan

    return jsonify({
        "id": process.id,
        "nama_proses": process.nama_proses,
        "pemilik_proses": process.pemilik_proses,
        "steps": [{
            "id": s.id,
            "nama_langkah": s.nama_langkah,
            "deskripsi_langkah": s.deskripsi_langkah,
            "urutan": s.urutan
        } for s in steps]
    })

# Membuat Langkah Proses (Process Step) baru untuk sebuah proses bisnis
@api_bp.route('/business-processes/<int:process_id>/steps', methods=['POST'])
@jwt_required()
def add_process_step(process_id):
    """Menambahkan langkah proses baru ke dalam sebuah proses bisnis."""
    current_user_id = get_jwt_identity()
    process = BusinessProcess.query.filter_by(id=process_id, user_id=current_user_id).first_or_404()
    
    data = request.get_json()
    if not data or not data.get('nama_langkah') or 'urutan' not in data:
        return jsonify({"msg": "Nama langkah dan urutan wajib diisi."}), 400

    new_step = ProcessStep(
        nama_langkah=data['nama_langkah'],
        deskripsi_langkah=data.get('deskripsi_langkah'),
        urutan=data['urutan'],
        process_id=process.id
    )
    db.session.add(new_step)
    db.session.commit()
    return jsonify({"msg": "Langkah proses berhasil ditambahkan.", "id": new_step.id}), 201

# Mengelola satu Langkah Proses spesifik (Update & Delete)
@api_bp.route('/steps/<int:step_id>', methods=['PUT'])
@jwt_required()
def update_process_step(step_id):
    """Memperbarui sebuah langkah proses."""
    current_user_id = get_jwt_identity()
    step = ProcessStep.query.get_or_404(step_id)
    # Otorisasi: Cek apakah langkah ini milik proses punya pengguna yang login
    if str(step.business_process.user_id) != current_user_id:
        return jsonify({"msg": "Akses ditolak"}), 403

    data = request.get_json()
    step.nama_langkah = data.get('nama_langkah', step.nama_langkah)
    step.deskripsi_langkah = data.get('deskripsi_langkah', step.deskripsi_langkah)
    step.urutan = data.get('urutan', step.urutan)
    db.session.commit()
    return jsonify({"msg": "Langkah proses berhasil diperbarui."})

@api_bp.route('/steps/<int:step_id>', methods=['DELETE'])
@jwt_required()
def delete_process_step(step_id):
    """Menghapus sebuah langkah proses."""
    current_user_id = get_jwt_identity()
    step = ProcessStep.query.get_or_404(step_id)
    if str(step.business_process.user_id) != current_user_id:
        return jsonify({"msg": "Akses ditolak"}), 403
        
    db.session.delete(step)
    db.session.commit()
    return jsonify({"msg": "Langkah proses berhasil dihapus."})

@api_bp.route('/ai/suggest-risks-for-step', methods=['POST'])
@jwt_required()
def suggest_risks_ai():
    """Menerima deskripsi langkah proses dan mengembalikan saran risiko dari AI."""
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        return jsonify({"msg": "Konfigurasi API Key AI tidak ditemukan."}), 500

    data = request.get_json()
    step_description = data.get('step_description')
    if not step_description:
        return jsonify({"msg": "Deskripsi langkah (step_description) wajib diisi."}), 400

    # Panggil fungsi AI
    suggested_risks_raw = suggest_risks_for_process_step(step_description, gemini_api_key)

    if not suggested_risks_raw:
        return jsonify({"msg": "Gagal mendapatkan saran dari AI."}), 500

    # Olah output dari AI menjadi sebuah list
    risk_list = [risk.strip() for risk in suggested_risks_raw.strip().split('\n') if risk.strip()]

    return jsonify(suggested_risks=risk_list)

@api_bp.route('/critical-assets', methods=['POST'])
@jwt_required()
def create_critical_asset():
    """Membuat aset kritis baru."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data or not data.get('nama_aset') or not data.get('tipe_aset'):
        return jsonify({"msg": "Nama dan tipe aset wajib diisi."}), 400

    new_asset = CriticalAsset(
        nama_aset=data['nama_aset'],
        tipe_aset=data['tipe_aset'],
        deskripsi=data.get('deskripsi'),
        user_id=current_user_id
    )
    db.session.add(new_asset)
    db.session.commit()
    return jsonify({"msg": "Aset kritis berhasil dibuat.", "id": new_asset.id}), 201

@api_bp.route('/critical-assets', methods=['GET'])
@jwt_required()
def get_critical_assets():
    """Mengambil daftar semua aset kritis milik pengguna."""
    current_user_id = get_jwt_identity()
    assets = CriticalAsset.query.filter_by(user_id=current_user_id).all()
    asset_list = [{
        "id": asset.id,
        "nama_aset": asset.nama_aset,
        "tipe_aset": asset.tipe_aset
    } for asset in assets]
    return jsonify(asset_list)

# --- API untuk Ketergantungan (Dependencies) ---

@api_bp.route('/dependencies', methods=['POST'])
@jwt_required()
def create_dependency():
    """Membuat hubungan ketergantungan baru antar aset."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data or 'asset_id' not in data or 'depends_on_asset_id' not in data:
        return jsonify({"msg": "asset_id dan depends_on_asset_id wajib diisi."}), 400

    asset1 = CriticalAsset.query.filter_by(id=data['asset_id'], user_id=current_user_id).first_or_404("Aset asal tidak ditemukan atau bukan milik Anda.")
    asset2 = CriticalAsset.query.filter_by(id=data['depends_on_asset_id'], user_id=current_user_id).first_or_404("Aset tujuan tidak ditemukan atau bukan milik Anda.")

    new_dependency = Dependency(
        asset_id=asset1.id,
        depends_on_asset_id=asset2.id
    )
    db.session.add(new_dependency)
    db.session.commit()
    return jsonify({"msg": "Hubungan ketergantungan berhasil dibuat.", "id": new_dependency.id}), 201

@api_bp.route('/critical-assets/<int:asset_id>/dependencies', methods=['GET'])
@jwt_required()
def get_asset_dependencies(asset_id):
    """Mengambil semua ketergantungan untuk sebuah aset spesifik."""
    current_user_id = get_jwt_identity()
    asset = CriticalAsset.query.filter_by(id=asset_id, user_id=current_user_id).first_or_404()

    # Aset-aset yang dibutuhkan oleh aset ini (dependencies_on)
    depends_on_list = [{
        "dependency_id": dep.id,
        "asset_id": dep.depends_on.id,
        "nama_aset": dep.depends_on.nama_aset
    } for dep in asset.dependencies_on]

    # Aset-aset lain yang membutuhkan aset ini (depended_on_by)
    depended_on_by_list = [{
        "dependency_id": dep.id,
        "asset_id": dep.asset.id,
        "nama_aset": dep.asset.nama_aset
    } for dep in asset.depended_on_by]

    return jsonify({
        "depends_on": depends_on_list,
        "depended_on_by": depended_on_by_list
    })
    
@api_bp.route('/bia/simulate', methods=['POST'])
@jwt_required()
def simulate_bia():
    """Menjalankan simulasi BIA dengan input dari frontend."""
    current_user_id = get_jwt_identity()
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        return jsonify({"msg": "Konfigurasi API Key AI tidak ditemukan."}), 500

    data = request.get_json()
    asset_id = data.get('asset_id')
    duration = data.get('duration')

    if not asset_id or not duration:
        return jsonify({"msg": "asset_id dan duration wajib diisi."}), 400

    failed_asset = CriticalAsset.query.filter_by(id=asset_id, user_id=current_user_id).first_or_404()

    # --- Logika untuk menelusuri aset terdampak ---
    impacted_assets_names = set()
    assets_to_check = [failed_asset]
    checked_ids = {failed_asset.id}

    while assets_to_check:
        current_asset = assets_to_check.pop(0)
        # Cari semua aset yang bergantung pada current_asset
        for dep in current_asset.depended_on_by:
            if dep.asset.id not in checked_ids:
                impacted_assets_names.add(dep.asset.nama_aset)
                assets_to_check.append(dep.asset)
                checked_ids.add(dep.asset.id)
    
    # Ambil beberapa KRI relevan untuk konteks (contoh sederhana)
    relevant_kris = KRI.query.filter_by(user_id=current_user_id).limit(5).all()
    kri_list = [{"nama_kri": k.nama_kri, "ambang_batas_kritis": k.ambang_batas_kritis} for k in relevant_kris]

    # Panggil fungsi AI
    analysis_result = analyze_bia_with_gemini(
        failed_asset_name=failed_asset.nama_aset,
        downtime=duration,
        impacted_assets=list(impacted_assets_names),
        kris=kri_list,
        api_key=gemini_api_key
    )

    if not analysis_result:
        return jsonify({"msg": "Gagal mendapatkan analisis dari AI."}), 500

    return jsonify({"analysis": analysis_result})
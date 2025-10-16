import os
import json
from flask import request, jsonify, Blueprint, current_app
from .models import User, KRI, RiskAssessment, HorizonScanEntry, RiskRegister, Department, RscaCycle, RscaQuestionnaire, RscaAnswer, BusinessProcess, ProcessStep, CriticalAsset, Dependency, ImpactScenario, MasterData, Regulation, MainRiskRegister, BasicAssessment, OrganizationalContext, BasicRiskIdentification, BasicRiskAnalysis
from . import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from app.ai_services import summarize_text_with_gemini, analyze_rsca_answers_with_gemini, suggest_risks_for_process_step, analyze_bia_with_gemini, analyze_assessment_with_gemini, generate_detailed_risk_analysis_with_gemini
from functools import wraps
from werkzeug.utils import secure_filename

# Membuat Blueprint untuk API
api_bp = Blueprint('api', __name__)

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            # Cek apakah 'role' di dalam token adalah 'admin'
            if claims.get("role") != "admin":
                return jsonify(msg="Hanya admin yang diizinkan!"), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

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

    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        # === PERUBAHAN: Sisipkan role ke dalam token JWT ===
        additional_claims = {"role": user.role}
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        return jsonify(access_token=access_token)

    return jsonify({"msg": "Email atau password salah"}), 401


# === ENDPOINT BARU: UNTUK MENGAMBIL INFO USER YANG SEDANG LOGIN ===
@api_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Mengambil detail pengguna yang sedang login."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"msg": "User tidak ditemukan"}), 404
    
    claims = get_jwt()
    
    return jsonify({
        "id": user.id,
        "nama_lengkap": user.nama_lengkap,
        "email": user.email,
        "role": claims.get('role', 'user')
    }), 200


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
    if not data or not data.get('nama_asesmen'):
        return jsonify({"msg": "Nama asesmen wajib diisi"}), 400

    # Validasi minimal 1 kategori risiko
    if not data.get('risk_categories') or len(data.get('risk_categories')) == 0:
        return jsonify({"msg": "Pilih minimal satu Kategori Risiko."}), 400

    # Coba konversi risk_limit ke float, default ke 0 jika gagal atau tidak ada
    try:
        risk_limit_val = float(data.get('risk_limit', 0))
    except (ValueError, TypeError):
        risk_limit_val = 0

    # Buat instance RiskAssessment baru
    new_assessment = RiskAssessment(
        nama_asesmen=data['nama_asesmen'],
        tanggal_mulai=datetime.utcnow().date(),
        company_industry=data.get('company_industry'),
        company_type=data.get('company_type'),
        company_assets=data.get('company_assets'),
        currency=data.get('currency'),
        risk_limit=risk_limit_val,
        risk_categories=",".join(data.get('risk_categories', [])),
        project_objective=data.get('project_objective'),
        relevant_regulations=data.get('relevant_regulations'),
        involved_departments=data.get('involved_departments'),
        completed_actions=data.get('completed_actions'),
        additional_risk_context=data.get('additional_risk_context'),
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
    
    assessment_list = []
    for a in assessments:
        assessment_list.append({
            "id": a.id,
            "nama_asesmen": a.nama_asesmen,
            "tanggal_mulai": a.tanggal_mulai.isoformat(),
            "tanggal_selesai": a.tanggal_selesai.isoformat() if a.tanggal_selesai else None,
            # --- TAMBAHAN BARU: Sertakan data industri dan risiko ---
            "company_industry": a.company_industry,
            "risks": [{
                "inherent_likelihood": r.inherent_likelihood,
                "inherent_impact": r.inherent_impact
            } for r in a.risk_register_entries]
        })
        
    return jsonify(assessment_list)

@api_bp.route('/assessments/<int:assessment_id>', methods=['GET'])
@jwt_required()
def get_assessment_details(assessment_id):
    """Mengambil data detail dari satu asesmen, termasuk risk register-nya."""
    current_user_id = get_jwt_identity()
    assessment = RiskAssessment.query.filter_by(id=assessment_id, user_id=current_user_id).first_or_404()
    
    creator_user = User.query.get(assessment.user_id)
    created_by_user_name = creator_user.nama_lengkap if creator_user else "N/A"
    created_by_user_email = creator_user.email if creator_user else ""
    
    risk_entries = [{
        "id": r.id,
        "kode_risiko": r.kode_risiko,
        "objective": r.objective,
        "risk_type": r.risk_type,
        "deskripsi_risiko": r.deskripsi_risiko,
        "risk_causes": r.risk_causes,
        "risk_impacts": r.risk_impacts,
        "existing_controls": r.existing_controls,
        "control_effectiveness": r.control_effectiveness,
        "inherent_likelihood": r.inherent_likelihood,
        "inherent_impact": r.inherent_impact,
        "mitigation_plan": r.mitigation_plan,
        "residual_likelihood": r.residual_likelihood,
        "residual_impact": r.residual_impact,
    } for r in assessment.risk_register_entries]
    
    def safe_json_loads(json_string):
        if not json_string: return None
        try:
            return json.loads(json_string)
        except (json.JSONDecodeError, TypeError):
            return None
    
    return jsonify({
        "id": assessment.id,
        "nama_asesmen": assessment.nama_asesmen,
        "tanggal_mulai": assessment.tanggal_mulai.isoformat(),
        "created_by_user_name": created_by_user_name,
        "created_by_user_email": created_by_user_email,
        "company_industry": assessment.company_industry,
        "company_type": assessment.company_type,
        "company_assets": assessment.company_assets,
        "currency": assessment.currency,
        "risk_limit": assessment.risk_limit,
        "risk_categories": assessment.risk_categories,
        "project_objective": assessment.project_objective,
        "relevant_regulations": assessment.relevant_regulations,
        "involved_departments": assessment.involved_departments,
        "completed_actions": assessment.completed_actions,
        "additional_risk_context": assessment.additional_risk_context,
        "risks": risk_entries,
        "ai_executive_summary": assessment.ai_executive_summary,
        "ai_risk_profile_analysis": safe_json_loads(assessment.ai_risk_profile_analysis),
        "ai_immediate_priorities": safe_json_loads(assessment.ai_immediate_priorities),
        "ai_critical_risks_discussion": safe_json_loads(assessment.ai_critical_risks_discussion),
        "ai_implementation_plan": safe_json_loads(assessment.ai_implementation_plan),
        "ai_next_steps": assessment.ai_next_steps,
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

# === ENDPOINTS UNTUK MASTER DATA ===
@api_bp.route('/master-data', methods=['GET'])
@jwt_required()
def get_master_data():
    """(Publik) Mengambil data master berdasarkan kategori untuk dropdown."""
    category = request.args.get('category')
    if not category:
        return jsonify({"msg": "Parameter 'category' wajib diisi."}), 400
    
    data = MasterData.query.filter_by(category=category.upper()).all()
    result = [{"key": item.key, "value": item.value} for item in data]
    return jsonify(result)

@api_bp.route('/admin/master-data', methods=['GET'])
@admin_required() # <-- Menggunakan decorator admin
def get_all_master_data():
    """[Admin] Mengambil semua master data, dikelompokkan."""
    all_data = MasterData.query.order_by(MasterData.category, MasterData.id).all()
    grouped_data = {}
    for item in all_data:
        if item.category not in grouped_data:
            grouped_data[item.category] = []
        grouped_data[item.category].append({"id": item.id, "key": item.key, "value": item.value})
    return jsonify(grouped_data)

@api_bp.route('/admin/master-data', methods=['POST'])
@admin_required() # <-- Menggunakan decorator admin
def create_master_data():
    """[Admin] Membuat entri master data baru."""
    data = request.get_json()
    if not data or not data.get('category') or not data.get('key') or not data.get('value'):
        return jsonify({"msg": "Category, Key, dan Value wajib diisi"}), 400
    
    new_item = MasterData(
        category=data['category'].upper(), 
        key=data['key'], 
        value=data['value']
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify({"msg": "Data berhasil dibuat", "id": new_item.id}), 201
    
@api_bp.route('/admin/master-data/<int:id>', methods=['DELETE'])
@admin_required() # <-- Menggunakan decorator admin
def delete_master_data(id):
    """[Admin] Menghapus entri master data."""
    item = MasterData.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"msg": "Data berhasil dihapus"})

@api_bp.route('/admin/master-data/<int:id>', methods=['PUT'])
@admin_required()
def update_master_data(id):
    """[Admin] Memperbarui entri master data."""
    item = MasterData.query.get_or_404(id)
    data = request.get_json()

    # Update key dan value jika ada di data yang dikirim
    item.key = data.get('key', item.key)
    item.value = data.get('value', item.value)

    db.session.commit()
    return jsonify({"msg": "Data berhasil diperbarui"})

# === ENDPOINTS UNTUK MASTER REGULASI ===
@api_bp.route('/admin/regulations', methods=['GET'])
@admin_required()
def get_regulations():
    """[Admin] Mengambil semua data regulasi."""
    regulations = Regulation.query.order_by(Regulation.name).all()
    return jsonify([{
        "id": reg.id,
        "name": reg.name,
        "description": reg.description,
        "filename": reg.filename,
        "created_at": reg.created_at.isoformat()
    } for reg in regulations])

@api_bp.route('/admin/regulations', methods=['POST'])
@admin_required()
def create_regulation():
    """[Admin] Menambah regulasi baru dan meng-upload file."""
    # Ambil data form
    name = request.form.get('name')
    description = request.form.get('description')
    
    if not name or 'file' not in request.files:
        return jsonify({"msg": "Nama regulasi dan file wajib diisi."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "Tidak ada file yang dipilih."}), 400

    # Simpan file dengan aman
    filename = secure_filename(file.filename)
    # Pastikan direktori uploads ada
    upload_folder = current_app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    file.save(os.path.join(upload_folder, filename))

    # Simpan informasi ke database
    new_regulation = Regulation(
        name=name,
        description=description,
        filename=filename
    )
    db.session.add(new_regulation)
    db.session.commit()

    return jsonify({"msg": "Regulasi berhasil ditambahkan."}), 201

@api_bp.route('/admin/regulations/<int:id>', methods=['DELETE'])
@admin_required()
def delete_regulation(id):
    """[Admin] Menghapus regulasi dan file terkait."""
    regulation = Regulation.query.get_or_404(id)
    
    # Hapus file dari folder uploads jika ada
    if regulation.filename:
        try:
            os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], regulation.filename))
        except OSError as e:
            print(f"Error saat menghapus file: {e.strerror}")
            
    # Hapus data dari database
    db.session.delete(regulation)
    db.session.commit()
    
    return jsonify({"msg": "Regulasi berhasil dihapus."})


# === ENDPOINT UNTUK PENCARIAN REGULASI (AUTO-SUGGEST) ===

@api_bp.route('/regulations/search', methods=['GET'])
@jwt_required()
def search_regulations():
    """Mencari regulasi berdasarkan query untuk form assessment."""
    query = request.args.get('q', '')
    if len(query) < 2: # Hanya cari jika user sudah mengetik minimal 2 huruf
        return jsonify([])

    # Cari regulasi yang namanya mengandung query (case-insensitive)
    search_term = f"%{query}%"
    regulations = Regulation.query.filter(Regulation.name.ilike(search_term)).limit(10).all()

    return jsonify([{
        "value": reg.id,  # ID akan menjadi nilai yang disimpan
        "label": reg.name, # Nama akan menjadi teks yang ditampilkan
        "description": reg.description
    } for reg in regulations])

from flask import send_from_directory

@api_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    """Menyajikan file yang sudah di-upload."""
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

# === ENDPOINT BARU UNTUK ANALISIS AI ===
@api_bp.route('/assessments/analyze', methods=['POST'])
@jwt_required()
def analyze_assessment():
    current_user_id = get_jwt_identity()
    form_data = request.get_json()

    # --- Validasi Input (Tidak Berubah) ---
    if not form_data or not form_data.get('nama_asesmen'):
        return jsonify({"msg": "Nama asesmen wajib diisi"}), 400
    if not form_data.get('risk_categories'):
        return jsonify({"msg": "Pilih minimal satu Kategori Risiko."}), 400

    # --- 1. Buat dan Simpan Proyek Asesmen (Tidak Berubah) ---
    new_assessment = RiskAssessment(
        nama_asesmen=form_data.get('nama_asesmen'),
        tanggal_mulai=datetime.utcnow().date(),
        company_industry=form_data.get('company_industry'),
        company_type=form_data.get('company_type'),
        company_assets=form_data.get('company_assets'),
        currency=form_data.get('currency'),
        risk_limit=float(form_data.get('risk_limit', 0)),
        risk_categories=",".join(form_data.get('risk_categories', [])),
        project_objective=form_data.get('project_objective'),
        relevant_regulations=form_data.get('relevant_regulations'),
        involved_departments=form_data.get('involved_departments'),
        completed_actions=form_data.get('completed_actions'),
        additional_risk_context=form_data.get('additional_risk_context'),
        user_id=current_user_id
    )
    db.session.add(new_assessment)
    db.session.flush()
    assessment_id = new_assessment.id

    # --- 2. Panggil Layanan AI (Tidak Berubah) ---
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        db.session.rollback()
        return jsonify({"msg": "Konfigurasi API Key AI tidak ditemukan."}), 500
        
    identified_risks = analyze_assessment_with_gemini(form_data, gemini_api_key)

    # --- 3. Simpan Hasil Analisis AI ke Risk Register (DIPERBAIKI) ---
    if identified_risks:
        for i, risk in enumerate(identified_risks):
            def safe_int(value):
                try:
                    return int(value)
                except (ValueError, TypeError):
                    return None
            
            risk_type_prefix = risk.get('risk_type', 'XX').upper()
            kode_risiko_unik = f"A{assessment_id}-{risk_type_prefix}{str(i+1).zfill(2)}"

            new_risk_entry = RiskRegister(
                kode_risiko=kode_risiko_unik,
                title=risk.get('title'),
                objective=risk.get('objective'),
                risk_type=risk.get('risk_type'),
                deskripsi_risiko=risk.get('deskripsi_risiko'),
                risk_causes=risk.get('risk_causes'),
                risk_impacts=risk.get('risk_impacts'),
                existing_controls=risk.get('existing_controls'),
                control_effectiveness=risk.get('control_effectiveness'),
                mitigation_plan=risk.get('mitigation_plan'),
                assessment_id=assessment_id,
                
                # Gunakan helper 'safe_int' untuk memastikan tipe datanya benar
                inherent_likelihood=safe_int(risk.get('inherent_likelihood')),
                inherent_impact=safe_int(risk.get('inherent_impact')),
                residual_likelihood=safe_int(risk.get('residual_likelihood')),
                residual_impact=safe_int(risk.get('residual_impact')),
            )
            db.session.add(new_risk_entry)
            
            print("Membuat ringkasan dan rekomendasi dari risiko yang teridentifikasi...")
            analysis_content = generate_detailed_risk_analysis_with_gemini(identified_risks, gemini_api_key)
            
            if analysis_content:
                new_assessment.ai_executive_summary = analysis_content.get("executive_summary")
                new_assessment.ai_risk_profile_analysis = json.dumps(analysis_content.get("risk_profile_analysis"))
                new_assessment.ai_immediate_priorities = json.dumps(analysis_content.get("immediate_priorities"))
                new_assessment.ai_critical_risks_discussion = json.dumps(analysis_content.get("critical_risks_discussion"))
                new_assessment.ai_implementation_plan = json.dumps(analysis_content.get("implementation_plan"))
                new_assessment.ai_next_steps = analysis_content.get("next_steps")
                print("Analisis detail berhasil dibuat.")
    else:
        db.session.commit()
        return jsonify({"msg": "Asesmen berhasil dibuat, namun analisis AI gagal.", "assessment_id": assessment_id}), 500

    db.session.commit()
    return jsonify({"msg": "Analisis risiko AI berhasil dan disimpan.", "assessment_id": assessment_id}), 201

@api_bp.route('/risks/<int:risk_id>', methods=['PUT'])
@jwt_required()
def update_risk_item(risk_id):
    """Memperbarui detail satu item risiko."""
    current_user_id = get_jwt_identity()
    
    # Cari risk item berdasarkan ID-nya
    risk_item = RiskRegister.query.get_or_404(risk_id)

    # Otorisasi: Pastikan risk item ini milik asesmen yang dibuat oleh user yang sedang login
    assessment_owner_id = str(risk_item.assessment.user_id)
    if assessment_owner_id != current_user_id:
        return jsonify({"msg": "Akses ditolak. Anda bukan pemilik asesmen ini."}), 403

    data = request.get_json()
    if not data:
        return jsonify({"msg": "Request body tidak boleh kosong"}), 400

    # Update semua field yang mungkin diubah dari sidebar
    risk_item.objective = data.get('objective', risk_item.objective)
    risk_item.deskripsi_risiko = data.get('deskripsi_risiko', risk_item.deskripsi_risiko)
    risk_item.risk_causes = data.get('risk_causes', risk_item.risk_causes)
    risk_item.risk_impacts = data.get('risk_impacts', risk_item.risk_impacts)
    risk_item.existing_controls = data.get('existing_controls', risk_item.existing_controls)
    risk_item.control_effectiveness = data.get('control_effectiveness', risk_item.control_effectiveness)
    risk_item.mitigation_plan = data.get('mitigation_plan', risk_item.mitigation_plan)
    
    # Helper untuk memastikan nilai integer tidak error jika kosong
    def safe_int(value, default):
        try:
            return int(value) if value is not None else default
        except (ValueError, TypeError):
            return default

    risk_item.inherent_likelihood = safe_int(data.get('inherent_likelihood'), risk_item.inherent_likelihood)
    risk_item.inherent_impact = safe_int(data.get('inherent_impact'), risk_item.inherent_impact)
    risk_item.residual_likelihood = safe_int(data.get('residual_likelihood'), risk_item.residual_likelihood)
    risk_item.residual_impact = safe_int(data.get('residual_impact'), risk_item.residual_impact)

    # Simpan perubahan ke database
    db.session.commit()

    return jsonify({"msg": "Item risiko berhasil diperbarui."}), 200

@api_bp.route('/risk-register', methods=['GET'])
@jwt_required()
def get_main_risk_register():
    """Mengambil semua risiko dari register utama milik pengguna."""
    current_user_id = get_jwt_identity()
    risks = MainRiskRegister.query.filter_by(user_id=current_user_id).order_by(MainRiskRegister.created_at.desc()).all()
    
    risk_list = [{
        "id": r.id,
        "title": r.title,
        "kode_risiko": r.kode_risiko,
        "objective": r.objective,
        "risk_type": r.risk_type,
        "deskripsi_risiko": r.deskripsi_risiko,
        "risk_causes": r.risk_causes,
        "risk_impacts": r.risk_impacts,
        "existing_controls": r.existing_controls,
        "control_effectiveness": r.control_effectiveness,
        "inherent_likelihood": r.inherent_likelihood,
        "inherent_impact": r.inherent_impact,
        "mitigation_plan": r.mitigation_plan,
        "residual_likelihood": r.residual_likelihood,
        "residual_impact": r.residual_impact,
        "status": r.status,
        "treatment_option": r.treatment_option,
        "created_at": r.created_at.isoformat()
    } for r in risks]
    
    return jsonify(risk_list)

@api_bp.route('/risk-register/import', methods=['POST'])
@jwt_required()
def import_to_main_register():
    """Mengimpor risiko dari asesmen ke register utama."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    risk_ids_to_import = data.get('risk_ids')

    if not risk_ids_to_import:
        return jsonify({"msg": "Tidak ada ID risiko yang diberikan"}), 400

    imported_count = 0
    for risk_id in risk_ids_to_import:
        original_risk = RiskRegister.query.get(risk_id)
        
        # Otorisasi: pastikan risiko ini milik pengguna
        if original_risk and str(original_risk.assessment.user_id) == current_user_id:
            new_main_risk = MainRiskRegister(
                title=original_risk.title,
                kode_risiko=original_risk.kode_risiko,
                objective=original_risk.objective,
                risk_type=original_risk.risk_type,
                deskripsi_risiko=original_risk.deskripsi_risiko,
                risk_causes=original_risk.risk_causes,
                risk_impacts=original_risk.risk_impacts,
                existing_controls=original_risk.existing_controls,
                control_effectiveness=original_risk.control_effectiveness,
                inherent_likelihood=original_risk.inherent_likelihood,
                inherent_impact=original_risk.inherent_impact,
                mitigation_plan=original_risk.mitigation_plan,
                residual_likelihood=original_risk.residual_likelihood,
                residual_impact=original_risk.residual_impact,
                user_id=current_user_id,
                source_assessment_id=original_risk.assessment_id
            )
            db.session.add(new_main_risk)
            imported_count += 1
            
    db.session.commit()
    return jsonify({"msg": f"{imported_count} risiko berhasil diimpor ke Register Utama."}), 201

@api_bp.route('/risk-register/<int:risk_id>', methods=['PUT'])
@jwt_required()
def update_main_risk_register_item(risk_id):
    """Memperbarui satu item di Main Risk Register."""
    current_user_id = get_jwt_identity()
    risk_item = MainRiskRegister.query.filter_by(id=risk_id, user_id=current_user_id).first_or_404()

    data = request.get_json()
    if not data:
        return jsonify({"msg": "Request body tidak boleh kosong"}), 400

    # Loop melalui semua field yang bisa di-update
    for field in ['objective', 'deskripsi_risiko', 'risk_causes', 'risk_impacts', 'existing_controls', 'control_effectiveness', 'mitigation_plan', 'inherent_likelihood', 'inherent_impact', 'residual_likelihood', 'residual_impact', 'status', 'treatment_option']:
        if field in data:
            setattr(risk_item, field, data[field])
    
    db.session.commit()
    return jsonify({"msg": "Item risk register berhasil diperbarui.", "risk": {
        "id": risk_item.id,
        "kode_risiko": risk_item.kode_risiko,
        "objective": risk_item.objective,
        # ... tambahkan field lain jika perlu dikembalikan
    }}), 200

@api_bp.route('/risk-register/<int:risk_id>', methods=['DELETE'])
@jwt_required()
def delete_main_risk_register_item(risk_id):
    """Menghapus satu item dari Main Risk Register."""
    current_user_id = get_jwt_identity()
    risk_item = MainRiskRegister.query.filter_by(id=risk_id, user_id=current_user_id).first_or_404()

    db.session.delete(risk_item)
    db.session.commit()
    
    return jsonify({"msg": "Item risk register berhasil dihapus."}), 200

@api_bp.route('/risk-register/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_main_risk_register_items():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    risk_ids_to_delete = data.get('risk_ids')

    if not risk_ids_to_delete:
        return jsonify({"msg": "Tidak ada ID risiko yang diberikan"}), 400

    # Hapus hanya risiko yang dimiliki oleh user yang sedang login
    MainRiskRegister.query.filter(
        MainRiskRegister.id.in_(risk_ids_to_delete),
        MainRiskRegister.user_id == current_user_id
    ).delete(synchronize_session=False)
    
    db.session.commit()
    return jsonify({"msg": f"{len(risk_ids_to_delete)} risiko berhasil dihapus."}), 200

@api_bp.route('/basic-assessments', methods=['POST'])
@jwt_required()
def create_basic_assessment():
    """Endpoint untuk membuat Asesmen Dasar baru beserta konteks dan risikonya."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('nama_unit_kerja') or not data.get('nama_perusahaan'):
        return jsonify({"msg": "Nama Unit Kerja dan Nama Perusahaan wajib diisi."}), 400

    new_assessment = BasicAssessment(
        nama_unit_kerja=data['nama_unit_kerja'],
        nama_perusahaan=data['nama_perusahaan'],
        user_id=current_user_id
    )
    db.session.add(new_assessment)
    db.session.flush()

    # Proses data konteks jika ada
    contexts_data = data.get('contexts', [])
    for context_item in contexts_data:
        new_context = OrganizationalContext(
            external_context=context_item.get('external'),
            internal_context=context_item.get('internal'),
            user_id=current_user_id
        )
        db.session.add(new_context)
        # Flush untuk mendapatkan ID sebelum di-commit
        db.session.flush()
        new_assessment.contexts.append(new_context)

    # Proses data identifikasi risiko jika ada
    risks_data = data.get('risks', [])
    frontend_to_db_risk_id_map = {} 
    
    for index, risk_item in enumerate(risks_data):
        try:
            tanggal_obj = datetime.strptime(risk_item.get('tanggal_identifikasi'), '%Y-%m-%d').date()
        except (ValueError, TypeError):
            tanggal_obj = datetime.utcnow().date()
            
        new_risk = BasicRiskIdentification(
            kode_risiko=risk_item.get('kode_risiko'),
            kategori_risiko=risk_item.get('kategori_risiko'),
            unit_kerja=risk_item.get('unit_kerja'),
            sasaran=risk_item.get('sasaran'),
            tanggal_identifikasi=tanggal_obj,
            deskripsi_risiko=risk_item.get('deskripsi_risiko'),
            akar_penyebab=risk_item.get('akar_penyebab'),
            indikator_risiko=risk_item.get('indikator_risiko'),
            internal_control=risk_item.get('internal_control'),
            deskripsi_dampak=risk_item.get('deskripsi_dampak'),
            assessment_id=new_assessment.id
        )
        db.session.add(new_risk)
        db.session.flush()
        frontend_to_db_risk_id_map[index] = new_risk.id

    analyses_data = data.get('analyses', [])
    for analysis_item in analyses_data:
        frontend_risk_id = analysis_item.get('risk_identification_id')
        db_risk_id = frontend_to_db_risk_id_map.get(frontend_risk_id)

        if db_risk_id:
            new_analysis = BasicRiskAnalysis(
                risk_identification_id=db_risk_id,
                probabilitas=analysis_item.get('probabilitas'),
                dampak=analysis_item.get('dampak'),
                probabilitas_kualitatif=analysis_item.get('probabilitas_kualitatif'),
                dampak_finansial=analysis_item.get('dampak_finansial'),
                assessment_id=new_assessment.id
            )
            db.session.add(new_analysis)

    db.session.commit()

    return jsonify({"msg": "Asesmen Dasar berhasil dibuat.", "id": new_assessment.id}), 201


@api_bp.route('/basic-assessments', methods=['GET'])
@jwt_required()
def get_all_basic_assessments():
    """Mengambil semua Asesmen Dasar milik pengguna."""
    current_user_id = get_jwt_identity()
    assessments = BasicAssessment.query.filter_by(user_id=current_user_id).order_by(BasicAssessment.created_at.desc()).all()
    
    assessment_list = [{
        "id": a.id,
        "nama_unit_kerja": a.nama_unit_kerja,
        "nama_perusahaan": a.nama_perusahaan,
        "created_at": a.created_at.isoformat()
    } for a in assessments]
        
    return jsonify(assessment_list)

@api_bp.route('/basic-assessments/<int:assessment_id>', methods=['GET'])
@jwt_required()
def get_basic_assessment_detail(assessment_id):
    """Mengambil detail lengkap dari satu Asesmen Dasar."""
    current_user_id = get_jwt_identity()
    assessment = BasicAssessment.query.filter_by(id=assessment_id, user_id=current_user_id).first_or_404()

    risks_list = [{
        "id": r.id, # Sertakan ID asli dari database
        "kode_risiko": r.kode_risiko,
        "kategori_risiko": r.kategori_risiko,
        "unit_kerja": r.unit_kerja,
        "sasaran": r.sasaran,
        "tanggal_identifikasi": r.tanggal_identifikasi.isoformat(),
        "deskripsi_risiko": r.deskripsi_risiko,
        "akar_penyebab": r.akar_penyebab,
        "indikator_risiko": r.indikator_risiko,
        "internal_control": r.internal_control,
        "deskripsi_dampak": r.deskripsi_dampak
    } for r in assessment.risks]

    # 2. Buat pemetaan dari ID risiko ke index-nya di dalam list
    risk_id_to_index_map = {risk['id']: index for index, risk in enumerate(risks_list)}
    
    return jsonify({
        "id": assessment.id,
        "nama_unit_kerja": assessment.nama_unit_kerja,
        "nama_perusahaan": assessment.nama_perusahaan,
        "contexts": [{
            "external": ctx.external_context,
            "internal": ctx.internal_context
        } for ctx in assessment.contexts],
        "risks": risks_list,
        "analyses": [{
            "risk_identification_id": risk_id_to_index_map.get(a.risk_identification_id),
            "probabilitas": a.probabilitas,
            "dampak": a.dampak,
            "probabilitas_kualitatif": a.probabilitas_kualitatif,
            "dampak_finansial": a.dampak_finansial
        } for a in assessment.risk_analyses if a.risk_identification_id in risk_id_to_index_map]
    }), 200
    
@api_bp.route('/basic-assessments/<int:assessment_id>', methods=['PUT'])
@jwt_required()
def update_basic_assessment(assessment_id):
    """Memperbarui Asesmen Dasar yang ada."""
    current_user_id = get_jwt_identity()
    assessment = BasicAssessment.query.filter_by(id=assessment_id, user_id=current_user_id).first_or_404()
    data = request.get_json()

    assessment.nama_unit_kerja = data.get('nama_unit_kerja', assessment.nama_unit_kerja)
    assessment.nama_perusahaan = data.get('nama_perusahaan', assessment.nama_perusahaan)

    # Strategi "Delete-and-Recreate" untuk data terkait
    assessment.contexts.clear()
    BasicRiskAnalysis.query.filter_by(assessment_id=assessment.id).delete()
    BasicRiskIdentification.query.filter_by(assessment_id=assessment.id).delete()
    db.session.flush()

    # Tambahkan kembali data yang diperbarui (Logika ini sama persis dengan POST)
    contexts_data = data.get('contexts', [])
    for context_item in contexts_data:
        new_context = OrganizationalContext(
            external_context=context_item.get('external'),
            internal_context=context_item.get('internal'),
            user_id=current_user_id
        )
        db.session.add(new_context)
        db.session.flush()
        assessment.contexts.append(new_context)
    
    risks_data = data.get('risks', [])
    frontend_to_db_risk_id_map = {}
    for index, risk_item in enumerate(risks_data):
        try:
            tanggal_obj = datetime.strptime(risk_item.get('tanggal_identifikasi'), '%Y-%m-%d').date()
        except (ValueError, TypeError):
            tanggal_obj = datetime.utcnow().date()
            
        new_risk = BasicRiskIdentification(
            assessment_id=assessment.id,
            kode_risiko=risk_item.get('kode_risiko'),
            kategori_risiko=risk_item.get('kategori_risiko'),
            unit_kerja=risk_item.get('unit_kerja'),
            sasaran=risk_item.get('sasaran'),
            tanggal_identifikasi=tanggal_obj,
            deskripsi_risiko=risk_item.get('deskripsi_risiko'),
            akar_penyebab=risk_item.get('akar_penyebab'),
            indikator_risiko=risk_item.get('indikator_risiko'),
            internal_control=risk_item.get('internal_control'),
            deskripsi_dampak=risk_item.get('deskripsi_dampak')
        )
        db.session.add(new_risk)
        db.session.flush()
        frontend_to_db_risk_id_map[index] = new_risk.id

    analyses_data = data.get('analyses', [])
    for analysis_item in analyses_data:
        frontend_risk_id_index = analysis_item.get('risk_identification_id')
        db_risk_id = frontend_to_db_risk_id_map.get(frontend_risk_id_index)

        if db_risk_id:
            new_analysis = BasicRiskAnalysis(
                assessment_id=assessment.id,
                risk_identification_id=db_risk_id,
                probabilitas=analysis_item.get('probabilitas'),
                dampak=analysis_item.get('dampak'),
                probabilitas_kualitatif=analysis_item.get('probabilitas_kualitatif'),
                dampak_finansial=analysis_item.get('dampak_finansial')
            )
            db.session.add(new_analysis)

    db.session.commit()
    return jsonify({"msg": "Asesmen Dasar berhasil diperbarui."}), 200
# backend/app/routes/rsca.py
import os
from flask import request, jsonify, Blueprint
from app.models import db, User, Department, RscaCycle, RscaQuestionnaire, RscaAnswer
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.ai_services import analyze_rsca_answers_with_gemini

rsca_bp = Blueprint('rsca_bp', __name__)

@rsca_bp.route('/departments', methods=['POST'])
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

@rsca_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    """Mengambil daftar semua departemen."""
    depts = Department.query.all()
    dept_list = [{"id": dept.id, "name": dept.name} for dept in depts]
    return jsonify(dept_list), 200

@rsca_bp.route('/rsca-cycles', methods=['POST'])
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

@rsca_bp.route('/my-rsca-tasks', methods=['GET'])
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

@rsca_bp.route('/rsca-cycles/<int:cycle_id>/questionnaire', methods=['GET'])
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

@rsca_bp.route('/rsca-cycles/<int:cycle_id>/answers', methods=['POST'])
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

@rsca_bp.route('/rsca-cycles/<int:cycle_id>/analyze', methods=['POST'])
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
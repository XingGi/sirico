# backend/app/routes/bpr.py
import os
from flask import request, jsonify, Blueprint
from app.models import db, BusinessProcess, ProcessStep
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.ai_services import suggest_risks_for_process_step

bpr_bp = Blueprint('bpr_bp', __name__)

# Membuat dan Membaca daftar Proses Bisnis
@bpr_bp.route('/business-processes', methods=['POST'])
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

@bpr_bp.route('/business-processes', methods=['GET'])
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
@bpr_bp.route('/business-processes/<int:process_id>', methods=['GET'])
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
@bpr_bp.route('/business-processes/<int:process_id>/steps', methods=['POST'])
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
@bpr_bp.route('/steps/<int:step_id>', methods=['PUT'])
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

@bpr_bp.route('/steps/<int:step_id>', methods=['DELETE'])
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

@bpr_bp.route('/ai/suggest-risks-for-step', methods=['POST'])
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
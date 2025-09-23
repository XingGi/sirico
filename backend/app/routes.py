from flask import request, jsonify, Blueprint
from .models import User, KRI, RiskAssessment
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
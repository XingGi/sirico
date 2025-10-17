# backend/app/routes/auth.py
from flask import request, jsonify, Blueprint
from app.models import User
from app import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from functools import wraps

# Membuat Blueprint khusus untuk otentikasi
auth_bp = Blueprint('auth_bp', __name__)

# --- Helper Decorator untuk Admin ---
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

@auth_bp.route('/register', methods=['POST'])
def register():
    """Endpoint untuk registrasi pengguna baru."""
    data = request.get_json()
    
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


@auth_bp.route('/login', methods=['POST'])
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
@auth_bp.route('/me', methods=['GET'])
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


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Endpoint untuk logout."""
    return jsonify({"msg": "Logout berhasil"}), 200
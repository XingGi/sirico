# backend/app/routes/auth.py
from flask import request, jsonify, Blueprint
from app.models import User, Role, Permission
from app import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request, get_jwt
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

def permission_required(permission_name):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_permissions = claims.get("permissions", []) # Ambil permissions dari token
            is_admin = claims.get("role") == "admin"
            if permission_name not in user_permissions and not is_admin:
                if claims.get("role") != "admin":
                     return jsonify(msg=f"Akses ditolak: Membutuhkan permission '{permission_name}'."), 403
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
    
    try:
        user_role = Role.query.filter_by(name='User').first()
        if user_role:
            new_user.roles.append(user_role)
            print(f"Assigning default 'User' role to new user: {new_user.email}")
        else:
            # Ini seharusnya tidak terjadi jika seeder berjalan benar
            print(f"WARNING: Default 'User' role not found in database during registration for {new_user.email}. User created without roles.")
            # Pertimbangkan: return error atau biarkan user tanpa role?
            # Untuk sekarang, kita biarkan user dibuat tanpa role jika role 'User' tidak ada.
            # return jsonify({"msg": "Registrasi gagal: Role default 'User' tidak ditemukan."}), 500
    except Exception as e:
         print(f"Error finding or assigning default 'User' role: {e}")
         # Mungkin rollback? Tergantung kebutuhan.
         # db.session.rollback()
         # return jsonify({"msg": "Terjadi kesalahan saat assign role default."}), 500
         
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
    
    if user:
        print(f"--- Login attempt for: {user.email} ---")
        print(f"User ID from DB: {user.id}")
        # Coba akses relasi roles
        try:
            user_roles_list = user.roles
            print(f"User Roles from DB relationship: {[r.name for r in user_roles_list]}")
        except Exception as e:
            print(f"Error accessing user.roles: {e}")

    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        user_permissions = set()
        user_roles_names = []
        is_admin = False
        print("Processing roles for token:")
        for role in user.roles:
             print(f"  - Found role: {role.name} (ID: {role.id})") # Log role yang ditemukan
             user_roles_names.append(role.name)
             if role.name.lower() == 'admin':
                 is_admin = True
             for perm in role.permissions:
                 user_permissions.add(perm.name)

        additional_claims = {
            "role": "admin" if is_admin else (user_roles_names[0] if user_roles_names else "user"),
            "permissions": list(user_permissions) # Kirim list permission unik
        }
        
        print(f"Final additional_claims for token: {additional_claims}")
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
# backend/app/routes/admin.py
from flask import request, jsonify, Blueprint
from app.models import db, Role, Permission, User, BasicAssessment, MadyaAssessment, RiskAssessment
from app import bcrypt
from .auth import admin_required
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

admin_bp = Blueprint('admin_bp', __name__)

# --- CRUD untuk Roles ---

@admin_bp.route('/roles', methods=['POST'])
@admin_required() # Hanya admin yang bisa membuat role baru
def create_role():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"msg": "Nama role wajib diisi."}), 400

    if Role.query.filter_by(name=data['name']).first():
        return jsonify({"msg": "Nama role sudah ada."}), 409

    new_role = Role(name=data['name'], description=data.get('description'))

    # Tambahkan permissions jika ada ID yang dikirim
    permission_ids = data.get('permission_ids', [])
    if permission_ids:
        permissions = Permission.query.filter(Permission.id.in_(permission_ids)).all()
        new_role.permissions.extend(permissions)

    db.session.add(new_role)
    db.session.commit()
    return jsonify({"msg": "Role berhasil dibuat.", "id": new_role.id}), 201

@admin_bp.route('/roles', methods=['GET'])
@admin_required() # Hanya admin yang bisa melihat semua role
# @permission_required('view_roles') # Atau gunakan permission spesifik jika perlu
def get_roles():
    roles = Role.query.order_by(Role.name).all()
    result = []
    for role in roles:
        result.append({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            # Sertakan ID permission yang dimiliki role ini
            "permission_ids": [p.id for p in role.permissions]
        })
    return jsonify(result)

@admin_bp.route('/roles/<int:role_id>', methods=['PUT'])
@admin_required() # Hanya admin yang bisa edit
# @permission_required('edit_role')
def update_role(role_id):
    role = Role.query.get_or_404(role_id)
    data = request.get_json()

    role.name = data.get('name', role.name)
    role.description = data.get('description', role.description)

    # Update permissions: Hapus yang lama, tambah yang baru
    if 'permission_ids' in data: # Cek jika key 'permission_ids' ada di request
        permission_ids = data['permission_ids']
        if isinstance(permission_ids, list): # Pastikan berupa list
             # Dapatkan objek Permission berdasarkan ID
             new_permissions = Permission.query.filter(Permission.id.in_(permission_ids)).all()
             role.permissions = new_permissions # Ganti permissions yang lama
        else:
             return jsonify({"msg": "'permission_ids' harus berupa array."}), 400

    db.session.commit()
    return jsonify({"msg": "Role berhasil diperbarui."})

@admin_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@admin_required() # Hanya admin yang bisa hapus
# @permission_required('delete_role')
def delete_role(role_id):
    role = Role.query.get_or_404(role_id)
    # Tambahkan validasi: jangan hapus role 'admin' atau role yang masih dipakai user? (Opsional)
    if role.name.lower() == 'admin':
         return jsonify({"msg": "Role 'admin' tidak dapat dihapus."}), 400

    db.session.delete(role)
    db.session.commit()
    return jsonify({"msg": "Role berhasil dihapus."})

# --- Endpoint untuk Permissions ---

@admin_bp.route('/permissions', methods=['GET'])
@admin_required() # Hanya admin yang perlu tahu semua permission
# @permission_required('view_permissions')
def get_permissions():
    """Mengambil daftar semua permission yang tersedia."""
    # Opsi 1: Ambil dari database (jika kamu membuat seeder untuk permissions)
    permissions = Permission.query.order_by(Permission.name).all()
    result = [{"id": p.id, "name": p.name, "description": p.description} for p in permissions]

    # Opsi 2: Hardcode daftar permission (lebih simpel di awal)
    # PERMISSIONS_LIST = [
    #     {"id": 1, "name": "view_dashboard", "description": "Melihat halaman dashboard"},
    #     {"id": 2, "name": "manage_users", "description": "Mengelola data pengguna (Admin)"},
    #     {"id": 3, "name": "view_risk_assessment", "description": "Melihat daftar Risk Assessment AI"},
    #     {"id": 4, "name": "create_risk_assessment", "description": "Membuat Risk Assessment AI baru"},
    #     {"id": 5, "name": "edit_risk_assessment", "description": "Mengedit Risk Assessment AI"},
    #     {"id": 6, "name": "delete_risk_assessment", "description": "Menghapus Risk Assessment AI"},
    #     {"id": 7, "name": "view_risk_register", "description": "Melihat Risk Register Utama"},
    #     {"id": 8, "name": "edit_risk_register", "description": "Mengedit item di Risk Register Utama"},
    #     {"id": 9, "name": "delete_risk_register", "description": "Menghapus item dari Risk Register Utama"},
    #     # Tambahkan permission untuk fitur lain (Dasar, Madya, RSCA, BPR, BIA, Admin)
    #     {"id": 10, "name": "view_risk_dasar", "description": "Melihat daftar Asesmen Dasar"},
    #     {"id": 11, "name": "manage_risk_dasar", "description": "Membuat/Edit/Hapus Asesmen Dasar"}, # Gabung create, edit, delete
    #     {"id": 12, "name": "view_risk_madya", "description": "Melihat daftar Asesmen Madya"},
    #     {"id": 13, "name": "manage_risk_madya", "description": "Membuat/Edit/Hapus Asesmen Madya"},
    #     {"id": 14, "name": "view_risk_templates", "description": "Melihat daftar Template Peta Risiko"},
    #     {"id": 15, "name": "manage_risk_templates", "description": "Membuat/Edit/Hapus Template Peta Risiko"},
    #     {"id": 16, "name": "view_rsca", "description": "Melihat tugas RSCA"},
    #     {"id": 17, "name": "submit_rsca", "description": "Mengisi dan mengirim jawaban RSCA"},
    #     {"id": 18, "name": "manage_rsca_cycles", "description": "Membuat/Mengelola siklus RSCA (Admin)"},
    #     {"id": 19, "name": "view_bpr", "description": "Melihat Proses Bisnis"},
    #     {"id": 20, "name": "manage_bpr", "description": "Membuat/Edit/Hapus Proses Bisnis"},
    #     {"id": 21, "name": "view_bia", "description": "Melihat halaman BIA"},
    #     {"id": 22, "name": "run_bia_simulation", "description": "Menjalankan simulasi BIA"},
    #     {"id": 23, "name": "manage_critical_assets", "description": "Mengelola Aset Kritis (BIA)"},
    #     {"id": 24, "name": "view_admin_master_data", "description": "Melihat halaman Master Data (Admin)"},
    #     {"id": 25, "name": "manage_admin_master_data", "description": "Mengelola Master Data (Admin)"},
    #     {"id": 26, "name": "view_admin_regulations", "description": "Melihat halaman Master Regulasi (Admin)"},
    #     {"id": 27, "name": "manage_admin_regulations", "description": "Mengelola Master Regulasi (Admin)"},
    #     {"id": 28, "name": "view_roles", "description": "Melihat daftar Roles (Admin)"},
    #     {"id": 29, "name": "manage_roles", "description": "Membuat/Edit/Hapus Roles (Admin)"},
    #     # ... tambahkan permission lain sesuai kebutuhan ...
    # ]
    # result = PERMISSIONS_LIST

    return jsonify(result)

# --- Endpoint untuk Mengelola User & Roles (Contoh) ---
# Endpoint ini mungkin perlu dipisah ke blueprint lain jika semakin kompleks

@admin_bp.route('/users/<int:user_id>/roles', methods=['PUT'])
@admin_required() # Hanya admin yang bisa assign role
def assign_user_roles(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    role_ids = data.get('role_ids', [])

    if not isinstance(role_ids, list):
        return jsonify({"msg": "'role_ids' harus berupa array."}), 400

    # Dapatkan objek Role berdasarkan ID
    new_roles = Role.query.filter(Role.id.in_(role_ids)).all()
    user.roles = new_roles # Ganti roles yang lama dengan yang baru

    db.session.commit()
    return jsonify({"msg": f"Roles untuk user {user.email} berhasil diperbarui."})

@admin_bp.route('/users', methods=['GET'])
@admin_required() # Hanya admin yang bisa melihat semua user
def get_users():
     users = User.query.order_by(User.nama_lengkap).all()
     result = []
     for user in users:
         result.append({
             "id": user.id,
             "email": user.email,
             "nama_lengkap": user.nama_lengkap,
             "role_ids": [role.id for role in user.roles], # Kirim ID role yang dimiliki user
             "roles": [role.name for role in user.roles] # Kirim nama role juga bisa membantu
             # Jangan kirim password_hash
         })
     return jsonify(result)

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required()
def get_user_details_admin(user_id):
    """[Admin] Mengambil detail lengkap user berdasarkan ID."""
    user = User.query.get_or_404(user_id)

    count_dasar = db.session.query(func.count(BasicAssessment.id)).filter_by(user_id=user_id).scalar() or 0
    count_madya = db.session.query(func.count(MadyaAssessment.id)).filter_by(user_id=user_id).scalar() or 0
    count_ai = db.session.query(func.count(RiskAssessment.id)).filter_by(user_id=user_id).scalar() or 0

    assessment_limits = {
        "dasar": {"count": count_dasar, "limit": user.limit_dasar}, # Gunakan count asli
        "madya": {"count": count_madya, "limit": user.limit_madya}, # Gunakan count asli
        "ai": {"count": count_ai, "limit": user.limit_ai}          # Gunakan count asli
    }

    return jsonify({
        "id": user.id,
        "nama_lengkap": user.nama_lengkap,
        "email": user.email,
        "phone_number": getattr(user, 'phone_number', None),
        "institution": getattr(user, 'institution', None),
        "role_ids": [role.id for role in user.roles], # Kirim ID roles
        "assessment_limits": assessment_limits
    }), 200

# === ENDPOINT BARU: UPDATE User Detail (oleh Admin) ===
@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required()
def update_user_details_admin(user_id):
    """[Admin] Memperbarui detail user, termasuk roles dan limits."""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Request body tidak boleh kosong"}), 400

    updated = False

    # 1. Update Profil Dasar
    profile_fields = ['nama_lengkap', 'phone_number', 'institution']
    for field in profile_fields:
        if field in data:
            setattr(user, field, data[field])
            updated = True

    # 2. Update Roles
    if 'role_ids' in data:
        role_ids = data['role_ids']
        if isinstance(role_ids, list):
            admin_role_db = Role.query.filter(func.lower(Role.name) == 'admin').first()
            admin_role_id_in_db = admin_role_db.id if admin_role_db else None
            is_trying_to_remove_admin_role = admin_role_id_in_db and admin_role_id_in_db not in role_ids
            
            if user.email.lower() == "admin@admin.com" and is_trying_to_remove_admin_role:
                 return jsonify({"msg": "Tidak dapat menghapus role 'Admin' dari akun super admin utama."}), 400

            new_roles = Role.query.filter(Role.id.in_(role_ids)).all()
            user.roles = new_roles
            updated = True
        else:
            return jsonify({"msg": "'role_ids' harus berupa array."}), 400

    # 3. Update Assessment Limits
    if 'assessment_limits' in data:
        limits_data = data['assessment_limits']
        limit_fields = {
            "dasar": "limit_dasar",
            "madya": "limit_madya",
            "ai": "limit_ai"
        }
        for key, db_field in limit_fields.items():
            if key in limits_data and 'limit' in limits_data[key]:
                try:
                    new_limit = int(limits_data[key]['limit']) if limits_data[key]['limit'] is not None else None
                    if getattr(user, db_field) != new_limit:
                        setattr(user, db_field, new_limit)
                        updated = True
                except (ValueError, TypeError):
                    pass # Abaikan jika limit tidak valid

    if updated:
        try:
            db.session.commit()
            count_dasar = db.session.query(func.count(BasicAssessment.id)).filter_by(user_id=user_id).scalar() or 0
            count_madya = db.session.query(func.count(MadyaAssessment.id)).filter_by(user_id=user_id).scalar() or 0
            count_ai = db.session.query(func.count(RiskAssessment.id)).filter_by(user_id=user_id).scalar() or 0
            updated_user_data = {
                "id": user.id, "nama_lengkap": user.nama_lengkap, "email": user.email,
                "phone_number": getattr(user, 'phone_number', None),
                "institution": getattr(user, 'institution', None),
                "role_ids": [role.id for role in user.roles],
                "roles": [role.name for role in user.roles], # Kirim nama role juga
                "assessment_limits": {
                    "dasar": {"count": count_dasar, "limit": user.limit_dasar},
                    "madya": {"count": count_madya, "limit": user.limit_madya},
                    "ai": {"count": count_ai, "limit": user.limit_ai}
                }
            }
            return jsonify({
                "msg": f"Data pengguna {user.email} berhasil diperbarui.",
                "user": updated_user_data
            }), 200
        except Exception as e:
            db.session.rollback()
            print(f"Error updating user {user_id}: {e}")
            return jsonify({"msg": "Gagal memperbarui data pengguna."}), 500
    else:
        return jsonify({"msg": "Tidak ada data yang valid untuk diperbarui."}), 400
    
@admin_bp.route('/users', methods=['POST'])
@admin_required()
def create_user_admin():
    """[Admin] Membuat user baru."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    nama_lengkap = data.get('nama_lengkap')
    role_ids = data.get('role_ids', [])

    if not email or not password or not nama_lengkap:
        return jsonify({"msg": "Email, password, dan nama lengkap wajib diisi."}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email sudah terdaftar."}), 409
    
    # Hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    new_user = User(
        email=email,
        password_hash=hashed_password,
        nama_lengkap=nama_lengkap,
        phone_number=data.get('phone_number'),
        institution=data.get('institution'),
        # Set default limits (atau ambil dari request jika ada)
        limit_dasar=data.get('limit_dasar', 10),
        limit_madya=data.get('limit_madya', 5),
        limit_ai=data.get('limit_ai', 15)
    )
    
    # Assign roles
    if role_ids:
        roles = Role.query.filter(Role.id.in_(role_ids)).all()
        new_user.roles.extend(roles)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Kembalikan data user baru (tanpa password)
        # (Hitungan assessment masih 0 karena baru dibuat)
        created_user_data = {
            "id": new_user.id,
            "nama_lengkap": new_user.nama_lengkap,
            "email": new_user.email,
            "phone_number": new_user.phone_number,
            "institution": new_user.institution,
            "role_ids": [role.id for role in new_user.roles],
            "roles": [role.name for role in new_user.roles],
            "assessment_limits": {
                "dasar": {"count": 0, "limit": new_user.limit_dasar},
                "madya": {"count": 0, "limit": new_user.limit_madya},
                "ai": {"count": 0, "limit": new_user.limit_ai}
            }
        }
        return jsonify({"msg": "User berhasil dibuat.", "user": created_user_data}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {e}")
        return jsonify({"msg": "Gagal membuat user."}), 500

# === ENDPOINT BARU: DELETE /users/<id> (Hapus User) ===
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required()
def delete_user_admin(user_id):
    """[Admin] Menghapus user berdasarkan ID."""
    current_admin_id_str = get_jwt_identity()
    current_admin_id = int(current_admin_id_str)

    # Keamanan: Admin tidak bisa menghapus diri sendiri
    if user_id == current_admin_id:
        return jsonify({"msg": "Anda tidak dapat menghapus akun Anda sendiri."}), 403

    user_to_delete = User.query.get_or_404(user_id)
    
    # Keamanan: Admin tidak bisa menghapus super admin 'admin@admin.com'
    if user_to_delete.email.lower() == "admin@admin.com":
        return jsonify({"msg": "Akun super admin utama tidak dapat dihapus."}), 403

    try:
        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify({"msg": f"User {user_to_delete.email} berhasil dihapus."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting user {user_id}: {e}")
        return jsonify({"msg": "Gagal menghapus user. Pastikan user tidak memiliki data terkait (misal: assessment)."}), 500
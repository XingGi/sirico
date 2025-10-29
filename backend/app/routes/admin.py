# backend/app/routes/admin.py
from flask import request, jsonify, Blueprint
from app.models import db, Role, Permission, User # Import model yang relevan
from .auth import admin_required # Import decorator admin
# Jika perlu decorator permission: from .auth import permission_required
from flask_jwt_extended import jwt_required, get_jwt_identity

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

# Endpoint GET /users/<user_id>, PUT /users/<user_id>, DELETE /users/<user_id> bisa ditambahkan di sini
# ...
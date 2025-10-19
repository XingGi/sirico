# backend/app/seeds.py

from .models import User, MasterData, RiskMapTemplate, RiskMapLikelihoodLabel, RiskMapImpactLabel, RiskMapLevelDefinition, RiskMapScore
from . import db, bcrypt

def seed_admin():
    """Membuat akun admin jika belum ada."""
    
    # Cek apakah admin sudah ada
    admin_user = User.query.filter_by(email="admin@admin.com").first()
    
    if not admin_user:
        print("Admin user not found, creating one...")
        
        hashed_password = bcrypt.generate_password_hash("12345678").decode('utf-8')
        
        new_admin = User(
            email="admin@admin.com",
            password_hash=hashed_password,
            nama_lengkap="Admin SIRICO",
            role="admin" # <-- Menetapkan peran sebagai admin
        )
        
        db.session.add(new_admin)
        db.session.commit()
        print("Admin user created successfully.")
    else:
        print("Admin user already exists.")

def seed_master_data():
    print("Seeding master data...")
    options = {
        'INDUSTRY': [
            {'key': 'banking', 'value': 'Perbankan'}, 
            {'key': 'insurance', 'value': 'Asuransi'},
            {'key': 'capital_market', 'value': 'Pasar Modal'},
            {'key': 'fintech', 'value': 'Teknologi Finansial (Fintech)'},
            {'key': 'multifinance', 'value': 'Multifinance'},
            {'key': 'savings_loan_coop', 'value': 'Koperasi Simpan Pinjam'},
            {'key': 'digital_asset_trading', 'value': 'Pedagang Aset Digital'},
            {'key': 'manufacturing', 'value': 'Manufaktur'},
            {'key': 'automotive', 'value': 'Otomotif'},
            {'key': 'textile', 'value': 'Tekstil'},
            {'key': 'chemical', 'value': 'Kimia'},
            {'key': 'pharmaceutical', 'value': 'Farmasi'},
            {'key': 'electronics', 'value': 'Elektronik'},
            {'key': 'metal_machinery', 'value': 'Logam & Mesin'},
            {'key': 'it', 'value': 'Teknologi Informasi'},
            {'key': 'telecom', 'value': 'Telekomunikasi'},
            {'key': 'ecommerce', 'value': 'E-commerce'},
            {'key': 'media_creative', 'value': 'Media & Kreatif'},
            {'key': 'energy', 'value': 'Energi'},
            {'key': 'mining', 'value': 'Pertambangan'},
            {'key': 'oil_gas', 'value': 'Migas'},
            {'key': 'forestry', 'value': 'Kehutanan'},
            {'key': 'plantation', 'value': 'Perkebunan'},
            {'key': 'agriculture', 'value': 'Pertanian'},
            {'key': 'fisheries', 'value': 'Perikanan'},
            {'key': 'construction', 'value': 'Konstruksi'},
            {'key': 'property', 'value': 'Properti'},
            {'key': 'transportation', 'value': 'Transportasi'},
            {'key': 'logistics', 'value': 'Logistik'},
            {'key': 'water_sanitation', 'value': 'Air & Sanitasi'},
            {'key': 'electricity', 'value': 'Kelistrikan'},
            {'key': 'retail', 'value': 'Retail'},
            {'key': 'fnb', 'value': 'Food & Beverage'},
            {'key': 'hospitality', 'value': 'Perhotelan & Pariwisata'},
            {'key': 'consulting', 'value': 'Konsultan'},
            {'key': 'cleaning_services', 'value': 'Jasa Kebersihan'},
            {'key': 'healthcare', 'value': 'Kesehatan'},
            {'key': 'education', 'value': 'Pendidikan'},
            {'key': 'government', 'value': 'Pemerintahan'},
            {'key': 'nonprofit', 'value': 'Nirlaba'},
            {'key': 'intl_organization', 'value': 'Organisasi Internasional'}
        ],
        'COMPANY_TYPE': [
            {'key': 'Public', 'value': 'Public Company'}, 
            {'key': 'Private', 'value': 'Private Company'},
            {'key': 'Startup', 'value': 'Startup'},
            {'key': 'foreign_corp', 'value': 'Perusahaan Asing'},
            {'key': 'bumn', 'value': 'BUMN'},
            {'key': 'bumd', 'value': 'BUMD'},
            {'key': 'umkm', 'value': 'UMKM (Usaha Mikro, Kecil, dan Menengah)'},
            {'key': 'koperasi', 'value': 'Koperasi'},
            {'key': 'cv', 'value': 'Commanditaire Vennotschap (CV)'},
            {'key': 'firma', 'value': 'Firma (Fa)'},
            {'key': 'persekutuan_perdata', 'value': 'Persekutuan Perdata'},
            {'key': 'sole_proprietorship', 'value': 'Perusahaan Perorangan (UD)'},
            {'key': 'yayasan', 'value': 'Yayasan / Lembaga Nirlaba'},
            {'key': 'ormas_orpol', 'value': 'Ormas / Partai Politik'},
            {'key': 'lembaga_pendidikan', 'value': 'Lembaga Pendidikan / Pesantren'},
            {'key': 'perusahaan_publik', 'value': 'Perusahaan Terbuka (Tbk)'},
            {'key': 'joint_venture', 'value': 'Perusahaan Joint Venture'},
            {'key': 'representative_office', 'value': 'Kantor Perwakilan Perusahaan Asing'}
        ],
        'COMPANY_ASSETS': [
            {'key': 'under_1b', 'value': '< Rp 1 Miliar'},
            {'key': '1b_5b', 'value': 'Rp 1 - 5 Miliar'},
            {'key': '5b_10b', 'value': 'Rp 5 - 10 Miliar'},
            {'key': '10b_25b', 'value': 'Rp 10 - 25 Miliar'},
            {'key': '25b_50b', 'value': 'Rp 25 - 50 Miliar'},
            {'key': '50b_100b', 'value': 'Rp 50 - 100 Miliar'},
            {'key': '100b_250b', 'value': 'Rp 100 - 250 Miliar'},
            {'key': '250b_500b', 'value': 'Rp 250 - 500 Miliar'},
            {'key': '500b_1t', 'value': 'Rp 500 Miliar - 1 Triliun'},
            {'key': '1t_2.5t', 'value': 'Rp 1 Triliun - 2.5 Triliun'},
            {'key': '2.5t_5t', 'value': 'Rp 2.5 Triliun - 5 Triliun'},
            {'key': 'over_5t', 'value': 'Rp > 5 Triliun'}
        ],
        'CURRENCY': [
            {'key': 'idr', 'value': 'IDR'}, 
            {'key': 'usd', 'value': 'USD'},
            {'key': 'eur', 'value': 'EUR'},
            {'key': 'sgd', 'value': 'SGD'}
        ]
    }
    for category, items in options.items():
        for item in items:
            # Cek apakah data sudah ada sebelum memasukkan
            exists = MasterData.query.filter_by(category=category, key=item['key']).first()
            if not exists:
                new_data = MasterData(category=category, key=item['key'], value=item['value'])
                db.session.add(new_data)
                
    db.session.commit()
    print("Master data seeding complete.")
    
# Peta Risiko
def seed_default_risk_map():
    """Membuat template peta risiko default jika belum ada."""
    if RiskMapTemplate.query.filter_by(is_default=True).first():
        print("Default risk map template already exists.")
        return

    print("Creating default risk map template...")
    
    # 1. Buat Template Induk
    default_template = RiskMapTemplate(
        name="Default SIRICO Matrix 5x5",
        description="Template peta risiko standar berdasarkan matriks 5x5 umum.",
        is_default=True,
        user_id=None # Milik sistem, bukan user spesifik
    )
    db.session.add(default_template)
    db.session.flush()

    # 2. Definisikan Label Probabilitas & Dampak
    likelihoods = {
        5: "Hampir Pasti Terjadi", 4: "Sangat Mungkin Terjadi", 3: "Bisa Terjadi",
        2: "Jarang Terjadi", 1: "Sangat Jarang Terjadi"
    }
    impacts = {
        1: "Sangat Rendah", 2: "Rendah", 3: "Moderat", 4: "Tinggi", 5: "Sangat Tinggi"
    }

    for level, label in likelihoods.items():
        db.session.add(RiskMapLikelihoodLabel(template_id=default_template.id, level=level, label=label))
    
    for level, label in impacts.items():
        db.session.add(RiskMapImpactLabel(template_id=default_template.id, level=level, label=label))

    # 3. Definisikan Level Risiko (Skor, Nama, Warna)
    definitions = [
        {"name": "Rendah", "color": "#00B050", "min": 1, "max": 4},      # Hijau
        {"name": "Moderat", "color": "#FFFF00", "min": 5, "max": 9},    # Kuning
        {"name": "Tinggi", "color": "#FFC000", "min": 10, "max": 16},   # Oranye
        {"name": "Sangat Tinggi", "color": "#FF0000", "min": 17, "max": 25} # Merah
    ]
    
    # Penyesuaian berdasarkan gambar (ada 2 level hijau)
    definitions_from_image = [
        {"level_name": "Sangat Rendah", "color_hex": "#00B050", "min_score": 1, "max_score": 2}, # Hijau Tua
        {"level_name": "Rendah", "color_hex": "#92D050", "min_score": 3, "max_score": 6},       # Hijau Muda
        {"level_name": "Moderat", "color_hex": "#FFFF00", "min_score": 7, "max_score": 12},      # Kuning
        {"level_name": "Tinggi", "color_hex": "#FFC000", "min_score": 13, "max_score": 19},     # Oranye
        {"level_name": "Sangat Tinggi", "color_hex": "#FF0000", "min_score": 20, "max_score": 25} # Merah
    ]

    for d in definitions_from_image:
        db.session.add(RiskMapLevelDefinition(
            template_id=default_template.id,
            level_name=d['level_name'],
            color_hex=d['color_hex'],
            min_score=d['min_score'],
            max_score=d['max_score']
        ))
    
    for likelihood_level in range(1, 6):
        for impact_level in range(1, 6):
            score_value = likelihood_level * impact_level
            new_score = RiskMapScore(
                template_id=default_template.id,
                likelihood_level=likelihood_level,
                impact_level=impact_level,
                score=score_value
            )
            db.session.add(new_score)

    db.session.commit()
    print("Default risk map template created.")
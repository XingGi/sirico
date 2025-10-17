# backend/app/routes/risk_management_levels.py
from flask import request, jsonify, Blueprint, send_file, current_app
from app.models import (
    db, BasicAssessment, OrganizationalContext, 
    BasicRiskIdentification, BasicRiskAnalysis
)
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from io import BytesIO
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

# Membuat Blueprint untuk Risk Management Levels
risk_management_levels_bp = Blueprint('risk_management_levels_bp', __name__)

@risk_management_levels_bp.route('/basic-assessments', methods=['POST'])
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


@risk_management_levels_bp.route('/basic-assessments', methods=['GET'])
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

@risk_management_levels_bp.route('/basic-assessments/<int:assessment_id>', methods=['GET'])
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
    
@risk_management_levels_bp.route('/basic-assessments/<int:assessment_id>', methods=['PUT'])
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

@risk_management_levels_bp.route('/basic-assessments/<int:assessment_id>/export', methods=['GET'])
@jwt_required()
def export_basic_assessment_to_excel(assessment_id):
    """Membuat dan mengirim file Excel dari data Asesmen Dasar dengan styling lengkap."""
    current_user_id = get_jwt_identity()
    assessment = BasicAssessment.query.filter_by(id=assessment_id, user_id=current_user_id).first_or_404()

    wb = openpyxl.Workbook()
    
    # Hapus sheet default yang dibuat otomatis
    if "Sheet" in wb.sheetnames:
        wb.remove(wb["Sheet"])

    # --- DEFINISI GAYA (STYLES) ---
    bold_font = Font(bold=True)
    white_bold_font = Font(bold=True, color="FFFFFF")
    center_align = Alignment(horizontal='center', vertical='center')
    
    teal_fill = PatternFill(start_color="4DB6AC", end_color="4DB6AC", fill_type="solid") # Warna Teal
    light_blue_fill = PatternFill(start_color="DDEBF7", end_color="DDEBF7", fill_type="solid")
    dark_red_fill = PatternFill(start_color="A90200", end_color="A90200", fill_type="solid")
    bright_red_fill = PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid")
    peach_fill = PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid")
    header_light_blue_fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
    value_light_blue_fill = PatternFill(start_color="B4C6E7", end_color="B4C6E7", fill_type="solid")

    thin_border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

    # --- Sheet 1: Konteks Organisasi ---
    ws1 = wb.create_sheet(title="Tugas 1 - Konteks")
    ws1.page_setup.orientation = ws1.ORIENTATION_LANDSCAPE
    
    ws1.append(["Tugas 1 - Penetapan Konteks Organisasi"])
    ws1['A1'].font = bold_font
    ws1.append([])
    ws1.append(["Konteks Eksternal", "Konteks Internal"])
    
    for cell in ws1["3:3"]:
        cell.font = white_bold_font
        cell.fill = teal_fill
        cell.alignment = center_align
        cell.border = thin_border

    for ctx in assessment.contexts:
        ws1.append([ctx.external_context, ctx.internal_context])
    
    for row in ws1.iter_rows(min_row=4, max_row=ws1.max_row, min_col=1, max_col=2):
        for cell in row:
            cell.border = thin_border
    
    ws1.column_dimensions['A'].width = 80
    ws1.column_dimensions['B'].width = 80

    # --- Sheet 2: Identifikasi Risiko ---
    ws2 = wb.create_sheet(title="Tugas 2 - Identifikasi")
    ws2.page_setup.orientation = ws2.ORIENTATION_LANDSCAPE
    
    ws2['A1'] = "Tugas 2 - Identifikasi Risiko"
    ws2['A1'].font = bold_font
    ws2.append([]) # Baris kosong
    
    # Header Kompleks (Baris 3 dan 4)
    ws2['A3'] = "Nama Unit Kerja:"
    ws2['A3'].font = bold_font
    ws2['B3'] = assessment.nama_unit_kerja
    ws2['B3'].fill = value_light_blue_fill
    
    ws2['A4'] = "Nama Perusahaan:"
    ws2['A4'].font = bold_font
    ws2['B4'] = assessment.nama_perusahaan
    ws2['B4'].fill = value_light_blue_fill

    # Menggabungkan sel untuk "IDENTIFIKASI RISIKO"
    ws2.merge_cells('C3:K4')
    merged_cell_c3 = ws2['C3']
    merged_cell_c3.value = 'IDENTIFIKASI RISIKO'
    merged_cell_c3.alignment = center_align
    merged_cell_c3.font = bold_font
    merged_cell_c3.fill = header_light_blue_fill

    ws2.append([]) # Baris kosong
    
    # Header Tabel (Baris 6)
    headers2 = ["Kode Risiko", "No.", "Kategori Risiko", "Unit Kerja / Fungsi", "Sasaran", "Tanggal Identifikasi Risiko", "Deskripsi atau Kejadian Risiko", "Akar Penyebab", "Indikator Risiko", "Faktor Positif / Internal Control Yang Ada Saat Ini", "Deskripsi Dampak"]
    ws2.append(headers2)
    for cell in ws2[6:6]: # Target baris ke-6
        cell.font = white_bold_font
        cell.fill = dark_red_fill
        cell.alignment = Alignment(wrap_text=True, horizontal='center')

    # Data
    for i, risk in enumerate(assessment.risks):
        ws2.append([
            risk.kode_risiko, i + 1, risk.kategori_risiko, risk.unit_kerja, 
            risk.sasaran, risk.tanggal_identifikasi.strftime('%d %B %Y'), 
            risk.deskripsi_risiko, risk.akar_penyebab, risk.indikator_risiko, 
            risk.internal_control, risk.deskripsi_dampak
        ])

    # Atur lebar kolom
    for col_letter in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']:
        ws2.column_dimensions[col_letter].width = 25

    # --- Sheet 3: Analisis Risiko ---
    ws3 = wb.create_sheet(title="Tugas 3 - Analisis")
    ws3.page_setup.orientation = ws3.ORIENTATION_LANDSCAPE

    ws3['A1'] = "Tugas 3 - Analisis Risiko"
    ws3['A1'].font = bold_font

    ws3['A3'] = "Nama Unit Kerja:"
    ws3['A3'].font = bold_font
    ws3['B3'] = assessment.nama_unit_kerja
    ws3['B3'].fill = value_light_blue_fill

    ws3['A4'] = "Nama Perusahaan:"
    ws3['A4'].font = bold_font
    ws3['B4'] = assessment.nama_perusahaan
    ws3['B4'].fill = value_light_blue_fill

    ws3.merge_cells('C3:G3')
    ws3['C3'].value = 'ANALISIS RISIKO'
    ws3['C3'].alignment = center_align
    ws3['C3'].font = bold_font
    ws3['C3'].fill = peach_fill

    ws3.merge_cells('C4:G4')
    ws3['C4'].value = 'RISIKO INHERENT'
    ws3['C4'].alignment = center_align
    ws3['C4'].font = white_bold_font
    ws3['C4'].fill = bright_red_fill
    
    ws3.append([]) # Baris kosong (baris 5)
    
    headers3 = ["Deskripsi atau Kejadian Risiko", "Probabilitas (P)", "Dampak (I)", "Skor Risiko Inherent (W)", "Probabilitas Risiko Inherent Kualitatif (%)", "Dampak Finansial Risiko Inherent (Rp)", "Nilai Bersih Risiko Inherent"]
    ws3.append(headers3) # Menambahkan headers ke baris 6
    for cell in ws3[6:6]: # Menargetkan baris ke-6 untuk styling
        cell.font = white_bold_font
        cell.fill = dark_red_fill
        cell.alignment = Alignment(wrap_text=True, horizontal='center', vertical='center')

    for analysis in assessment.risk_analyses:
        skor = (analysis.probabilitas or 0) * (analysis.dampak or 0)
        nilai_bersih = (analysis.dampak_finansial or 0) * ((analysis.probabilitas_kualitatif or 0) / 100)
        ws3.append([analysis.risk_identification.deskripsi_risiko, analysis.probabilitas, analysis.dampak, skor, analysis.probabilitas_kualitatif, analysis.dampak_finansial, nilai_bersih])
        last_row = ws3.max_row
        ws3.cell(row=last_row, column=6).number_format = '"Rp"#,##0'
        ws3.cell(row=last_row, column=7).number_format = '"Rp"#,##0'
    
    for col_letter in ['A','B', 'C', 'D', 'E', 'F', 'G']:
        ws3.column_dimensions[col_letter].width = 25

    # Simpan ke memori
    in_memory_fp = BytesIO()
    wb.save(in_memory_fp)
    in_memory_fp.seek(0)

    return send_file(
        in_memory_fp,
        as_attachment=True,
        download_name=f"Asesmen_Dasar_{assessment.nama_unit_kerja}.xlsx",
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
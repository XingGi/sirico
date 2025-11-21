# backend/app/routes/horizon.py
import json
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, HorizonScanResult
from horizon_scanner import run_horizon_scan
from app.ai_services import summarize_horizon_scan
from sqlalchemy import func

horizon_bp = Blueprint('horizon_bp', __name__)

@horizon_bp.route('/horizon/history', methods=['GET'])
@jwt_required()
def get_scan_history():
    """Mengambil daftar riwayat scan user."""
    current_user_id = get_jwt_identity()
    
    history = HorizonScanResult.query.filter_by(user_id=current_user_id)\
        .order_by(HorizonScanResult.created_at.desc()).all()
        
    result = []
    for item in history:
        result.append({
            "id": item.id,
            "title": item.generated_title,
            "sector": item.sector,
            "created_at": item.created_at.isoformat(),
            "summary_preview": item.executive_summary[:100] + "..." if item.executive_summary else ""
        })
    
    return jsonify(result), 200

@horizon_bp.route('/horizon/history/<int:scan_id>', methods=['GET'])
@jwt_required()
def get_scan_detail(scan_id):
    """Mengambil detail lengkap satu scan."""
    current_user_id = get_jwt_identity()
    scan = HorizonScanResult.query.filter_by(id=scan_id, user_id=current_user_id).first_or_404()
    
    # Parse JSON raw data kembali ke object
    raw_news = []
    if scan.raw_news_data:
        try:
            raw_news = json.loads(scan.raw_news_data)
        except:
            raw_news = []

    return jsonify({
        "id": scan.id,
        "title": scan.generated_title,
        "sector": scan.sector,
        "created_at": scan.created_at.isoformat(),
        "report_html": scan.executive_summary,
        "news_data": raw_news
    }), 200
    
@horizon_bp.route('/horizon/scan', methods=['POST'])
@jwt_required()
def scan_risks():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.limit_horizon is not None:
        current_count = db.session.query(func.count(HorizonScanResult.id))\
            .filter_by(user_id=current_user_id).scalar() or 0
        
        if current_count >= user.limit_horizon:
            return jsonify({
                "msg": f"Slot penyimpanan Horizon Scanner penuh ({current_count}/{user.limit_horizon}). Hapus riwayat lama untuk melakukan scan baru."
            }), 403

    data = request.get_json()
    sector = data.get('sector', 'General')
    
    print(f"Starting Horizon Scan for sector: {sector}...")
    news_results = run_horizon_scan(sector)
    
    if not news_results:
         return jsonify({"msg": "Gagal mengambil data berita."}), 500

    gemini_key = os.getenv("GEMINI_API_KEY")
    title, report_html = summarize_horizon_scan(sector, news_results, gemini_key)
    
    if not title:
        title = f"Horizon Scan: {sector}"
        report_html = "<p>AI Analysis Unavailable.</p>"

    # 4. Simpan ke Database
    new_scan = HorizonScanResult(
        user_id=user.id,
        sector=sector,
        generated_title=title,
        executive_summary=report_html,
        raw_news_data=json.dumps(news_results)
    )
        
    db.session.add(new_scan)
    db.session.commit()
    
    return jsonify({
        "msg": "Scan completed successfully",
        "scan_id": new_scan.id,
        "remaining_limit": user.limit_horizon
    }), 201
    
@horizon_bp.route('/horizon/history/<int:scan_id>', methods=['DELETE'])
@jwt_required()
def delete_scan_history(scan_id):
    """Menghapus satu riwayat scan."""
    current_user_id = get_jwt_identity()
    
    scan = HorizonScanResult.query.filter_by(id=scan_id, user_id=current_user_id).first_or_404()
    
    try:
        db.session.delete(scan)
            
        db.session.commit()
        return jsonify({"msg": "Riwayat scan berhasil dihapus."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting scan: {e}")
        return jsonify({"msg": "Gagal menghapus data."}), 500
    
@horizon_bp.route('/horizon', methods=['GET'])
@jwt_required()
def get_horizon_dashboard():
    current_user_id = get_jwt_identity()
    
    # Ambil 3 scan terbaru
    scans = HorizonScanResult.query.filter_by(user_id=current_user_id)\
        .order_by(HorizonScanResult.created_at.desc())\
        .limit(3).all()
        
    result = []
    for s in scans:
        result.append({
            "id": s.id,
            # FIX: Map 'generated_title' atau 'sector' ke 'topic' agar muncul di frontend
            "topic": s.generated_title if s.generated_title else s.sector, 
            "scan_date": s.created_at.isoformat(),
            "risk_score": "Analisis AI" 
        })
        
    return jsonify(result), 200
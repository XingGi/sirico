import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')

    print(f"!!! DEBUG: Kunci JWT yang sedang digunakan: {app.config['JWT_SECRET_KEY']}")
     
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        # Import blueprint dari setiap file di folder routes
        from .routes.auth import auth_bp
        from .routes.dashboard import dashboard_bp
        from .routes.risk_ai import risk_ai_bp
        from .routes.risk_register import risk_register_bp
        from .routes.risk_management_levels import risk_management_levels_bp
        from .routes.bia import bia_bp
        from .routes.bpr import bpr_bp
        from .routes.rsca import rsca_bp
        from .routes.master_data import master_data_bp

        # Daftarkan semua blueprint ke aplikasi
        app.register_blueprint(auth_bp, url_prefix='/api')
        app.register_blueprint(dashboard_bp, url_prefix='/api')
        app.register_blueprint(risk_ai_bp, url_prefix='/api')
        app.register_blueprint(risk_register_bp, url_prefix='/api')
        app.register_blueprint(risk_management_levels_bp, url_prefix='/api')
        app.register_blueprint(bia_bp, url_prefix='/api')
        app.register_blueprint(bpr_bp, url_prefix='/api')
        app.register_blueprint(rsca_bp, url_prefix='/api')
        app.register_blueprint(master_data_bp, url_prefix='/api')

        # Kita tidak perlu lagi mengimpor dari routes.py yang lama
        # from . import routes

    return app
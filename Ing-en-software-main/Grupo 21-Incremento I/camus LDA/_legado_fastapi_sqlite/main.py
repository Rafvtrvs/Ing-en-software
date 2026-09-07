from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

app = FastAPI(title="Sistema de Clientes y Visitas - API")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# CONFIGURACIÓN DE BASE DE DATOS SQLITE
# ==========================================================
DATABASE_URL = "sqlite:///./clientes.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================================
# MODELOS DE BASE DE DATOS 
# ==========================================================
class ClienteDB(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    rut = Column(String, unique=True, index=True)
    telefono = Column(String, default="")
    correo = Column(String, default="")
    direccion = Column(String, default="")
    tipo = Column(String, default="Residencial")
    estado = Column(String, default="Activo")
    observaciones = Column(String, default="")

class VisitaDB(Base):
    __tablename__ = "visitas"
    id = Column(Integer, primary_key=True, index=True)
    clienteId = Column(Integer, index=True)
    fecha = Column(String)
    hora = Column(String)
    motivo = Column(String, default="")
    estado = Column(String, default="Pendiente")
    observaciones = Column(String, default="")

# Crear las tablas
Base.metadata.create_all(bind=engine)

# ==========================================================
# MODELOS PYDANTIC 
# ==========================================================
class Cliente(BaseModel):
    id: Optional[int] = None
    nombre: str
    rut: str
    telefono: Optional[str] = ""
    correo: Optional[str] = ""
    direccion: Optional[str] = ""
    tipo: str
    estado: str
    observaciones: Optional[str] = ""

class Visita(BaseModel):
    id: Optional[int] = None
    clienteId: int
    fecha: str
    hora: str
    motivo: Optional[str] = ""
    estado: str
    observaciones: Optional[str] = ""

# ==========================================================
# FUNCIONES AUXILIARES
# ==========================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================================
# ENDPOINTS DE CLIENTES
# ==========================================================
@app.get("/api/clientes", response_model=List[Cliente])
def obtener_clientes():
    db = SessionLocal()
    clientes = db.query(ClienteDB).all()
    db.close()
    return clientes

@app.post("/api/clientes", response_model=Cliente)
def crear_cliente(cliente: Cliente):
    db = SessionLocal()
    cliente_db = ClienteDB(**cliente.dict())
    db.add(cliente_db)
    db.commit()
    db.refresh(cliente_db)
    db.close()
    return cliente_db

@app.put("/api/clientes/{cliente_id}", response_model=Cliente)
def actualizar_cliente(cliente_id: int, cliente_actualizado: Cliente):
    db = SessionLocal()
    cliente_db = db.query(ClienteDB).filter(ClienteDB.id == cliente_id).first()
    if not cliente_db:
        db.close()
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    for key, value in cliente_actualizado.dict().items():
        setattr(cliente_db, key, value)
    
    db.commit()
    db.refresh(cliente_db)
    db.close()
    return cliente_db

@app.delete("/api/clientes/{cliente_id}")
def eliminar_cliente(cliente_id: int):
    db = SessionLocal()
    cliente_db = db.query(ClienteDB).filter(ClienteDB.id == cliente_id).first()
    if not cliente_db:
        db.close()
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Eliminar visitas asociadas
    db.query(VisitaDB).filter(VisitaDB.clienteId == cliente_id).delete()
    # Eliminar cliente
    db.delete(cliente_db)
    db.commit()
    db.close()
    return {"detail": f"Cliente {cliente_id} eliminado"}

# ==========================================================
# ENDPOINTS DE VISITAS
# ==========================================================
@app.get("/api/visitas", response_model=List[Visita])
def obtener_visitas():
    db = SessionLocal()
    visitas = db.query(VisitaDB).all()
    db.close()
    return visitas

@app.post("/api/visitas", response_model=Visita)
def crear_visita(visita: Visita):
    db = SessionLocal()
    visita_db = VisitaDB(**visita.dict())
    db.add(visita_db)
    db.commit()
    db.refresh(visita_db)
    db.close()
    return visita_db

@app.put("/api/visitas/{visita_id}", response_model=Visita)
def actualizar_visita(visita_id: int, visita_actualizada: Visita):
    db = SessionLocal()
    visita_db = db.query(VisitaDB).filter(VisitaDB.id == visita_id).first()
    if not visita_db:
        db.close()
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    for key, value in visita_actualizada.dict().items():
        setattr(visita_db, key, value)
    
    db.commit()
    db.refresh(visita_db)
    db.close()
    return visita_db

@app.delete("/api/visitas/{visita_id}")
def eliminar_visita(visita_id: int):
    db = SessionLocal()
    visita_db = db.query(VisitaDB).filter(VisitaDB.id == visita_id).first()
    if not visita_db:
        db.close()
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    
    db.delete(visita_db)
    db.commit()
    db.close()
    return {"detail": f"Visita {visita_id} eliminada"}

# Endpoint de prueba
@app.get("/")
def root():
    return {"message": "API con base de datos SQLite funcionando"}
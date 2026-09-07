-- ============================================================
--  Alcantarillados Camus Ltda. - Esquema PostgreSQL (ampliado)
--  Convertido y ampliado desde base_de_datos.sql (MySQL genérico).
--
--  Corresponde al bloque "Base de datos -> Cloud SQL PostgreSQL
--  (Transaccional)" del diagrama de despliegue.
--
--  Cambios respecto al original:
--   - Sintaxis PostgreSQL (SERIAL, TIMESTAMP, TEXT).
--   - Sin tildes/ñ en identificadores (evita problemas de encoding).
--   - PK autoincrementales.
--   - Tablas nuevas para cubrir módulos de la app que el SQL original
--     no contemplaba: rol, permiso, categoria_insumo, proveedor, kit,
--     factura, pago.
--   - Campos ampliados en cliente, insumo y orden_trabajo para no
--     perder funcionalidad del frontend.
-- ============================================================

-- Limpieza idempotente (orden inverso por dependencias)
DROP TABLE IF EXISTS consume CASCADE;
DROP TABLE IF EXISTS utiliza CASCADE;
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS factura CASCADE;
DROP TABLE IF EXISTS registro_financiero CASCADE;
DROP TABLE IF EXISTS evidencia_multimedia CASCADE;
DROP TABLE IF EXISTS bitacora_auditoria CASCADE;
DROP TABLE IF EXISTS intervencion CASCADE;
DROP TABLE IF EXISTS orden_trabajo CASCADE;
DROP TABLE IF EXISTS kit_item CASCADE;
DROP TABLE IF EXISTS kit CASCADE;
DROP TABLE IF EXISTS insumo CASCADE;
DROP TABLE IF EXISTS categoria_insumo CASCADE;
DROP TABLE IF EXISTS proveedor CASCADE;
DROP TABLE IF EXISTS maquinaria CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS rol_permiso CASCADE;
DROP TABLE IF EXISTS permiso CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol CASCADE;

-- ============================================================
-- 1. Seguridad: roles, permisos y usuarios
-- ============================================================
CREATE TABLE rol (
    id_rol          SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     VARCHAR(255) DEFAULT '',
    estado          VARCHAR(20)  DEFAULT 'Activo',
    es_sistema      BOOLEAN      DEFAULT FALSE
);

CREATE TABLE permiso (
    id_permiso      SERIAL PRIMARY KEY,
    clave           VARCHAR(100) UNIQUE NOT NULL,
    etiqueta        VARCHAR(150) NOT NULL,
    modulo          VARCHAR(100) NOT NULL
);

CREATE TABLE rol_permiso (
    id_rol          INT NOT NULL,
    id_permiso      INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    FOREIGN KEY (id_rol)     REFERENCES rol(id_rol) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permiso(id_permiso) ON DELETE CASCADE
);

CREATE TABLE usuario (
    id_usuario          SERIAL PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,
    correo_electronico  VARCHAR(150) UNIQUE NOT NULL,
    -- La contraseña real vive en Firebase Auth; aquí solo un hash opcional
    -- para el modo simulado / local.
    password_hash       VARCHAR(255) DEFAULT '',
    firebase_uid        VARCHAR(128) DEFAULT '',
    telefono            VARCHAR(20)  DEFAULT '',
    id_rol              INT,
    estado              VARCHAR(20)  DEFAULT 'Activo',
    ultimo_acceso       TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);

-- ============================================================
-- 2. Clientes
-- ============================================================
CREATE TABLE cliente (
    id_cliente      SERIAL PRIMARY KEY,
    rut             VARCHAR(12) UNIQUE NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    empresa         VARCHAR(150) DEFAULT '',
    telefono        VARCHAR(20)  DEFAULT '',
    email           VARCHAR(150) DEFAULT '',
    direccion       VARCHAR(255) DEFAULT '',
    estado          VARCHAR(20)  DEFAULT 'Activo',
    ultima_orden    VARCHAR(20)  DEFAULT '',
    creado_en       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. Activos: maquinaria, insumos, proveedores, categorías, kits
-- ============================================================
CREATE TABLE maquinaria (
    id_maquinaria   SERIAL PRIMARY KEY,
    patente         VARCHAR(10),
    marca           VARCHAR(50),
    estado          VARCHAR(50) DEFAULT 'Operativa'
);

CREATE TABLE proveedor (
    id_proveedor    SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    rut             VARCHAR(12) DEFAULT '',
    contacto        VARCHAR(100) DEFAULT '',
    telefono        VARCHAR(20)  DEFAULT '',
    email           VARCHAR(150) DEFAULT '',
    direccion       VARCHAR(255) DEFAULT '',
    condicion_pago  VARCHAR(100) DEFAULT '',
    estado          VARCHAR(20)  DEFAULT 'Activo'
);

CREATE TABLE categoria_insumo (
    id_categoria    SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     VARCHAR(255) DEFAULT '',
    estado          VARCHAR(20)  DEFAULT 'Activa'
);

CREATE TABLE insumo (
    id_insumo       SERIAL PRIMARY KEY,
    codigo          VARCHAR(50) DEFAULT '',
    nombre          VARCHAR(100) NOT NULL,
    stock_actual    INT DEFAULT 0,
    stock_minimo    INT DEFAULT 0,
    unidad          VARCHAR(30) DEFAULT 'unidad',
    estado          VARCHAR(20) DEFAULT 'Ok',
    id_categoria    INT,
    id_proveedor    INT,
    FOREIGN KEY (id_categoria) REFERENCES categoria_insumo(id_categoria),
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor)
);

CREATE TABLE kit (
    id_kit          SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     VARCHAR(255) DEFAULT '',
    estado          VARCHAR(20) DEFAULT 'Activo'
);

CREATE TABLE kit_item (
    id_kit          INT NOT NULL,
    id_insumo       INT NOT NULL,
    cantidad        INT DEFAULT 1,
    PRIMARY KEY (id_kit, id_insumo),
    FOREIGN KEY (id_kit)    REFERENCES kit(id_kit) ON DELETE CASCADE,
    FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo)
);

-- ============================================================
-- 4. Órdenes de trabajo e intervenciones
-- ============================================================
CREATE TABLE orden_trabajo (
    id_ot           VARCHAR(30) PRIMARY KEY, -- mantiene formato OT-2026-0128
    fecha_emision   DATE DEFAULT CURRENT_DATE,
    estado          VARCHAR(50) DEFAULT 'Pendiente',
    prioridad       VARCHAR(20) DEFAULT 'Media',
    servicio        VARCHAR(150) DEFAULT '',
    categoria       VARCHAR(100) DEFAULT '',
    direccion       VARCHAR(255) DEFAULT '',
    progreso        INT DEFAULT 0,
    orden_visual    INT DEFAULT 0,
    id_cliente      INT,
    id_operador     INT,
    FOREIGN KEY (id_cliente)  REFERENCES cliente(id_cliente),
    FOREIGN KEY (id_operador) REFERENCES usuario(id_usuario)
);

CREATE TABLE intervencion (
    id_intervencion SERIAL PRIMARY KEY,
    detalle         VARCHAR(255),
    id_ot           VARCHAR(30),
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo(id_ot) ON DELETE CASCADE
);

-- ============================================================
-- 5. Auditoría (componente "Registro y auditoría" del diagrama)
-- ============================================================
CREATE TABLE bitacora_auditoria (
    id_log          BIGSERIAL PRIMARY KEY,
    modulo_afectado VARCHAR(100),
    accion          VARCHAR(100),
    valor_anterior  TEXT,
    valor_nuevo     TEXT,
    id_usuario      INT,
    fecha_hora      TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- ============================================================
-- 6. Evidencia multimedia (apunta a Firebase Storage - SIMULADO)
-- ============================================================
CREATE TABLE evidencia_multimedia (
    id_evidencia        SERIAL PRIMARY KEY,
    tipo_archivo        VARCHAR(50),
    version             INT DEFAULT 1,
    ruta_archivo_url    VARCHAR(255),
    capa_dibujo_json    TEXT,
    fecha_carga         TIMESTAMP DEFAULT NOW(),
    id_ot               VARCHAR(30),
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo(id_ot) ON DELETE CASCADE
);

-- ============================================================
-- 7. Finanzas: registro, facturas y pagos
-- ============================================================
CREATE TABLE registro_financiero (
    id_registro     SERIAL PRIMARY KEY,
    estimacion_costo DECIMAL(12,2) DEFAULT 0,
    estado_pago     VARCHAR(50) DEFAULT 'Pendiente',
    iva             DECIMAL(12,2) DEFAULT 0,
    id_ot           VARCHAR(30),
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo(id_ot)
);

CREATE TABLE factura (
    id_factura      SERIAL PRIMARY KEY,
    numero          VARCHAR(40) UNIQUE NOT NULL,
    id_cliente      INT,
    id_ot           VARCHAR(30),
    fecha_emision   DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    monto           DECIMAL(12,2) DEFAULT 0,
    estado          VARCHAR(20) DEFAULT 'Emitida',
    metodo_pago     VARCHAR(30),
    pagada_en       DATE,
    notas           TEXT,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
    FOREIGN KEY (id_ot)      REFERENCES orden_trabajo(id_ot)
);

CREATE TABLE pago (
    id_pago         SERIAL PRIMARY KEY,
    id_factura      INT,
    monto           DECIMAL(12,2) DEFAULT 0,
    metodo          VARCHAR(30),
    fecha           DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (id_factura) REFERENCES factura(id_factura)
);

-- ============================================================
-- 8. Relaciones N:M de la orden de trabajo
-- ============================================================
CREATE TABLE utiliza (
    id_ot           VARCHAR(30),
    id_maquinaria   INT,
    horas_uso       INT DEFAULT 0,
    fecha_uso       DATE,
    PRIMARY KEY (id_ot, id_maquinaria),
    FOREIGN KEY (id_ot)         REFERENCES orden_trabajo(id_ot) ON DELETE CASCADE,
    FOREIGN KEY (id_maquinaria) REFERENCES maquinaria(id_maquinaria)
);

CREATE TABLE consume (
    id_ot               VARCHAR(30),
    id_insumo           INT,
    cantidad_consumida  INT DEFAULT 0,
    costo_total         DECIMAL(12,2) DEFAULT 0,
    PRIMARY KEY (id_ot, id_insumo),
    FOREIGN KEY (id_ot)     REFERENCES orden_trabajo(id_ot) ON DELETE CASCADE,
    FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo)
);

-- Índices de apoyo
CREATE INDEX idx_ot_cliente   ON orden_trabajo(id_cliente);
CREATE INDEX idx_ot_estado    ON orden_trabajo(estado);
CREATE INDEX idx_insumo_cat   ON insumo(id_categoria);
CREATE INDEX idx_factura_cli  ON factura(id_cliente);
CREATE INDEX idx_audit_fecha  ON bitacora_auditoria(fecha_hora);

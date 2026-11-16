DROP TABLE IF EXISTS estimacion CASCADE;
DROP TABLE IF EXISTS tarifa_costo CASCADE;
DROP TABLE IF EXISTS consume CASCADE;
DROP TABLE IF EXISTS utiliza CASCADE;
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS factura CASCADE;
DROP TABLE IF EXISTS registro_financiero CASCADE;
DROP TABLE IF EXISTS evidencia_multimedia CASCADE;
DROP TABLE IF EXISTS bitacora_auditoria CASCADE;
DROP TABLE IF EXISTS intervencion CASCADE;
DROP TABLE IF EXISTS documento_orden CASCADE;
DROP TABLE IF EXISTS historial_reprogramacion_ot CASCADE;
DROP TABLE IF EXISTS historial_modificacion_ot CASCADE;
DROP TABLE IF EXISTS solicitud_modificacion CASCADE;
DROP TABLE IF EXISTS orden_trabajo CASCADE;
DROP TABLE IF EXISTS kit_item CASCADE;
DROP TABLE IF EXISTS kit CASCADE;
DROP TABLE IF EXISTS movimiento_stock CASCADE;
DROP TABLE IF EXISTS insumo CASCADE;
DROP TABLE IF EXISTS categoria_insumo CASCADE;
DROP TABLE IF EXISTS proveedor CASCADE;
DROP TABLE IF EXISTS maquinaria CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS dispositivo_push CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol_permiso CASCADE;
DROP TABLE IF EXISTS permiso CASCADE;
DROP TABLE IF EXISTS rol CASCADE;


CREATE TABLE rol (
    id_rol        SERIAL        NOT NULL,
    nombre        VARCHAR(100)  NOT NULL,
    descripcion   VARCHAR(255)  NOT NULL DEFAULT '',
    estado        VARCHAR(20)   NOT NULL DEFAULT 'Activo',
    es_sistema    BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_rol PRIMARY KEY (id_rol)
);

COMMENT ON TABLE  rol IS 'Perfiles de acceso del sistema';
COMMENT ON COLUMN rol.es_sistema IS 'TRUE si el rol es propio del sistema y no puede eliminarse';

CREATE TABLE permiso (
    id_permiso    SERIAL        NOT NULL,
    clave         VARCHAR(100)  NOT NULL,
    etiqueta      VARCHAR(150)  NOT NULL,
    modulo        VARCHAR(100)  NOT NULL,

    CONSTRAINT pk_permiso        PRIMARY KEY (id_permiso),
    CONSTRAINT uq_permiso_clave  UNIQUE (clave)
);

COMMENT ON TABLE  permiso IS 'Permisos atomicos asignables a un rol';
COMMENT ON COLUMN permiso.clave IS 'Identificador tecnico, por ejemplo orders.manage';

CREATE TABLE rol_permiso (
    id_rol        INTEGER       NOT NULL,
    id_permiso    INTEGER       NOT NULL,

    CONSTRAINT pk_rol_permiso PRIMARY KEY (id_rol, id_permiso)
);

COMMENT ON TABLE rol_permiso IS 'Relacion N:M entre roles y permisos';

CREATE TABLE usuario (
    id_usuario           SERIAL        NOT NULL,
    nombre               VARCHAR(100)  NOT NULL,
    correo_electronico   VARCHAR(150)  NOT NULL,
    password_hash        VARCHAR(255)  NOT NULL DEFAULT '',
    firebase_uid         VARCHAR(128)  NOT NULL DEFAULT '',
    telefono             VARCHAR(20)   NOT NULL DEFAULT '',
    avatar_url           TEXT          NOT NULL DEFAULT '',
    id_rol               INTEGER       NULL,
    estado               VARCHAR(20)   NOT NULL DEFAULT 'Activo',
    ultimo_acceso        TIMESTAMP(3)  NULL,

    CONSTRAINT pk_usuario         PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_correo  UNIQUE (correo_electronico)
);

COMMENT ON TABLE  usuario IS 'Usuarios del sistema (administrativos y operarios de terreno)';
COMMENT ON COLUMN usuario.password_hash IS 'Hash bcrypt de la contrasena, nunca texto plano';
COMMENT ON COLUMN usuario.avatar_url IS 'Foto de perfil como data URL o URL http';

CREATE TABLE dispositivo_push (
    id_dispositivo   SERIAL        NOT NULL,
    id_usuario       INTEGER       NOT NULL,
    fcm_token        VARCHAR(512)  NOT NULL,
    platform         VARCHAR(40)   NOT NULL DEFAULT 'web',
    actualizado_en   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_dispositivo_push        PRIMARY KEY (id_dispositivo),
    CONSTRAINT uq_dispositivo_push_token  UNIQUE (fcm_token)
);

COMMENT ON TABLE dispositivo_push IS 'Tokens FCM por dispositivo para notificaciones push';


CREATE TABLE cliente (
    id_cliente     SERIAL        NOT NULL,
    rut            VARCHAR(12)   NOT NULL,
    nombre         VARCHAR(100)  NOT NULL,
    empresa        VARCHAR(150)  NOT NULL DEFAULT '',
    telefono       VARCHAR(20)   NOT NULL DEFAULT '',
    email          VARCHAR(150)  NOT NULL DEFAULT '',
    direccion      VARCHAR(255)  NOT NULL DEFAULT '',
    estado         VARCHAR(20)   NOT NULL DEFAULT 'Activo',
    ultima_orden   VARCHAR(20)   NOT NULL DEFAULT '',
    creado_en      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_cliente      PRIMARY KEY (id_cliente),
    CONSTRAINT uq_cliente_rut  UNIQUE (rut)
);

COMMENT ON TABLE  cliente IS 'Clientes de Alcantarillados Camus Ltda.';
COMMENT ON COLUMN cliente.estado IS 'Activo, Inactivo, Pendiente o Bloqueado';


CREATE TABLE maquinaria (
    id_maquinaria        SERIAL        NOT NULL,
    patente              VARCHAR(20)   NULL,
    marca                VARCHAR(50)   NULL,
    estado               VARCHAR(50)   NOT NULL DEFAULT 'Operativo',
    codigo               VARCHAR(50)   NOT NULL DEFAULT '',
    nombre               VARCHAR(150)  NOT NULL DEFAULT '',
    numero_serie         VARCHAR(50)   NOT NULL DEFAULT '',
    ubicacion            VARCHAR(150)  NOT NULL DEFAULT '',
    ubicacion_base       VARCHAR(150)  NOT NULL DEFAULT '',
    categoria            VARCHAR(100)  NOT NULL DEFAULT '',
    fecha_compra         DATE          NULL,
    ultima_mantencion    DATE          NULL,
    proxima_mantencion   DATE          NULL,
    asignado_a           VARCHAR(100)  NULL,

    CONSTRAINT pk_maquinaria PRIMARY KEY (id_maquinaria)
);

COMMENT ON TABLE  maquinaria IS 'Maquinaria y equipamiento disponible para las ordenes de trabajo';
COMMENT ON COLUMN maquinaria.ubicacion_base IS 'Ubicacion original, se restaura al liberar el equipo de una OT';

CREATE TABLE proveedor (
    id_proveedor     SERIAL        NOT NULL,
    nombre           VARCHAR(150)  NOT NULL,
    rut              VARCHAR(12)   NOT NULL DEFAULT '',
    contacto         VARCHAR(100)  NOT NULL DEFAULT '',
    telefono         VARCHAR(20)   NOT NULL DEFAULT '',
    email            VARCHAR(150)  NOT NULL DEFAULT '',
    direccion        VARCHAR(255)  NOT NULL DEFAULT '',
    condicion_pago   VARCHAR(100)  NOT NULL DEFAULT '',
    estado           VARCHAR(20)   NOT NULL DEFAULT 'Activo',

    CONSTRAINT pk_proveedor PRIMARY KEY (id_proveedor)
);

COMMENT ON TABLE proveedor IS 'Proveedores de insumos';

CREATE TABLE categoria_insumo (
    id_categoria   SERIAL        NOT NULL,
    nombre         VARCHAR(100)  NOT NULL,
    descripcion    VARCHAR(255)  NOT NULL DEFAULT '',
    estado         VARCHAR(20)   NOT NULL DEFAULT 'Activa',

    CONSTRAINT pk_categoria_insumo PRIMARY KEY (id_categoria)
);

COMMENT ON TABLE categoria_insumo IS 'Categorias de clasificacion de los insumos';

CREATE TABLE insumo (
    id_insumo        SERIAL          NOT NULL,
    codigo           VARCHAR(50)     NOT NULL DEFAULT '',
    nombre           VARCHAR(100)    NOT NULL,
    stock_actual     INTEGER         NOT NULL DEFAULT 0,
    stock_minimo     INTEGER         NOT NULL DEFAULT 0,
    unidad           VARCHAR(30)     NOT NULL DEFAULT 'unidad',
    costo_unitario   DECIMAL(12,2)   NOT NULL DEFAULT 0,
    estado           VARCHAR(20)     NOT NULL DEFAULT 'Ok',
    id_categoria     INTEGER         NULL,
    id_proveedor     INTEGER         NULL,

    CONSTRAINT pk_insumo PRIMARY KEY (id_insumo)
);

COMMENT ON TABLE  insumo IS 'Insumos del inventario con control de stock';
COMMENT ON COLUMN insumo.costo_unitario IS 'Costo unitario de adquisicion, usado para el calculo de utilidad';
COMMENT ON COLUMN insumo.estado IS 'Ok, Bajo o Critico segun stock_actual frente a stock_minimo';

CREATE TABLE movimiento_stock (
    id_movimiento   SERIAL        NOT NULL,
    id_insumo       INTEGER       NOT NULL,
    tipo            VARCHAR(20)   NOT NULL,
    cantidad        INTEGER       NOT NULL,
    detalle         VARCHAR(255)  NOT NULL DEFAULT '',
    usuario         VARCHAR(120)  NOT NULL DEFAULT 'Sistema',
    id_ot           VARCHAR(30)   NULL,
    fecha           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_movimiento_stock PRIMARY KEY (id_movimiento)
);

COMMENT ON TABLE  movimiento_stock IS 'Historial de entradas y salidas de inventario';
COMMENT ON COLUMN movimiento_stock.tipo IS 'Entrada o Salida';

CREATE TABLE kit (
    id_kit        SERIAL        NOT NULL,
    nombre        VARCHAR(100)  NOT NULL,
    descripcion   VARCHAR(255)  NOT NULL DEFAULT '',
    estado        VARCHAR(20)   NOT NULL DEFAULT 'Activo',

    CONSTRAINT pk_kit PRIMARY KEY (id_kit)
);

COMMENT ON TABLE kit IS 'Kits de insumos predefinidos por tipo de servicio';

CREATE TABLE kit_item (
    id_kit       INTEGER   NOT NULL,
    id_insumo    INTEGER   NOT NULL,
    cantidad     INTEGER   NOT NULL DEFAULT 1,

    CONSTRAINT pk_kit_item PRIMARY KEY (id_kit, id_insumo)
);

COMMENT ON TABLE kit_item IS 'Detalle de insumos que componen cada kit';



CREATE TABLE orden_trabajo (
    id_ot              VARCHAR(30)      NOT NULL,
    fecha_emision      DATE             NOT NULL DEFAULT CURRENT_DATE,
    estado             VARCHAR(50)      NOT NULL DEFAULT 'Pendiente',
    prioridad          VARCHAR(20)      NOT NULL DEFAULT 'Media',
    servicio           VARCHAR(150)     NOT NULL DEFAULT '',
    categoria          VARCHAR(100)     NOT NULL DEFAULT '',
    direccion          VARCHAR(255)     NOT NULL DEFAULT '',
    latitud            DOUBLE PRECISION NULL,
    longitud           DOUBLE PRECISION NULL,
    fecha_limite       DATE             NULL,
    fecha_inicio       DATE             NULL,
    fecha_termino      DATE             NULL,
    duracion_horas     DOUBLE PRECISION NULL,
    codigo_camion      VARCHAR(50)      NULL,
    id_maquinaria      INTEGER          NULL,
    nombre_cliente     VARCHAR(150)     NOT NULL DEFAULT '',
    progreso           INTEGER          NOT NULL DEFAULT 0,
    orden_visual       INTEGER          NOT NULL DEFAULT 0,
    id_cliente         INTEGER          NULL,
    id_operador        INTEGER          NULL,
    operadores_json    TEXT             NOT NULL DEFAULT '',

    CONSTRAINT pk_orden_trabajo      PRIMARY KEY (id_ot),
    CONSTRAINT ck_orden_progreso     CHECK (progreso BETWEEN 0 AND 100)
);

COMMENT ON TABLE  orden_trabajo IS 'Ordenes de trabajo, entidad central del sistema';
COMMENT ON COLUMN orden_trabajo.id_ot IS 'Codigo de negocio de la OT, por ejemplo OT-2026-0128';
COMMENT ON COLUMN orden_trabajo.fecha_inicio IS 'RF56: fecha de inicio del servicio';
COMMENT ON COLUMN orden_trabajo.fecha_termino IS 'RF56: fecha de termino del servicio';
COMMENT ON COLUMN orden_trabajo.operadores_json IS 'Cuadrilla completa en JSON, id_operador es el responsable principal';

CREATE TABLE solicitud_modificacion (
    id_solicitud        SERIAL        NOT NULL,
    id_ot               VARCHAR(30)   NOT NULL,
    id_operador         VARCHAR(80)   NOT NULL,
    nombre_operador     VARCHAR(150)  NOT NULL,
    campos_modificar    VARCHAR(255)  NOT NULL,
    motivo              VARCHAR(500)  NOT NULL,
    cambios_json        TEXT          NOT NULL DEFAULT '',
    estado              VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
    solicitado_en       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_revisor          VARCHAR(80)   NULL,
    nombre_revisor      VARCHAR(150)  NULL,
    revisado_en         TIMESTAMP(3)  NULL,
    motivo_rechazo      VARCHAR(500)  NULL,

    CONSTRAINT pk_solicitud_modificacion PRIMARY KEY (id_solicitud)
);

COMMENT ON TABLE  solicitud_modificacion IS 'RF68: solicitudes de modificacion de una OT';
COMMENT ON COLUMN solicitud_modificacion.cambios_json IS 'Parche propuesto en JSON, no se aplica hasta ser aprobado';

CREATE TABLE historial_modificacion_ot (
    id_historial      SERIAL        NOT NULL,
    id_ot             VARCHAR(30)   NOT NULL,
    campo             VARCHAR(80)   NOT NULL,
    etiqueta          VARCHAR(120)  NOT NULL,
    valor_anterior    VARCHAR(500)  NOT NULL,
    valor_nuevo       VARCHAR(500)  NOT NULL,
    id_usuario        VARCHAR(80)   NOT NULL,
    nombre_usuario    VARCHAR(150)  NOT NULL,
    cambiado_en       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_historial_modificacion_ot PRIMARY KEY (id_historial)
);

COMMENT ON TABLE historial_modificacion_ot IS 'RF68: historial de modificaciones aplicadas a una OT';

CREATE TABLE historial_reprogramacion_ot (
    id_reprogramacion   SERIAL        NOT NULL,
    id_ot               VARCHAR(30)   NOT NULL,
    fecha_anterior      VARCHAR(40)   NOT NULL,
    fecha_nueva         VARCHAR(40)   NOT NULL,
    id_usuario          VARCHAR(80)   NOT NULL,
    nombre_usuario      VARCHAR(150)  NOT NULL,
    cambiado_en         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_historial_reprogramacion_ot PRIMARY KEY (id_reprogramacion)
);

COMMENT ON TABLE historial_reprogramacion_ot IS 'RF66: historial de reprogramaciones de fecha de ejecucion';

CREATE TABLE documento_orden (
    id_documento      SERIAL        NOT NULL,
    titulo            VARCHAR(150)  NOT NULL,
    tipo              VARCHAR(30)   NOT NULL DEFAULT 'general',
    version_actual    INTEGER       NOT NULL DEFAULT 1,
    nombre_archivo    VARCHAR(255)  NOT NULL,
    mime_type         VARCHAR(100)  NOT NULL DEFAULT 'application/pdf',
    tamanio_bytes     INTEGER       NOT NULL DEFAULT 0,
    url_archivo       VARCHAR(500)  NOT NULL,
    contenido         BYTEA         NULL,
    subido_por        VARCHAR(120)  NULL,
    nota              VARCHAR(255)  NULL,
    fecha_carga       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_ot             VARCHAR(30)   NULL,

    CONSTRAINT pk_documento_orden PRIMARY KEY (id_documento)
);

COMMENT ON TABLE documento_orden IS 'RF40 a RF42: documentos, contratos y reportes versionados por OT';

CREATE TABLE intervencion (
    id_intervencion   SERIAL        NOT NULL,
    detalle           VARCHAR(255)  NULL,
    id_ot             VARCHAR(30)   NULL,

    CONSTRAINT pk_intervencion PRIMARY KEY (id_intervencion)
);

COMMENT ON TABLE intervencion IS 'Intervenciones realizadas en terreno para una OT';


CREATE TABLE evidencia_multimedia (
    id_evidencia        SERIAL        NOT NULL,
    tipo_archivo        VARCHAR(255)  NULL,
    version             INTEGER       NOT NULL DEFAULT 1,
    ruta_archivo_url    TEXT          NULL,
    contenido           BYTEA         NULL,
    capa_dibujo_json    TEXT          NULL,
    fecha_carga         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_ot               VARCHAR(30)   NULL,

    CONSTRAINT pk_evidencia_multimedia PRIMARY KEY (id_evidencia)
);

COMMENT ON TABLE  evidencia_multimedia IS 'Evidencia fotografica y audiovisual asociada a una OT';
COMMENT ON COLUMN evidencia_multimedia.capa_dibujo_json IS 'RF55: capa de anotaciones o dibujos sobre la imagen';



CREATE TABLE bitacora_auditoria (
    id_log             BIGSERIAL     NOT NULL,
    modulo_afectado    VARCHAR(100)  NULL,
    accion             VARCHAR(100)  NULL,
    valor_anterior     TEXT          NULL,
    valor_nuevo        TEXT          NULL,
    id_usuario         INTEGER       NULL,
    fecha_hora         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_bitacora_auditoria PRIMARY KEY (id_log)
);

COMMENT ON TABLE bitacora_auditoria IS 'Bitacora de auditoria de las acciones realizadas en el sistema';


CREATE TABLE registro_financiero (
    id_registro         SERIAL          NOT NULL,
    estimacion_costo    DECIMAL(12,2)   NOT NULL DEFAULT 0,
    estado_pago         VARCHAR(50)     NOT NULL DEFAULT 'Pendiente',
    iva                 DECIMAL(12,2)   NOT NULL DEFAULT 0,
    id_ot               VARCHAR(30)     NULL,

    CONSTRAINT pk_registro_financiero PRIMARY KEY (id_registro)
);

COMMENT ON TABLE registro_financiero IS 'Registro financiero asociado a una orden de trabajo';

CREATE TABLE factura (
    id_factura          SERIAL          NOT NULL,
    numero              VARCHAR(40)     NOT NULL,
    id_cliente          INTEGER         NULL,
    id_ot               VARCHAR(30)     NULL,
    fecha_emision       DATE            NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento   DATE            NULL,
    monto               DECIMAL(12,2)   NOT NULL DEFAULT 0,
    estado              VARCHAR(20)     NOT NULL DEFAULT 'Emitida',
    metodo_pago         VARCHAR(30)     NULL,
    pagada_en           DATE            NULL,
    notas               TEXT            NULL,

    CONSTRAINT pk_factura         PRIMARY KEY (id_factura),
    CONSTRAINT uq_factura_numero  UNIQUE (numero)
);

COMMENT ON TABLE  factura IS 'Facturas emitidas a los clientes';
COMMENT ON COLUMN factura.estado IS 'Emitida, Pagada, Vencida o Anulada';


CREATE TABLE pago (
    id_pago       SERIAL          NOT NULL,
    id_factura    INTEGER         NULL,
    monto         DECIMAL(12,2)   NOT NULL DEFAULT 0,
    metodo        VARCHAR(30)     NULL,
    fecha         DATE            NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT pk_pago PRIMARY KEY (id_pago)
);

COMMENT ON TABLE pago IS 'Pagos recibidos contra una factura';

CREATE TABLE tarifa_costo (
    id_tarifa        SERIAL          NOT NULL,
    tipo             VARCHAR(20)     NOT NULL,
    nombre           VARCHAR(120)    NOT NULL,
    unidad           VARCHAR(30)     NOT NULL DEFAULT 'unidad',
    valor_unitario   DECIMAL(12,2)   NOT NULL,

    CONSTRAINT pk_tarifa_costo PRIMARY KEY (id_tarifa)
);

COMMENT ON TABLE  tarifa_costo IS 'RF16: tarifas unitarias para la estimacion de costos';
COMMENT ON COLUMN tarifa_costo.tipo IS 'insumo, maquinaria, combustible o personal';

CREATE TABLE estimacion (
    id_estimacion     SERIAL          NOT NULL,
    descripcion       VARCHAR(200)    NOT NULL DEFAULT '',
    subtotal          DECIMAL(12,2)   NOT NULL,
    tasa_iva          DECIMAL(5,2)    NOT NULL,
    iva               DECIMAL(12,2)   NOT NULL,
    total             DECIMAL(12,2)   NOT NULL,
    detalle           TEXT            NOT NULL,
    id_usuario        INTEGER         NULL,
    fecha_creacion    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_estimacion PRIMARY KEY (id_estimacion)
);

COMMENT ON TABLE estimacion IS 'RF16: estimaciones de costo guardadas, con el detalle serializado en JSON';

CREATE TABLE utiliza (
    id_ot            VARCHAR(30)   NOT NULL,
    id_maquinaria    INTEGER       NOT NULL,
    horas_uso        INTEGER       NOT NULL DEFAULT 0,
    fecha_uso        DATE          NULL,

    CONSTRAINT pk_utiliza PRIMARY KEY (id_ot, id_maquinaria)
);

COMMENT ON TABLE utiliza IS 'Maquinaria utilizada en cada orden de trabajo';

-- Consume: insumos consumidos en una OT (relacion N:M con cantidad y costo)
CREATE TABLE consume (
    id_ot                 VARCHAR(30)     NOT NULL,
    id_insumo             INTEGER         NOT NULL,
    cantidad_consumida    INTEGER         NOT NULL DEFAULT 0,
    costo_total           DECIMAL(12,2)   NOT NULL DEFAULT 0,

    CONSTRAINT pk_consume PRIMARY KEY (id_ot, id_insumo)
);

COMMENT ON TABLE consume IS 'Insumos consumidos en cada orden de trabajo';



CREATE INDEX idx_dispositivo_push_usuario    ON dispositivo_push (id_usuario);
CREATE INDEX idx_movimiento_stock_fecha      ON movimiento_stock (fecha);
CREATE INDEX idx_movimiento_stock_insumo     ON movimiento_stock (id_insumo);
CREATE INDEX idx_solicitud_mod_ot            ON solicitud_modificacion (id_ot);
CREATE INDEX idx_solicitud_mod_estado        ON solicitud_modificacion (estado);
CREATE INDEX idx_historial_mod_ot            ON historial_modificacion_ot (id_ot);
CREATE INDEX idx_historial_reprog_ot         ON historial_reprogramacion_ot (id_ot);
CREATE INDEX idx_historial_reprog_fecha      ON historial_reprogramacion_ot (cambiado_en);
CREATE INDEX idx_documento_orden_ot          ON documento_orden (id_ot);
CREATE INDEX idx_orden_trabajo_cliente       ON orden_trabajo (id_cliente);
CREATE INDEX idx_orden_trabajo_operador      ON orden_trabajo (id_operador);
CREATE INDEX idx_orden_trabajo_estado        ON orden_trabajo (estado);
CREATE INDEX idx_factura_cliente             ON factura (id_cliente);
CREATE INDEX idx_insumo_categoria            ON insumo (id_categoria);


ALTER TABLE rol_permiso
    ADD CONSTRAINT fk_rol_permiso_rol
    FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE rol_permiso
    ADD CONSTRAINT fk_rol_permiso_permiso
    FOREIGN KEY (id_permiso) REFERENCES permiso (id_permiso)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE usuario
    ADD CONSTRAINT fk_usuario_rol
    FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE dispositivo_push
    ADD CONSTRAINT fk_dispositivo_push_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE insumo
    ADD CONSTRAINT fk_insumo_categoria
    FOREIGN KEY (id_categoria) REFERENCES categoria_insumo (id_categoria)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE insumo
    ADD CONSTRAINT fk_insumo_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES proveedor (id_proveedor)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE movimiento_stock
    ADD CONSTRAINT fk_movimiento_stock_insumo
    FOREIGN KEY (id_insumo) REFERENCES insumo (id_insumo)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE kit_item
    ADD CONSTRAINT fk_kit_item_kit
    FOREIGN KEY (id_kit) REFERENCES kit (id_kit)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE kit_item
    ADD CONSTRAINT fk_kit_item_insumo
    FOREIGN KEY (id_insumo) REFERENCES insumo (id_insumo)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE orden_trabajo
    ADD CONSTRAINT fk_orden_trabajo_cliente
    FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE orden_trabajo
    ADD CONSTRAINT fk_orden_trabajo_operador
    FOREIGN KEY (id_operador) REFERENCES usuario (id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE orden_trabajo
    ADD CONSTRAINT fk_orden_trabajo_maquinaria
    FOREIGN KEY (id_maquinaria) REFERENCES maquinaria (id_maquinaria)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE solicitud_modificacion
    ADD CONSTRAINT fk_solicitud_modificacion_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE historial_modificacion_ot
    ADD CONSTRAINT fk_historial_modificacion_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE historial_reprogramacion_ot
    ADD CONSTRAINT fk_historial_reprogramacion_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE documento_orden
    ADD CONSTRAINT fk_documento_orden_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE intervencion
    ADD CONSTRAINT fk_intervencion_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE evidencia_multimedia
    ADD CONSTRAINT fk_evidencia_multimedia_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE bitacora_auditoria
    ADD CONSTRAINT fk_bitacora_auditoria_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE registro_financiero
    ADD CONSTRAINT fk_registro_financiero_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE factura
    ADD CONSTRAINT fk_factura_cliente
    FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE factura
    ADD CONSTRAINT fk_factura_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE pago
    ADD CONSTRAINT fk_pago_factura
    FOREIGN KEY (id_factura) REFERENCES factura (id_factura)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE utiliza
    ADD CONSTRAINT fk_utiliza_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE utiliza
    ADD CONSTRAINT fk_utiliza_maquinaria
    FOREIGN KEY (id_maquinaria) REFERENCES maquinaria (id_maquinaria)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE consume
    ADD CONSTRAINT fk_consume_ot
    FOREIGN KEY (id_ot) REFERENCES orden_trabajo (id_ot)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE consume
    ADD CONSTRAINT fk_consume_insumo
    FOREIGN KEY (id_insumo) REFERENCES insumo (id_insumo)
    ON DELETE RESTRICT ON UPDATE CASCADE;



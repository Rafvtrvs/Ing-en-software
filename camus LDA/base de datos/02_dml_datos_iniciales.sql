BEGIN;


TRUNCATE TABLE
    consume, utiliza, pago, factura, registro_financiero,
    evidencia_multimedia, bitacora_auditoria, intervencion, documento_orden,
    historial_reprogramacion_ot, historial_modificacion_ot,
    solicitud_modificacion, orden_trabajo, kit_item, kit, movimiento_stock,
    insumo, categoria_insumo, proveedor, maquinaria, cliente,
    dispositivo_push, usuario, rol_permiso, permiso, rol,
    tarifa_costo, estimacion
RESTART IDENTITY CASCADE;


INSERT INTO permiso (id_permiso, clave, etiqueta, modulo) VALUES
    (1, 'dashboard.view',    'Ver dashboard',            'Dashboard'),
    (2, 'clients.manage',    'Gestionar clientes',       'Clientes'),
    (3, 'orders.manage',     'Gestionar ordenes',        'Ordenes'),
    (4, 'inventory.manage',  'Gestionar inventario',     'Inventario'),
    (5, 'operations.view',   'Ver operaciones',          'Operaciones'),
    (6, 'billing.manage',    'Gestionar facturacion',    'Facturacion'),
    (7, 'reports.view',      'Ver reportes',             'Reportes'),
    (8, 'users.manage',      'Gestionar usuarios',       'Usuarios');


INSERT INTO rol (id_rol, nombre, descripcion, estado, es_sistema) VALUES
    (1, 'Administrador',    'Acceso total al sistema',                        'Activo', TRUE),
    (2, 'Supervisor',       'Supervisa ordenes, inventario y reportes',       'Activo', TRUE),
    (3, 'Tecnico de Campo', 'Operario de terreno: solo ordenes asignadas',    'Activo', TRUE);


INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT 1, id_permiso FROM permiso;

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT 2, id_permiso FROM permiso WHERE clave <> 'users.manage';

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT 3, id_permiso FROM permiso
WHERE clave IN ('dashboard.view', 'orders.manage', 'operations.view');


INSERT INTO usuario (id_usuario, nombre, correo_electronico, password_hash, telefono, id_rol, estado, ultimo_acceso) VALUES
    (1, 'Administrador', 'admin@camus.cl',      '$2b$10$e3oYt28fMi4uBbDLmtuNv.0iJ9lFkWSdJMKZolL3U14ylAK1Kw6tS', '+56 2 2345 6789', 1, 'Activo', '2026-05-22 08:15:00'),
    (2, 'Patricia Nunez', 'supervisor@camus.cl', '$2b$10$by/ugsZh4.m7g5QeJsseg.Kqp6vkOmcCbS0MO8kIwe9jEd3X1J1fm', '+56 9 8812 4455', 2, 'Activo', '2026-05-22 08:40:00'),
    (3, 'Luis Torres',   'operador@camus.cl',   '$2b$10$5TPcav26rzTAVK.UGDEAluabKVhneuBNU9ggyuzkdEBM2e8iI4doq', '+56 9 6543 2109', 3, 'Activo', '2026-05-22 09:05:00'),
    (4, 'Carlos Ruiz',   'cruiz@camus.cl',      '$2b$10$5TPcav26rzTAVK.UGDEAluabKVhneuBNU9ggyuzkdEBM2e8iI4doq', '+56 9 7721 3344', 3, 'Activo', NULL);



INSERT INTO cliente (id_cliente, rut, nombre, empresa, telefono, email, direccion, estado, ultima_orden) VALUES
    (1, '76.123.456-7', 'Carlos Mendoza',  'Comercial XYZ Ltda.',      '+56 9 8765 4321', 'carlos@xyz.cl',          'Av. Las Torres 1234, Santiago',   'Activo',    '22/05/2026'),
    (2, '77.234.567-8', 'Maria Gonzalez',  'Inversiones SpA',          '+56 9 7654 3210', 'maria@inversiones.cl',   'Camino a Melipilla 456',          'Activo',    '21/05/2026'),
    (3, '78.345.678-9', 'Roberto Silva',   'Constructora ABC',         '+56 9 6543 2109', 'roberto@abc.cl',         'Av. Libertad 123, Maipu',         'Inactivo',  '15/04/2026'),
    (4, '79.456.789-0', 'Ana Torres',      'Aguas Claras Ltda.',       '+56 9 5432 1098', 'ana@aguasclaras.cl',     'Los Alerces 980, Nunoa',          'Activo',    '20/05/2026'),
    (5, '80.567.890-1', 'Pedro Rojas',     'Edificio Central',         '+56 9 4321 0987', 'pedro@edificio.cl',      'Huerfanos 1150, Santiago Centro', 'Pendiente', ''),
    (6, '81.678.901-2', 'Laura Soto',      'Servicios Urbanos SA',     '+56 9 3210 9876', 'laura@urbanos.cl',       'Gran Avenida 4521, La Cisterna',  'Activo',    '19/05/2026'),
    (7, '82.789.012-3', 'Miguel Alvarez',  'Industrias del Sur',       '+56 9 2109 8765', 'miguel@idsur.cl',        'Ruta 5 Sur km 22, San Bernardo',  'Bloqueado', '10/03/2026'),
    (8, '83.890.123-4', 'Daniela Perez',   'Condominio Las Flores',    '+56 9 1098 7654', 'daniela@lasflores.cl',   'Las Flores 330, La Florida',      'Activo',    '18/05/2026');



INSERT INTO maquinaria (id_maquinaria, codigo, nombre, numero_serie, patente, marca, categoria, estado, ubicacion, ubicacion_base, asignado_a, fecha_compra, ultima_mantencion, proxima_mantencion) VALUES
    (1, 'BOMBA-004', 'Bomba sumergible 3HP',        'BS-2024-00891', NULL,      'Grundfos',    'Bombas',       'Operativo',          'Bodega Central, Santiago', 'Bodega Central, Santiago', 'Unidad movil 02', '2024-03-12', '2026-04-10', '2026-07-10'),
    (2, 'CAM-012',   'Camion hidrojet 3000 PSI',    'CJ-2023-0045',  'ABCD-12', 'Isuzu',       'Vehiculos',    'Operativo',          'Patente ABCD-12',          'Patente ABCD-12',          'Carlos Ruiz',     '2023-07-25', '2026-05-02', '2026-08-02'),
    (3, 'GEN-003',   'Generador diesel 15 kVA',     'GD-2022-0112',  NULL,      'Caterpillar', 'Energia',      'Asignado',           'Obra Providencia 1234',    'Taller Las Condes',        'Obra activa',     '2022-11-08', '2026-06-01', '2026-06-20'),
    (4, 'CAM-008',   'Camara inspeccion CCTV',      'CI-2025-0033',  NULL,      'Rausch',      'Inspeccion',   'Operativo',          'Bodega Central, Santiago', 'Bodega Central, Santiago', 'Maria Gonzalez',  '2025-01-30', '2026-03-15', '2026-09-15'),
    (5, 'COMP-002',  'Compresor industrial 500L',   'CP-2021-0078',  NULL,      'Atlas Copco', 'Herramientas', 'Fuera de servicio',  'Taller Las Condes',        'Taller Las Condes',        NULL,              '2021-05-14', '2026-01-20', '2026-06-25'),
    (6, 'BOMBA-009', 'Bomba de achique portatil',   'BA-2024-0156',  NULL,      'Flygt',       'Bombas',       'Operativo',          'Unidad movil 01',          'Unidad movil 01',          'Unidad movil 01', '2024-09-02', '2026-05-18', '2026-08-18');




INSERT INTO proveedor (id_proveedor, nombre, rut, contacto, telefono, email, direccion, condicion_pago, estado) VALUES
    (1, 'Distribuidora Hidraulica Ltda.', '76.555.111-2', 'Jorge Lagos',   '+56 2 2456 7788', 'ventas@dhidraulica.cl', 'Av. Industrial 2300, Quilicura', '30 dias',    'Activo'),
    (2, 'Insumos Sanitarios SpA',         '77.666.222-3', 'Carla Munoz',   '+56 2 2789 1122', 'contacto@insasan.cl',   'El Roble 455, Pudahuel',         'Contado',    'Activo'),
    (3, 'Ferreteria Industrial Norte',    '78.777.333-4', 'Rodrigo Vera',  '+56 2 2334 5566', 'ventas@finorte.cl',     'Panamericana Norte 7890',        '60 dias',    'Activo');

INSERT INTO categoria_insumo (id_categoria, nombre, descripcion, estado) VALUES
    (1, 'Tuberias y fitting', 'Tuberias, codos, uniones y accesorios de PVC', 'Activa'),
    (2, 'Sellos y juntas',    'Sellos hidraulicos, gomas y juntas',           'Activa'),
    (3, 'Quimicos',           'Desengrasantes y productos de limpieza',       'Activa'),
    (4, 'Seguridad',          'Elementos de proteccion personal',             'Activa');


INSERT INTO insumo (id_insumo, codigo, nombre, stock_actual, stock_minimo, unidad, costo_unitario, estado, id_categoria, id_proveedor) VALUES
    (1, 'INS-001', 'Tuberia PVC 110mm',          8,  20, 'm',      4500.00, 'Critico', 1, 1),
    (2, 'INS-002', 'Codo PVC 90 grados',        45,  30, 'unidad', 1200.00, 'Ok',      1, 1),
    (3, 'INS-003', 'Sello hidraulico',          18,  15, 'unidad',  890.00, 'Bajo',    2, 2),
    (4, 'INS-004', 'Union PVC 110mm',           60,  25, 'unidad',  950.00, 'Ok',      1, 1),
    (5, 'INS-005', 'Desengrasante industrial',  12,  10, 'litro',  3200.00, 'Ok',      3, 2),
    (6, 'INS-006', 'Guantes de nitrilo',        80,  40, 'par',     750.00, 'Ok',      4, 3),
    (7, 'INS-007', 'Mascarilla con filtro',     25,  20, 'unidad', 2100.00, 'Ok',      4, 3),
    (8, 'INS-008', 'Cinta de senalizacion',     14,  10, 'rollo',  1800.00, 'Ok',      4, 3);


INSERT INTO movimiento_stock (id_movimiento, id_insumo, tipo, cantidad, detalle, usuario, id_ot, fecha) VALUES
    (1, 1, 'Entrada', 30, 'Compra orden 4521',               'Administrador',  NULL,            '2026-05-05 10:20:00'),
    (2, 1, 'Salida',  22, 'Consumo en terreno',              'Luis Torres',    'OT-2026-0127',  '2026-05-21 14:05:00'),
    (3, 2, 'Entrada', 50, 'Compra orden 4522',               'Administrador',  NULL,            '2026-05-06 09:10:00'),
    (4, 2, 'Salida',   5, 'Consumo en terreno',              'Luis Torres',    'OT-2026-0126',  '2026-05-18 16:30:00'),
    (5, 3, 'Entrada', 25, 'Compra orden 4530',               'Patricia Nunez', NULL,            '2026-05-09 11:45:00'),
    (6, 3, 'Salida',   7, 'Consumo en terreno',              'Carlos Ruiz',    'OT-2026-0124',  '2026-05-20 08:50:00'),
    (7, 5, 'Entrada', 20, 'Compra orden 4535',               'Administrador',  NULL,            '2026-05-11 15:00:00'),
    (8, 5, 'Salida',   8, 'Limpieza de camara',              'Luis Torres',    'OT-2026-0126',  '2026-05-18 17:10:00');


INSERT INTO kit (id_kit, nombre, descripcion, estado) VALUES
    (1, 'Kit desobstruccion', 'Insumos basicos para desobstruccion de ductos', 'Activo'),
    (2, 'Kit reparacion PVC', 'Insumos para reparacion de tuberias de PVC',    'Activo'),
    (3, 'Kit seguridad',      'Elementos de proteccion personal por cuadrilla','Activo');

INSERT INTO kit_item (id_kit, id_insumo, cantidad) VALUES
    (1, 5, 2), (1, 6, 4), (1, 8, 1),
    (2, 1, 6), (2, 2, 4), (2, 3, 2), (2, 4, 4),
    (3, 6, 4), (3, 7, 4), (3, 8, 2);



INSERT INTO tarifa_costo (id_tarifa, tipo, nombre, unidad, valor_unitario) VALUES
    (1, 'personal',    'Hora tecnico de campo',      'hora',   12000.00),
    (2, 'personal',    'Hora supervisor',            'hora',   18000.00),
    (3, 'maquinaria',  'Hora camion hidrojet',       'hora',   45000.00),
    (4, 'maquinaria',  'Hora generador diesel',      'hora',    9000.00),
    (5, 'combustible', 'Litro de diesel',            'litro',   1050.00),
    (6, 'insumo',      'Metro tuberia PVC 110mm',    'm',       4500.00);

INSERT INTO estimacion (id_estimacion, descripcion, subtotal, tasa_iva, iva, total, detalle, id_usuario, fecha_creacion) VALUES
    (1, 'Estimacion OT-2026-0128 obstruccion de camara', 285000.00, 19.00, 54150.00, 339150.00,
        '[{"tipo":"personal","nombre":"Hora tecnico de campo","cantidad":6,"valor":12000},{"tipo":"maquinaria","nombre":"Hora camion hidrojet","cantidad":4,"valor":45000},{"tipo":"combustible","nombre":"Litro de diesel","cantidad":30,"valor":1050}]',
        2, '2026-05-22 09:30:00'),
    (2, 'Estimacion OT-2026-0127 rotura de tuberia matriz', 412000.00, 19.00, 78280.00, 490280.00,
        '[{"tipo":"insumo","nombre":"Metro tuberia PVC 110mm","cantidad":22,"valor":4500},{"tipo":"personal","nombre":"Hora tecnico de campo","cantidad":12,"valor":12000},{"tipo":"maquinaria","nombre":"Hora camion hidrojet","cantidad":3,"valor":45000}]',
        2, '2026-05-21 10:15:00');



INSERT INTO orden_trabajo (id_ot, fecha_emision, estado, prioridad, servicio, categoria, direccion, latitud, longitud, fecha_limite, fecha_inicio, fecha_termino, duracion_horas, codigo_camion, id_maquinaria, nombre_cliente, progreso, orden_visual, id_cliente, id_operador, operadores_json) VALUES
    ('OT-2026-0128', '2026-05-22', 'Pendiente',  'Alta',  'Obstruccion de camara',      'Obstruccion',        'Av. Las Torres 1234, Santiago', -33.448900, -70.669300, '2026-05-25', NULL,         NULL,         NULL, 'CAM-012', 2, 'Comercial XYZ Ltda.',   0,   0, 1, 3, '[{"id":3,"name":"Luis Torres"},{"id":4,"name":"Carlos Ruiz"}]'),
    ('OT-2026-0127', '2026-05-21', 'En Curso',   'Media', 'Rotura de tuberia matriz',   'Rotura de Tuberia',  'Camino a Melipilla 456',        -33.540200, -70.785100, '2026-05-24', '2026-05-21', NULL,         NULL, 'CAM-012', 2, 'Inversiones SpA',      60,   1, 2, 3, '[{"id":3,"name":"Luis Torres"}]'),
    ('OT-2026-0126', '2026-05-18', 'Completada', 'Baja',  'Mantencion preventiva',      'Mantencion',         'Pte. Salvador 789',             -33.426700, -70.615400, '2026-05-20', '2026-05-18', '2026-05-18',  5.5, 'CAM-008', 4, 'Comercial XYZ Ltda.', 100,   2, 1, 4, '[{"id":4,"name":"Carlos Ruiz"}]'),
    ('OT-2026-0124', '2026-05-20', 'En Curso',   'Alta',  'Desobstruccion de ducto',    'Obstruccion',        'Av. Libertad 123, Maipu',       -33.511800, -70.751200, '2026-05-23', '2026-05-20', NULL,         NULL, 'CAM-012', 2, 'Constructora ABC',     35,   3, 3, 4, '[{"id":4,"name":"Carlos Ruiz"},{"id":3,"name":"Luis Torres"}]'),
    ('OT-2026-0123', '2026-05-15', 'Completada', 'Media', 'Limpieza de fosa septica',   'Mantencion',         'Las Flores 330, La Florida',    -33.552300, -70.586700, '2026-05-17', '2026-05-16', '2026-05-17',  8.0, 'CAM-012', 2, 'Condominio Las Flores',100,  4, 8, 3, '[{"id":3,"name":"Luis Torres"}]');


INSERT INTO utiliza (id_ot, id_maquinaria, horas_uso, fecha_uso) VALUES
    ('OT-2026-0128', 3, 4, '2026-05-22'),
    ('OT-2026-0127', 2, 6, '2026-05-21'),
    ('OT-2026-0126', 4, 3, '2026-05-18'),
    ('OT-2026-0124', 2, 5, '2026-05-20'),
    ('OT-2026-0123', 2, 8, '2026-05-16');


INSERT INTO consume (id_ot, id_insumo, cantidad_consumida, costo_total) VALUES
    ('OT-2026-0127', 1, 22,  99000.00),
    ('OT-2026-0127', 4,  6,   5700.00),
    ('OT-2026-0126', 2,  5,   6000.00),
    ('OT-2026-0126', 5,  8,  25600.00),
    ('OT-2026-0124', 3,  7,   6230.00),
    ('OT-2026-0123', 5,  4,  12800.00);



INSERT INTO intervencion (id_intervencion, detalle, id_ot) VALUES
    (1, 'Inspeccion inicial con camara CCTV, se detecta raiz obstruyendo la camara',  'OT-2026-0127'),
    (2, 'Corte y reemplazo de 22 metros de tuberia PVC 110mm',                        'OT-2026-0127'),
    (3, 'Limpieza con hidrojet y verificacion de flujo',                              'OT-2026-0126'),
    (4, 'Desobstruccion mecanica del ducto principal',                                'OT-2026-0124'),
    (5, 'Vaciado y lavado de fosa septica, retiro de lodos',                          'OT-2026-0123');

INSERT INTO evidencia_multimedia (id_evidencia, tipo_archivo, version, ruta_archivo_url, capa_dibujo_json, fecha_carga, id_ot) VALUES
    (1, 'image/jpeg', 1, 'https://storage.camus.cl/evidencias/ot-0127-antes.jpg',  '{"trazos":[{"tipo":"circulo","x":120,"y":210,"r":40,"color":"#e11d48"}]}', '2026-05-21 11:20:00', 'OT-2026-0127'),
    (2, 'image/jpeg', 1, 'https://storage.camus.cl/evidencias/ot-0127-despues.jpg', NULL,                                                                     '2026-05-21 17:45:00', 'OT-2026-0127'),
    (3, 'image/jpeg', 1, 'https://storage.camus.cl/evidencias/ot-0126-final.jpg',   NULL,                                                                     '2026-05-18 18:00:00', 'OT-2026-0126'),
    (4, 'video/mp4',  1, 'https://storage.camus.cl/evidencias/ot-0124-cctv.mp4',    NULL,                                                                     '2026-05-20 12:30:00', 'OT-2026-0124');

INSERT INTO documento_orden (id_documento, titulo, tipo, version_actual, nombre_archivo, mime_type, tamanio_bytes, url_archivo, subido_por, nota, fecha_carga, id_ot) VALUES
    (1, 'Informe tecnico OT-2026-0126', 'reporte',  1, 'informe-ot-0126.pdf', 'application/pdf', 248500, 'https://storage.camus.cl/docs/informe-ot-0126.pdf', 'Carlos Ruiz',    'Informe de cierre del servicio', '2026-05-18 18:30:00', 'OT-2026-0126'),
    (2, 'Acta de conformidad cliente',  'contrato', 2, 'acta-ot-0126.pdf',    'application/pdf', 112300, 'https://storage.camus.cl/docs/acta-ot-0126.pdf',    'Patricia Nunez', 'Firmada por el cliente',         '2026-05-19 09:10:00', 'OT-2026-0126');



INSERT INTO solicitud_modificacion (id_solicitud, id_ot, id_operador, nombre_operador, campos_modificar, motivo, cambios_json, estado, solicitado_en, id_revisor, nombre_revisor, revisado_en, motivo_rechazo) VALUES
    (1, 'OT-2026-0124', '4', 'Carlos Ruiz', 'fecha_limite', 'El acceso al ducto esta bloqueado por obras de la municipalidad', '{"fecha_limite":"2026-05-26"}', 'Pendiente', '2026-05-20 15:40:00', NULL, NULL, NULL, NULL),
    (2, 'OT-2026-0127', '3', 'Luis Torres', 'prioridad',    'La filtracion aumento y afecta la via publica',                   '{"prioridad":"Alta"}',         'Aprobada',  '2026-05-21 12:00:00', '2', 'Patricia Nunez', '2026-05-21 12:35:00', NULL);

INSERT INTO historial_modificacion_ot (id_historial, id_ot, campo, etiqueta, valor_anterior, valor_nuevo, id_usuario, nombre_usuario, cambiado_en) VALUES
    (1, 'OT-2026-0127', 'prioridad', 'Prioridad', 'Media', 'Alta', '2', 'Patricia Nunez', '2026-05-21 12:35:00'),
    (2, 'OT-2026-0127', 'progreso',  'Progreso',  '40',    '60',   '3', 'Luis Torres',    '2026-05-21 16:20:00');

INSERT INTO historial_reprogramacion_ot (id_reprogramacion, id_ot, fecha_anterior, fecha_nueva, id_usuario, nombre_usuario, cambiado_en) VALUES
    (1, 'OT-2026-0124', '2026-05-22', '2026-05-23', '2', 'Patricia Nunez', '2026-05-20 16:05:00');



INSERT INTO registro_financiero (id_registro, estimacion_costo, estado_pago, iva, id_ot) VALUES
    (1, 285000.00, 'Pendiente', 54150.00, 'OT-2026-0128'),
    (2, 412000.00, 'Pendiente', 78280.00, 'OT-2026-0127'),
    (3, 180000.00, 'Pagado',    34200.00, 'OT-2026-0126'),
    (4, 240000.00, 'Pendiente', 45600.00, 'OT-2026-0124'),
    (5, 320000.00, 'Pagado',    60800.00, 'OT-2026-0123');

INSERT INTO factura (id_factura, numero, id_cliente, id_ot, fecha_emision, fecha_vencimiento, monto, estado, metodo_pago, pagada_en, notas) VALUES
    (1, 'F-2026-0451', 1, 'OT-2026-0126', '2026-05-19', '2026-06-18', 214200.00, 'Pagada',  'Transferencia', '2026-05-27', 'Servicio de mantencion preventiva'),
    (2, 'F-2026-0452', 8, 'OT-2026-0123', '2026-05-18', '2026-06-17', 380800.00, 'Pagada',  'Transferencia', '2026-05-30', 'Limpieza de fosa septica'),
    (3, 'F-2026-0453', 2, 'OT-2026-0127', '2026-05-22', '2026-06-21', 490280.00, 'Emitida', NULL,            NULL,         'Pendiente de cierre de la OT');

INSERT INTO pago (id_pago, id_factura, monto, metodo, fecha) VALUES
    (1, 1, 214200.00, 'Transferencia', '2026-05-27'),
    (2, 2, 200000.00, 'Transferencia', '2026-05-30'),
    (3, 2, 180800.00, 'Transferencia', '2026-06-03');



INSERT INTO bitacora_auditoria (id_log, modulo_afectado, accion, valor_anterior, valor_nuevo, id_usuario, fecha_hora) VALUES
    (1, 'Ordenes',    'Crear orden de trabajo',   NULL,    'OT-2026-0128', 1, '2026-05-22 08:20:00'),
    (2, 'Ordenes',    'Actualizar prioridad',     'Media', 'Alta',         2, '2026-05-21 12:35:00'),
    (3, 'Inventario', 'Registrar salida',         '30',    '8',            3, '2026-05-21 14:05:00'),
    (4, 'Usuarios',   'Asignar rol',              NULL,    'Supervisor',   1, '2026-05-15 10:00:00'),
    (5, 'Facturacion','Registrar pago',           NULL,    'F-2026-0451',  2, '2026-05-27 11:10:00');


SELECT setval('rol_id_rol_seq',                                 (SELECT COALESCE(MAX(id_rol),             0) FROM rol)                         + 1, FALSE);
SELECT setval('permiso_id_permiso_seq',                         (SELECT COALESCE(MAX(id_permiso),         0) FROM permiso)                     + 1, FALSE);
SELECT setval('usuario_id_usuario_seq',                         (SELECT COALESCE(MAX(id_usuario),         0) FROM usuario)                     + 1, FALSE);
SELECT setval('dispositivo_push_id_dispositivo_seq',            (SELECT COALESCE(MAX(id_dispositivo),     0) FROM dispositivo_push)            + 1, FALSE);
SELECT setval('cliente_id_cliente_seq',                         (SELECT COALESCE(MAX(id_cliente),         0) FROM cliente)                     + 1, FALSE);
SELECT setval('maquinaria_id_maquinaria_seq',                   (SELECT COALESCE(MAX(id_maquinaria),      0) FROM maquinaria)                  + 1, FALSE);
SELECT setval('proveedor_id_proveedor_seq',                     (SELECT COALESCE(MAX(id_proveedor),       0) FROM proveedor)                   + 1, FALSE);
SELECT setval('categoria_insumo_id_categoria_seq',              (SELECT COALESCE(MAX(id_categoria),       0) FROM categoria_insumo)            + 1, FALSE);
SELECT setval('insumo_id_insumo_seq',                           (SELECT COALESCE(MAX(id_insumo),          0) FROM insumo)                      + 1, FALSE);
SELECT setval('movimiento_stock_id_movimiento_seq',             (SELECT COALESCE(MAX(id_movimiento),      0) FROM movimiento_stock)            + 1, FALSE);
SELECT setval('kit_id_kit_seq',                                 (SELECT COALESCE(MAX(id_kit),             0) FROM kit)                         + 1, FALSE);
SELECT setval('solicitud_modificacion_id_solicitud_seq',        (SELECT COALESCE(MAX(id_solicitud),       0) FROM solicitud_modificacion)      + 1, FALSE);
SELECT setval('historial_modificacion_ot_id_historial_seq',     (SELECT COALESCE(MAX(id_historial),       0) FROM historial_modificacion_ot)   + 1, FALSE);
SELECT setval('historial_reprogramacion_ot_id_reprogramacion_seq', (SELECT COALESCE(MAX(id_reprogramacion), 0) FROM historial_reprogramacion_ot) + 1, FALSE);
SELECT setval('documento_orden_id_documento_seq',               (SELECT COALESCE(MAX(id_documento),       0) FROM documento_orden)             + 1, FALSE);
SELECT setval('intervencion_id_intervencion_seq',               (SELECT COALESCE(MAX(id_intervencion),    0) FROM intervencion)                + 1, FALSE);
SELECT setval('bitacora_auditoria_id_log_seq',                  (SELECT COALESCE(MAX(id_log),             0) FROM bitacora_auditoria)          + 1, FALSE);
SELECT setval('evidencia_multimedia_id_evidencia_seq',          (SELECT COALESCE(MAX(id_evidencia),       0) FROM evidencia_multimedia)        + 1, FALSE);
SELECT setval('registro_financiero_id_registro_seq',            (SELECT COALESCE(MAX(id_registro),        0) FROM registro_financiero)         + 1, FALSE);
SELECT setval('factura_id_factura_seq',                         (SELECT COALESCE(MAX(id_factura),         0) FROM factura)                     + 1, FALSE);
SELECT setval('pago_id_pago_seq',                               (SELECT COALESCE(MAX(id_pago),            0) FROM pago)                        + 1, FALSE);
SELECT setval('tarifa_costo_id_tarifa_seq',                     (SELECT COALESCE(MAX(id_tarifa),          0) FROM tarifa_costo)                + 1, FALSE);
SELECT setval('estimacion_id_estimacion_seq',                   (SELECT COALESCE(MAX(id_estimacion),      0) FROM estimacion)                  + 1, FALSE);

COMMIT;



-- 1. Tablas Independientes (Sin llaves foráneas)
CREATE TABLE Usuario (
    ID_Usuario INT PRIMARY KEY,
    Nombre VARCHAR(100),
    Correo_electronico VARCHAR(100),
    Contraseña VARCHAR(255)
);

CREATE TABLE Cliente (
    ID_Cliente INT PRIMARY KEY,
    RUT VARCHAR(12),
    Nombre VARCHAR(100),
    Telefono VARCHAR(20),
    Email VARCHAR(100),
    Direccion VARCHAR(255)
);

CREATE TABLE Maquinaria (
    ID_Maquinaria INT PRIMARY KEY,
    Patente VARCHAR(10),
    Marca VARCHAR(50),
    Estado VARCHAR(50)
);

CREATE TABLE Insumo (
    ID_Insumo INT PRIMARY KEY,
    Nombre VARCHAR(100),
    Stock_Actual INT
);

-- 2. Tablas Dependientes
CREATE TABLE Orden_Trabajo (
    ID_OT INT PRIMARY KEY,
    Fecha_Emision DATE,
    Estado VARCHAR(50),
    Prioridad VARCHAR(20),
    ID_Cliente INT,
    ID_Operador INT,
    FOREIGN KEY (ID_Cliente) REFERENCES Cliente(ID_Cliente),
    FOREIGN KEY (ID_Operador) REFERENCES Usuario(ID_Usuario)
);

CREATE TABLE Intervencion (
    ID_Intervencion INT PRIMARY KEY,
    Detalle VARCHAR(255),
    ID_OT INT,
    FOREIGN KEY (ID_OT) REFERENCES Orden_Trabajo(ID_OT)
);

CREATE TABLE Bitácora_Auditoria (
    ID_Long INT PRIMARY KEY,
    Modulo_Afectado VARCHAR(100),
    Accion VARCHAR(100),
    Valor_Anterior VARCHAR(255),
    Valor_Nuevo VARCHAR(255),
    Fecha_Hora DATETIME
);

CREATE TABLE Evidencia_Multimedia (
    ID_Evidencia INT PRIMARY KEY,
    Tipo_Archivo VARCHAR(50),
    Version INT,
    Ruta_Archivo_URL VARCHAR(255),
    Capa_Dibujo_Json TEXT,
    Fecha_Carga DATETIME,
    ID_OT INT,
    FOREIGN KEY (ID_OT) REFERENCES Orden_Trabajo(ID_OT)
);

CREATE TABLE Registro_Financiar (
    ID_Registro_Financiar INT PRIMARY KEY,
    Estimacion_Costo DECIMAL(10,2),
    Estado_Pago VARCHAR(50),
    IVA DECIMAL(10,2),
    ID_OT INT,
    FOREIGN KEY (ID_OT) REFERENCES Orden_Trabajo(ID_OT)
);

-- 3. Tablas de Relación N:M
CREATE TABLE Utiliza (
    ID_OT INT,
    ID_Maquinaria INT,
    Horas_Uso INT,
    Fecha_Uso DATE,
    PRIMARY KEY (ID_OT, ID_Maquinaria),
    FOREIGN KEY (ID_OT) REFERENCES Orden_Trabajo(ID_OT),
    FOREIGN KEY (ID_Maquinaria) REFERENCES Maquinaria(ID_Maquinaria)
);

CREATE TABLE Consume (
    ID_OT INT,
    ID_Insumo INT,
    Cantidad_Consumida INT,
    Costo_Total DECIMAL(10,2),
    PRIMARY KEY (ID_OT, ID_Insumo),
    FOREIGN KEY (ID_OT) REFERENCES Orden_Trabajo(ID_OT),
    FOREIGN KEY (ID_Insumo) REFERENCES Insumo(ID_Insumo)
);
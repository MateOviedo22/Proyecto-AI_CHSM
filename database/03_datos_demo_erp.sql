-- Datos ficticios opcionales para los módulos ERP (se ejecuta después de las migraciones). Idempotente.
UPDATE proveedores SET razon_social='Curtidos del Norte, S.A.',ruc='J0310000000001',condiciones_pago='Crédito 30 días',plazo_pago_dias=30 WHERE id=1 AND razon_social=nombre;
UPDATE proveedores SET razon_social='Suministros León, S.A.',ruc='J0310000000002',condiciones_pago='Contado',plazo_pago_dias=0 WHERE id=2 AND razon_social=nombre;
UPDATE proveedores SET razon_social='Textiles del Centro, S.A.',ruc='J0310000000003',condiciones_pago='Crédito 15 días',plazo_pago_dias=15 WHERE id=3 AND razon_social=nombre;
INSERT INTO etapas_produccion(id,nombre,descripcion,responsable,duracion,orden,activa) VALUES
 (1,'Diseño y patronaje','Preparación del diseño y patrones de corte','Diseño','45',1,true),
 (2,'Corte de cuero','Corte de piezas según ficha técnica','Corte','35',2,true),
 (3,'Preparación y costura','Unión de piezas y costuras principales','Costura','90',3,true),
 (4,'Ensamblaje','Montaje de herrajes y componentes','Ensamblaje','55',4,true),
 (5,'Control de calidad','Inspección final del producto','Calidad','20',5,true) ON CONFLICT DO NOTHING;
INSERT INTO material_proveedores(material_id,proveedor_id,precio_ref,plazo_entrega_dias,preferido) VALUES
 (1,2,395,5,false),(2,2,430,5,false),(3,2,90,3,false) ON CONFLICT DO NOTHING;
-- Fichas técnicas vigentes de ejemplo (el bolso incluye el llavero como componente: BOM multinivel).
INSERT INTO fichas_tecnicas(producto_id,nombre,tiempo_minutos,notas,codigo,version_ficha,estado,activa)
SELECT 6,'Llavero de cuero',20,'Pieza troquelada con argolla','FT-LLA-001-V1.0','1.0','Vigente',true WHERE NOT EXISTS (SELECT 1 FROM fichas_tecnicas WHERE codigo='FT-LLA-001-V1.0');
INSERT INTO fichas_tecnicas(producto_id,nombre,tiempo_minutos,notas,codigo,version_ficha,estado,activa)
SELECT 1,'Billetera clásica',60,'Seis compartimentos interiores','FT-BIL-001-V1.0','1.0','Vigente',true WHERE NOT EXISTS (SELECT 1 FROM fichas_tecnicas WHERE codigo='FT-BIL-001-V1.0');
INSERT INTO fichas_tecnicas(producto_id,nombre,tiempo_minutos,notas,codigo,version_ficha,estado,activa)
SELECT 2,'Bolso artesanal',210,'Bolso con correa ajustable y llavero decorativo','FT-BOL-001-V1.0','1.0','Vigente',true WHERE NOT EXISTS (SELECT 1 FROM fichas_tecnicas WHERE codigo='FT-BOL-001-V1.0');
INSERT INTO ficha_materiales(ficha_id,material_id,cantidad,merma_pct,parte)
SELECT f.id,x.m,x.c,x.merma,x.parte FROM fichas_tecnicas f JOIN (VALUES
 ('FT-LLA-001-V1.0',1,0.03,10,'Cuerpo'),
 ('FT-BIL-001-V1.0',1,0.15,10,'Cuerpo'),('FT-BIL-001-V1.0',3,0.05,0,'Costura'),
 ('FT-BOL-001-V1.0',2,0.80,12,'Cuerpo'),('FT-BOL-001-V1.0',1,0.10,10,'Asa'),('FT-BOL-001-V1.0',3,0.20,0,'Costura')
) AS x(codigo,m,c,merma,parte) ON x.codigo=f.codigo ON CONFLICT DO NOTHING;
INSERT INTO ficha_componentes(ficha_id,producto_id,cantidad,parte)
SELECT f.id,6,1,'Accesorio' FROM fichas_tecnicas f WHERE f.codigo='FT-BOL-001-V1.0' ON CONFLICT DO NOTHING;

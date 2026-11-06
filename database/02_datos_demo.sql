-- Ejemplos ficticios, opcionales. No corresponden a datos reales de Sunshine.
INSERT INTO clientes(id,nombre,tipo,correo,telefono,ubicacion,estado) VALUES
('CLI-001','María González','Frecuente','maria@example.com','8888-1234','Managua','Activo'),
('CLI-002','Hotel Las Flores','Corporativo','compras@example.com','2222-4567','Granada','Activo'),
('CLI-003','Ana Martínez','Ocasional','ana@example.com','8777-3210','León','Activo') ON CONFLICT DO NOTHING;
INSERT INTO proveedores(id,codigo,nombre,contacto,telefono,correo,direccion,estado) VALUES
(1,'PROV-001','Curtidos del Norte','Carlos Martínez','8888-1200','ventas@example.com','Managua','Activo'),
(2,'PROV-002','Suministros León','María López','8888-2450','suministros@example.com','León','Activo'),
(3,'PROV-003','Textiles Centro','Ana Rodríguez','8888-3175','textiles@example.com','Managua','Activo') ON CONFLICT DO NOTHING;
INSERT INTO materiales(id,codigo,nombre,tipo,categoria,unidad,existencia,minimo,costo,ubicacion,proveedor) VALUES
(1,'MAT-CUE-001','Cuero tratado café','Materia prima','Cuero','m²',45,50,380,'Almacén principal','Curtidos del Norte'),
(2,'MAT-CUE-002','Cuero natural','Materia prima','Cuero','m²',85,40,420,'Almacén principal','Curtidos del Norte'),
(3,'MAT-HIL-001','Carrete de hilo negro','Insumo','Costura','carrete',5,15,95,'Taller de producción','Textiles Centro') ON CONFLICT DO NOTHING;
INSERT INTO productos(id,codigo,nombre,categoria,precio,existencia,minimo,descripcion,material) VALUES
(1,'BIL-001','Billetera clásica','Billeteras',850,12,3,'Billetera artesanal','Cuero'),
(2,'BOL-001','Bolso artesanal','Bolsos',2450,5,2,'Bolso de cuero','Cuero'),
(3,'MON-001','Monedero pequeño','Monederos',450,20,4,'Monedero artesanal','Cuero'),
(4,'CAR-001','Cartera elegante','Carteras',3200,4,2,'Cartera artesanal','Cuero'),
(5,'POR-001','Porta documentos','Accesorios',1150,8,2,'Porta documentos artesanal','Cuero'),
(6,'LLA-001','Llavero de cuero','Accesorios',180,30,5,'Llavero artesanal','Cuero') ON CONFLICT DO NOTHING;

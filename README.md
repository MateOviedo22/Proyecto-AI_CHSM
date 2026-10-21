Sunshine Handmade Nicaragua
Web informativa + sistema interno (frontend). Hecho con React 18, Vite, React Router, Tailwind CSS, recharts y lucide-react. No tiene backend: los datos y la sesión son simulados.
---
1. Cómo ejecutarlo en VS Code
Instala Node.js (versión 18 o superior).
Abre la carpeta `sunshine-handmade` en VS Code (Archivo → Abrir carpeta).
Abre la terminal (Ctrl+Ñ o Terminal → Nueva terminal) y ejecuta:
```bash
npm install
npm run dev
```
Abre http://localhost:5173 en el navegador.
Otros comandos:
Comando	Qué hace
`npm run dev`	Servidor de desarrollo (se actualiza al guardar)
`npm run build`	Genera la carpeta `dist/` lista para publicar
`npm run preview`	Prueba localmente lo generado por `build`
Para entrar al sistema: en el login, cualquier usuario de 3 o más caracteres con contraseña de 6 o más caracteres funciona.
---
2. Mapa de rutas
URL	Pantalla
`/`	Web informativa (botón "Ir al sistema")
`/login`	Inicio de sesión
`/registro`	Crear cuenta
`/sistema/dashboard`	Resumen
`/sistema/crm`	CRM y clientes
`/sistema/produccion`	Producción
`/sistema/inventario`	Inventario
`/sistema/ventas`	Ventas y órdenes
`/sistema/finanzas`	Finanzas
`/sistema/rrhh`	R.R.H.H
Las rutas `/sistema/*` están protegidas: sin sesión, redirigen a `/login`. Las rutas se definen en `src/App.jsx`.
---
3. ¿Dónde está el "HTML"?
En un proyecto React no hay un solo archivo `.html` con toda la página. El HTML se escribe como JSX dentro de los archivos `.jsx`, en el `return (...)` de cada componente. Las etiquetas son las de siempre (`<header>`, `<section>`, `<nav>`, `<form>`), pero se usa `className` en lugar de `class`. El estilo viene de las clases de Tailwind (`bg-brand`, `rounded-card`, etc.).
El único archivo `.html` real es `index.html` (título, idioma y fuentes).
---
4. Estructura de carpetas
```
sunshine-handmade/
├── index.html                  # Único HTML: título, idioma, fuentes
├── tailwind.config.js          # Colores, fuentes, sombras y radios
├── public/products/            # Fotos de productos (ver sección 8)
└── src/
    ├── main.jsx                # Punto de entrada
    ├── App.jsx                 # Rutas
    ├── index.css               # Estilos base de Tailwind
    ├── data/                   # mockData.js (sistema) y landingData.js (web)
    ├── utils/                  # formatters, validators, products
    ├── hooks/                  # useForm, usePagination, useFilteredList
    ├── context/                # AuthContext (sesión simulada)
    ├── routes/                 # ProtectedRoute
    ├── components/
    │   ├── ui/                 # Button, Input, FormField, Select, SearchInput, Badge, Card, Pagination, Logo
    │   ├── data/               # StatCard, DataTable, DetailPanel, QuickActionsPanel, ProductCard, IncomeExpenseChart, InventoryAlerts
    │   └── layout/             # AppShell, Sidebar, Topbar, PageHeader, AuthLayout
    ├── features/landing/       # Secciones de la web informativa
    └── pages/                  # LandingPage, LoginPage, RegisterPage y system/
```
---
5. Qué archivo abrir según lo que ves
Web informativa (`/`)
Parte de la web	Archivo
Orden de todas las secciones	`src/pages/LandingPage.jsx`
Menú superior y botón "Ir al sistema"	`src/features/landing/Navbar.jsx`
Portada con el sol	`src/features/landing/Hero.jsx`
Nosotros y valores	`src/features/landing/AboutSection.jsx`
Productos	`src/features/landing/FeaturedProducts.jsx` y `src/components/data/ProductCard.jsx`
Servicios	`src/features/landing/ServicesSection.jsx`
Formulario de contacto	`src/features/landing/ContactSection.jsx`
Pie de página	`src/features/landing/Footer.jsx`
Todos los textos de la web	`src/data/landingData.js`
Acceso
Pantalla	Archivo
Login	`src/pages/LoginPage.jsx`
Registro	`src/pages/RegisterPage.jsx`
Panel turquesa + logo (compartido)	`src/components/layout/AuthLayout.jsx`
Sistema (`src/pages/system/`)
Módulo	Página	Piezas que usa	Datos en `mockData.js`
Dashboard	`DashboardPage.jsx`	`StatCard`, `IncomeExpenseChart`, `InventoryAlerts`	`dashboardKpis`, `incomeVsExpenses`, `inventoryAlerts`
CRM y clientes	`CrmPage.jsx`	`DataTable`, `DetailPanel`, `QuickActionsPanel`	`customers`
Producción	`ProductionPage.jsx`	`ProductCard`, `DetailPanel`, `QuickActionsPanel`	`products`
Inventario	`InventoryPage.jsx`	`ProductCard`, `SearchInput`, `Select`, `Pagination`	`inventoryStats`, `products`
Ventas y órdenes	`SalesPage.jsx`	`DataTable`	`orders`, `salesStats`
Finanzas	`FinancePage.jsx`	`StatCard`, `DataTable`	`financeKpis`, `transactions`
R.R.H.H	`HrPage.jsx`	`DataTable`, `DetailPanel`, `QuickActionsPanel`	`employees`
Estructura común del sistema
Qué	Archivo
Marco con menú, barra superior y contenido	`src/components/layout/AppShell.jsx`
Menú lateral	`src/components/layout/Sidebar.jsx`
Barra superior (campana, usuario, cerrar sesión)	`src/components/layout/Topbar.jsx`
Título y subtítulo de cada página	`src/components/layout/PageHeader.jsx`
Bloqueo de rutas sin sesión	`src/routes/ProtectedRoute.jsx` y `src/context/AuthContext.jsx`
---
6. Cómo leer un archivo de página
Todos tienen la misma forma, de arriba hacia abajo:
```jsx
// 1. IMPORTACIONES: las piezas que usa (aquí ves de qué depende)
import DataTable from '../../components/data/DataTable';
import { customers } from '../../data/mockData';

// 2. LÓGICA: estado, filtros, columnas de la tabla
export default function CrmPage() {
  const [selected, setSelected] = useState(null);
  ...

  // 3. LO QUE SE VE (el "HTML"): todo lo que está dentro del return
  return (
    <>
      <PageHeader title="Directorio CRM" ... />
      <DataTable ... />
    </>
  );
}
```
Para cambiar un título o un texto, normalmente es dentro del `return`.
Para cambiar nombres, montos o cualquier dato de las tablas, es en `src/data/mockData.js`.
---
7. Cómo encontrar código en VS Code
Quiero...	Hago...
Abrir un archivo por nombre	`Ctrl+P` y escribo el nombre (ej. `CrmPage`)
Saber en qué archivo está un texto que veo en pantalla	`Ctrl+Shift+F` y escribo el texto
Ir al archivo de un componente	Mantengo `Ctrl` y hago clic sobre su nombre (ej. `<DataTable />`)
Desde el navegador: con la app abierta, pulsa F12, usa el selector de elementos (la flecha arriba a la izquierda) y haz clic sobre lo que quieres ubicar. Copia un texto o una clase que veas ahí (por ejemplo `bg-wine`) y búscalo con `Ctrl+Shift+F`.
> **Nota:** con `Ctrl+U` ("Ver código fuente") solo verás un `<div id="root"></div>` casi vacío. Es normal: React genera el contenido después. Para ver el HTML real usa **F12 → Elements**.
---
8. Cómo personalizar
Fotos de productos
Guárdalas en `public/products/` con estos nombres:
`bolso-elipse.jpg` · `faja-dama.jpg` · `cosmetiquera-neo.jpg` · `bolso-avalon.jpg`
Sin las fotos se muestra un fondo de cuero. Para otros nombres, cambia el campo `image` en `src/data/mockData.js`.
Logo
Ahora es un sol dibujado en SVG en `src/components/ui/Logo.jsx`. Para usar el logo oficial, cambia ese componente por una etiqueta `<img>` con tu archivo.
Textos de la web
Menú, valores, servicios y descripciones de productos: `src/data/landingData.js`. Los títulos y párrafos de cada sección están en su archivo dentro de `src/features/landing/`. Los textos actuales son propuestos y hay que reemplazarlos por los reales.
Colores, fuentes, sombras y radios
Todo está en `tailwind.config.js`. Cambiar un color ahí lo cambia en todo el proyecto.
Token	Uso
`brand` (turquesa)	Títulos de bienvenida, gráficos, foco de los campos
`wine` (marrón vino)	Botones principales
`sun` (naranja)	Texto "Sunshine", enlaces destacados
`sand`	Ítem activo del menú
`canvas`	Fondo del sistema
El estilo de una pieza concreta está en su `className`, dentro de su archivo (por ejemplo, el botón en `src/components/ui/Button.jsx`).
Datos del sistema
Clientes, órdenes, productos, finanzas, colaboradores y alertas: `src/data/mockData.js`.
---
9. Validaciones de formularios
Los formularios (login, registro y contacto) validan en tiempo real: el error aparece al salir del campo y se actualiza mientras escribes.
Las reglas están en `src/utils/validators.js` (obligatorio, correo, teléfono, longitud mínima, número, coincidencia).
El hook `src/hooks/useForm.js` aplica las reglas a cada formulario.
---
10. Limitaciones actuales
Sin backend: los formularios no envían datos a ningún servidor y la sesión es simulada (se guarda en `sessionStorage`).
Botones sin acción: "Añadir cliente", "Exportar Reporte", "Añadir Producto", "Registrar movimiento" y las acciones rápidas todavía no abren formularios ni hacen nada.
"Ver / Editar" solo muestra una ficha, no abre un formulario de edición.
Diseño aproximado: colores, fuentes y espaciados se tomaron a ojo de las capturas de Figma. Con los design tokens exactos se pueden ajustar.
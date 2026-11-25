# ÉLÉGANCE MONDIALE — Tienda Online Internacional de Alta Costura

Plataforma e-commerce moderna, elegante, responsive y totalmente funcional desarrollada para una marca de ropa de alcance global.

---

## 🌟 Características Principales

### 1. Detección Automática de País y Conversión de Monedas
- **Geolocalización por IP**: Detecta automáticamente el país de origen del cliente, código ISO y su divisa oficial.
  - Ejemplo: Cliente desde **Brasil** ve precios en **BRL (R$)**.
  - Cliente desde **Perú** ve precios en **PEN (S/)**.
  - Cliente desde **Estados Unidos** ve precios en **USD ($)**.
  - Cliente desde **España o Zona Euro** ve precios en **EUR (€)**.
  - Cliente desde **México** ve precios en **MXN ($)**, Reino Unido en **GBP (£)**, etc.
- **Tipos de Cambio en Tiempo Real**: Motor de divisas conectado a APIs oficiales (`open.er-api.com`, `frankfurter.app`, o `ExchangeRate-API` con clave privada opcional).
- **Regla Estricta de Moneda Base**: El precio original de las prendas se mantiene siempre en **USD** en la base de datos y nunca es alterado; la conversión se calcula dinámicamente en tiempo real con reglas oficiales de redondeo y formato local.
- **Selector Manual y Persistencia**: Selector de país/moneda con búsqueda rápida que guarda la preferencia del usuario en `localStorage` para visitas posteriores.

### 2. Integración Oficial con DHL Express (MyDHL API)
- **Cálculo Real con MyDHL API v2**: Conexión al endpoint oficial `https://express.api.dhl.com/mydhlapi/rates` (Producción) y `/test/rates` (Sandbox).
- **Consolidación de Paquetes**: Calcula peso volumétrico y físico acumulado según las prendas agregadas (cada prenda cuenta con peso en kg y dimensiones de embalaje largo x ancho x alto).
- **Tarifas y Tiempos de Entrega Reales**: Muestra servicios disponibles como *DHL Express Worldwide*, cotizaciones exactas convertidas a la divisa del cliente y fechas estimadas de entrega.
- **Sin Precios Inventados**: Si DHL no ofrece servicio para un destino o las credenciales no son válidas, informa con claridad y honestidad técnica sin falsear tarifas.
- **Credenciales Seguras**: API Key, API Secret y Shipper Account Number resguardados exclusivamente en el backend.

### 3. Carrito y Checkout Internacional
- Carrito tipo slide-over accesible desde cualquier vista.
- Selección de tallas (XS, S, M, L, XL), colores artesanales y modificación de cantidades.
- Estimador rápido de DHL dentro del carrito por código postal.
- Checkout guiado paso a paso:
  1. Dirección de entrega con validación de código postal.
  2. Cotización en vivo con DHL Express y selección del servicio.
  3. Desglose financiero completo en moneda local y confirmación de pago seguro SSL.
  4. Pantalla de confirmación con número de orden y detalles de despacho.

### 4. Panel de Administración Integrado
- **Dashboard de Órdenes**: Consulta pedidos internacionales, recaudación total en USD y monedas locales, y distribución de compras por país.
- **Gestor de Estados**: Actualización del estado del pedido (*Confirmado, En Preparación, Despachado DHL, Entregado, Cancelado*).
- **CRUD de Productos**: Alta, edición y eliminación de prendas, control de stock, peso en kg, dimensiones de caja, imágenes de alta resolución y precios base en USD.
- **Configuración de Integraciones**: Configuración de credenciales de DHL Express (Key, Secret, Account Number, switch Sandbox/Producción) y API de tipos de cambio.

---

## 🚀 Puesta en Marcha

### Prerrequisitos
- Node.js v18+ instalado.

### Iniciar la Tienda
1. Instalar dependencias (ya instaladas en el entorno):
   ```bash
   npm install
   ```

2. Iniciar el servidor (Backend Express + Frontend compilado):
   ```bash
   npm start
   ```
   Abrir en el navegador: **`http://localhost:5000`**

3. Modo Desarrollo (Opcional si deseas desarrollo en caliente con Vite):
   ```bash
   # Terminal 1 (Servidor Backend):
   npm run server

   # Terminal 2 (Cliente Vite con Hot Reload):
   npm run client
   ```

---

## 🔑 Configurar Credenciales Reales de DHL Express

Para cotizar envíos oficiales en vivo con tu cuenta de DHL:
1. Ingresa a la tienda en `http://localhost:5000`.
2. Haz clic en el botón superior derecho **"Panel Admin / DHL"** o navega a la pestaña de administración.
3. Dirígete a la pestaña **"Configuración DHL Express & APIs"**.
4. Introduce tu **DHL Express API Key**, **DHL Express API Secret** y tu **Número de Cuenta Shipper**.
5. Selecciona el entorno deseado (**Sandbox** para pruebas o **Producción Oficial** para despachos reales).
6. Configura la dirección de tu almacén o punto de despacho de origen (por defecto New York / Miami, US).
7. Haz clic en **"Guardar Toda la Configuración"**.

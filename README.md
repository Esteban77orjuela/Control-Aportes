# ⛪ Control de Aportes - Restauración Poder y Vida

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54.0.32-000020?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3EECB5?style=for-the-badge&logo=supabase&logoColor=white)

Sistema profesional de gestión de aportes para congregaciones religiosas. Aplicación móvil desarrollada con React Native + Expo y TypeScript para un control eficiente de miembros y sus contribuciones.

## ✨ Características Principales

### 📱 **Gestión Completa de Miembros**
- **👥 Registro de Miembros**: Formularios intuitivos con validación
- **📋 Perfiles Detallados**: Información completa con historial de pagos
- **✏️ Edición en Tiempo Real**: Modificación de datos al instante
- **🗑️ Eliminación Segura**: Con confirmaciones y validaciones

### 💰 **Sistema de Aportes Avanzado**
- **➕ Nuevos Pagos**: Registro con selección de miembros y fechas
- **✍️ Firmas Digitales**: Captura de firmas con canvas táctil
- **📅 Control Mensual**: Semáforo visual de 12 meses (Verde/Rojo)
- **💾 Persistencia**: Almacenamiento seguro en Supabase (PostgreSQL)

### 📊 **Dashboard y Analytics**
- **� Estadísticas en Vivo**: Total recaudado, transacciones, miembros
- **🏆 Ranking de Aportantes**: Top contributors con montos visualizados
- **📉 Gráficos Interactivos**: Evolución mensual con React Native Chart Kit
- **📤 Exportación a Excel**: Reportes completos en formato .xlsx

### 🎨 **Experiencia de Usuario Premium**
- **🎯 Diseño Moderno**: Esquema de colores Indigo & Emerald
- **📱 Responsive**: Adaptable a tablets y diferentes dispositivos
- **⚡ Navegación Fluida**: React Navigation con transiciones nativas
- **✨ Iconografía Lucide**: Iconos modernos y consistentes

---

## 🚀 Tecnologías Utilizadas

| Capa | Tecnología | Versión |
|:----|:-----------|:--------|
| **Framework** | React Native | 0.81.5 |
| **Runtime** | Expo SDK | 54.0.32 |
| **Lenguaje** | TypeScript | 5.9.2 |
| **Navegación** | React Navigation | 7.x |
| **Base de Datos** | Supabase (PostgreSQL) | 2.95.3 |
| **Iconos** | Lucide React Native | 0.563.0 |
| **Gráficos** | React Native Chart Kit | 6.12.0 |
| **Firmas** | React Native Signature Canvas | 5.0.2 |
| **Exportación** | SheetJS (xlsx) | 0.18.5 |

---

## 📁 Estructura del Proyecto

```
Pagos_Cuotas/
├── 📁 assets/                    # Recursos multimedia
│   ├── 🖼️ adaptive-icon.png     # Icono adaptativo Android
│   ├── 🏛️ church-logo.png       # Logo de la congregación
│   ├── 🔖 favicon.png           # Favicon web
│   ├── 🎯 icon.png              # Icono principal
│   └── 🌅 splash-icon.png       # Pantalla de inicio
├── 📁 src/
│   ├── 📁 lib/
│   │   └── 🔧 supabase.ts       # Configuración cliente Supabase
│   ├── 📁 screens/             # Pantallas de la aplicación
│   │   ├── 🏠 Dashboard.tsx     # Panel principal con estadísticas
│   │   ├── ✏️ EditMember.tsx    # Edición de miembros
│   │   ├── 👤 MemberDetails.tsx # Detalles completos del miembro
│   │   ├── 💰 NewPayment.tsx    # Registro de nuevos aportes
│   │   └── 📝 RegisterPerson.tsx # Formulario de registro
│   ├── � styles/
│   │   └── 🎨 theme.ts          # Sistema de diseño y colores
│   ├── 📁 types/
│   │   └── 📋 index.ts          # Definiciones TypeScript
│   └── 📁 utils/
│       ├── 📤 export.ts         # Exportación a Excel
│       └── 💾 storage.ts        # Operaciones con Supabase
├── ⚙️ app.json                 # Configuración Expo
├── 🏗️ eas.json                 # Configuración builds EAS
├── 📦 package.json             # Dependencias del proyecto
├── 📖 README.md               # Documentación (este archivo)
├── 🔍 REPORTE_AUDITORIA.md    # Análisis de calidad de código
├── 🗃️ SUPABASE_SETUP.sql      # Script de base de datos
└── 🎯 tsconfig.json            # Configuración TypeScript
```

---

## 🛠️ Proceso de Creación desde Cero

### **Paso 1: Inicialización del Proyecto**
```bash
# Crear proyecto con Expo y TypeScript
npx create-expo-app Pagos_Cuotas --template blank
cd Pagos_Cuotas

# Configurar TypeScript
npx expo install -D typescript @types/react
npx tsc --init
```

### **Paso 2: Instalación de Dependencias**
```bash
# Navegación
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Persistencia y Backend
npm install @supabase/supabase-js react-native-url-polyfill

# UI y Utilidades
npm install lucide-react-native react-native-chart-kit
npm install react-native-signature-canvas xlsx
npx expo install react-native-svg expo-file-system expo-sharing
```

### **Paso 3: Configuración de Supabase**
1. **Crear cuenta en [Supabase.io](https://supabase.io)**
2. **Crear nuevo proyecto**
3. **Ejecutar script SQL** desde `SUPABASE_SETUP.sql`
4. **Configurar variables** en `src/lib/supabase.ts`

### **Paso 4: Desarrollo de Funcionalidades**
1. **Definir tipos** en `src/types/index.ts`
2. **Crear sistema de diseño** en `src/styles/theme.ts`
3. **Implementar operaciones CRUD** en `src/utils/storage.ts`
4. **Desarrollar pantallas** con navegación integrada
5. **Agregar exportación a Excel** en `src/utils/export.ts`

### **Paso 5: Assets y Personalización**
1. **Agregar iconos** en carpeta `assets/`
2. **Configurar app.json** con metadatos de la aplicación
3. **Personalizar splash screen** y colores de la app

---

## 🚀 Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en web
npm run web

# Crear build de producción
npx eas build --platform android --profile preview
```

---

## 📦 Scripts Disponibles

| Comando | Descripción |
|:--------|:------------|
| `npm start` | Inicia servidor de desarrollo Expo |
| `npm run android` | Ejecuta en emulador/dispositivo Android |
| `npm run ios` | Ejecuta en simulador/dispositivo iOS |
| `npm run web` | Ejecuta versión web |
| `npx eas build` | Crea build de producción |

---

## 🎯 Estado del Proyecto

### ✅ **Completado (MVP Funcional)**
- [x] CRUD completo de miembros
- [x] Sistema de pagos con firmas digitales
- [x] Dashboard con estadísticas en tiempo real
- [x] Exportación a Excel
- [x] Interfaz responsive y moderna
- [x] Integración con Supabase (PostgreSQL)
- [x] Navegación entre pantallas
- [x] Gráficos y visualización de datos

### 🚧 **Próximas Mejoras**
- [ ] Autenticación y roles de usuario
- [ ] Notificaciones push
- [ ] Backup automático de datos
- [ ] Modo offline con sincronización
- [ ] Reportes avanzados y analytics
- [ ] Integración con pasarelas de pago

---

## � Configuración de Seguridad

El proyecto incluye configuración para Supabase con políticas de seguridad (RLS). Para producción:

1. **Configurar variables de entorno**
2. **Implementar autenticación JWT**
3. **Ajustar políticas RLS** según roles
4. **Usar claves de API seguras**

---

## 📊 Metrics del Proyecto

- **📏 Líneas de código**: ~1,800+ (TypeScript)
- **📁 Archivos**: 15+ componentes principales
- **🎨 Pantallas**: 5 pantallas completas
- **🗃️ Tablas de BD**: 2 tablas (people, payments)
- **📦 Dependencias**: 25+ paquetes npm

---

## 🤝 Contribución

Este proyecto está abierto a contribuciones. Para colaborar:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está desarrollado para **Restauración Poder y Vida** y mantiene todos los derechos reservados.

---

## 👨‍💻 Desarrollador

**Esteban Orjuela**  
💌 [Email de contacto]  
🔗 [LinkedIn/Portafolio]  

---

*Desarrollado con ❤️ para la obra de Dios y la congregación Restauración Poder y Vida.*  
*¡Que cada aporte sea una semilla de bendición!* 🌱✨
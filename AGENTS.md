<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Lineamientos y Reglas del Proyecto para Agentes de IA

Como agente de IA que colabore en este repositorio, debes adherirte de forma estricta a las siguientes directivas para garantizar la escalabilidad y mantenibilidad del sistema:

### 1. Clean Code y Separación de Responsabilidades
- Escribe código limpio, legible y declarativo.
- Separa estrictamente las responsabilidades: la interfaz de usuario (componentes visuales), la lógica de estado/negocio (custom hooks/funciones) y la persistencia/acceso a datos (servicios/consultas a MySQL) no deben estar acopladas en un mismo archivo.

### 2. Estructura de Carpetas y Agrupación por Dominio
- Mantén los módulos y conceptos de dominio agrupados cohesivamente (Ejemplo: colocar todo lo relacionado a `Stock` o `Productos` —componentes, interfaces, acciones, hooks— dentro de un mismo directorio de dominio).
- Utiliza estructuras jerárquicas de carpetas y subcarpetas para tener un mayor orden sistemático. Evita dejar archivos sueltos en el root de `src` o en las carpetas base.

### 3. Pruebas Unitarias y de Componentes (Jest + Testing Library)
- Realiza pruebas unitarias enfocadas en validar la lógica descrita para cada nuevo componente, hook o función de utilidad.
- Los componentes deben probarse simulando las interacciones del usuario y validando los cambios en el DOM.

### 4. Pruebas End-to-End Automatizadas (Playwright)
- Por cada nueva **definición de feature** o funcionalidad principal incorporada al sistema, es obligatorio construir **al menos una prueba automatizada E2E con Playwright** que valide el flujo feliz (happy path) desde la perspectiva del usuario final.

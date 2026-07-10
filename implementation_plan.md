# Rediseño de la Interfaz de Usuario

**Objetivo**: Mejorar la estética y modernizar la UI del proyecto `sisgesmafi-app`, aplicando principios de diseño premium (gradientes, glassmorphism, tipografía Google Fonts, micro‑animaciones) sin usar Tailwind.

## Revisión de Usuario Necesaria

> [!IMPORTANT]
> Necesitamos confirmar en qué página(s) exactas se aplicará el rediseño. Hasta ahora asumimos que será la página principal (`index.html`). Si se requiere cambiar otras vistas, por favor indícalo.

## Preguntas Abiertas

> [!WARNING]
> 1. ¿Hay assets (imágenes, íconos) que deban reemplazarse o crear?
> 2. ¿Se debe mantener la compatibilidad con navegadores antiguos?
> 3. ¿Hay alguna restricción de tamaño de bundle o rendimiento?

## Cambios Propuestos

---
### Estructura y Estilos Globales

#### [MODIFY] [index.html](file:///Users/osmer/.gemini/sisgesmafi-app/index.html)
- Añadir referencia a `styles.css` y a Google Fonts (p. ej., **Inter**).
- Insertar contenedor principal con clase `glass-card`.

#### [NEW] [styles.css](file:///Users/osmer/.gemini/sisgesmafi-app/styles.css)
- Definir variables de color (HSL), tipografía, efectos de glassmorphism y micro‑animaciones.
- Configurar media queries para responsividad.

---
### Componentes Específicos

#### [MODIFY] [src/components/Header.js] (si existe) o crear componente
- Aplicar fondo con gradiente y sombra difusa.
- Incluir transición suave al hacer hover en los enlaces.

#### [NEW] [src/components/HeroSection.js]
- Sección hero con fondo difuso, texto grande y botón CTA con efecto de escalado.

---
### SEO y Accesibilidad

#### [MODIFY] [index.html]
- Añadir `<title>`, meta descripción, y etiquetas semánticas (`<header>`, `<main>`, `<footer>`).
- Incluir atributos `aria-label` y contraste suficiente.

---
### Automatización y Deploy

1. **Git**: crear rama `ui-redesign`.
2. **Commit**: mensajes convencionales `feat: rediseño UI premium`.
3. **Push**: subir a remoto GitHub.
4. **Deploy**: ejecutar `npm run build && vercel --prod` (si el proyecto usa Vercel).

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npm test` (si existen pruebas).
- Verificar que `npm run build` complete sin errores.

### Verificación Manual
- Cargar la página en Chrome/Firefox y comprobar que los elementos tengan los estilos esperados, que las animaciones funcionen y que el LCP esté por debajo de 2 s.
- Utilizar Lighthouse para validar SEO, accesibilidad y rendimiento.

---
**Próximo paso**: Esperar confirmación del usuario sobre las preguntas abiertas y la lista de páginas a rediseñar.

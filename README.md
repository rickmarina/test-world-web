# test-world-web

Una aplicación web interactiva que muestra un globo terráqueo 3D utilizando Three.js.

## Características

- 🌍 Globo terráqueo 3D realista con texturas de la Tierra
- 🎮 Controles interactivos (arrastrar para rotar, rueda del ratón para zoom)
- ⭐ Fondo espacial con estrellas
- 💡 Iluminación realista que simula la luz del sol
- 📱 Diseño responsive que funciona en dispositivos móviles

## Cómo usar

1. Abre el archivo `index.html` en un navegador web moderno
2. Arrastra con el ratón para rotar el globo
3. Usa la rueda del ratón para acercar o alejar el zoom
4. Disfruta explorando la Tierra en 3D

## Servidor local

Para una mejor experiencia, se recomienda ejecutar un servidor local:

```bash
# Usando Python 3
python -m http.server 8000

# Usando Node.js (con npx)
npx http-server

# Usando PHP
php -S localhost:8000
```

Luego abre tu navegador en `http://localhost:8000`

## Tecnologías

- Three.js 0.160.0
- OrbitControls para interacción
- Texturas de la NASA (dominio público)

## Compatibilidad

Funciona en todos los navegadores modernos que soportan WebGL y ES6 modules.
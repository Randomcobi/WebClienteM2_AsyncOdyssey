# GundamWiki

Wiki de trajes Gundam hecha con Vite y JavaScript. Usa la [Gundam API](https://gundam-api.pages.dev) para mostrar los 828 trajes, buscarlos por nombre o piloto, filtrarlos por universo y ver la ficha de cada uno. Los datos se guardan en localStorage para no repetir peticiones.

## Cómo probarlo

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev
```

Después abre `http://localhost:5173`.

## Uso de IA

He usado Claude (Anthropic) como ayuda para analizar la API y transformar sus lecturas, organizar el proyecto en módulos y generar parte del código.

## Autopsia

1. La API no permite peticiones desde el navegador (CORS), así que he usado el proxy de Vite en `vite.config.js`. Por eso solo funciona con `npm run dev` o `npm run preview`.
2. El endpoint para pedir un traje por id siempre da error 400, así que descargo todos los trajes de una vez y busco el detalle en local.

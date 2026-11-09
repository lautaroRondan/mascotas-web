# Mascotas – web (React + Vite)

1. Levantar el backend: `uvicorn app.main:app --reload` (puerto 8000; ajustá el módulo al tuyo).
2. En esta carpeta:

       pnpm install
       pnpm dev

El front llama a `/api/...` y Vite lo reenvía a `http://localhost:8000` (ver vite.config.js).

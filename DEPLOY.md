# Guía de despliegue de nutriFlow

Hay tres formas de correr el proyecto. Las tres usan el mismo código; cambia qué tanto del sistema se levanta.

| Forma | Para qué | Backend | Requisitos |
| --- | --- | --- | --- |
| 1. Vercel | Enlace público para mostrar | No: todo se simula en el navegador | Nada, es automático |
| 2. Local nativo | Sustentación y desarrollo | Sí: 11 procesos Node | Node.js 24 |
| 3. Docker Compose | Requisito de contenedores del enunciado | Sí: 11 contenedores | Docker Desktop y virtualización activa |

## 1. Vercel (producción)

- Cada `git push` a `main` despliega producción. Una rama distinta de `main` crea un despliegue de vista previa con su propia URL.
- Vercel ejecuta `npm run build` (`vite build`, sin modo en vivo). La app funciona sola: los cuatro actores comparten estado entre pestañas del mismo navegador.
- La carpeta `server/` no se despliega. Solo `api/ai.js` se vuelve una función.
- Variable opcional: `POLLINATIONS_KEY`, para que el planificador con IA responda más rápido.

Antes de subir a `main`:

```bash
npm run check      # lint + 111 pruebas + build
npm run preview    # sirve en http://localhost:4173 lo mismo que servirá Vercel
```

## 2. Local nativo (recomendado para la sustentación)

```bash
npm install
npm run backend      # terminal 1: broker + 5 APIs regionales + réplica co-2 + payments, logistics, notifications
npm run dev:live     # terminal 2: la app web conectada al backend → http://localhost:5173
```

Verifica que todo esté vivo con `ps` en la terminal 1, o en `/admin` → Monitoreo.

### Guion de la demostración de fallos

Abre tres pestañas: cliente (`/checkout` y luego `/orders/<id>`), tienda (`/merchant`) y repartidor (`/courier`). En cada una inicia sesión con su rol en `/login`. Luego escribe en la terminal 1:

| Comando | Qué se ve |
| --- | --- |
| `stop payments` y haces un pedido | El pago queda "pendiente" y la tienda no puede aceptarlo; el monitor marca payments caído |
| `start payments` | El pago se completa solo: el mensaje esperaba en el broker |
| `stop co-1` | La app sigue funcionando contra la réplica `co-2` |
| `stop logistics` con un pedido listo | El pedido espera repartidor |
| `start logistics` | Se asigna repartidor solo |
| `start co-1` | La región vuelve |

Para correr los mismos escenarios automáticamente: `npm run test:backend` (10 pruebas, cierra el backend de la terminal 1 antes porque usa los mismos puertos).

### Mostrarlo desde celulares en la misma red

1. Averigua la IP del portátil (`ipconfig`, por ejemplo `192.168.1.20`).
2. En `server/directory.json` cambia `127.0.0.1` por esa IP **solo en las URLs de las regiones** (deja el broker en `127.0.0.1`).
3. Arranca la web con `npm run dev:live -- --host` y abre `http://192.168.1.20:5173` en el celular.
4. Si Windows pregunta, permite a Node en el firewall para redes privadas.

Devuelve `directory.json` a `127.0.0.1` al terminar (no lo subas con la IP).

## 3. Docker Compose (contenedores)

Requiere virtualización activa. En el PC con Ryzen: BIOS → Advanced → CPU Configuration → **SVM Mode: Enabled**, y luego instalar Docker Desktop.

```bash
docker compose up --build          # primera vez tarda unos minutos
# abre http://localhost:4173

docker compose ps
docker compose stop payments       # demostración de fallos
docker compose start payments
docker compose stop co-1           # la web pasa a co-2
docker compose down                # apaga todo (los volúmenes con datos se conservan)
docker compose down -v             # apaga y borra los datos
```

Cada región tiene su propio volumen (`region-co`, `region-br`…): los datos personales quedan en su región.

> Esta forma no se ha probado todavía en una máquina con Docker. Pruébala al menos una vez antes de la sustentación.

## Problemas comunes

| Síntoma | Causa y solución |
| --- | --- |
| `EADDRINUSE` al arrancar | Quedó un backend corriendo. En la terminal del backend escribe `quit`, o cierra los procesos `node` en el Administrador de tareas |
| La app en vivo no carga pedidos | ¿Usaste `npm run dev:live` y no `npm run dev`? ¿Está corriendo `npm run backend`? |
| Conexión rechazada usando `localhost` | En Windows `localhost` puede ir a IPv6; el proyecto usa `127.0.0.1` a propósito |
| Datos viejos o raros | Apaga el backend y borra la carpeta `server/data/` |
| `git push` dice `Permission denied (publickey)` | Sube por HTTPS con la sesión de GitHub CLI: `gh auth login` y luego `gh auth setup-git` |

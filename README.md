<p align="center">
  <img src="logo.png" alt="Universidad Central" width="260">
</p>

<h1 align="center">nutriFlow</h1>

<p align="center">
  Sistemas Distribuidos · Universidad Central · Ingeniería de Sistemas y Computación · 2026<br>
  Nilson Aldair Molina Rengifo · Juan Fernando Cruz Cárdenas · Julián David Romero Baquero<br>
  <a href="https://github.com/hasttyr/nutriFlow">github.com/hasttyr/nutriFlow</a>
</p>

nutriFlow te ayuda a hacer mercado donde estés. Encuentra las tiendas reales que tienes cerca, arma el menú de la semana con una IA gratuita, saca la lista de compras y te dice qué tienda cercana te sale más barata. Es el proyecto de la Práctica IV de Sistemas Distribuidos, así que la app se ve y se comporta como un sistema distribuido: cada tienda cercana es un nodo de un clúster simulado en el navegador. Funciona sola en el navegador o conectada al backend real de `server/` (ver Backend).

## Cómo correrlo y probarlo

Necesitas **Node.js 24** (el archivo `.nvmrc` lo fija: con nvm basta `nvm use`). Para la opción A también necesitas Docker: **Docker Desktop** en Windows o macOS, o **Docker Engine con el plugin compose** en Linux (ver [En Linux](#en-linux)). Clona el repositorio e instala las dependencias una vez:

```bash
git clone https://github.com/hasttyr/nutriFlow.git
cd nutriFlow
npm install
```

### Opción A: Docker (la de la demostración)

```bash
npm run demo
```

Este comando construye una imagen y levanta 11 contenedores: el intermediario, las cinco regiones, la réplica de Colombia `co-2`, pagos, logística, notificaciones y la app web. Luego espera a que todos respondan. Cuando estén listos, abre http://localhost:4173/login en cuatro pestañas. Entra **primero como administrador** y después como cliente, tienda y repartidor. El administrador oye las cinco regiones y es el que mueve el piloto automático.

En la misma terminal puedes escribir:

| Comando | Qué hace |
| --- | --- |
| `ps` | Lista los contenedores y su estado |
| `kill <nombre>` | Tumba un contenedor: `kill payments`, `kill co-1`, `kill logistics`… |
| `start <nombre>` | Lo vuelve a prender |
| `logs <nombre>` | Muestra sus últimas líneas |
| `quit` o Ctrl+C | Baja todos los contenedores (los volúmenes guardan los pedidos) |

Después de `kill co-1`, el indicador en la cabecera de una pestaña de Colombia pasa de **co-1** (verde) a **co-2** (ámbar) en unos segundos. Si prefieres no usar el script, `docker compose up --build` levanta lo mismo.

Si Docker Desktop nunca llega a "Engine running", activa la virtualización en la BIOS (AMD: SVM Mode, Intel: VT-x).

#### En Linux

Todo corre igual que en Windows. Instala Node 24 (por ejemplo con `nvm install 24`) y, para la opción A, Docker Engine con el plugin compose (`docker compose version` debe responder). Si `npm run demo` dice que Docker no responde:

```bash
sudo systemctl start docker          # prende el motor
sudo usermod -aG docker $USER        # usar docker sin sudo; luego cierra sesión o corre: newgrp docker
```

Los puertos que se usan son 1883, 4101–4105, 4111, 4173 y 5173; si alguno está ocupado, el proceso que lo usa falla al arrancar.

### Opción B: nativo (solo Node, sin Docker)

```bash
npm run demo:local
```

Levanta los mismos procesos con Node en una sola terminal, y la app web queda en http://localhost:5173. Los comandos son `ps`, `stop <nombre>`, `start <nombre>`, `restart <nombre>` y `quit`. Si quieres ver los logs de la app aparte, usa dos terminales: `npm run backend` y `npm run dev:live`.

### Solo navegador

`npm run dev` (http://localhost:5173) corre la app con el clúster simulado en el navegador. No necesita backend y es la misma versión publicada en Vercel.

### Pruebas

| Comando | Qué revisa |
| --- | --- |
| `npm test` | Las 113 pruebas de la app con Vitest, incluido el caso de la sección 9 en los cinco países |
| `npm run test:backend` | 12 pruebas de falla que levantan los procesos reales y los tumban a propósito (unos 10 s, sin Docker) |
| `npm run lint` | ESLint |
| `npm run check` | Lint, pruebas y build de producción. Córrelo antes de hacer push |

## Informe del curso

El informe técnico es [`docs/pdf/informe.pdf`](docs/pdf/informe.pdf) y sale de [`informe.md`](informe.md). Para regenerarlo, corre `node docs/pdf/build.mjs`, que escribe `docs/pdf/informe.html` con tablas y diagramas mermaid en formato APA. Luego imprime esa página a PDF desde un navegador, en tamaño carta con márgenes de 2.54 cm. `docs/pdf/measure.js` es un fragmento de Playwright que imprime el PDF y cuenta las páginas del cuerpo, que el curso limita a 20.

## Funciones

- **Ubicación, del método más preciso al menos preciso**: GPS del dispositivo (con permiso), luego la IP, luego la zona horaria y por último un punto elegido en el mapa. La ciudad y el país salen de geocodificación inversa.
- **Mapa de tiendas** (`/map`): supermercados, fruterías, carnicerías, panaderías y plazas reales cerca de ti, sacados de OpenStreetMap (Nominatim, con Overpass de respaldo y caché por zona). Al tocar una tienda ves lo que vende. Los nombres y las posiciones son reales; los productos, precios y existencias son simulados, y cada tipo de tienda vende solo lo suyo (una frutería no vende café). Si OpenStreetMap no responde, aparecen tiendas de demostración marcadas como tal.
- **Cinco países configurados como datos** (Colombia, Brasil, Estados Unidos, Francia y Japón). Cada uno es un JSON `RegionProfile` en `src/region/profiles/` con idioma, locale CLDR, moneda y sus decimales, zona horaria, reloj de 12 o 24 h, formatos de teléfono y código postal, orden del nombre, domicilio, impuesto, propina, tipo de comprobante, identificaciones fiscales, medios de pago y ley de datos personales. Además tiene su propia lista de precios en `src/region/prices/`. El código no tiene condicionales por país: agregar un sexto país es agregar esos dos archivos.
- **Dinero en enteros**: todo valor es un entero en la unidad menor de la moneda local (centavos o yenes). El COP y el JPY se cotizan sin decimales, así que su unidad menor es el peso o el yen. Intl (CLDR) les da formato según el país: `$ 25.900`, `R$ 25,90`, `$25.90`, `25,90 €`, `￥2,590`.
- **Planificador semanal** (`/planner`): escribes lo que quieres comer ("sano, poca carne roja, barato") y una IA gratuita (Pollinations) devuelve un menú de 7 días y una lista con productos que se venden cerca, con preferencia por platos típicos de tu país. Después todas las tiendas cercanas cotizan la canasta en paralelo (scatter-gather): verás la tienda más barata con todo, la mejor combinación entre tiendas y un botón para comprar o pasarlo a tu lista. Si la IA no responde, un planificador por reglas arma el menú con palabras clave de dieta en los cinco idiomas.
- **Varios dispositivos con enlace o QR**: la lista y el plan viajan comprimidos en el fragmento de la URL (`/share#…`) y se muestran como QR. Lo abres en otro dispositivo y lo importas. Ningún servidor guarda nada.
- **Productos locales**: el catálogo de 65 productos tiene etiquetas de dieta (vegano, vegetariano, gluten, proteína) y los países donde cada producto es típico. La página de inicio muestra los de tu zona.
- **Catálogo** con búsqueda en cualquiera de los cinco idiomas, sin importar las tildes, y con categorías.
- **Lista de compras**: planeas, marcas lo que ya tienes y pasas lo que falta al carrito.
- **Comparar sucursales**: cada sucursal responde con su propio precio y sus existencias, cada una con su latencia.
- **Domicilio o recoger en tienda**, con pago contra entrega (es una demo, no se cobra nada).
- **Estado del sistema** (`/status`): salud de los nodos, latencia, versión del inventario, peticiones, fallas, un registro de llamadas en vivo y controles para volver lento o tumbar cualquier nodo.
- **Pantallas de cuenta (demo, no funcionales)**: `/login`, `/register` y `/profile`, con pedidos, direcciones, preferencias y una sesión replicada en los nodos. Cualquier dato sirve para "entrar", y siempre abre el mismo perfil de demostración.
- **Páginas de control**: una página 404 para rutas que no existen y una 500 en `/500`, que también reemplaza cualquier pantalla que se rompa al dibujarse.
- **Cinco idiomas** (español, portugués, inglés, francés y japonés), con un catálogo JSON por idioma en `src/i18n/locales/`, claves estables y respaldo en inglés. El idioma sigue al país, y si eliges uno a mano se recuerda para ese país. Los números, el dinero, las fechas y las horas siempre siguen el perfil del país. El japonés usa fuentes CJK y corte de línea estricto. La interfaz es de vidrio líquido, hecha 100 % con Tailwind y pensada primero para el teléfono.

## Las cuatro apps, en vivo

La plataforma atiende a cuatro actores, cada uno con su app. Entra en `/login` y elige el rol. Cada pestaña guarda su propia sesión, así que puedes tener las cuatro apps abiertas al mismo tiempo:

| Ruta | Actor | Qué hace |
| --- | --- | --- |
| `/checkout` → `/orders/:id` | Cliente | Pide y sigue el pedido en vivo: mapa con tienda, repartidor y puerta, línea de tiempo en hora local, cancelación con reembolso, calificación de tienda y repartidor, y el comprobante del país |
| `/merchant` | Tienda | Pedidos por etapa: aceptar o rechazar, marcar listo y entregar los de recoger en tienda |
| `/courier` | Repartidor | Conectarse o desconectarse, recoger y entregar, y ver la flota con la carga de cada repartidor |
| `/admin` | Administrador | Ventas por país consolidadas en USD (con fuente y fecha de la tasa de cambio), ingresos de la plataforma, perfiles regionales editables como datos (impuestos, domicilio, propina, comisión), monitoreo y piloto automático |
| `/notifications` | Todos | La bandeja de cada actor, en su idioma y su zona horaria |

**Cómo se hablan las pestañas:** el estado compartido (`src/live/store.js`) vive en `localStorage`. Cada pestaña oye lo que escriben las demás con el evento `storage`, y las escrituras se hacen una a la vez con la API Web Locks, que es un mutex real entre procesos. Los repartidores se asignan por cercanía y disponibilidad, con balanceo de carga: `pickCourier` usa distancia × (1 + entregas en curso) y permite máximo 2 a la vez. El piloto automático corre solo en la pestaña que tiene el candado de líder. Cuando esa pestaña se cierra, la siguiente en la fila toma el relevo (elección de líder con conmutación).

Demo: abre `/orders/<id>` en una pestaña y `/merchant` y `/courier` en otras dos, y mira cómo avanza el pedido. También puedes prender el piloto automático en `/admin`.

## Backend (modo en vivo)

La misma app web funciona contra servidores regionales reales (en [Cómo correrlo y probarlo](#cómo-correrlo-y-probarlo) está cómo levantarlos). En modo en vivo cada pestaña se conecta solo a la región de su país, y la cabecera dice qué instancia la atiende. La consola de administración sigue a las cinco regiones. Cada subsistema es un proceso de Node con el SQLite que trae Node. En Docker, cada proceso tiene su propio contenedor a partir de una sola imagen, y cada región tiene su propio volumen.

| Proceso | Puerto | Papel |
| --- | --- | --- |
| `broker` | tcp/1883 (MQTT) | Middleware: publicación/suscripción, colas persistentes (QoS 1), estado retenido y Last Will |
| `co-1` `br-1` `us-1` `fr-1` `jp-1` | http/4101–4105 | API regional, una por país y con el mismo código (`REGION=…`). Es dueña de los pedidos de su país, guardados en su propio archivo SQLite |
| `co-2` | http/4111 | Réplica de Colombia sobre los mismos datos. La app web pasa a ella si cae `co-1` |
| `payments` | — | Pasarela de pagos simulada: cobros y reembolsos idempotentes |
| `logistics` | — | Flota de repartidores, asignación por cercanía, disponibilidad y carga, y posiciones en vivo (QoS 0, una por segundo) |
| `notifications` | — | Un mensaje por actor y por paso, que cada app muestra en su idioma y su zona horaria |

`server/directory.json` es el servicio de nombres: país → URLs de la región, primero el primario y después las réplicas. Las reglas del pedido (`src/live/rules.js`), los precios (`src/region/pricing.js`, `money.js`) y los datos de los países son los mismos archivos que usa el navegador. Es un solo código.

**Cómo viaja un comando:** el navegador lo manda por HTTP a la región de su país (`POST /orders/:id/accept`, con un token de rol firmado). La región aplica la regla en una transacción ACID sobre su archivo SQLite, publica el cambio en el intermediario, y cada proceso interesado reacciona: pagos cobra, logística asigna y notificaciones escribe. Cada región devuelve su estado en vivo a los navegadores con Server-Sent Events. Los precios y totales siempre los recalcula la región, nunca se toman del navegador, y la tarjeta nunca sale del navegador (la pasarela recibe un token).

**Para romperlo a propósito**, escribe en la terminal de `npm run backend` o `npm run demo:local` (en Docker, los mismos casos se hacen con `kill`):
- `ps` lista los procesos.
- `stop payments` / `start payments`: los pagos esperan en el intermediario y se completan cuando pagos vuelve.
- `stop co-1`: la réplica toma el relevo.
- `stop logistics`: los pedidos esperan repartidor y lo reciben cuando logística vuelve.

La pestaña de monitoreo de la consola de administración muestra cada proceso cuando cae y cuando vuelve. `npm run test:backend` corre estos casos de falla automáticamente contra los procesos reales.

## Sistema distribuido simulado

Todo está en `src/distributed/`:

| Concepto | Dónde se ve |
| --- | --- |
| **Nodos**: hasta 12 tiendas reales cercanas entran al clúster, y la latencia crece con la distancia. Mientras cargan, las tres sucursales de Bogotá son el clúster de demostración | Mapa, selector de sucursal, `/status` |
| **Cambio de membresía**: cuando te mueves, los nodos viejos salen y entran las tiendas nuevas | Registro de llamadas en `/status` |
| **Scatter-gather**: todas las tiendas cotizan en paralelo la canasta del planificador | Presupuesto del planificador |
| **Red**: cada llamada tiene latencia y puede fallar (4 % de fallas transitorias) | Etiqueta "Atendido por", registro de llamadas |
| **Reintentos con espera exponencial** y **cortacircuitos** para nodos que se sabe que están caídos | Registro de llamadas |
| **Latidos** que refrescan la latencia de cada nodo cada 2 s | `/status`, selector de sucursal |
| **Lecturas con conmutación**: si una sucursal no responde, una réplica entrega sus datos | Página de productos ("servidos por la réplica …") |
| **Saga del pedido**: enrutar → reservar existencias → registrar pago → crear pedido → replicar → notificar | Traza del pedido en vivo en el checkout |
| **Replicación por quórum**: cada pedido se guarda en el primario y en sus 2 réplicas más cercanas (factor 3, quórum 2), con **compensación** (las existencias se liberan si no hay quórum) | Confirmación o error del pedido |
| **Conmutación del despacho**: una sucursal caída pasa el pedido a la siguiente | Confirmación del pedido |

Pruébalo: abre `/status`, pon Chapinero en **Caída** y luego mira productos y haz un pedido a domicilio.

## Requisitos

- Node.js 24 (React Router 8 necesita Node ≥ 22.22)

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run demo` | Toda la plataforma en Docker, con comandos para tumbar procesos |
| `npm run demo:local` | Toda la plataforma como procesos de Node, con comandos para tumbar procesos |
| `npm run backend` / `npm run dev:live` | El backend y la app web en vivo, en dos terminales |
| `npm run test:backend` | Las 12 pruebas de falla contra los procesos reales |
| `npm run dev` | Servidor de desarrollo de Vite (solo navegador) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción en local |
| `npm run lint` | Corre ESLint |
| `npm test` | Corre las pruebas una vez |
| `npm run check` | Lint, pruebas y build (córrelo antes de hacer push) |

## Despliegue

Guía paso a paso (Vercel, backend local, Docker, demostración de fallas y problemas comunes): [DEPLOY.md](DEPLOY.md).

Cada push a `main` se despliega en Vercel. `vercel.json` redirige todas las rutas, menos `/api/*`, a `index.html`, para que enlaces como `/products` funcionen al recargar.

### Proxy de la IA

Pollinations rechaza las llamadas anónimas que salen de un navegador (pide un token de Turnstile), pero sí responde las que van de servidor a servidor. Por eso el planificador llama a `/api/ai`, una función de Vercel (`api/ai.js`) que solo reenvía los mensajes del chat. En desarrollo, el proxy de Vite hace lo mismo (`vite.config.js`). No hace falta clave. Si creas una en enter.pollinations.ai, ponla en `POLLINATIONS_KEY` en el proyecto de Vercel y el proxy la usa. El modelo gratuito tarda entre 15 y 30 s, y el nivel anónimo permite **una respuesta cada ~45 s por IP**. Ese límite lo comparten todos los visitantes, porque todas las llamadas salen del proxy. El planificador espera y reintenta una vez; si no hay respuesta, contesta el planificador por reglas. Para que la demo vaya más fluida, crea una clave gratuita y configura `POLLINATIONS_KEY`.

### Servicios externos (todos gratuitos y sin clave)

| Servicio | Para qué se usa |
| --- | --- |
| get.geojs.io | Posición a partir de la IP |
| api.bigdatacloud.net (endpoint de cliente) | Ciudad y país de un punto |
| nominatim.openstreetmap.org, espejos de Overpass | Tiendas cercanas |
| tile.openstreetmap.org | Teselas del mapa (Leaflet) |
| text.pollinations.ai (vía `/api/ai`) | IA del planificador semanal |

## Estructura de la aplicación

- `src/distributed/`: clúster simulado (`cluster.js`, membresía dinámica), inventarios de las tiendas (`inventory.js`), saga del pedido (`orders.js`) y hooks de React (`hooks.js`)
- `src/region/`: perfiles regionales (`profiles/*.json`), listas de precios (`prices/*.json`), el cargador (`profiles.js`) y las funciones de dinero en enteros (`money.js`)
- `src/geo/`: ubicación (`location.js`), tiendas cercanas (`stores.js`) y el estado de región que los une (`region.js`)
- `src/planner/`: planificador semanal con IA y por reglas, y precio de la canasta
- `src/share/`: codificación de la lista y el plan para enlaces y QR
- `api/ai.js`: función de Vercel que hace de proxy del planificador hacia Pollinations
- `src/data/products.js`: catálogo con precios base e íconos
- `src/cart/`, `src/list/`: estado del carrito y de la lista de compras (guardado en `localStorage`)
- `src/i18n/`: traductor y formatos (`i18n.js`), y un catálogo JSON por idioma en `locales/`
- `src/ui/`: piezas base de vidrio líquido y conjuntos de clases de Tailwind compartidos
- `src/components/`, `src/pages/`: estructura de la interfaz y rutas

## Créditos de imágenes

`public/images/backdrop-produce.jpg` es "Fruit Vegetables" de StockSnap (F8B73CPSBK), CC0 / dominio público, encontrada en [Openverse](https://openverse.org).

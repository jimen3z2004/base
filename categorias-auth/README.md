# Mis categorías — CRUD con registro y autenticación

Aplicación en **Node.js + Express + SQLite** que agrega usuarios, registro e inicio de sesión a un CRUD de categorías. Solo los usuarios autenticados pueden ver y administrar sus categorías.

## Funcionalidades
- Registro de usuarios con validaciones (nombre, correo válido y único, contraseña con mínimo 8 caracteres, letra y número, confirmación).
- Inicio y cierre de sesión (contraseñas con `bcryptjs`, sesiones con cookie `httpOnly` guardadas en SQLite).
- CRUD de categorías (crear, listar, editar, eliminar) protegido: sin sesión redirige al login.
- Cada usuario solo ve y modifica **sus** categorías.
- Seguridad: token CSRF, límite de intentos en login/registro, mensajes de error genéricos en login, cabeceras CSP.

## Estructura
```
src/server.js            Servidor, sesiones y middlewares
src/db.js                Conexión SQLite y tablas (usuarios, categorias)
src/validators.js        Validaciones de registro y categorías
src/middleware/auth.js   requireAuth y soloInvitados
src/middleware/csrf.js   Protección CSRF
src/routes/auth.js       /registro, /login, /logout
src/routes/categorias.js CRUD de categorías
views/                   Plantillas EJS
public/                  CSS y JS del cliente
```

## Ejecutar en local
```bash
npm install
cp .env.example .env   # opcional
npm start              # http://localhost:3000
```

## Variables de entorno
| Variable | Uso |
|---|---|
| `PORT` | Puerto (lo define el hosting) |
| `SESSION_SECRET` | Texto largo y aleatorio (obligatorio en producción) |
| `NODE_ENV` | `production` en el despliegue |
| `DATA_DIR` | Carpeta de la base SQLite (opcional; apuntar a un disco persistente) |

## Despliegue en Render
1. Sube el proyecto a un repositorio público de GitHub.
2. En Render: **New → Web Service**, conecta el repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Variables: `NODE_ENV=production` y `SESSION_SECRET` (valor aleatorio largo).
5. Nota: en el plan gratuito el disco no es persistente, así que la base SQLite se reinicia en cada redeploy. Para conservar datos, agrega un disco persistente y define `DATA_DIR` con su ruta.

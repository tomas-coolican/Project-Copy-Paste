# Deploy — backend en Render, frontend en Vercel

```
Navegador ──► Vercel (React, estático) ──► Render (API .NET, Docker) ──► Supabase (PostgreSQL)
```

- **Frontend → Vercel.** Es un sitio estático (Vite): Vercel lo compila desde `frontend/`.
- **Backend → Render.** Vercel no ejecuta .NET, así que la API va en Render como contenedor Docker, con el `VuelosApi/Dockerfile` del repo (escucha en el puerto que indica `$PORT`, por defecto 10000).
- **Base de datos:** la misma de Supabase que se usa en desarrollo (ya tiene la migración aplicada). No hay que migrar nada.

Los dos servicios son gratuitos y se vuelven a desplegar solos con cada push a `main`.

Orden: **1) Render** (para tener la URL de la API) → **2) Vercel** (con esa URL) → **3) volver a Render** para habilitar el CORS con la URL de Vercel.

---

## 1. Backend en Render

### 1.1 Cadena de conexión de Supabase (IPv4)

Render no puede salir por IPv6, y la *Direct connection* de Supabase es solo IPv6. Hay que usar el **Session pooler**:

Supabase → proyecto → botón **Connect** → *Connection string* → tipo **Session pooler**. Pasarla al formato de Npgsql:

```
Host=aws-0-<region>.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<ref-del-proyecto>;Password=<contraseña>;SSL Mode=Require;Trust Server Certificate=true
```

Ojo: en el pooler el usuario es `postgres.<ref-del-proyecto>`, no solo `postgres`.

### 1.2 Clave JWT para producción

Conviene una clave distinta a la de desarrollo. En PowerShell:

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

### 1.3 Crear el servicio

1. Entrar a [render.com](https://render.com) con la cuenta de GitHub. El repo es de `tomas-coolican`: tiene que hacerlo Tomás, o darle a Render acceso al repo desde su cuenta (*Configure GitHub App*).
2. **New → Web Service** → elegir el repo `Project-Copy-Paste`.
3. Configuración:

   | Campo | Valor |
   |---|---|
   | Language | **Docker** |
   | Branch | `main` |
   | Root Directory | `VuelosApi` |
   | Dockerfile Path | `./Dockerfile` (relativo al Root Directory) |
   | Instance Type | **Free** |
   | Region | la más cercana a la región de Supabase |

4. **Environment Variables** (los `:` de la configuración de .NET se escriben `__`):

   | Variable | Valor |
   |---|---|
   | `ConnectionStrings__Supabase` | la cadena del paso 1.1 |
   | `Jwt__Key` | la clave del paso 1.2 |
   | `Swagger__Habilitar` | `true` (para mostrar Swagger en la demo) |
   | `Cors__AllowedOrigins__0` | por ahora `http://localhost:5173`; se cambia en el paso 3 |

5. **Advanced → Health Check Path:** `/api/salud`.
6. **Deploy Web Service.** La primera compilación tarda unos minutos.

### 1.4 Verificar

- `https://<servicio>.onrender.com/api/salud` → `{"estado":"ok"}`
- `https://<servicio>.onrender.com/api/vuelos` → la lista de vuelos (si da 500, revisar la cadena de conexión en los *Logs*).
- `https://<servicio>.onrender.com/swagger`

---

## 2. Frontend en Vercel

1. Entrar a [vercel.com](https://vercel.com) con GitHub → **Add New → Project** → importar `Project-Copy-Paste` (mismo tema de permisos que en Render).
2. Configuración:

   | Campo | Valor |
   |---|---|
   | Root Directory | `frontend` |
   | Framework Preset | Vite (lo detecta solo) |
   | Build / Output | por defecto (`pnpm build`, `dist`) |

3. **Environment Variables:** `VITE_API_URL` = `https://<servicio>.onrender.com/api`
   Vite la incorpora **al compilar**: si se cambia, hay que hacer *Redeploy*.
4. **Deploy.** Queda en `https://<proyecto>.vercel.app`.

`frontend/vercel.json` redirige todas las rutas a `index.html`, para que funcione abrir o recargar directamente `/dashboard/vuelos` (sin eso Vercel da 404).

---

## 3. Habilitar el CORS

En Render → el servicio → **Environment** → cambiar `Cors__AllowedOrigins__0` por la URL de Vercel, **sin barra final**:

```
https://<proyecto>.vercel.app
```

Guardar (Render redespliega solo). Si también se quiere seguir usando el frontend local contra la API de Render, agregar `Cors__AllowedOrigins__1` = `http://localhost:5173`.

Listo: abrir la URL de Vercel, registrarse o entrar y reservar.

---

## Día de la demo

- **La API gratuita se duerme** tras 15 minutos sin uso; la primera petición tarda hasta ~1 minuto. Unos minutos antes, abrir `https://<servicio>.onrender.com/api/salud` para despertarla. (El frontend espera hasta 60 s antes de mostrar error.)
- **Supabase se pausa** tras 7 días sin uso: revisar el panel antes.
- Tener a mano las dos URLs y el Swagger de Render.

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| En los logs de Render: `Network is unreachable` o timeout al conectar a la base | Se usó la *Direct connection* (IPv6). Usar el Session pooler (paso 1.1) |
| `password authentication failed` | En el pooler el usuario es `postgres.<ref>`; revisar también la contraseña |
| El navegador muestra error de CORS | `Cors__AllowedOrigins__0` no coincide exacto con la URL de Vercel (https, sin `/` al final) |
| El frontend llama a `localhost:5000` | Falta `VITE_API_URL` en Vercel, o se agregó después: hacer *Redeploy* |
| 404 al recargar una página | Falta `frontend/vercel.json` |
| La API no arranca: "Configurá Jwt:Key…" | Falta `Jwt__Key` en Render, o tiene menos de 32 bytes |

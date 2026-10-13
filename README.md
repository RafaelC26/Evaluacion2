# Evaluacion2 — API Árbol Genealógico

API REST que permite el **CRUD** de un sistema que gestiona un **árbol genealógico hasta el segundo grado de consanguinidad**.

- **Tecnología:** Node.js + Express 5 + Mongoose
- **Persistencia en la nube:** MongoDB Atlas
- **Despliegue:** Vercel (función serverless)

## Modelo

Cada **persona** guarda sus datos y la referencia a su padre y a su madre. A partir de esas relaciones la API calcula los parentescos:

| Grado | Parentescos |
|---|---|
| 1.º | padres, hijos |
| 2.º | abuelos (línea paterna/materna), hermanos (completos y medios hermanos), nietos |

```json
{
  "nombre": "Juan",
  "apellido": "Pérez Rodríguez",
  "genero": "M",                 // "M" | "F"  (obligatorio)
  "fechaNacimiento": "1998-02-20",
  "fechaFallecimiento": null,
  "padreId": "<id de una persona con genero M>",
  "madreId": "<id de una persona con genero F>"
}
```

**Validaciones:** campos obligatorios, ids válidos, el padre/la madre deben existir y tener el género correcto, una persona no puede ser su propio padre y no se permiten ciclos (un descendiente no puede ser asignado como progenitor). Al eliminar una persona, sus hijos quedan sin ese padre/madre.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Información y lista de endpoints |
| GET | `/api/health` | Estado de la API y de la base de datos |
| GET | `/api/personas` | Listar (filtros: `?nombre=&apellido=&genero=`) |
| GET | `/api/personas/:id` | Consultar una persona |
| POST | `/api/personas` | Crear |
| PUT | `/api/personas/:id` | Reemplazar (todos los campos) |
| PATCH | `/api/personas/:id` | Actualizar parcialmente |
| DELETE | `/api/personas/:id` | Eliminar |
| GET | `/api/personas/:id/arbol` | Familiares de 1.er y 2.º grado |
| GET | `/api/personas/:id/parentesco/:otroId` | Parentesco entre dos personas |
| POST | `/api/seed` | Borra todo y carga una familia de ejemplo |

## Ejecutar localmente

```bash
npm install
MONGODB_URI="mongodb+srv://usuario:clave@cluster.mongodb.net/" npm start
# http://localhost:3000
```

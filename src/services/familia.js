const mongoose = require('mongoose');
const Persona = require('../models/Persona');

const esId = (v) => mongoose.Types.ObjectId.isValid(v) && String(new mongoose.Types.ObjectId(v)) === String(v);

function errorHttp(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

const resumen = (p, extra = {}) =>
  p && {
    id: p._id,
    nombre: p.nombre,
    apellido: p.apellido,
    nombreCompleto: `${p.nombre} ${p.apellido}`,
    genero: p.genero,
    ...extra,
  };

async function hijosDe(ids) {
  if (!ids.length) return [];
  return Persona.find({ $or: [{ padreId: { $in: ids } }, { madreId: { $in: ids } }] }).lean();
}

async function padresDe(persona) {
  const ids = [persona.padreId, persona.madreId].filter(Boolean);
  if (!ids.length) return [];
  return Persona.find({ _id: { $in: ids } }).lean();
}

/** ¿Es `posibleDescendienteId` descendiente de `ancestroId`? (evita ciclos) */
async function esDescendiente(ancestroId, posibleDescendienteId) {
  let frontera = [String(ancestroId)];
  const vistos = new Set(frontera);
  while (frontera.length) {
    const hijos = await hijosDe(frontera);
    frontera = [];
    for (const h of hijos) {
      const id = String(h._id);
      if (id === String(posibleDescendienteId)) return true;
      if (!vistos.has(id)) {
        vistos.add(id);
        frontera.push(id);
      }
    }
  }
  return false;
}

/** Valida padreId / madreId antes de crear o actualizar */
async function validarPadres({ padreId, madreId }, personaId = null) {
  for (const [campo, valor, generoEsperado, rol] of [
    ['padreId', padreId, 'M', 'padre'],
    ['madreId', madreId, 'F', 'madre'],
  ]) {
    if (valor === undefined || valor === null || valor === '') continue;
    if (!esId(valor)) throw errorHttp(400, `${campo} no es un id válido`);
    if (personaId && String(valor) === String(personaId))
      throw errorHttp(400, `Una persona no puede ser su propio(a) ${rol}`);
    const progenitor = await Persona.findById(valor).lean();
    if (!progenitor) throw errorHttp(404, `No existe la persona indicada como ${rol} (${valor})`);
    if (progenitor.genero !== generoEsperado)
      throw errorHttp(400, `La persona indicada como ${rol} debe tener género "${generoEsperado}"`);
    if (personaId && (await esDescendiente(personaId, valor)))
      throw errorHttp(400, `Relación inválida: ${progenitor.nombre} ${progenitor.apellido} es descendiente de esta persona (se formaría un ciclo)`);
  }
}

/** Familiares hasta 2.º grado de consanguinidad */
async function arbol(persona) {
  const id = String(persona._id);

  // 1.er grado
  const padres = await padresDe(persona);
  const hijos = await hijosDe([id]);

  // 2.º grado
  const abuelos = [];
  for (const p of padres) {
    for (const a of await padresDe(p)) {
      const linea = p.genero === 'M' ? 'paterna' : 'materna';
      abuelos.push(resumen(a, { parentesco: a.genero === 'M' ? 'abuelo' : 'abuela', linea }));
    }
  }

  const nietos = (await hijosDe(hijos.map((h) => String(h._id)))).map((n) =>
    resumen(n, { parentesco: n.genero === 'M' ? 'nieto' : 'nieta' })
  );

  const hermanosRaw = (await hijosDe(padres.map((p) => String(p._id)))).filter((h) => String(h._id) !== id);
  const hermanos = hermanosRaw.map((h) => {
    const mismoPadre = persona.padreId && h.padreId && String(persona.padreId) === String(h.padreId);
    const mismaMadre = persona.madreId && h.madreId && String(persona.madreId) === String(h.madreId);
    const completo = mismoPadre && mismaMadre;
    const base = h.genero === 'M' ? 'hermano' : 'hermana';
    return resumen(h, {
      parentesco: completo ? base : `medio ${base}`,
      tipo: completo ? 'completo' : mismoPadre ? 'por parte de padre' : 'por parte de madre',
    });
  });

  return {
    persona: resumen(persona),
    primerGrado: {
      padres: padres.map((p) => resumen(p, { parentesco: p.genero === 'M' ? 'padre' : 'madre' })),
      hijos: hijos.map((h) => resumen(h, { parentesco: h.genero === 'M' ? 'hijo' : 'hija' })),
    },
    segundoGrado: { abuelos, hermanos, nietos },
    totales: {
      primerGrado: padres.length + hijos.length,
      segundoGrado: abuelos.length + hermanos.length + nietos.length,
    },
  };
}

/** Parentesco entre dos personas (si están a 2 grados o menos) */
async function parentesco(a, b) {
  if (String(a._id) === String(b._id)) return { grado: 0, parentesco: 'misma persona' };
  const info = await arbol(a);
  const grupos = [
    [1, info.primerGrado.padres],
    [1, info.primerGrado.hijos],
    [2, info.segundoGrado.abuelos],
    [2, info.segundoGrado.hermanos],
    [2, info.segundoGrado.nietos],
  ];
  for (const [grado, lista] of grupos) {
    const f = lista.find((x) => String(x.id) === String(b._id));
    if (f) return { grado, parentesco: f.parentesco, descripcion: `${f.nombreCompleto} es ${f.parentesco} de ${a.nombre} ${a.apellido}` };
  }
  return { grado: null, parentesco: 'sin parentesco consanguíneo hasta 2.º grado' };
}

module.exports = { esId, errorHttp, validarPadres, arbol, parentesco };

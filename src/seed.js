const Persona = require('./models/Persona');

/** Borra todo y carga una familia de ejemplo de 4 generaciones */
async function cargarDatosEjemplo() {
  await Persona.deleteMany({});
  const crear = (d) => Persona.create(d);

  // Generación 1: abuelos
  const jose = await crear({ nombre: 'José', apellido: 'Pérez', genero: 'M', fechaNacimiento: '1945-03-12' });
  const maria = await crear({ nombre: 'María', apellido: 'Gómez', genero: 'F', fechaNacimiento: '1948-07-25' });
  const carlos = await crear({ nombre: 'Carlos', apellido: 'Rodríguez', genero: 'M', fechaNacimiento: '1944-11-02', fechaFallecimiento: '2019-05-10' });
  const ana = await crear({ nombre: 'Ana', apellido: 'López', genero: 'F', fechaNacimiento: '1950-01-18' });

  // Generación 2: padres y tíos
  const luis = await crear({ nombre: 'Luis', apellido: 'Pérez Gómez', genero: 'M', fechaNacimiento: '1972-06-30', padreId: jose._id, madreId: maria._id });
  const andres = await crear({ nombre: 'Andrés', apellido: 'Pérez Gómez', genero: 'M', fechaNacimiento: '1975-09-14', padreId: jose._id, madreId: maria._id });
  const laura = await crear({ nombre: 'Laura', apellido: 'Rodríguez López', genero: 'F', fechaNacimiento: '1974-04-08', padreId: carlos._id, madreId: ana._id });
  const patricia = await crear({ nombre: 'Patricia', apellido: 'Rodríguez López', genero: 'F', fechaNacimiento: '1978-12-01', padreId: carlos._id, madreId: ana._id });

  // Generación 3: hijos (Juan es la persona "central" de ejemplo)
  const juan = await crear({ nombre: 'Juan', apellido: 'Pérez Rodríguez', genero: 'M', fechaNacimiento: '1998-02-20', padreId: luis._id, madreId: laura._id });
  await crear({ nombre: 'Sofía', apellido: 'Pérez Rodríguez', genero: 'F', fechaNacimiento: '2001-08-05', padreId: luis._id, madreId: laura._id });
  const camila = await crear({ nombre: 'Camila', apellido: 'Martínez', genero: 'F', fechaNacimiento: '1999-10-10' });

  // Generación 4: nietos
  await crear({ nombre: 'Mateo', apellido: 'Pérez Martínez', genero: 'M', fechaNacimiento: '2022-03-15', padreId: juan._id, madreId: camila._id });
  await crear({ nombre: 'Valentina', apellido: 'Pérez Martínez', genero: 'F', fechaNacimiento: '2024-07-01', padreId: juan._id, madreId: camila._id });

  const total = await Persona.countDocuments();
  return { mensaje: 'Datos de ejemplo cargados', total, personaSugerida: { id: luis._id, nombre: 'Luis Pérez Gómez' } };
}

module.exports = { cargarDatosEjemplo };

const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const opciones = {
  timestamps: { createdAt: 'creadoEn', updatedAt: 'actualizadoEn' },
  versionKey: false,
};

const ArbolSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    descripcion: { type: String, trim: true, maxlength: 500, default: '' },
    raizId: { type: Types.ObjectId, ref: 'Persona', default: null },
  },
  opciones
);

const PersonaSchema = new Schema(
  {
    arbolId: { type: Types.ObjectId, ref: 'Arbol', required: true, index: true },
    nombres: { type: String, required: true, trim: true, maxlength: 80 },
    apellidos: { type: String, trim: true, maxlength: 80, default: '' },
    genero: { type: String, enum: ['M', 'F'], required: true },
    fechaNacimiento: { type: Date, default: null },
    fechaFallecimiento: { type: Date, default: null },
    padreId: { type: Types.ObjectId, ref: 'Persona', default: null },
    madreId: { type: Types.ObjectId, ref: 'Persona', default: null },
  },
  opciones
);

const Arbol = mongoose.models.Arbol || mongoose.model('Arbol', ArbolSchema, 'arboles');
const Persona = mongoose.models.Persona || mongoose.model('Persona', PersonaSchema, 'personas');

module.exports = { Arbol, Persona };

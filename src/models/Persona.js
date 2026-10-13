const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    apellido: { type: String, required: [true, 'El apellido es obligatorio'], trim: true },
    genero: {
      type: String,
      enum: { values: ['M', 'F'], message: 'El género debe ser "M" o "F"' },
      required: [true, 'El género es obligatorio'],
    },
    fechaNacimiento: { type: Date },
    fechaFallecimiento: { type: Date, default: null },
    padreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', default: null },
    madreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

personaSchema.index({ padreId: 1 });
personaSchema.index({ madreId: 1 });

module.exports = mongoose.models.Persona || mongoose.model('Persona', personaSchema);

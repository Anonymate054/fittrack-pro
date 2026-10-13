// Valida la estructura de los datos en src/data/ antes de construir o desplegar.
// Uso: node scripts/validate_data.js   (sale con código 1 si algún archivo no cumple su esquema)
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const dataDir = path.resolve(__dirname, '..', 'src', 'data');
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

const str = { type: 'string' };
const num = { type: 'number' };
const strOrNum = { type: ['string', 'number'] };

const mealPlans = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['kcal', 'ration_matrix', 'menu_meals'],
    properties: {
      file: str,
      kcal: num,
      date: str,
      ration_matrix: { type: 'array', items: { type: 'array', items: str } },
      menu_meals: {
        type: 'array',
        items: {
          type: 'object',
          required: ['meal_name', 'options'],
          properties: {
            meal_name: str,
            target_time: str,
            eq_summary: { type: 'array', items: str },
            options: { type: 'array', items: { type: 'object', properties: { title: str, description: str } } }
          }
        }
      },
      supplements: { type: 'array', items: str },
      rest_day_notes: { type: 'array', items: str }
    }
  }
};

const exercise = {
  type: 'object',
  required: ['name'],
  properties: { name: str, video_url: str, tempo: str, sets: strOrNum, reps: strOrNum }
};

const trainingPlans = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['days'],
    properties: {
      technique_title: str,
      technique_description: str,
      cardio_schedule: str,
      abdomen_table: { type: 'array', items: exercise },
      days: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['day_name', 'biseries'],
          properties: {
            day_name: str,
            biseries: {
              type: 'array',
              items: {
                type: 'object',
                required: ['exercises'],
                properties: { note: str, exercises: { type: 'array', minItems: 1, items: exercise } }
              }
            }
          }
        }
      }
    }
  }
};

const equivalents = {
  type: 'object',
  minProperties: 1,
  additionalProperties: {
    type: 'array',
    minItems: 1,
    items: { type: 'object', required: ['name', 'portion'], properties: { name: str, portion: str } }
  }
};

const zScores = (n) => ({ type: 'array', minItems: n, maxItems: n, items: num });
const progress = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['eval_index', 'eval_label', 'fecha', 'peso_kg', 'somatotype', 'phantom_circunferencias', 'phantom_pliegues'],
    properties: {
      eval_index: { type: 'integer', minimum: 1 },
      eval_label: str,
      fecha: { type: 'string', pattern: '^\\d{2}/\\d{2}/\\d{4}$' },
      peso_kg: num,
      somatotype: { type: 'object', required: ['endo', 'meso', 'ecto'], properties: { endo: num, meso: num, ecto: num } },
      phantom_circunferencias: zScores(7),
      phantom_pliegues: zScores(8)
    }
  }
};

const files = {
  'meal_plans.json': mealPlans,
  'training_plans.json': trainingPlans,
  'equivalents.json': equivalents,
  'progress_history.demo.json': progress,
  'progress_history.template.json': progress
};

let failed = false;
for (const [file, schema] of Object.entries(files)) {
  const filePath = path.join(dataDir, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`✗ ${file}: no se pudo leer (${err.message})`);
    failed = true;
    continue;
  }
  const validate = ajv.compile(schema);
  if (validate(data)) {
    console.log(`✓ ${file}`);
  } else {
    failed = true;
    console.error(`✗ ${file}`);
    for (const e of validate.errors.slice(0, 10)) console.error(`   ${e.instancePath || '/'} ${e.message}`);
  }
}

process.exit(failed ? 1 : 0);

import Joi from "joi";

const COLONY_STATUSES = ["forte", "normale", "faible", "morte"];

// GET /api/hives?site_id=…
export const hivesQuerySchema = Joi.object({
    site_id: Joi.string(),
});

// Les paramètres de requête arrivent en chaînes : Joi les convertit et applique les défauts.
export const paginationSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(500).default(50),
    offset: Joi.number().integer().min(0).default(0),
});

// Trame du § 6.5, avec les plages physiques du TP 4. Un champ facultatif peut valoir null.
export const measureSchema = Joi.object({
    hive_id: Joi.string(),
    site_id: Joi.string(),
    timestamp: Joi.date().iso().required(),
    position_lat: Joi.number().min(-90).max(90).allow(null),
    position_lon: Joi.number().min(-180).max(180).allow(null),
    weight_kg: Joi.number().min(0).max(150).required(),
    temp_internal_c: Joi.number().min(-10).max(60).allow(null),
    temp_external_c: Joi.number().min(-20).max(60).allow(null),
    humidity_pct: Joi.number().integer().min(0).max(100).allow(null),
    acoustic_activity_score: Joi.number().min(0).max(1).allow(null),
    battery_pct: Joi.number().integer().min(0).max(100).allow(null),
});

// Les champs d'une inspection, sortis dans un objet : le TP 8 les réutilisera.
export const inspectionFields = {
    id: Joi.string().guid().required(),
    hive_id: Joi.string(),
    inspected_at: Joi.date().iso().max("now").required()
        .messages({ "date.max": "{{#label}} ne peut pas être dans le futur." }),
    colony_status: Joi.string().valid(...COLONY_STATUSES).required(),
    queen_present: Joi.boolean().allow(null),
    observations: Joi.string().max(2000).allow("", null),
};

// Un Joi.object refuse tout champ non déclaré : impossible de glisser un author_id.
export const inspectionSchema = Joi.object(inspectionFields);

// tlds: { allow: false } : sinon les adresses en .test du jeu de données seraient refusées.
const email = Joi.string().email({ tlds: { allow: false } }).max(254);

export const loginSchema = Joi.object({
    email: email.required(),
    password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
    refresh_token: Joi.string().required(),
});

export const registerSchema = Joi.object({
    email: email.required(),
    password: Joi.string().min(12).max(72).required(), // bcrypt ignore tout au-delà de 72 octets
    role: Joi.string().valid("apiculteur", "coordinateur", "gestionnaire", "admin").required(),
    site_id: Joi.when("role", {
        is: Joi.valid("apiculteur", "coordinateur"),
        then: Joi.string().required(),
        otherwise: Joi.forbidden(),
    }),
});

// Dans le lot, chaque inspection précise sa ruche ; version n'est là que pour une modification.
export const syncSchema = Joi.object({
    inspections: Joi.array()
        .items(Joi.object({
            ...inspectionFields,
            hive_id: Joi.string().required(),
            version: Joi.number().integer().min(1),
        }))
        .min(1)
        .max(500)
        .required(),
});

import * as Joi from 'joi'

export const validation_schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_URI: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  DOCS_PASSWORD: Joi.string().required(),
  TELEGRAM_API_ID: Joi.number().required(),
  TELEGRAM_API_HASH: Joi.string().required(),
  TELEGRAM_PHONE_NUMBER: Joi.string().required(),
  TELEGRAM_PASSWORD: Joi.string().allow(''),
  TELEGRAM_CHANNEL_USERNAME: Joi.string().required(),
})

export const configuration = () => ({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  database: {
    uri: process.env.DATABASE_URI,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  jwt_secret: process.env.JWT_SECRET,
  docs_password: process.env.DOCS_PASSWORD,
  telegram: {
    api_id: parseInt(process.env.TELEGRAM_API_ID, 10),
    api_hash: process.env.TELEGRAM_API_HASH,
    phone_number: process.env.TELEGRAM_PHONE_NUMBER,
    password: process.env.TELEGRAM_PASSWORD,
    channel_username: process.env.TELEGRAM_CHANNEL_USERNAME,
  },
  openai: {
    api_key: process.env.OPENAI_API_KEY,
  },
  locationiq: {
    api_key: process.env.LOCATION_IQ_API_KEY,
  },
})

export default {
  isGlobal: true,
  load: [configuration],
  validationSchema: validation_schema,
  validationOptions: {
    abortEarly: true,
  },
}

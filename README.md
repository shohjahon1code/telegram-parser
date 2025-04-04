# Telegram Load Parser

An intelligent Telegram message parser built with NestJS that extracts load information from messages and integrates with the Flexobo API.

## Features

- 🤖 AI-powered message parsing using GPT
- 📍 Location extraction and validation
- 💾 MongoDB storage for parsed loads
- 🔄 Flexobo API integration for cargo management
- 🚛 Support for various load types and pricing formats

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Telegram Bot Token
- OpenAI API Key
- Flexobo API Token

## Installation

```bash
$ npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_uri
MONGODB_USER=your_mongodb_user
MONGODB_PASSWORD=your_mongodb_password
MONGODB_NAME=your_database_name

OPENAI_API_KEY=your_openai_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
FLEXOBO_API_TOKEN=your_flexobo_api_token
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Loads

- `POST /loads/post-to-flexobo` - Post all loads to Flexobo API
- `POST /loads/delete-from-flexobo` - Delete specified loads from Flexobo API

## Project Structure

```
src/
├── controllers/
│   └── load.controller.ts
├── models/
│   └── load.schema.ts
├── services/
│   ├── ai-parser.service.ts
│   ├── flexobo.service.ts
│   ├── gpt.service.ts
│   ├── load.service.ts
│   ├── location.service.ts
│   └── telegram-parser.service.ts
├── app.module.ts
├── config.ts
└── main.ts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.


## Project Structure

Minimum project structure:

```bash
src/
│
├── api/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   └── etc... (all other APIs)
│
├── common/
│   ├── decorators/
│   │   └── example.decorator.ts
│   ├── interceptors/
│   │   └── example.interceptor.ts
│   ├── utils/
│       └── example.util.ts
│
├── constants/
│   └── example.constant.ts
│
├── enums/
│   └── example.enum.ts
│
├── middlewares/
│   └── example.middleware.ts
│
├── models/
│   ├── user.schema.ts
│   └── example.schema.ts (other models)
│
├── service/
│   ├── example.service.ts
│   └── another.service.ts (other services)
│
├── shared/
│   └── example.shared.ts (if needed)
│
├── app.module.ts
├── config.ts
└── main.ts
.github/
  └── workflows/
      ├── lint.yaml
      └── dev.yaml
```
	 
### Project Feeling:

- **API Design**: Follow REST principles.
- **Error Handling**: Use global filters for consistent error handling.
- **Authentication and Authorization**: Use Passport.js or others,  JWT.
- **Validation**: Use class-validator for request validation.
- **Documentation**: Use Swagger for API documentation.
- **Testing**: Write unit and integration tests using Jest.

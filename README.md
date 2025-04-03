## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
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

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```


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

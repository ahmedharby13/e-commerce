// import swaggerJsdoc from 'swagger-jsdoc';
// import swaggerUi from 'swagger-ui-express';

// const options = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'User Authentication API',
//       version: '1.0.0',
//       description: 'API for user authentication and management',
//     },
//     servers: [
//       {
//         url: process.env.APP_URL || 'http://localhost:3000',
//         description: 'Development server',
//       },
//     ],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT',
//         },
//       },
//     },
//   },
//   apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
// };

// const swaggerSpec = swaggerJsdoc(options);

// export const setupSwagger = (app: import('express').Express) => {
//   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// };
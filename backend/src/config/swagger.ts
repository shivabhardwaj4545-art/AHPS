import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Teacher Attendance & Payroll Management API',
      version: '1.0.0',
      description:
        'Production-grade RESTful API for School Teacher Biometric Attendance, Shift Policies, Leave Management, and Locked Monthly Payroll Processing.',
      contact: {
        name: 'School Admin Support',
        email: 'admin@school.edu',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token.',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.ts', './dist/modules/**/*.js'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);


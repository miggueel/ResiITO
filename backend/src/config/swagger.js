
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ResiITO API',
      version: '1.0.0',
      description: 'API REST de la Plataforma de Residencias Profesionales del ITO'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Sistema', description: 'Estado del servidor' },
      { name: 'Autenticación', description: 'Registro e inicio de sesión' },
      { name: 'Vacantes', description: 'Gestión de vacantes' },
      { name: 'Postulaciones', description: 'Gestión de postulaciones' },
      { name: 'Residencias', description: 'Gestión de residencias' }
    ]
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);

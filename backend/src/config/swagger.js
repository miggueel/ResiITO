
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
      { name: 'Autenticación', description: 'Inicio de sesión, activación y contraseñas' },
      { name: 'Postulaciones', description: 'Gestión de postulaciones' },
      { name: 'Usuarios', description: 'Alta de usuarios y restablecimiento (coordinación)' },
      { name: 'Vacantes', description: 'Proyectos de empresas, cupo y docentes asignados' },
      { name: 'Residencias', description: 'Gestión de residencias' },
      { name: 'Reportes', description: 'Entrega y revisión docente de reportes' },
      { name: 'Evaluaciones', description: 'Evaluación de la empresa' },
      { name: 'Solicitudes', description: 'Solicitudes de cambio de estatus' }
    ]
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);

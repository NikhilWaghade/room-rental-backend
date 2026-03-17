import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Room Rental API",
            version: "1.0.0"
        }
    },
    apis: ["./routes/*.js"]
};

export const swaggerSpec = swaggerJsdoc(options);
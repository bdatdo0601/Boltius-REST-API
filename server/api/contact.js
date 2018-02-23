const Config = require("../../config");
const Joi = require("joi");
const Mailer = require("../mailer");

const RESPONSES = require("../constants/Responses");

const register = function(server, serverOptions) {
    server.route({
        method: "POST",
        path: "/api/contact",
        options: {
            auth: false,
            validate: {
                payload: {
                    name: Joi.string()
                        .required()
                        .description("Sender's name"),
                    email: Joi.string()
                        .email()
                        .required()
                        .description("Sender's email"),
                    message: Joi.string()
                        .required()
                        .description("Message"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Send email",
            notes: "Sending an email to this system",
            tags: ["api", "public"],
        },
        handler: async function(request, h) {
            const emailOptions = {
                subject: Config.get("/projectName") + " contact form",
                to: Config.get("/system/toAddress"),
                replyTo: {
                    name: request.payload.name,
                    address: request.payload.email,
                },
            };
            const template = "contact";

            await Mailer.sendEmail(emailOptions, template, request.payload);

            return { message: "Success." };
        },
    });
};

module.exports = {
    name: "api-contact",
    dependencies: [],
    register,
};

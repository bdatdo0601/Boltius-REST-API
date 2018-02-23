const RESPONSES = require("../constants/Responses");

const register = function(server, serverOptions) {
    server.route({
        method: "GET",
        path: "/api",
        options: {
            auth: false,
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Root Endpoint",
            tags: ["api", "public"],
        },
        handler: function(request, h) {
            return {
                message: "Welcome to the API.",
            };
        },
    });
};

module.exports = {
    name: "api-main",
    dependencies: [],
    register,
};

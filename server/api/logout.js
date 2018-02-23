const Session = require("../models/session");

const RESPONSES = require("../constants/Responses");

const register = function(server, serverOptions) {
    server.route({
        method: "DELETE",
        path: "/api/logout",
        options: {
            auth: {
                mode: "try",
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Log out from the system",
            tags: ["api", "public"],
        },
        handler: function(request, h) {
            const credentials = request.auth.credentials;

            if (!credentials) {
                return { message: "Success." };
            }

            Session.findByIdAndDelete(credentials.session._id);

            return { message: "Success." };
        },
    });
};

module.exports = {
    name: "api-logout",
    dependencies: ["auth", "hapi-auth-basic", "hapi-mongo-models"],
    register,
};

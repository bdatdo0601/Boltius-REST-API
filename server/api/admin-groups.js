const AdminGroup = require("../models/admin-group");
const Boom = require("boom");
const Joi = require("joi");
const Preware = require("../preware");

const RESPONSES = require("../constants/Responses");

const register = function(server, serverOptions) {
    server.route({
        method: "GET",
        path: "/api/admin-groups",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                query: {
                    sort: Joi.string()
                        .default("_id")
                        .description("which param to sort"),
                    limit: Joi.number()
                        .default(20)
                        .description("maximum amount of groups returned"),
                    page: Joi.number()
                        .default(1)
                        .description("current page"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Get Admin Groups",
            notes: "Get all available admin groups",
            tags: ["api", "rootScope"],
            pre: [Preware.requireAdminGroup("root")],
        },
        handler: async function(request, h) {
            const query = {};
            const limit = request.query.limit;
            const page = request.query.page;
            const options = {
                sort: AdminGroup.sortAdapter(request.query.sort),
            };

            return await AdminGroup.pagedFind(query, limit, page, options);
        },
    });

    server.route({
        method: "POST",
        path: "/api/admin-groups",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                payload: {
                    name: Joi.string()
                        .required()
                        .description("name of new group"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Create Admin Groups",
            notes: "Create a new admin group",
            tags: ["api", "rootScope"],
            pre: [Preware.requireAdminGroup("root")],
        },
        handler: async function(request, h) {
            return await AdminGroup.create(request.payload.name);
        },
    });

    server.route({
        method: "GET",
        path: "/api/admin-groups/{id}",
        options: {
            auth: {
                scope: "admin",
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Get an Admin Group",
            notes: "Get an admin group based on admin group ID",
            tags: ["api", "rootScope"],
            pre: [Preware.requireAdminGroup("root")],
        },
        handler: async function(request, h) {
            const adminGroup = await AdminGroup.findById(request.params.id);

            if (!adminGroup) {
                throw Boom.notFound("AdminGroup not found.");
            }

            return adminGroup;
        },
    });

    server.route({
        method: "PUT",
        path: "/api/admin-groups/{id}",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                params: {
                    id: Joi.string().invalid("root"),
                },
                payload: {
                    name: Joi.string()
                        .required()
                        .description("new name of group"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Change name",
            notes: "Change name of an admin group (changing root is not allowed)",
            tags: ["api", "rootScope"],
            pre: [Preware.requireAdminGroup("root")],
        },
        handler: async function(request, h) {
            const id = request.params.id;
            const update = {
                $set: {
                    name: request.payload.name,
                },
            };
            const adminGroup = await AdminGroup.findByIdAndUpdate(id, update);

            if (!adminGroup) {
                throw Boom.notFound("AdminGroup not found.");
            }

            return adminGroup;
        },
    });

    server.route({
        method: "DELETE",
        path: "/api/admin-groups/{id}",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                params: {
                    id: Joi.string().invalid("root"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Delete an admin group",
            notes: "Delete an admin group based on ID",
            tags: ["api", "rootScope"],
            pre: [Preware.requireAdminGroup("root")],
        },
        handler: async function(request, h) {
            const adminGroup = await AdminGroup.findByIdAndDelete(request.params.id);

            if (!adminGroup) {
                throw Boom.notFound("AdminGroup not found.");
            }

            return { message: "Success." };
        },
    });

    server.route({
        method: "PUT",
        path: "/api/admin-groups/{id}/permissions",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                params: {
                    id: Joi.string().invalid("root"),
                },
                payload: {
                    permissions: Joi.object()
                        .required()
                        .description("new permission"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Update permission",
            notes: "Update permission of a group. Any permission is required to have a permission boolean property",
            tags: ["api", "rootScope"],
            pre: [Preware.requireAdminGroup("root")],
        },
        handler: async function(request, h) {
            const id = request.params.id;
            const update = {
                $set: {
                    permissions: request.payload.permissions,
                },
            };
            const adminGroup = await AdminGroup.findByIdAndUpdate(id, update);

            if (!adminGroup) {
                throw Boom.notFound("AdminGroup not found.");
            }

            return adminGroup;
        },
    });
};

module.exports = {
    name: "api-admin-groups",
    dependencies: ["auth", "hapi-auth-basic", "hapi-mongo-models"],
    register,
};

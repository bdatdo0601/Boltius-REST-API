const Account = require("../models/account");
const Boom = require("boom");
const Joi = require("joi");
const NoteEntry = require("../models/note-entry");
const Preware = require("../preware");
const Status = require("../models/status");
const StatusEntry = require("../models/status-entry");
const User = require("../models/user");

const RESPONSES = require("../constants/Responses");

const register = function(server, serverOptions) {
    server.route({
        method: "GET",
        path: "/api/accounts",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                query: {
                    sort: Joi.string()
                        .default("_id")
                        .description("determine which param of accounts to sort by"),
                    limit: Joi.number()
                        .default(20)
                        .description("maximum amount of accounts that will be return"),
                    page: Joi.number()
                        .default(1)
                        .description("allow pagination of account list"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Get Accounts",
            notes: "Returns all accounts existed",
            tags: ["api", "adminScope"],
        },
        handler: async function(request, h) {
            const query = {};
            const limit = request.query.limit;
            const page = request.query.page;
            const options = {
                sort: Account.sortAdapter(request.query.sort),
            };

            return await Account.pagedFind(query, page, limit, options);
        },
    });

    server.route({
        method: "POST",
        path: "/api/accounts",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                payload: {
                    name: Joi.string()
                        .required()
                        .description("Name of the new account"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Create New Accounts",
            notes: "Add a new account to database ",
            tags: ["api", "adminScope"],
        },
        handler: async function(request, h) {
            return await Account.create(request.payload.name);
        },
    });

    server.route({
        method: "GET",
        path: "/api/accounts/{id}",
        options: {
            auth: {
                scope: "admin",
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Get an Account",
            notes: "Get an account from ID ",
            tags: ["api", "adminScope"],
        },
        handler: async function(request, h) {
            const account = await Account.findById(request.params.id);

            if (!account) {
                throw Boom.notFound("Account not found.");
            }

            return account;
        },
    });

    server.route({
        method: "PUT",
        path: "/api/accounts/{id}",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                payload: {
                    name: Joi.object({
                        first: Joi.string().required(),
                        middle: Joi.string().allow(""),
                        last: Joi.string().required(),
                    })
                        .required()
                        .description("new name of an account (divided by first, middle and last)"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Change name of an account",
            notes: "Rename of an already exist account",
            tags: ["api", "adminScope"],
        },
        handler: async function(request, h) {
            const id = request.params.id;
            const update = {
                $set: {
                    name: request.payload.name,
                },
            };
            const account = await Account.findByIdAndUpdate(id, update);

            if (!account) {
                throw Boom.notFound("Account not found.");
            }

            return account;
        },
    });

    server.route({
        method: "DELETE",
        path: "/api/accounts/{id}",
        options: {
            auth: {
                scope: "admin",
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Delete an Account",
            notes: "Delete an account from database",
            tags: ["api", "rootScope"],
            pre: [Preware.requireAdminGroup("root")],
        },
        handler: async function(request, h) {
            const account = await Account.findByIdAndDelete(request.params.id);

            if (!account) {
                throw Boom.notFound("Account not found.");
            }

            return { message: "Success." };
        },
    });

    server.route({
        method: "PUT",
        path: "/api/accounts/{id}/user",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                payload: {
                    username: Joi.string()
                        .lowercase()
                        .required()
                        .description("user's username to link with this account"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Link user and account",
            notes: "Link user with an existing account. One to one relation",
            tags: ["api", "adminScope"],
            pre: [
                {
                    assign: "account",
                    method: async function(request, h) {
                        const account = await Account.findById(request.params.id);

                        if (!account) {
                            throw Boom.notFound("Account not found.");
                        }

                        return account;
                    },
                },
                {
                    assign: "user",
                    method: async function(request, h) {
                        const user = await User.findByUsername(request.payload.username);

                        if (!user) {
                            throw Boom.notFound("User not found.");
                        }

                        if (user.roles.account && user.roles.account.id !== request.params.id) {
                            throw Boom.conflict("User is linked to an account. Unlink first.");
                        }

                        if (request.pre.account.user && request.pre.account.user.id !== `${user._id}`) {
                            throw Boom.conflict("Account is linked to a user. Unlink first.");
                        }

                        return user;
                    },
                },
            ],
        },
        handler: async function(request, h) {
            const user = request.pre.user;
            let account = request.pre.account;

            [account] = await Promise.all([
                account.linkUser(`${user._id}`, user.username),
                user.linkAccount(`${account._id}`, account.fullName()),
            ]);

            return account;
        },
    });

    server.route({
        method: "DELETE",
        path: "/api/accounts/{id}/user",
        options: {
            auth: {
                scope: "admin",
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Unlink user and account",
            tags: ["api", "adminScope"],
            pre: [
                {
                    assign: "account",
                    method: async function(request, h) {
                        let account = await Account.findById(request.params.id);

                        if (!account) {
                            throw Boom.notFound("Account not found.");
                        }

                        if (!account.user || !account.user.id) {
                            account = await account.unlinkUser();

                            return h.response(account).takeover();
                        }

                        return account;
                    },
                },
                {
                    assign: "user",
                    method: async function(request, h) {
                        const user = await User.findById(request.pre.account.user.id);

                        if (!user) {
                            throw Boom.notFound("User not found.");
                        }

                        return user;
                    },
                },
            ],
        },
        handler: async function(request, h) {
            const [account] = await Promise.all([request.pre.account.unlinkUser(), request.pre.user.unlinkAccount()]);

            return account;
        },
    });

    server.route({
        method: "POST",
        path: "/api/accounts/{id}/notes",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                payload: {
                    data: Joi.string()
                        .required()
                        .description("note data"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Create a note",
            notes: "Create a note for an account",
            tags: ["api", "adminScope"],
        },
        handler: async function(request, h) {
            const id = request.params.id;
            const admin = request.auth.credentials.roles.admin;
            const newNote = new NoteEntry({
                data: request.payload.data,
                adminCreated: {
                    id: `${admin._id}`,
                    name: admin.fullName(),
                },
            });
            const update = {
                $push: {
                    notes: newNote,
                },
            };
            const account = await Account.findByIdAndUpdate(id, update);

            if (!account) {
                throw Boom.notFound("Account not found.");
            }

            return account;
        },
    });

    server.route({
        method: "POST",
        path: "/api/accounts/{id}/status",
        options: {
            auth: {
                scope: "admin",
            },
            validate: {
                payload: {
                    status: Joi.string()
                        .required()
                        .description("new status"),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Assign Statuses",
            notes: "Assign a Status to an account",
            tags: ["api", "adminScope"],
            pre: [
                {
                    assign: "status",
                    method: async function(request, h) {
                        const status = await Status.findById(request.payload.status);

                        if (!status) {
                            throw Boom.notFound("Status not found.");
                        }

                        return status;
                    },
                },
            ],
        },
        handler: async function(request, h) {
            const id = request.params.id;
            const admin = request.auth.credentials.roles.admin;
            const newStatus = new StatusEntry({
                id: `${request.pre.status._id}`,
                name: request.pre.status.name,
                adminCreated: {
                    id: `${admin._id}`,
                    name: admin.fullName(),
                },
            });
            const update = {
                $set: {
                    "status.current": newStatus,
                },
                $push: {
                    "status.log": newStatus,
                },
            };
            const account = await Account.findByIdAndUpdate(id, update);

            if (!account) {
                throw Boom.notFound("Account not found.");
            }

            return account;
        },
    });

    server.route({
        method: "GET",
        path: "/api/accounts/my",
        options: {
            auth: {
                scope: "account",
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Get account",
            notes: "Get the currently used account (self)",
            tags: ["api", "accountScope"],
        },
        handler: async function(request, h) {
            const id = request.auth.credentials.roles.account._id;
            const fields = Account.fieldsAdapter("user name timeCreated");

            return await Account.findById(id, fields);
        },
    });

    server.route({
        method: "PUT",
        path: "/api/accounts/my",
        options: {
            auth: {
                scope: "account",
            },
            validate: {
                payload: {
                    name: Joi.object({
                        first: Joi.string().required(),
                        middle: Joi.string().allow(""),
                        last: Joi.string().required(),
                    }).required(),
                },
            },
            plugins: {
                "hapi-swagger": {
                    responses: RESPONSES,
                },
            },
            description: "Change account's name",
            notes: "Change the name of the currently used account (self)",
            tags: ["api", "accountScope"],
        },
        handler: async function(request, h) {
            const id = request.auth.credentials.roles.account._id;
            const update = {
                $set: {
                    name: request.payload.name,
                },
            };
            const options = {
                fields: Account.fieldsAdapter("user name timeCreated"),
            };

            return await Account.findByIdAndUpdate(id, update, options);
        },
    });
};

module.exports = {
    name: "api-accounts",
    dependencies: ["auth", "hapi-auth-basic", "hapi-mongo-models"],
    register,
};

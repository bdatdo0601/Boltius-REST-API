const { formatError } = require("graphql");
const Accepts = require("accepts");
const Boom = require("boom");
const { Stream } = require("stream");
const GraphQLModule = require("../graphql");
const Schema = require("../graphql/schema/schema");

/**
 * Define helper: parse payload
 */
const parsePayload = async request => {
    // Read stream
    const result = await new Promise(resolve => {
        if (request.payload instanceof Stream) {
            let data = "";
            request.payload.on("data", chunk => {
                data += chunk;
            });
            request.payload.on("end", () => resolve(data));
        } else {
            resolve("{}");
        }
    });

    // Return normalized payload
    let formattedResult = null;
    if (request.mime === "application/graphql") {
        formattedResult = { query: result };
    } else {
        formattedResult = JSON.parse(result);
    }
    return formattedResult;
};

/**
 * Define helper: get GraphQL parameters from query/payload
 */
const getGraphQLParams = (data = {}, isPayload) => {
    const query = !isPayload ? data.query.query : data.query;
    // Parse the variables if needed.
    let variables = query && !isPayload ? data.query.variables : data.variables;
    if (variables && typeof variables === "string") {
        try {
            variables = JSON.parse(variables);
        } catch (error) {
            throw Boom.badRequest("Variables are invalid JSON.");
        }
    }

    // Name of GraphQL operation to execute.
    const operationName = query && !isPayload ? data.query.operationName : data.operationName;
    // Return params
    return { query, variables, operationName };
};

/**
 * Define helper: determine if GraphiQL can be displayed.
 */
const canDisplayGraphiQL = (request, data) => {
    // If `raw` exists, GraphiQL mode is not enabled.
    const raw = request.query.raw !== undefined || data.raw !== undefined;

    // Allowed to show GraphiQL if not requested as raw and this request
    // prefers HTML over JSON.
    const accept = Accepts(request.raw.req);
    return !raw && accept.type(["json", "html"]) === "html";
};

const register = (server, serverOptions) => {
    server.route({
        method: "GET",
        path: "/api/graphql",
        options: {
            auth: false,
        },
        handler: async (request, h) => {
            // Parse payload
            const payload = await parsePayload(request);
            // Can we show graphiQL?
            const showGraphiQL = process.env.NODE_ENV === "development" && (await canDisplayGraphiQL(request, payload));
            // Get GraphQL params from the request and POST body data.
            const { query, variables, operationName } = getGraphQLParams(request, false);
            const result = await GraphQLModule.getResult(operationName, query, true, showGraphiQL, variables, Schema);
            // Format any encountered errors.
            if (result && result.errors) {
                result.errors = result.errors.map(formatError);
            }
            // If allowed to show GraphiQL, present it instead of JSON.
            if (showGraphiQL) {
                return h
                    .response(GraphQLModule.GRAPHIQL({ query, variables, operationName, result }))
                    .type("text/html");
            }
            // Otherwise, present JSON directly.
            return JSON.stringify(result);
        },
    });
    server.route({
        method: "POST",
        path: "/api/graphql",
        options: {
            auth: false,
        },
        handler: async (request, h) => {
            const { query, variables, operationName } = await getGraphQLParams(request.payload, true);
            const result = await GraphQLModule.getResult(operationName, query, false, false, variables, Schema);
            // Format any encountered errors.
            if (result && result.errors) {
                result.errors = result.errors.map(formatError);
            }
            return JSON.stringify(result);
        },
    });
};

module.exports = {
    name: "api-graphql",
    dependencies: [],
    register,
};

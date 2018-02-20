const { Source, parse, validate, execute, getOperationAST, specifiedRules } = require("graphql");
const RenderGraphiQL = require("./renderGraphiQL");
const Boom = require("boom");
const Schema = require("./schema/schema");

/**
 * Define helper: execute query and create result
 */
const createResult = async (operationName, query, isGet, showGraphiQL, variables) => {
    // If there is no query, but GraphiQL will be displayed, do not produce
    // a result, otherwise return a 400: Bad Request.
    if (!query) {
        if (showGraphiQL) {
            return null;
        }
        throw Boom.badRequest("Must provide query string.");
    }

    // GraphQL source.
    const source = new Source(query, "GraphQL request");
    // Parse source to AST, reporting any syntax error.
    let documentAST;
    try {
        documentAST = parse(source);
    } catch (syntaxError) {
        // Return 400: Bad Request if any syntax errors errors exist.
        throw Boom.badRequest("Syntax error", [syntaxError]);
    }

    // Validate AST, reporting any errors.
    const validationErrors = validate(Schema, documentAST, specifiedRules);
    if (validationErrors.length > 0) {
        // Return 400: Bad Request if any validation errors exist.
        throw Boom.badRequest("Validation error", validationErrors);
    }

    // Only query operations are allowed on GET requests.
    if (isGet) {
        // Determine if this GET request will perform a non-query.
        const operationAST = getOperationAST(documentAST, operationName);
        if (operationAST && operationAST.operation !== "query") {
            // If GraphiQL can be shown, do not perform this query, but
            // provide it to GraphiQL so that the requester may perform it
            // themselves if desired.
            if (showGraphiQL) {
                return null;
            }

            // Otherwise, report a 405: Method Not Allowed error.
            throw Boom.methodNotAllowed(`Can only perform a ${operationAST.operation} operation from a POST request.`);
        }
    }

    // Perform the execution, reporting any errors creating the context.
    try {
        return await execute(Schema, documentAST, null, null, variables, operationName);
    } catch (contextError) {
        // Return 400: Bad Request if any execution context errors exist.
        throw Boom.badRequest("Context error", [contextError]);
    }
};

module.exports = {
    getResult: createResult,
    GRAPHIQL: RenderGraphiQL,
};

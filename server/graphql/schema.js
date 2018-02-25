const { GraphQLSchema } = require("graphql");

const Queries = require("./queries");

module.exports = new GraphQLSchema({
    query: Queries,
});

const { GraphQLObjectType } = require("graphql");
const UserQuery = require("./user");

module.exports = new GraphQLObjectType({
    name: "RootQuery",
    fields: () => ({
        ...UserQuery,
    }),
});

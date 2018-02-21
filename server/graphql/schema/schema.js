const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require("graphql");
const User = require("../../models/user");

const UserType = new GraphQLObjectType({
    name: "User",
    fields: () => ({
        id: { type: GraphQLString },
        username: { type: GraphQLString },
        email: { type: GraphQLString },
    }),
});

const UserQuery = new GraphQLObjectType({
    name: "UserQuery",
    fields: {
        user: {
            type: UserType,
            args: {
                username: { type: GraphQLString },
            },
            resolve: async (parentValue, args) => {
                const user = await User.findByUsername(args.username);
                return user;
            },
        },
    },
});

module.exports = new GraphQLSchema({
    query: UserQuery,
});

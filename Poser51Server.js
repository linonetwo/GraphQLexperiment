import express from 'express';
import bodyParser from 'body-parser';
import { apolloExpress, graphiqlExpress } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import { typeDefinitions as typeDefs, resolvers } from './data/Poser51Schema';
import Power51Connector from './data/Poser51Connector';
import { User, Config, PowerEntity, FortuneCookie } from './data/Poser51Model';

const fs = require('fs');
const babelrc = fs.readFileSync('./.babelrc');
let config;

try {
  config = JSON.parse(babelrc);
} catch (err) {
  console.error('==>     ERROR: Error parsing your .babelrc.');
  console.error(err);
}
require('babel-register')(config);

const serverConnector = new Power51Connector();

const GRAPHQL_PORT = 8964;

const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
const graphQLServer = express();
graphQLServer.use(bodyParser.json())
graphQLServer.use('/graphql', apolloExpress(() => ({
  graphiql: true,
  pretty: true,
  schema: executableSchema,
  context: {
    Config: new Config({ connector: serverConnector }),
    User: new User({ connector: serverConnector }),
    PowerEntity: new PowerEntity({ connector: serverConnector }),
    FortuneCookie: new FortuneCookie(),
  },
}))
);

graphQLServer.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphiql`
));

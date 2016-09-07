import express from 'express';
import { apolloServer } from 'graphql-tools';
import { typeDefinitions, resolvers } from './data/schema';
import Power51Connector from './data/Poser51Connector';
import { User, Config } from './data/Model';

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

const GRAPHQL_PORT = 8080;

const graphQLServer = express();
graphQLServer.use('/graphql', apolloServer({
  graphiql: true,
  pretty: true,
  schema: typeDefinitions,
  resolvers,
  context: {
    Config: new Config({ connector: serverConnector }),
    User: new User({ connector: serverConnector }),
  },
}));
graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphql`
));

import express from 'express';
import bodyParser from 'body-parser';
import { apolloExpress, graphiqlExpress } from 'apollo-server';

import { executableSchema, defaultContext } from 'power51-graphql-wrapper';

const GRAPHQL_PORT = 8964;

const graphQLServer = express();
graphQLServer.use(bodyParser.json())

graphQLServer.use('/graphql', apolloExpress((req) => ({
  graphiql: true,
  pretty: true,
  schema: executableSchema,
  context: defaultContext({
    power51Config: { url: 'http://power51.grootapp.com:31328' },
    ezConfig: { url: 'https://open.ys7.com/api/lapp/token/get', appKey: '93ce9b9a3bbd450ab7de2b0f9c111d32&appSecret=3c9713a3568bcd80f0d29ef6c5901ff2'},
  })
}))
);

graphQLServer.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphiql`
));

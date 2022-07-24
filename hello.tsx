/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';
import { h, renderSSR } from 'https://deno.land/x/nano_jsx@v0.0.20/mod.ts';
import * as postgres from 'https://deno.land/x/postgres@v0.14.0/mod.ts';

const databaseUrl = Deno.env.get('DATABASE_URL');

const pool = new postgres.Pool(databaseUrl, 3, true);

function App() {
  return (
    <html>
      <head>
        <title>Hello from JSX</title>
      </head>
      <body>
        <h1>Hello world!</h1>
      </body>
    </html>
  );
}

function handler(req) {
  const html = renderSSR(<App />);
  return new Response(html, {
    headers: {
      'content-type': 'text/html',
    },
  });
}

serve(handler);

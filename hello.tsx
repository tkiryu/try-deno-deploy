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

const connection = await pool.connect();

try {
  await connection.queryObject`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL
    )
  `;
} finally {
  connection.release();
}

type Todo = {
  id: number;
  title: string;
};

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <html>
      <head>
        <title>Hello from JSX</title>
      </head>
      <body>
        <h1>Hello world!</h1>
        {todos.map((todo) => (
          <dl key={todo.id}>
            <dt>{todo.title}</dt>
          </dl>
        ))}
      </body>
    </html>
  );
}

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname !== '/todos') {
    return new Response('Not Found', { status: 404 });
  }

  const connection = await pool.connect();

  try {
    switch (req.method) {
      case 'GET': {
        const result = await connection.queryObject<Todo>`
            SELECT * from todos
        `;

        const html = renderSSR(<TodoList todos={result.rows} />);
        return new Response(html, {
          headers: {
            'content-type': 'text/html',
          },
        });
      }
      case 'POST': {
        const title = await req.json().catch(() => null);
        if (typeof title !== 'string' || title.length > 256) {
          return new Response('Bad Request', { status: 400 });
        }

        await connection.queryObject`
            INSERT INTO todos (title) VALUES (${title})
        `;

        return new Response('', { status: 201 });
      }
      default: {
        return new Response('Method Not Allowed', { status: 405 });
      }
    }
  } catch (err) {
    console.error(err);
    return new Response(`Internal Server Error\n\n${err.message}`, { status: 500 });
  } finally {
    connection.release();
  }
});

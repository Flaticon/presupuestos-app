/// <reference types="astro/client" />

type D1Database = import("@cloudflare/workers-types").D1Database;

interface CloudflareEnv {
  DB: D1Database;
}

type Runtime = import("@astrojs/cloudflare").Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}

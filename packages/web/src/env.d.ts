interface ImportMetaEnv {
  /** Cloudflare Web Analytics site token. When unset, no beacon is rendered. */
  readonly PUBLIC_CF_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

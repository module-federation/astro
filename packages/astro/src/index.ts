import { federation } from '@module-federation/vite';
import type { AstroIntegration } from 'astro';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type RemoteObjectConfig = {
  type?: string;
  name: string;
  entry: string;
  entryGlobalName?: string;
  shareScope?: string;
};

export type AstroModuleFederationOptions = {
  mode?: 'auto' | 'client' | 'server';
  name: string;
  filename?: string;
  manifest?: boolean | { filePath?: string; fileName?: string; disableAssetsAnalyze?: boolean };
  exposes?: Record<string, string | { import: string }>;
  remotes?: Record<string, string | RemoteObjectConfig>;
  shared?: Record<string, unknown> | string[];
  runtimePlugins?: Array<string | [string, Record<string, unknown>]>;
  shareScope?: string;
  dts?: boolean | Record<string, unknown>;
  dev?: boolean | Record<string, unknown>;
  varFilename?: string;
  target?: 'web' | 'node';
  virtualModuleDir?: string;
  ssr?: {
    localRemotes?: Record<string, string>;
  };
  bundleAllCSS?: boolean;
  hostInitInjectLocation?: 'entry' | 'html';
};

type RemoteValue = string | RemoteObjectConfig;
type RemotesMap = AstroModuleFederationOptions['remotes'];
type ExposesMap = AstroModuleFederationOptions['exposes'];
type ExposeValue = string | { import: string };
type RuntimeRemoteConfig = {
  alias: string;
  name: string;
  entry: string;
  type: string;
  entryGlobalName: string;
  shareScope: string;
};

const DEFAULT_NO_EXTERNAL = [
  '@module-federation/runtime',
  '@module-federation/runtime-core',
  '@module-federation/sdk',
  '@module-federation/vite',
];
const DEFAULT_OPTIMIZE_DEPS_INCLUDE = [
  '@module-federation/runtime',
];
const DEFAULT_VIRTUAL_MODULE_DIR = '__mf__virtual';
const DEFAULT_ASTRO_EXPOSES_TEMP_DIR = path.join('.__mf__temp', 'astro-exposes');
const HOST_AUTO_INIT_TAG = '__H_A_I__';
const ASTRO_RUNTIME_ALIAS = '@module-federation/astro/runtime';
const require = createRequire(import.meta.url);
const viteEntrypointPath = require.resolve('@module-federation/vite');
const viteRequire = createRequire(viteEntrypointPath);
const RUNTIME_ESM_PATH = viteRequire.resolve('@module-federation/runtime/dist/index.js');

function packageNameEncode(name: string): string {
  if (typeof name !== 'string') {
    throw new TypeError('A string package name is required');
  }
  return name
    .replace(/@/g, '_mf_0_')
    .replace(/\//g, '_mf_1_')
    .replace(/-/g, '_mf_2_')
    .replace(/\./g, '_mf_3_');
}

function isUrlLike(value: string): boolean {
  return /^(https?:)?\/\//.test(value) || value.startsWith('/');
}

function parseRemoteString(
  remoteKey: string,
  remoteValue: string,
): { entryGlobalName: string; entry: string } | null {
  if (typeof remoteValue !== 'string') return null;

  const atIndex = remoteValue.lastIndexOf('@');
  if (atIndex > 0) {
    const entryGlobalName = remoteValue.slice(0, atIndex);
    const entry = remoteValue.slice(atIndex + 1);
    if (isUrlLike(entry)) {
      return { entryGlobalName, entry };
    }
  }

  if (isUrlLike(remoteValue)) {
    return {
      entryGlobalName: remoteKey,
      entry: remoteValue,
    };
  }

  return null;
}

function normalizeRemoteValue(remoteKey: string, remoteValue: RemoteValue): RemoteValue {
  if (typeof remoteValue !== 'string') return remoteValue;

  const parsedRemote = parseRemoteString(remoteKey, remoteValue);
  if (!parsedRemote) return remoteValue;

  return {
    type: 'var',
    name: remoteKey,
    entry: parsedRemote.entry,
    entryGlobalName: parsedRemote.entryGlobalName,
    shareScope: 'default',
  };
}

function normalizeRemotes(remotes?: RemotesMap): RemotesMap {
  if (!remotes) return remotes;
  const entries = Object.entries(remotes).map(([key, value]) => [
    key,
    normalizeRemoteValue(key, value as RemoteValue),
  ]);
  return Object.fromEntries(entries);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function ensureRelativeImportSpecifier(specifier: string): string {
  if (
    specifier.startsWith('./')
    || specifier.startsWith('../')
    || specifier.startsWith('/')
  ) {
    return specifier;
  }
  return `./${specifier}`;
}

function toProjectRelativeSpecifier(projectRoot: string, absoluteFilePath: string): string {
  return ensureRelativeImportSpecifier(
    toPosixPath(path.relative(projectRoot, absoluteFilePath)),
  );
}

function resolveAstroExposeFile(
  projectRoot: string,
  exposeImport: string,
): string | null {
  const importWithoutQuery = exposeImport.split('?')[0].split('#')[0];
  const normalizedImport = importWithoutQuery.startsWith('file://')
    ? fileURLToPath(importWithoutQuery)
    : importWithoutQuery;
  const absoluteBasePath = path.isAbsolute(normalizedImport)
    ? normalizedImport
    : path.resolve(projectRoot, normalizedImport);
  const candidates = [
    absoluteBasePath,
    `${absoluteBasePath}.astro`,
    path.join(absoluteBasePath, 'index.astro'),
  ];

  for (const candidatePath of candidates) {
    if (!candidatePath.endsWith('.astro')) continue;
    if (fs.existsSync(candidatePath)) return candidatePath;
  }

  return null;
}

function writeAstroExposeWrapper(
  wrapperPath: string,
  exposedAstroFilePath: string,
): void {
  const relativeSourceImport = ensureRelativeImportSpecifier(
    toPosixPath(path.relative(path.dirname(wrapperPath), exposedAstroFilePath)),
  );
  const wrapperContents = [
    '// Auto-generated by @module-federation/astro.',
    '// @ts-ignore -- DTS generation runs plain tsc without Astro module resolution.',
    `import AstroExposedModule from ${JSON.stringify(relativeSourceImport)};`,
    '',
    'export default AstroExposedModule;',
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(wrapperPath), { recursive: true });
  fs.writeFileSync(wrapperPath, wrapperContents, 'utf8');
}

function normalizeAstroExposesForFederation(
  exposes: ExposesMap | undefined,
  projectRoot: string,
): ExposesMap | undefined {
  if (!exposes) return exposes;

  let hasAstroExpose = false;
  const normalizedExposes: Record<string, ExposeValue> = {};

  for (const [exposeKey, exposeValue] of Object.entries(exposes)) {
    const exposeImport = typeof exposeValue === 'string' ? exposeValue : exposeValue.import;
    if (typeof exposeImport !== 'string') {
      normalizedExposes[exposeKey] = exposeValue;
      continue;
    }

    const astroExposeFilePath = resolveAstroExposeFile(projectRoot, exposeImport);
    if (!astroExposeFilePath) {
      normalizedExposes[exposeKey] = exposeValue;
      continue;
    }

    hasAstroExpose = true;

    const normalizedExposeKey = exposeKey.replace(/^\.?\//, '');
    const wrapperFileName = `${packageNameEncode(normalizedExposeKey || exposeKey)}.ts`;
    const wrapperAbsolutePath = path.join(
      projectRoot,
      DEFAULT_ASTRO_EXPOSES_TEMP_DIR,
      wrapperFileName,
    );
    writeAstroExposeWrapper(wrapperAbsolutePath, astroExposeFilePath);
    const wrapperImport = toProjectRelativeSpecifier(projectRoot, wrapperAbsolutePath);

    normalizedExposes[exposeKey] =
      typeof exposeValue === 'string'
        ? wrapperImport
        : {
            ...exposeValue,
            import: wrapperImport,
          };
  }

  return hasAstroExpose ? normalizedExposes : exposes;
}

function inferTargetFromMode(
  mode: AstroModuleFederationOptions['mode'],
): AstroModuleFederationOptions['target'] | undefined {
  if (mode === 'client') return 'web';
  if (mode === 'server') return 'node';
  return undefined;
}

function getEnvTargetDefineValue(
  target: AstroModuleFederationOptions['target'] | undefined,
): string {
  if (target === 'web' || target === 'node') {
    return JSON.stringify(target);
  }
  return 'undefined';
}

function hasConfiguredRemotes(remotes?: RemotesMap): boolean {
  return !!remotes && Object.keys(remotes).length > 0;
}

function toRuntimeRemotes(remotes?: RemotesMap): RuntimeRemoteConfig[] {
  if (!remotes) return [];

  return Object.entries(remotes)
    .map(([alias, remoteConfig]) => {
      if (!remoteConfig || typeof remoteConfig !== 'object') return null;
      return {
        alias,
        name: remoteConfig.name || alias,
        entry: remoteConfig.entry,
        type: remoteConfig.type || 'var',
        entryGlobalName: remoteConfig.entryGlobalName || alias,
        shareScope: remoteConfig.shareScope || 'default',
      };
    })
    .filter(Boolean) as RuntimeRemoteConfig[];
}

function toSsrRuntimeRemotes(remotes?: RemotesMap): RuntimeRemoteConfig[] {
  return toRuntimeRemotes(remotes).map((remote) => {
    if (!remote.entry || !remote.entry.includes('.json')) {
      return remote;
    }

    let entry = remote.entry;
    try {
      const parsed = new URL(remote.entry);
      parsed.pathname = parsed.pathname.replace(/\/[^/]*$/, '/remoteEntry.global.js');
      parsed.search = '';
      entry = parsed.toString();
    } catch {
      entry = remote.entry.replace(/\/[^/]*$/, '/remoteEntry.global.js');
    }

    return {
      ...remote,
      entry,
      type: 'global',
      entryGlobalName: remote.alias || remote.name,
    };
  });
}

function toRemoteSourceBases(remotes?: RemotesMap): Record<string, string> {
  const sourceBases: Record<string, string> = {};
  if (!remotes) return sourceBases;

  for (const [alias, remoteConfig] of Object.entries(remotes)) {
    if (!remoteConfig || typeof remoteConfig !== 'object' || !remoteConfig.entry) {
      continue;
    }

    try {
      const parsed = new URL(remoteConfig.entry);
      parsed.pathname = parsed.pathname.replace(/\/[^/]*$/, '/');
      parsed.search = '';
      sourceBases[alias] = parsed.toString();
    } catch {
      continue;
    }
  }

  return sourceBases;
}

function buildHostAutoInitImportId(
  mfName: string,
  virtualModuleDir = DEFAULT_VIRTUAL_MODULE_DIR,
): string {
  const encodedName = packageNameEncode(
    `${mfName}${HOST_AUTO_INIT_TAG}hostAutoInit${HOST_AUTO_INIT_TAG}`,
  );
  return `${virtualModuleDir}/${encodedName}.js`;
}

function resolveSsrLocalRemotes(
  ssrOptions: AstroModuleFederationOptions['ssr'] | undefined,
  hostRoot: string,
): Record<string, string> {
  const localRemotes = ssrOptions?.localRemotes;
  if (!localRemotes || typeof localRemotes !== 'object') return {};

  const resolvedRemotes: Record<string, string> = {};

  for (const [alias, remotePath] of Object.entries(localRemotes)) {
    if (typeof remotePath !== 'string') continue;

    if (remotePath.startsWith('file://')) {
      resolvedRemotes[alias] = fileURLToPath(remotePath);
      continue;
    }

    resolvedRemotes[alias] = path.resolve(hostRoot, remotePath);
  }

  return resolvedRemotes;
}

function resolveSsrLocalModuleFile(
  localRemoteRoot: string | undefined,
  remoteSubpath: string,
): string | null {
  if (!localRemoteRoot || !remoteSubpath) return null;

  const normalizedSubpath = remoteSubpath.replace(/^\/+/, '');
  const baseDir = path.join(localRemoteRoot, 'src');
  const candidates = [
    path.join(baseDir, `${normalizedSubpath}.astro`),
    path.join(baseDir, `${normalizedSubpath}.ts`),
    path.join(baseDir, `${normalizedSubpath}.js`),
    path.join(baseDir, `${normalizedSubpath}.mjs`),
    path.join(baseDir, normalizedSubpath, 'index.astro'),
    path.join(baseDir, normalizedSubpath, 'index.ts'),
    path.join(baseDir, normalizedSubpath, 'index.js'),
    path.join(baseDir, normalizedSubpath, 'index.mjs'),
  ];

  return candidates.find((candidatePath) => fs.existsSync(candidatePath)) || null;
}

function ssrLoadRemoteRuntimePlugin(
  federationOptions: AstroModuleFederationOptions,
  ssrLocalRemotes: Record<string, string>,
) {
  const runtimeRemotes = toSsrRuntimeRemotes(federationOptions.remotes);
  const remoteSourceBases = toRemoteSourceBases(federationOptions.remotes);
  const runtimeOptions = {
    name: federationOptions.name,
    remotes: runtimeRemotes,
  };

  return {
    name: '@module-federation/astro:ssr-load-remote-runtime',
    enforce: 'pre' as const,
    transform(code, id, transformOptions) {
      if (!transformOptions?.ssr) return null;
      if (!id.includes('__loadRemote__')) return null;

      const remoteRequestMatch = code.match(
        /loadRemote\((["'])([^"']+)\1\)/,
      );
      const remoteRequest = remoteRequestMatch?.[2];
      if (!remoteRequest) return null;
      const [remoteAlias, ...remoteSubpathParts] = remoteRequest.split('/');
      const remoteSubpath = remoteSubpathParts.join('/');
      const localRemoteRoot = ssrLocalRemotes[remoteAlias];
      const localModuleFile = resolveSsrLocalModuleFile(localRemoteRoot, remoteSubpath);

      if (localModuleFile) {
        const moduleCode = `
import * as __mf_local_module__ from ${JSON.stringify(localModuleFile)};
export * from ${JSON.stringify(localModuleFile)};
const exportModule = __mf_local_module__;
export const __moduleExports = exportModule;
export default exportModule?.default?.default ?? exportModule?.default ?? exportModule;
        `.trim();
        return { code: moduleCode, syntheticNamedExports: '__moduleExports' };
      }

      const sourceBase = remoteSourceBases[remoteAlias];
      const sourceModuleUrl =
        sourceBase && remoteSubpath ? `${sourceBase}src/${remoteSubpath}.js` : null;
      const sourceLoaderBlock = sourceModuleUrl
        ? `
const loadFromRemoteSource = async () => {
  const response = await fetch(${JSON.stringify(sourceModuleUrl)});
  if (!response.ok) {
    throw new Error(
      \`Failed to fetch remote source module: ${sourceModuleUrl} (\${response.status})\`,
    );
  }
  const source = await response.text();
  const moduleDataUrl = \`data:text/javascript;base64,\${Buffer.from(source).toString('base64')}\`;
  return import(moduleDataUrl);
};
`
        : '';
      const sourceLoadAttempt = sourceModuleUrl
        ? `
try {
  exportModule = await loadFromRemoteSource();
} catch {}
`
        : '';
      const moduleCode = `
import { createInstance, getInstance } from '${ASTRO_RUNTIME_ALIAS}';

${sourceLoaderBlock}
let exportModule;
${sourceLoadAttempt}
if (!exportModule) {
  const runtime = getInstance() || createInstance(${JSON.stringify(runtimeOptions)});
  exportModule = await runtime.loadRemote(${JSON.stringify(remoteRequest)});
}
export const __moduleExports = exportModule;
export default exportModule?.default?.default ?? exportModule?.default ?? exportModule;
      `.trim();
      return { code: moduleCode, syntheticNamedExports: '__moduleExports' };
    },
  };
}

function normalizeOptions(
  options: AstroModuleFederationOptions,
): AstroModuleFederationOptions {
  const projectRoot = process.cwd();
  const virtualModuleDir = options.virtualModuleDir || DEFAULT_VIRTUAL_MODULE_DIR;
  const remotes = normalizeRemotes(options.remotes);
  const dts = options.dts ?? false;
  const exposes = dts
    ? normalizeAstroExposesForFederation(options.exposes, projectRoot)
    : options.exposes;
  const target = options.target ?? inferTargetFromMode(options.mode);

  return {
    ...options,
    dts,
    exposes,
    remotes,
    target,
    virtualModuleDir,
  };
}

export function moduleFederationAstro(
  options: AstroModuleFederationOptions,
): AstroIntegration {
  return {
    name: '@module-federation/astro',
    hooks: {
      'astro:config:setup': ({ command, injectScript, updateConfig }) => {
        const federationOptions = normalizeOptions(options);
        const ssrLocalRemotes = resolveSsrLocalRemotes(options.ssr, process.cwd());
        const hasRemotes = hasConfiguredRemotes(federationOptions.remotes);
        const envTargetDefineValue = getEnvTargetDefineValue(
          federationOptions.target,
        );
        let hostAutoInitImportId: string | undefined;

        if (hasRemotes) {
          hostAutoInitImportId = buildHostAutoInitImportId(
            federationOptions.name,
            federationOptions.virtualModuleDir,
          );
          const injectedImport = `import ${JSON.stringify(hostAutoInitImportId)};`;

          injectScript('page', injectedImport);
        }

        updateConfig({
          vite: {
            plugins: [
              ssrLoadRemoteRuntimePlugin(federationOptions, ssrLocalRemotes),
              ...federation(federationOptions),
            ],
            build: {
              target: 'esnext',
            },
            optimizeDeps: {
              include: DEFAULT_OPTIMIZE_DEPS_INCLUDE,
              ...(hostAutoInitImportId
                ? {
                    exclude: [hostAutoInitImportId],
                  }
                : {}),
              esbuildOptions: {
                target: 'esnext',
              },
            },
            ssr: {
              noExternal: DEFAULT_NO_EXTERNAL,
            },
            resolve: {
              alias: [
                {
                  find: ASTRO_RUNTIME_ALIAS,
                  replacement: RUNTIME_ESM_PATH,
                },
              ],
            },
            ...(command === 'dev'
              ? {
                  define: {
                    ENV_TARGET: envTargetDefineValue,
                  },
                }
              : {}),
          },
        });
      },
    },
  };
}

export const moduleFederation = moduleFederationAstro;
export { buildHostAutoInitImportId };
export { normalizeAstroExposesForFederation };
export { normalizeRemotes };
export default moduleFederationAstro;

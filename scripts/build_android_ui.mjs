import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = process.env.G4T0XX_UI_CACHE || path.join(root, 'android/web');
const require = createRequire(path.join(cache, 'package.json'));
const { build } = await import(pathToFileURL(require.resolve('vite')));
const react = (await import(pathToFileURL(require.resolve('@vitejs/plugin-react')))).default;
const tailwind = (await import(pathToFileURL(require.resolve('@tailwindcss/vite')))).default;
const manifest = JSON.parse(await fs.readFile(path.join(cache, 'package.json'), 'utf8'));
const aliases = Object.keys(manifest.dependencies).filter(name => !['vite', '@vitejs/plugin-react', '@tailwindcss/vite', 'tailwindcss', 'tw-animate-css'].includes(name))
  .map(name => ({find: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=/|$)'), replacement: path.join(cache, 'node_modules', name)}));
const destination = path.join(root, 'android/app/build/generated/ui/public');
await build({configFile: false, base: './', root: path.join(root, 'client'), plugins: [react(), tailwind()],
  resolve: {alias: [
    {find: 'tailwindcss', replacement: path.join(cache, 'node_modules/tailwindcss/index.css')},
    {find: 'tw-animate-css', replacement: path.join(cache, 'node_modules/tw-animate-css/dist/tw-animate.css')},
    {find: '@/_core/hooks/useAuth', replacement: path.join(root, 'client/src/native-auth.ts')},
    ...aliases, {find: '@', replacement: path.join(root, 'client/src')}, {find: '@shared', replacement: path.join(root, 'shared')}
  ]}, build: {outDir: destination, emptyOutDir: true, rollupOptions: {input: path.join(root, 'client/index.android.html')}}});
await fs.copyFile(path.join(destination, 'index.android.html'), path.join(destination, 'index.html'));
await fs.cp(path.join(root, 'android/app/src/main/assets/licenses'), path.join(destination, '../licenses'), {recursive: true});
const client = process.env.G4T0XX_HOMELINK_CLIENT;
if (client) await fs.copyFile(path.resolve(client), path.join(destination, 'homelink.html'));

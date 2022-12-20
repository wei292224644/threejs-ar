import { mergeRollupOptions } from 'platformize-three/dist-plugin';
import firelog from './firelog.json';

export default mergeRollupOptions(
  {
    input: ['./miniprogram/viewer/viewer.ts'],
    output: {
      format: 'cjs',
      dir: 'miniprogram/',
      entryFileNames: 'pages/[name]/[name].js',
      chunkFileNames: 'chunks/[name].js',
    },
  },
  {
    minify: false,
    hotcode: { log: firelog, mode: process.env.HOTCODE_MODE },
  },
);

import FullReload from 'vite-plugin-full-reload'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        FullReload('', { root: __dirname }),
    ],
    build: {
        target: 'esnext',
        outDir: '../Services/open'
    }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径，适配鸿蒙本地加载
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 确保资源路径是相对的
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      }
    }
  }
})

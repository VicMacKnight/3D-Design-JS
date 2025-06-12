export default {
  server: {
    host: true, // permite acesso via tablet na rede local
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Endereço do backend
        changeOrigin: true,
      },
    },
  },
};
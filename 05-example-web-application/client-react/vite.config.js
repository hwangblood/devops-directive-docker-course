import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import dns from "dns";

dns.setDefaultResultOrder("verbatim");

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  const env = loadEnv(mode, process.cwd(), ["API_"]);
  console.log(env);

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/golang": {
          target: env.API_GOLANG_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/golang/, ""),
          secure: false,
        },
        "/api/node": {
          target: env.API_NODE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/node/, ""),
          secure: false,
        },
      },
    },
  };
});

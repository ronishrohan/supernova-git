// electron.vite.config.ts
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import * as fs from "fs";
import * as path from "path";
var __electron_vite_injected_dirname = "E:\\supernova-git";
var aliases = {
  "@/app": resolve(__electron_vite_injected_dirname, "app"),
  "@/lib": resolve(__electron_vite_injected_dirname, "lib"),
  "@/resources": resolve(__electron_vite_injected_dirname, "resources")
};
function loadEnvFile() {
  const envPath = path.resolve(__electron_vite_injected_dirname, ".env.local");
  const env2 = {};
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...values] = trimmed.split("=");
        if (key && values.length > 0) {
          env2[key.trim()] = values.join("=").trim();
        }
      }
    });
  }
  return env2;
}
var env = loadEnvFile();
var electron_vite_config_default = defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__electron_vite_injected_dirname, "lib/main/main.ts")
        }
      }
    },
    resolve: {
      alias: aliases
    },
    plugins: [externalizeDepsPlugin()],
    define: {
      "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "process.env.SUPABASE_API_KEY": JSON.stringify(env.SUPABASE_API_KEY)
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__electron_vite_injected_dirname, "lib/preload/preload.ts")
        }
      }
    },
    resolve: {
      alias: aliases
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: "./app",
    build: {
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "app/index.html")
        }
      }
    },
    resolve: {
      alias: aliases
    },
    plugins: [tailwindcss(), react()],
    define: {
      "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "process.env.SUPABASE_API_KEY": JSON.stringify(env.SUPABASE_API_KEY)
    }
  }
});
export {
  electron_vite_config_default as default
};

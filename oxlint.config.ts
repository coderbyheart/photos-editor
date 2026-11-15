import config from "@coderbyheart/oxlint-config"
import { defineConfig } from "oxlint"

export default defineConfig({
  extends: [config],
  options: {
    typeAware: true,
  },
  ignorePatterns: ["build/"],
})

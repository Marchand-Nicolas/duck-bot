import { existsSync, writeFileSync, readFileSync } from "fs";

const readConfig = () => {
  // Check if file exists
  const path = "./storage/config.json";

  existsSync(path) || writeFileSync(path, "{}");

  // Read file
  const content = readFileSync(path, "utf-8");

  // Parse file
  const config = JSON.parse(content);

  return config;
};

export default readConfig;

import { existsSync, writeFileSync, readFileSync } from "fs";

const writeConfig = (key: string, value: string) => {
  // Check if file exists
  const path = "./storage/config.json";

  existsSync(path) || writeFileSync(path, "{}");

  // Read file
  const content = readFileSync(path, "utf-8");

  // Parse file
  const config = JSON.parse(content);

  // Update config
  config[key] = value;

  // Write config
  writeFileSync(path, JSON.stringify(config));
};

export default writeConfig;

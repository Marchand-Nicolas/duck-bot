import { existsSync, writeFileSync, readFileSync } from "fs";
import path from "path";

const writeConfig = (key: string, value: string) => {
  // Check if file exists
  const p = path.join(__dirname, "./storage/config.json");

  existsSync(p) || writeFileSync(p, "{}");

  // Read file
  const content = readFileSync(p, "utf-8");

  // Parse file
  const config = JSON.parse(content);

  // Update config
  config[key] = value;

  // Write config
  writeFileSync(p, JSON.stringify(config));
};

export default writeConfig;

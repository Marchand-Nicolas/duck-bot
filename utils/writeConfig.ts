import fs from "fs";

const writeConfig = (key: string, value: string) => {
  // Check if file exists
  const path = "./storage/config.json";

  fs.existsSync(path) || fs.writeFileSync(path, "{}");

  // Read file
  const content = fs.readFileSync(path, "utf-8");

  // Parse file
  const config = JSON.parse(content);

  // Update config
  config[key] = value;

  // Write config
  fs.writeFileSync(path, JSON.stringify(config));
};

export default writeConfig;

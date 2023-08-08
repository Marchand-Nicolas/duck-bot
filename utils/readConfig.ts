import fs from "fs";

const readConfig = () => {
  // Check if file exists
  const path = "./storage/config.json";

  fs.existsSync(path) || fs.writeFileSync(path, "{}");

  // Read file
  const content = fs.readFileSync(path, "utf-8");

  // Parse file
  const config = JSON.parse(content);

  return config;
};

export default readConfig;

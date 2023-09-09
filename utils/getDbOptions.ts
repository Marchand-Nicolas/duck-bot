const getDbOptions = () => {
  return {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    supportBigNumbers: true,
    bigNumberStrings: true,
  };
};

export default getDbOptions;

function getEnv(name: "DATABASE_URL") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  DATABASE_URL: getEnv("DATABASE_URL"),
};

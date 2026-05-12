export function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = field.split(".").reduce((source, key) => source?.[key], req.body);
      return value === undefined || value === null || value === "";
    });

    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    return next();
  };
}


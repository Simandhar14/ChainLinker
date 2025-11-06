// error handler for catching oopsies

export function errorHandler(err, req, res, next) {
  console.error(err); // don't log secrets
  res.status(err.status || 500).json({ error: err.message || 'unknown error' });
}

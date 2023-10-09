const logger = (req, res, next) => {
  const requestStart = Date.now();
  console.log(`[${requestStart}] ${req.url} ${JSON.stringify(req.body)}`);
  let responseEnd = Date.now();

  const defaultWrite = res.write;
  const defaultEnd = res.end;
  const chunks = [];
  res.write = (...restArgs) => {
    chunks.push(Buffer.from(restArgs[0]));
    defaultWrite.apply(res, restArgs);
  };
  res.end = (...restArgs) => {
    if (restArgs[0]) {
      chunks.push(Buffer.from(restArgs[0]));
    }
    const body = Buffer.concat(chunks).toString("utf8");
    const responseTime = responseEnd - requestStart;
    console.log(`[${responseEnd}] ${body} (${responseTime}ms)`);
    defaultEnd.apply(res, restArgs);
  };
  next();
  responseEnd = Date.now();
};

module.exports = logger;

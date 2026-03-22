/*
  Execution Logger

  Purpose:
  Keep structured logs for each request pipeline.
*/

const createLogEntry = ({
  stage,
  status,
  message = "",
  metadata = {}
}) => {
  return {
    stage,
    status,
    message,
    metadata,
    timestamp: new Date().toISOString()
  };
};

const pushLog = (logs, entry) => {
  logs.push(entry);
};

module.exports = {
  createLogEntry,
  pushLog
};
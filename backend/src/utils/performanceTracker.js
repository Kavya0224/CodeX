/*
  Performance Tracker

  Purpose:
  Measure durations of different pipeline stages.
*/

const startTimer = () => Date.now();

const endTimer = (startTime) => Date.now() - startTime;

module.exports = {
  startTimer,
  endTimer
};
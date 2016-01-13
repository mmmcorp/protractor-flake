export default function (output = '') {
  console.log('\n--------\n');
  console.log(output);
  console.log('\n--------\n');

  let match = null;
  const CUCUMBERJS_TEST = /^\d+ scenarios?/m;
  const failedSpecs = new Set();

  if (CUCUMBERJS_TEST.test(output)) {
    const FAILED_LINES = /(.*?):\d+ # Scenario:.*/g;
    while (match = FAILED_LINES.exec(output)) {
      failedSpecs.add(match[1]);
    }
  } else {
    const FAILED_LINES = /at (?:\[object Object\]|Object)\.<anonymous> \((([A-Z]:\\)?.*?):.*\)/g;
    while (match = FAILED_LINES.exec(output)) {
      // windows output includes stack traces from
      // webdriver so we filter those out here
      if (!/node_modules/.test(match[1])) {
        failedSpecs.add(match[1]);
      }
    }
  }

  return [...failedSpecs];
}

const outputBuffer = [];
function failedSpecStreamParser(text$) {
  if (text$.match(/Error/)) {
    outputBuffer.push(text$);
    return null;
  }
  if (outputBuffer.length > 0) {
    outputBuffer.pop();
    return text$;
  }
  return null;
}

export default function (output = '') {
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
    const FAILED_LINES_PLANE = /at (.*)(:.*:.*)/g;

    const lineByLine = output.toString().split('\n');
    lineByLine.forEach((line)=> {
      const parsed$ = failedSpecStreamParser(line);
      if (parsed$) {
        match = FAILED_LINES.exec(parsed$) || FAILED_LINES_PLANE.exec(parsed$)
        if (match) {
          // windows output includes stack traces from
          // webdriver so we filter those out here
          if (!/node_modules/.test(match[1])) {
            failedSpecs.add(match[1]);
          }
        }
      }
    });
  }

  return [...failedSpecs];
}

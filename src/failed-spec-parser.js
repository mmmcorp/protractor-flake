const outputBuffer = [];
function failedSpecStreamParser(text$, failedFiles) {
  const isNextHasPath = new RegExp('(.*) PID');
  if (text$.match(isNextHasPath)) {
    failedFiles.map((file)=> new RegExp(file + '\] PID')).forEach((regex)=> {
      if (text$.match(regex)) {
        outputBuffer.push(text$);
      }
    });
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
    const lineByLine = output.toString().split('\n');
    const failedFiles = lineByLine.filter((line)=> {
      const failed = /(\[launcher\]).*#[0-9]-[0-9]* failed/;
      return line.match(failed);
    })
    .map((line)=> {
      const testId = /.*(#[0-9]-[0-9]*)/;
      return testId.exec(line)[1];
    });

    lineByLine.forEach((line)=> {
      const parsed$ = failedSpecStreamParser(line, failedFiles);
      if (parsed$) {
        const FAILED_LINES = /.*#[0-9]-[0-9]*.* Specs: (.*)/;
        match = FAILED_LINES.exec(parsed$);
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

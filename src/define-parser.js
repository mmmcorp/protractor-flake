function cucumberParser(output) {
  let match = null;
  const failedSpecs = new Set();
  const FAILED_LINES = /(.*?):\d+ # Scenario:.*/g;

  while (match = FAILED_LINES.exec(output)) {
    failedSpecs.add(match[1]);
  }
  return [...failedSpecs];
}

function shardParser(output) {
  const lineByLine = output.toString().split('\n');

  const failedFileIDs = lineByLine.filter((line)=> {
    const failed = /(\I\/launcher).*#[0-9]*-[0-9]* failed/;
    return line.match(failed);
  })
  .map((line)=> {
    const testId = /.*(#[0-9]*-[0-9]*)/;
    return testId.exec(line)[1];
  });

  const filePath = '.*#[0-9]*-[0-9]*.* Specs: (.*)';
  const failedSpecs = lineByLine.filter((line)=> {
    return line.match(new RegExp(filePath));
  }).filter((containPath)=> {
    return failedFileIDs.filter((failedFileID)=> {
      return containPath.match(failedFileID)
    }).length > 0;
  })
  .map((matchedLine)=> {
    const reg = new RegExp(filePath);
    return reg.exec(matchedLine)[1];
  });

  return failedSpecs;
}

function defaultParser(output) {
  let match = null;
  let failedSpecs = new Set();
  let FAILED_LINES = /at (?:\[object Object\]|Object)\.<anonymous> \((([A-Z]:\\)?.*?):.*\)/g;
  while (match = FAILED_LINES.exec(output)) {
    // windows output includes stack traces from
    // webdriver so we filter those out here
    if (!/node_modules/.test(match[1])) {
      failedSpecs.add(match[1]);
    }
  }
  return [...failedSpecs];
}

export default function(protractorConfig) {
  if (protractorConfig && protractorConfig.framework === 'cucumber') {
    return cucumberParser;
  }
  if (protractorConfig && protractorConfig.capabilities && protractorConfig.capabilities.shardTestFiles) {
    return shardParser;
  }
  return defaultParser;
}

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { resolve } from 'path';
import 'core-js/shim';
import failedSpecParser from './failed-spec-parser';
import log from './logger';
import { ParseArrayProp } from './utils';

const DEFAULT_PROTRACTOR_ARGS = [];

const DEFAULT_OPTIONS = {
  nodeBin: 'node',
  maxAttempts: 3,
  '--': DEFAULT_PROTRACTOR_ARGS,
  protractorArgs: DEFAULT_PROTRACTOR_ARGS,
};

export default function (options = {}, callback = function noop () {}) {
  const parsedOptions = Object.assign(DEFAULT_OPTIONS, options);
  let testAttempt = 1;
  // todo: remove this in the next major version
  parsedOptions.protractorArgs = parsedOptions.protractorArgs.concat(parsedOptions['--']);

  function handleTestEnd(status, output) {
    if (status === 0) {
      callback(status);
    } else {
      if (++testAttempt <= parsedOptions.maxAttempts) {
        const failedSpecs = failedSpecParser(output);

        log('info', `Re-running tests: test attempt ${testAttempt}\n`);
        log('info', 'Re-running the following test files:\n');
        log('info', failedSpecs.join('\n') + '\n');
        return startProtractor(failedSpecs);
      }

      callback(status);
    }
  }

  function startProtractor(specFiles = []) {
    // '.../node_modules/protractor/lib/protractor.js'
    const protractorMainPath = require.resolve('protractor');
    // '.../node_modules/protractor/bin/protractor'
    const protractorBinPath = resolve(protractorMainPath, '../../bin/protractor');

    const protractorArgs = [protractorBinPath].concat(parsedOptions.protractorArgs);
    let output = '';

    if (specFiles.length) {
      const confPath = protractorArgs[1];
      const ext = path.extname(confPath);
      const modifiedPath = confPath.split(ext)[0] + '.tmp' + ext;

      const conf = fs.readFileSync(confPath).toString();
      const parser = new ParseArrayProp(conf);
      const modified = parser.parse(specFiles);

      fs.writeFileSync(modifiedPath, modified);
      protractorArgs[1] = modifiedPath;
    }

    const protractor = spawn(
      parsedOptions.nodeBin,
      protractorArgs,
      options.protractorSpawnOptions
    );

    protractor.stdout.on('data', (buffer)=> {
      const text = buffer.toString();
      log('info', text);
      output = output + text;
    });

    protractor.on('exit', function (status) {
      handleTestEnd(status, output);
    });
  }

  startProtractor();
}

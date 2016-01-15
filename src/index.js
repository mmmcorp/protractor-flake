import path from 'path';
import { spawn } from 'child_process';
import { resolve } from 'path';
import 'core-js/shim';
import defineParser from './define-parser';
import log from './logger';

const DEFAULT_PROTRACTOR_ARGS = [];

const DEFAULT_OPTIONS = {
  nodeBin: 'node',
  maxAttempts: 3,
  '--': DEFAULT_PROTRACTOR_ARGS,
  protractorArgs: DEFAULT_PROTRACTOR_ARGS,
};

export default function (options = {}, done = function noop () {}) {
  const parsedOptions = Object.assign(DEFAULT_OPTIONS, options);

  // get protractor's configuration to decide appropriate stdout-parser.
  let protractorConfig;
  try {
    protractorConfig = require(parsedOptions.protractorArgs[0]);
  } catch (err) {
    protractorConfig = path.resolve(process.cwd(), './protractor.conf.js');
  }
  const failedSpecParser = options.customParser || defineParser(protractorConfig.config);
  let testAttempt = 1;

  // todo: remove this in the next major version
  parsedOptions.protractorArgs = parsedOptions.protractorArgs.concat(parsedOptions['--']);

  function handleTestEnd(status, output, prevSpecs) {
    if (status === 0) {
      return done(status);
    }

    testAttempt++;
    if (testAttempt > parsedOptions.maxAttempts) {
      return done(status);
    }

    log('info', `Re-running tests: test attempt ${testAttempt}\n`);
    log('info', 'Re-running the following test files:\n');

    if (prevSpecs.length === 1) {
      log('info', prevSpecs.join('\n') + '\n');
      return startProtractor(prevSpecs);
    }

    const failedSpecs = failedSpecParser(output);
    log('info', failedSpecs.join('\n') + '\n');

    startProtractor(failedSpecs);
  }

  function startProtractor(specFiles = []) {
    // '.../node_modules/protractor/lib/protractor.js'
    const protractorMainPath = require.resolve('protractor');
    // '.../node_modules/protractor/bin/protractor'
    const protractorBinPath = resolve(protractorMainPath, '../../bin/protractor');

    let protractorArgs = [protractorBinPath].concat(parsedOptions.protractorArgs);
    let output = '';

    if (specFiles.length) {
      protractorArgs = protractorArgs.filter((arg)=> !/^--suite=/.test(arg));
      protractorArgs.push('--specs', specFiles.join(','));
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
      handleTestEnd(status, output, specFiles);
    });
  }

  startProtractor();
}
